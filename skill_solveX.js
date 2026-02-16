let currentEquations = [];
let solveXErrorCount = 0;
let problemsSolved = 0;
let problemsNeeded = 4; // Default to max

async function initSolveXGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 240; // 4 minutes for set of equations
    solveXErrorCount = 0;
    problemsSolved = 0;

    // 1. Determine how many problems they need based on Supabase score
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
    // Generate a mix of equation types: simple linear, parentheses, fractions
    for (let i = 0; i < problemsNeeded; i++) {
        let type = i % 3; 
        if (type === 0) { // Simple linear: ax + b = c
            let a = Math.floor(Math.random() * 5) + 2;
            let ans = Math.floor(Math.random() * 10) - 5;
            let b = Math.floor(Math.random() * 10) + 1;
            let c = (a * ans) + b;
            currentEquations.push({ text: `${a}x + ${b} = ${c}`, ans: ans });
        } else if (type === 1) { // Parentheses: a(x + b) = c
            let a = Math.floor(Math.random() * 4) + 2;
            let ans = Math.floor(Math.random() * 8);
            let b = Math.floor(Math.random() * 5) + 1;
            let c = a * (ans + b);
            currentEquations.push({ text: `${a}(x + ${b}) = ${c}`, ans: ans });
        } else { // Fractions: x/a = b/c style
            let b = 3, c = 4;
            let ans = Math.floor(Math.random() * 6) * 2; // Even number
            let a = (ans + 2) * (c / b);
            currentEquations.push({ text: `6 / (x + 2) = 3 / 4`, ans: 6 }); // Fixed variety for now
        }
    }
}

function renderSolveXUI() {
    document.getElementById('q-title').innerText = `Solve for x (${problemsNeeded} required)`;
    let eq = currentEquations[problemsSolved];
    
    document.getElementById('q-content').innerHTML = `
        <div style="background:#f7fafc; padding:20px; border-radius:8px; margin-bottom:15px; text-align:center; font-size:24px;">
            <strong>${eq.text}</strong>
        </div>
        <p>Problem ${problemsSolved + 1} of ${problemsNeeded}:</p>
        <input type="number" id="solve-ans" placeholder="x = ?" style="width:100px; padding:10px; font-size:18px;">
        <button onclick="checkSolveX()" style="margin-left:10px; background:#38a169; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Submit</button>
        <div id="solve-feedback" style="margin-top:10px; font-weight:bold;"></div>
    `;
}

async function checkSolveX() {
    const userAns = parseFloat(document.getElementById('solve-ans').value);
    const correctAns = currentEquations[problemsSolved].ans;
    const feedback = document.getElementById('solve-feedback');

    if (Math.abs(userAns - correctAns) < 0.1) {
        problemsSolved++;
        if (problemsSolved >= problemsNeeded) {
            let score = Math.max(1, 10 - (solveXErrorCount));
            await supabaseClient.from('assignment').update({ SolveX: score }).eq('userName', currentUser);
            alert(`Great job! You finished the set with a score of ${score}/10.`);
            loadNextQuestion();
        } else {
            feedback.innerHTML = `<span style="color:green;">Correct! Loading next...</span>`;
            setTimeout(renderSolveXUI, 1000);
        }
    } else {
        solveXErrorCount++;
        feedback.innerHTML = `<span style="color:red;">Not quite. Try again!</span>`;
    }
}
