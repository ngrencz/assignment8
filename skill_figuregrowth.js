{
    let currentPattern = {};
    let figureErrorCount = 0;
    let currentStep = 1; 
    let isVisualMode = false;

    window.initFigureGrowthGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        figureErrorCount = 0;
        currentStep = 1;
        
        // 50% chance to be visual squares vs text
        isVisualMode = Math.random() > 0.5;

        const m = Math.floor(Math.random() * 3) + 1; 
        const b = Math.floor(Math.random() * 4) + 1; 
        
        currentPattern = {
            m: m,
            b: b,
            fig1Count: m + b,
            fig2Count: (m * 2) + b,
            fig3Count: (m * 3) + b,
            targetX: Math.floor(Math.random() * 15) + 10 
        };

        renderFigureUI();
    };

    function renderFigureUI() {
        const qContent = document.getElementById('q-content');
        document.getElementById('q-title').innerText = `Figure Growth Analysis`;

        let headerHTML = "";
        if (isVisualMode) {
            headerHTML = `
                <div style="display:flex; justify-content:center; gap:20px; margin-bottom:20px;">
                    <div><small>Fig 1</small><br>${generateTileHTML(currentPattern.fig1Count)}</div>
                    <div><small>Fig 2</small><br>${generateTileHTML(currentPattern.fig2Count)}</div>
                </div>`;
        } else {
            headerHTML = `
                <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:20px; border:1px solid #e2e8f0; text-align:center;">
                    <p><strong>Figure 1:</strong> ${currentPattern.fig1Count} tiles | <strong>Figure 2:</strong> ${currentPattern.fig2Count} tiles</p>
                </div>`;
        }

        let stepHTML = "";
        if (currentStep === 1) {
            stepHTML = `
                <p><strong>Step 1:</strong> Find the rule (y = mx + b)</p>
                <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                    y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:60px"> x + 
                    <input type="number" id="input-b" placeholder="b" class="math-input" style="width:60px">
                </div>`;
        } else if (currentStep === 2) {
            // THE DRAWING STEP
            stepHTML = `
                <p><strong>Step 2:</strong> Use the growth pattern to "draw" <strong>Figure 3</strong>.</p>
                <p><small>Click tiles to add/remove them.</small></p>
                <div id="tile-grid" style="display: grid; grid-template-columns: repeat(10, 25px); gap: 2px; justify-content: center; margin: 20px 0;">
                    ${Array(50).fill().map((_, i) => `<div class="drawing-tile" onclick="this.classList.toggle('active')" style="width:25px; height:25px; border:1px solid #cbd5e1; cursor:pointer;"></div>`).join('')}
                </div>`;
        } else {
            stepHTML = `
                <p><strong>Step 3:</strong> Use your rule to predict <strong>Figure ${currentPattern.targetX}</strong>.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <input type="number" id="input-ans" placeholder="Total tiles" class="math-input" style="width: 150px;">
                </div>`;
        }

        qContent.innerHTML = headerHTML + stepHTML + `
            <div style="text-align:center;"><button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button></div>
            <style>
                .tile-unit { width:12px; height:12px; background:#3b82f6; border:1px solid white; display:inline-block; }
                .drawing-tile.active { background:#3b82f6; border-color:#1d4ed8; }
            </style>`;
    }

    function generateTileHTML(count) {
        // Generates a small cluster of squares to represent the tiles
        return `<div style="width:80px; line-height:0;">${Array(count).fill().map(() => `<div class="tile-unit"></div>`).join('')}</div>`;
    }

    window.checkFigureAns = async function() {
        let isCorrect = false;
        let stepKey = "";

        if (currentStep === 1) {
            stepKey = "FigureRule";
            const uM = parseInt(document.getElementById('input-m').value);
            const uB = parseInt(document.getElementById('input-b').value);
            isCorrect = (uM === currentPattern.m && uB === currentPattern.b);
        } else if (currentStep === 2) {
            stepKey = "FigureDraw";
            const activeTiles = document.querySelectorAll('.drawing-tile.active').length;
            isCorrect = (activeTiles === currentPattern.fig3Count);
        } else {
            stepKey = "FigureX";
            const uAns = parseInt(document.getElementById('input-ans').value);
            isCorrect = (uAns === (currentPattern.m * currentPattern.targetX) + currentPattern.b);
        }

        const feedback = document.getElementById('feedback-box');
        feedback.style.display = "block";

        if (isCorrect) {
            feedback.className = "correct";
            feedback.innerText = "✅ Correct!";
            
            let earnedXP = (figureErrorCount === 0) ? 1.0 : (figureErrorCount === 1 ? 0.5 : 0.2);
            await saveStepData(stepKey, earnedXP);

            if (currentStep < 3) {
                currentStep++;
                figureErrorCount = 0;
                setTimeout(renderFigureUI, 1000);
            } else {
                window.isCurrentQActive = false;
                feedback.innerText = "Pattern Mastered!";
                setTimeout(loadNextQuestion, 1500);
            }
        } else {
            figureErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = currentStep === 2 ? "Count carefully! Figure 3 follows your growth rule." : "Not quite. Check your math!";
        }
    };

    async function saveStepData(column, earnedXP) {
        let currentMastery = window.userMastery?.[column] || 0;
        let newMastery = Math.min(10, currentMastery + earnedXP);

        if (!window.userMastery) window.userMastery = {};
        window.userMastery[column] = newMastery;

        let updates = {};
        updates[column] = newMastery;
        
        const avg = ((window.userMastery['FigureRule'] || 0) + 
                     (window.userMastery['FigureDraw'] || 0) + 
                     (window.userMastery['FigureX'] || 0)) / 3;
        updates['FigureGrowth'] = parseFloat(avg.toFixed(1)); 

        await window.supabaseClient.from('assignment').update(updates).eq('userName', window.currentUser);
    }
}
