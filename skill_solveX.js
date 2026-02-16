let currentEquations = [];
let solveXErrorCount = 0;
let problemsSolved = 0;
let problemsNeeded = 4;

async function initSolveXGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 240; 
    solveXErrorCount = 0;
    problemsSolved = 0;

    // 1. Determine difficulty scaling from Supabase
    const { data } = await supabaseClient.from('assignment').select('SolveX').eq('userName', currentUser).single();
    const currentScore = data.SolveX || 0;

    if (currentScore >= 8) problemsNeeded = 2;
    else if (currentScore >= 5) problemsNeeded = 3;
    else problemsNeeded = 4;

    generateEquations();
    renderSolveXUI();
}

function generateEquations() {
    currentEquations = [];
    for (let i = 0; i < problemsNeeded; i++) {
        let type = i % 3; 
        if (type === 0) { // ax + b = c
            let a = Math.floor(Math.random() * 5) + 2;
            let ans = Math.floor(Math.random() * 10) - 5;
            let b = Math.floor(Math.random() * 10) + 1;
            let c = (a * ans) + b;
            currentEquations.push({ text: `${a}x + ${b} = ${c}`, ans: ans });
        } else if (type === 1) { // a(x + b) = c
            let a = Math.floor(Math.random() * 4) + 2;
            let ans = Math.floor(Math.random() * 8);
            let b = Math.floor(Math.random() * 5) + 1;
            let c = a * (ans + b);
            currentEquations.push({ text: `${a}(x + ${b}) = ${c}`, ans: ans });
        } else { // Fractional proportions
            let ans = 6; 
            currentEquations.push({ text: `\\frac{6}{x + 2} = \\frac{3}{4}`, ans: ans });
        }
    }
}

function renderSolveXUI() {
    document.getElementById('q-title').innerText = `Algebra: Multi-Step Equations`;
    let eq = currentEquations[problemsSolved];
    
    // Formatting for fractions if needed, otherwise clean text
    let displayHtml = eq.text.includes('\\frac') 
        ? `<div style="font-size: 2rem; margin: 20px 0;">6/(x+2) = 3/4</div>` 
        : `<strong>${eq.text}</strong>`;

    document.getElementById('q-content').innerHTML = `
        <div style="background: var(--gray-light); padding: 30px; border-radius: var(--border-radius); margin-bottom: 20px; text-align: center; font-size: 28px; border: 1px solid var(--gray-med);">
            ${displayHtml}
        </div>
        
        <div style="text-align: center;">
            <p style="color: var(--gray-text); font-weight: bold;">Problem ${problemsSolved + 1} of ${problemsNeeded}</p>
            <div style="display: flex; justify-content: center; gap: 10px; align-items: center;">
                <span style="font-size: 1.2rem; font-weight: bold;">x =</span>
                <input type="number" id="solve-ans" placeholder="?" style="width: 100px; text-align: center;">
                <button onclick="checkSolveX()">Submit</button>
            </div>
        </div>
    `;
    
    // Hide feedback box when starting a new sub-problem
    document.getElementById('feedback-box').style.display = 'none';
}

async function checkSolveX() {
    const userAns = parseFloat(document.getElementById('solve-ans').value);
    const correctAns = currentEquations[problemsSolved].ans;
    const feedback = document.getElementById('feedback-box');

    if (isNaN(userAns)) return;

    feedback.style.display = "block";

    if (Math.abs(userAns - correctAns) < 0.1) {
        problemsSolved++;
        feedback.className = "correct";
        feedback.innerText = "Correct! Great algebraic thinking.";

        if (problemsSolved >= problemsNeeded) {
            let score = Math.max(1, 10 - solveXErrorCount);
            await supabaseClient.from('assignment').update({ SolveX: score }).eq('userName', currentUser);
            
            setTimeout(() => {
                alert(`Set Complete! Score: ${score}/10`);
                loadNextQuestion();
            }, 1000);
        } else {
            setTimeout(renderSolveXUI, 1200);
        }
    } else {
        solveXErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Not quite. Check your inverse operations and try again!";
    }
}
