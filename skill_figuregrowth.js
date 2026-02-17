// --- Figure Growth State ---
let currentPattern = {};
let figureErrorCount = 0;
let currentStep = 1; // 1: FigureRule, 2: FigureDraw (Fig 3), 3: FigureX

function initFigureGrowthGame() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    
    figureErrorCount = 0;
    currentStep = 1; 

    const m = Math.floor(Math.random() * 3) + 2; 
    const b = Math.floor(Math.random() * 5) + 1; 
    
    currentPattern = {
        m: m,
        b: b,
        fig2Count: (m * 2) + b,
        fig6Count: (m * 6) + b,
        targetX: Math.floor(Math.random() * 30) + 10 
    };

    renderFigureUI();
}

function renderFigureUI() {
    document.getElementById('q-title').innerText = `Tile Pattern Analysis`;
    
    let content = `
        <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; text-align: center;">
            <p><strong>Figure 2:</strong> ${currentPattern.fig2Count} tiles | <strong>Figure 6:</strong> ${currentPattern.fig6Count} tiles</p>
        </div>
    `;

    if (currentStep === 1) {
        content += `
            <p><strong>Step 1:</strong> Find the rule (y = mx + b)</p>
            <div style="font-size: 1.5rem; text-align: center; margin: 20px 0;">
                y = <input type="number" id="input-m" placeholder="m" class="math-input" style="width:70px"> x + 
                <input type="number" id="input-b" placeholder="b" class="math-input" style="width:70px">
            </div>
        `;
    } else if (currentStep === 2) {
        content += `
            <p><strong>Step 2:</strong> How many tiles are in <strong>Figure 3</strong>?</p>
            <div style="text-align: center; margin: 20px 0;">
                <input type="number" id="input-ans" placeholder="Total tiles" class="math-input" style="width: 150px;">
            </div>
        `;
    } else {
        content += `
            <p><strong>Step 3:</strong> How many tiles in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <div style="text-align: center; margin: 20px 0;">
                <input type="number" id="input-ans" placeholder="Total tiles" class="math-input" style="width: 150px;">
            </div>
        `;
    }

    content += `<div style="text-align:center;"><button onclick="checkFigureAns()" class="primary-btn">Submit Answer</button></div>`;
    document.getElementById('q-content').innerHTML = content;
}

async function checkFigureAns() {
    let isCorrect = false;
    let stepKey = "";
    const feedback = document.getElementById('feedback-box');
    feedback.style.display = "block";

    if (currentStep === 1) {
        stepKey = "FigureRule";
        const uM = parseInt(document.getElementById('input-m').value);
        const uB = parseInt(document.getElementById('input-b').value);
        isCorrect = (uM === currentPattern.m && uB === currentPattern.b);
    } else if (currentStep === 2) {
        stepKey = "FigureDraw";
        const uAns = parseInt(document.getElementById('input-ans').value);
        isCorrect = (uAns === (currentPattern.m * 3) + currentPattern.b);
    } else {
        stepKey = "FigureX";
        const uAns = parseInt(document.getElementById('input-ans').value);
        isCorrect = (uAns === (currentPattern.m * currentPattern.targetX) + currentPattern.b);
    }

    if (isCorrect) {
        feedback.className = "correct-box";
        feedback.innerText = "Correct! Saving step progress...";
        
        // Save this specific step's score
        let stepScore = Math.max(1, 10 - figureErrorCount);
        await saveStepData(stepKey, stepScore);

        if (currentStep < 3) {
            currentStep++;
            figureErrorCount = 0; // Reset errors for the next step
            setTimeout(renderFigureUI, 1000);
        } else {
            // Final completion - update main FigureGrowth average
            feedback.innerText = "Pattern Mastered!";
            window.isCurrentQActive = false;
            setTimeout(loadNextQuestion, 1500);
        }
    } else {
        figureErrorCount++;
        feedback.className = "incorrect-box";
        feedback.innerText = "Try again! Check your growth rate.";
    }
}

async function saveStepData(column, score) {
    let updates = {};
    updates[column] = score;
    // We also update the main FigureGrowth column as an overall progress indicator
    updates['FigureGrowth'] = score; 

    const { error } = await window.supabaseClient
        .from('assignment')
        .update(updates)
        .eq('userName', window.currentUser);

    if (error) console.error("Update failed:", error.message);
}
