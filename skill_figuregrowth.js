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
        
        isVisualMode = Math.random() > 0.5;

        // WIDER RANGES for m and b
        const m = Math.floor(Math.random() * 5) + 2; // Growth: 2 to 6
        const b = Math.floor(Math.random() * 8) + 1; // Starting: 1 to 8
        
        // RANDOMIZE which figures are used as the prompt
        // Example: Instead of Fig 1 & 2, maybe Fig 2 & 4 or Fig 1 & 3
        const firstFig = Math.floor(Math.random() * 2) + 1; // Figure 1 or 2
        const secondFig = firstFig + (Math.floor(Math.random() * 3) + 2); // At least 2 steps away
        
        currentPattern = {
            m: m,
            b: b,
            f1Num: firstFig,
            f1Count: (m * firstFig) + b,
            f2Num: secondFig,
            f2Count: (m * secondFig) + b,
            fig3Count: (m * 3) + b,
            targetX: Math.floor(Math.random() * 20) + 15 // Target Fig 15 to 35
        };

        renderFigureUI();
    };

   function generateTileHTML(count, m, b, figNum) {
        // Check if the user has reached "Expert" status (Mastery 8+)
        // If they are 8 or higher, we use a single color for everything.
        const isExpert = (window.userMastery?.['FigureGrowth'] || 0) >= 8;
        
        let html = `<div style="display: grid; grid-template-columns: repeat(5, 12px); gap: 1px; width: 65px; line-height: 0; margin: 0 auto;">`;
        
        for (let i = 0; i < count; i++) {
            // Default color is blue. Only use orange if they are below Rank 8.
            let color = '#3b82f6'; 
            if (!isExpert && i < b) {
                color = '#f97316'; // Training wheels: Orange for the constant 'b'
            }
            
            html += `<div style="width:12px; height:12px; background:${color}; border:0.5px solid white;"></div>`;
        }
        html += `</div>`;
        return html;
    }

  function renderFigureUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = `Figure Growth Analysis`;

    // 1. Keep the Header (Tiles/Images)
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

    // 2. Create the "Your Rule" display for Steps 2 and 3
    let ruleDisplay = "";
    if (currentStep > 1) {
        ruleDisplay = `
            <div style="background: #ecfdf5; border: 1px dashed #10b981; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; color: #065f46;">
                <strong>Your Rule:</strong> y = ${currentPattern.m}x + ${currentPattern.b}
            </div>`;
    }

    let stepHTML = "";
    if (currentStep === 1) {
        stepHTML = `
            <p><strong>Step 1:</strong> Find the rule (y = mx + b).</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:65px"> x + 
                <input type="number" id="input-b" placeholder="b" class="math-input" style="width:65px">
            </div>`;
    } else if (currentStep === 2) {
        stepHTML = ruleDisplay + `
            <p><strong>Step 2:</strong> Draw Figure 3.</p>
            <p>Click tiles to draw exactly how many tiles should be in Figure 3:</p>
            <div id="drawing-grid" style="display: grid; grid-template-columns: repeat(10, 32px); gap: 4px; justify-content: center; margin: 20px 0; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;"></div>`;
    } else {
        stepHTML = ruleDisplay + `
            <p><strong>Step 3:</strong> Large Scale Prediction.</p>
            <p>How many tiles will be in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                Tiles = <input type="number" id="input-ans" placeholder="?" class="math-input" style="width:100px">
            </div>`;
    }

    qContent.innerHTML = headerHTML + stepHTML + `
        <div style="text-align:center; margin-top:15px; display: flex; justify-content: center; gap: 10px;">
            <button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button>
            <button onclick="showFigureHint()" class="secondary-btn" style="background: #64748b; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">Get Hint</button>
        </div>
        <div id="hint-display" style="margin-top: 15px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.9rem; color: #92400e;"></div>`;

    if (currentStep === 2) setupDrawingGrid();
}
    window.showFigureHint = function() {
        const hintBox = document.getElementById('hint-display');
        hintBox.style.display = "block";
        
        let message = "";
        if (currentStep === 1) {
            const diffTiles = currentPattern.f2Count - currentPattern.f1Count;
            const diffFigs = currentPattern.f2Num - currentPattern.f1Num;
            message = `<strong>Growth (m):</strong> The tiles increased by ${diffTiles} over ${diffFigs} steps. Divide them to find <em>m</em>! <br><strong>Start (b):</strong> Subtract <em>m</em> from Figure 1 to find Figure 0.`;
        } else if (currentStep === 2) {
            message = `Use your rule: multiply ${currentPattern.m} by 3, then add ${currentPattern.b}. You need to click exactly ${currentPattern.fig3Count} tiles.`;
        } else {
            message = `Plug ${currentPattern.targetX} into your equation: (${currentPattern.m} × ${currentPattern.targetX}) + ${currentPattern.b}.`;
        }
        
        hintBox.innerHTML = message;
    };
    
   window.checkFigureAns = async function() {
    let isCorrect = false;
    let stepKey = "";
    const feedback = document.getElementById('feedback-box');
    if (feedback) feedback.style.display = "block";

    // --- Validation Logic (Unchanged) ---
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

    // --- Handling Correct Answer ---
    if (isCorrect) {
        feedback.className = "correct";
        feedback.innerText = "✅ Correct!";
        
        try {
            await saveStepData(stepKey, figureErrorCount);
        } catch (e) {
            console.error("Database save failed, but continuing game:", e);
        }

        if (currentStep < 3) {
            currentStep++;
            figureErrorCount = 0;
            setTimeout(() => {
                feedback.style.display = "none"; 
                renderFigureUI(); 
            }, 1000);
        } else {
            // FIXED: Removed the double { here
            window.isCurrentQActive = false; 
            feedback.innerText = "Pattern Mastered! Loading next...";
            
            console.log("Attempting to call window.loadNextQuestion...");
            
            setTimeout(() => {
                if (typeof window.loadNextQuestion === 'function') {
                    window.loadNextQuestion();
                } else {
                    loadNextQuestion();
                }
            }, 1500);
        } 
    } 
    // --- Handling Incorrect Answer ---
    else {
        figureErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Not quite! Check your growth logic.";
    }
};
function setupDrawingGrid() {
    const grid = document.getElementById('drawing-grid');
    if (!grid) return;
    
    // Create 50 clickable tiles
    for (let i = 0; i < 50; i++) {
        const tile = document.createElement('div');
        tile.className = 'drawing-tile';
        tile.style = "width:30px; height:30px; border:1px solid #cbd5e1; background:white; cursor:pointer; border-radius: 4px; transition: 0.2s;";
        
        tile.onclick = function() {
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                this.style.background = "#3b82f6";
                this.style.borderColor = "#2563eb";
            } else {
                this.style.background = "white";
                this.style.borderColor = "#cbd5e1";
            }
        };
        grid.appendChild(tile);
    }
}
    async function saveStepData(column, errorCount) {
        let adjustment = (errorCount === 0) ? 1 : (errorCount >= 3 ? -1 : 0);
        let currentMastery = window.userMastery?.[column] || 0;
        let newMastery = Math.max(0, Math.min(10, currentMastery + adjustment));

        if (!window.userMastery) window.userMastery = {};
        window.userMastery[column] = newMastery;

        const avg = ((window.userMastery['FigureRule'] || 0) + 
                     (window.userMastery['FigureDraw'] || 0) + 
                     (window.userMastery['FigureX'] || 0)) / 3;
        
        let updates = {};
        updates[column] = newMastery;
        updates['FigureGrowth'] = Math.round(avg); 

        // This ensures the game doesn't proceed until the DB confirms, 
        // OR the try/catch above handles the timeout.
        return await window.supabaseClient
            .from('assignment')
            .update(updates)
            .eq('userName', window.currentUser);
    }
}
