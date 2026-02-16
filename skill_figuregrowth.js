let currentPattern = {};
let figureErrorCount = 0;
let currentSubSkill = ""; // FigureRule, FigureDraw, or FigureX

function initFigureGrowthGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 180;
    figureErrorCount = 0;

    // 1. Generate a random linear pattern: y = mx + b
    const growthRate = Math.floor(Math.random() * 3) + 2; // m = 2, 3, or 4
    const startingTiles = Math.floor(Math.random() * 5) + 1; // b = 1 to 5
    
    currentPattern = {
        m: growthRate,
        b: startingTiles,
        fig2Count: (growthRate * 2) + startingTiles,
        fig6Count: (growthRate * 6) + startingTiles,
        targetX: Math.floor(Math.random() * 50) + 10 
    };

    // 2. Pick sub-skill
    const subSkills = ['FigureRule', 'FigureDraw', 'FigureX'];
    currentSubSkill = subSkills[Math.floor(Math.random() * subSkills.length)];

    renderFigureUI();
}

function renderFigureUI() {
    document.getElementById('q-title').innerText = "Tile Pattern Growth";
    
    let content = `
        <div style="background: var(--gray-light); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--gray-med);">
            <p style="margin: 0 0 10px 0;"><strong>Figure 2</strong> has <span class="accent-text">${currentPattern.fig2Count}</span> tiles.</p>
            <p style="margin: 0;"><strong>Figure 6</strong> has <span class="accent-text">${currentPattern.fig6Count}</span> tiles.</p>
        </div>
    `;

    if (currentSubSkill === 'FigureRule') {
        content += `
            <p>Find the rule for the pattern:</p>
            <div style="font-size: 1.2rem; font-weight: bold;">
                y = <input type="number" id="input-m" placeholder="m" style="width:70px"> x + 
                <input type="number" id="input-b" placeholder="b" style="width:70px">
            </div>
        `;
    } else if (currentSubSkill === 'FigureX') {
        content += `
            <p>Based on the growth, how many tiles will be in <strong>Figure ${currentPattern.targetX}</strong>?</p>
            <input type="number" id="input-ans" placeholder="Total tiles" style="width: 150px;">
        `;
    } else { // FigureDraw logic
        content += `
            <p>Sketch <strong>Figure 3</strong> on your paper. How many tiles should it have in total?</p>
            <input type="number" id="input-ans" placeholder="Tiles in Fig 3" style="width: 150px;">
        `;
    }

    content += `<br><br><button onclick="checkFigureAns()">Submit Answer</button>`;
    document.getElementById('q-content').innerHTML = content;
}

async function checkFigureAns() {
    let isCorrect = false;
    const feedback = document.getElementById('feedback-box');
    feedback.style.display = "block";

    if (currentSubSkill === 'FigureRule') {
        const userM = parseInt(document.getElementById('input-m').value);
        const userB = parseInt(document.getElementById('input-b').value);
        isCorrect = (userM === currentPattern.m && userB === currentPattern.b);
    } else if (currentSubSkill === 'FigureX') {
        const userAns = parseInt(document.getElementById('input-ans').value);
        const correctAns = (currentPattern.m * currentPattern.targetX) + currentPattern.b;
        isCorrect = (userAns === correctAns);
    } else { // Figure 3 count
        const userAns = parseInt(document.getElementById('input-ans').value);
        const correctAns = (currentPattern.m * 3) + currentPattern.b;
        isCorrect = (userAns === correctAns);
    }

    if (isCorrect) {
        feedback.className = "correct";
        feedback.innerText = "Excellent! You found the pattern.";
        
        let score = Math.max(1, 10 - (figureErrorCount * 2));
        await updateFigureMastery(score);
        
        setTimeout(loadNextQuestion, 1500);
    } else {
        figureErrorCount++;
        feedback.className = "incorrect";
        feedback.innerHTML = `
            <span>Not quite.</span><br>
            <small>Hint: The change in tiles between Fig 2 and Fig 6 is <strong>${currentPattern.fig6Count - currentPattern.fig2Count}</strong> over 4 steps. Divide that to find your growth rate (m)!</small>
        `;
    }
}

async function updateFigureMastery(score) {
    const { data } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
    
    let updates = {};
    updates[currentSubSkill] = score;

    const subColumns = ['FigureRule', 'FigureDraw', 'FigureX'];
    let total = score;
    let count = 1;
    subColumns.forEach(col => {
        if (col !== currentSubSkill && data[col] !== null) {
            total += data[col];
            count++;
        }
    });
    updates['FigureGrowth'] = Math.round(total / count);

    await supabaseClient.from('assignment').update(updates).eq('userName', currentUser);
}
