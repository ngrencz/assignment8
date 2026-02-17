
    let currentPattern = {};
    var figureErrorCount = 0; 
    var currentStep = 1;      
    let isVisualMode = false;
    let lastM = null; 

    window.initFigureGrowthGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        figureErrorCount = 0;
        currentStep = 1;
        isVisualMode = Math.random() > 0.5;

        // 1. Generate Slope (m): 3 to 10
        let m;
        // Math.random() * 8 + 3 gives a range from 3 to 10
        do { m = Math.floor(Math.random() * 8) + 3; } while (m === lastM); 
        lastM = m;

        // 2. Generate Intercept (b): 1 to 10
        const b = Math.floor(Math.random() * 10) + 1; 
        
        // 3. Prompt Figures (The "Examples")
        // first figure is 1 or 2. Gap is 2, 3, or 4.
        const f1 = Math.floor(Math.random() * 2) + 1; 
        const gap = Math.floor(Math.random() * 3) + 2; 
        const f2 = f1 + gap;
        
        // 4. Step 2 Figure: Any number up to 99 (not f1 or f2)
        let s2Fig;
        do { s2Fig = Math.floor(Math.random() * 98) + 1; } while (s2Fig === f1 || s2Fig === f2);

        // 5. Step 3 Figure: Drawing (Calculated to stay under 50 tiles)
        let s3Fig = Math.floor(Math.random() * 4) + 1; 
        
        // Safety Check: If the random figure is too big for the grid, 
        // keep reducing it until it fits.
        while ((m * s3Fig) + b > 48 && s3Fig > 1) {
            s3Fig--;
        }

        currentPattern = {
            m: m,
            b: b,
            f1Num: f1,
            f1Count: (m * f1) + b,
            f2Num: f2,
            f2Count: (m * f2) + b,
            step2Num: s2Fig,
            step2Ans: (m * s2Fig) + b,
            step3Num: s3Fig, // Now has much better variety!
            step3Ans: (m * s3Fig) + b
        };
        renderFigureUI();
    };
    function generateTileHTML(count, m, b, figNum) {
        const isExpert = (window.userMastery?.['FigureGrowth'] || 0) >= 8;
        let html = `<div style="display: grid; grid-template-columns: repeat(5, 12px); gap: 1px; width: 65px; line-height: 0; margin: 0 auto;">`;
        for (let i = 0; i < count; i++) {
            let color = '#3b82f6'; 
            if (!isExpert && i < b) color = '#f97316';
            html += `<div style="width:12px; height:12px; background:${color}; border:0.5px solid white;"></div>`;
        }
        html += `</div>`;
        return html;
    }

    function renderFigureUI() {
        const qContent = document.getElementById('q-content');
        document.getElementById('q-title').innerText = `Figure Growth Analysis`;

        let headerHTML = "";
        if (isVisualMode && currentPattern.f2Count <= 30) { 
            headerHTML = `<div style="display:flex; justify-content:center; align-items:flex-end; gap:30px; margin-bottom:20px; background: white; padding: 15px; border-radius: 8px;">
                            <div style="text-align:center;"><small>Fig ${currentPattern.f1Num}</small>${generateTileHTML(currentPattern.f1Count, currentPattern.m, currentPattern.b, currentPattern.f1Num)}</div>
                            <div style="text-align:center;"><small>Fig ${currentPattern.f2Num}</small>${generateTileHTML(currentPattern.f2Count, currentPattern.m, currentPattern.b, currentPattern.f2Num)}</div>
                        </div>`;
        } else {
            headerHTML = `<div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:20px; border: 1px solid #cbd5e1; text-align:center;">
                            <p><strong>Figure ${currentPattern.f1Num}:</strong> ${currentPattern.f1Count} tiles | <strong>Figure ${currentPattern.f2Num}:</strong> ${currentPattern.f2Count} tiles</p>
                        </div>`;
        }

        let ruleDisplay = (currentStep > 1) ? `
            <div style="background: #ecfdf5; border: 1px dashed #10b981; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; color: #065f46;">
                <strong>Your Rule:</strong> y = ${currentPattern.m}x + ${currentPattern.b}
            </div>` : "";

        let stepHTML = "";
        if (currentStep === 1) {
            stepHTML = `<p><strong>Step 1:</strong> Find the rule (y = mx + b).</p>
                <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                    y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:65px"> x + 
                    <input type="number" id="input-b" placeholder="b" class="math-input" style="width:65px">
                </div>`;
        } else if (currentStep === 2) {
            stepHTML = ruleDisplay + `<p><strong>Step 2:</strong> Intermediate Prediction.</p>
                <p>How many tiles are in <strong>Figure ${currentPattern.step2Num}</strong>?</p>
                <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                    Tiles = <input type="number" id="input-step2" placeholder="?" class="math-input" style="width:100px">
                </div>`;
        }else {
    stepHTML = ruleDisplay + `
        <p><strong>Step 3:</strong> Draw Figure ${currentPattern.step3Num}.</p>
        <p>Click the grid to show what Figure ${currentPattern.step3Num} looks like visually:</p>
        <div id="drawing-grid" style="display: grid; grid-template-columns: repeat(10, 32px); gap: 4px; justify-content: center; margin: 20px 0; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;"></div>`;
}

        qContent.innerHTML = headerHTML + stepHTML + `
            <div style="text-align:center; margin-top:15px; display: flex; justify-content: center; gap: 10px;">
                <button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button>
                <button onclick="showFigureHint()" class="secondary-btn" style="background: #64748b; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">Get Hint</button>
            </div>
            <div id="hint-display" style="margin-top: 15px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.9rem; color: #92400e;"></div>`;

        if (currentStep === 3) setupDrawingGrid();
    }

    window.showFigureHint = function() {
    const hintBox = document.getElementById('hint-display');
    hintBox.style.display = "block";
    let message = "";
    if (currentStep === 1) {
        message = `Compare the figures! The growth (m) is the change in tiles divided by the change in figure numbers.`;
    } else if (currentStep === 2) {
        message = `Plug ${currentPattern.step2Num} into your rule: (${currentPattern.m} × ${currentPattern.step2Num}) + ${currentPattern.b}`;
    } else {
        // Removed the specific count from the hint too
        message = `Apply your rule (y = mx + b) using Figure ${currentPattern.step3Num} as 'x' to find how many tiles to draw.`;
    }
    hintBox.innerHTML = message;
};
    
    window.checkFigureAns = async function() {
        let isCorrect = false;
        let stepKey = "";
        const feedback = document.getElementById('feedback-box');
        if (feedback) feedback.style.display = "block";

        if (currentStep === 1) {
            stepKey = "FigureRule";
            const uM = parseInt(document.getElementById('input-m').value);
            const uB = parseInt(document.getElementById('input-b').value);
            isCorrect = (uM === currentPattern.m && uB === currentPattern.b);
        } else if (currentStep === 2) {
            stepKey = "FigureX";
            const uAns = parseInt(document.getElementById('input-step2').value);
            isCorrect = (uAns === currentPattern.step2Ans);
        } else {
            stepKey = "FigureDraw";
            const activeTiles = document.querySelectorAll('.drawing-tile.active').length;
            isCorrect = (activeTiles === currentPattern.step3Ans);
        }

        if (isCorrect) {
            feedback.className = "correct";
            feedback.innerText = "✅ Correct!";
            try { await saveStepData(stepKey, figureErrorCount); } catch (e) { console.error(e); }

            if (currentStep < 3) {
                currentStep++;
                figureErrorCount = 0;
                setTimeout(() => { feedback.style.display = "none"; renderFigureUI(); }, 1000);
            } else {
                window.isCurrentQActive = false; 
                feedback.innerText = "Pattern Mastered!";
                setTimeout(() => { 
                    if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
                    else loadNextQuestion();
                }, 1500);
            } 
        } else {
            figureErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = "Not quite! Try again.";
        }
    };

    function setupDrawingGrid() {
        const grid = document.getElementById('drawing-grid');
        if (!grid) return;
        for (let i = 0; i < 50; i++) {
            const tile = document.createElement('div');
            tile.className = 'drawing-tile';
            tile.style = "width:30px; height:30px; border:1px solid #cbd5e1; background:white; cursor:pointer; border-radius: 4px;";
            tile.onclick = function() {
                this.classList.toggle('active');
                this.style.background = this.classList.contains('active') ? "#3b82f6" : "white";
                this.style.borderColor = this.classList.contains('active') ? "#2563eb" : "#cbd5e1";
            };
            grid.appendChild(tile);
        }
    }

    async function saveStepData(column, errorCount) {
        let adjustment = (errorCount === 0) ? 1 : (errorCount >= 3 ? -1 : 0);
        if (!window.userMastery) window.userMastery = {};
        let currentMastery = window.userMastery[column] || 0;
        let newMastery = Math.max(0, Math.min(10, currentMastery + adjustment));
        window.userMastery[column] = newMastery;

        const avg = ((window.userMastery['FigureRule'] || 0) + (window.userMastery['FigureDraw'] || 0) + (window.userMastery['FigureX'] || 0)) / 3;
        let updates = {};
        updates[column] = newMastery;
        updates['FigureGrowth'] = Math.round(avg); 

        return await window.supabaseClient.from('assignment').update(updates).eq('userName', window.currentUser);
    }

