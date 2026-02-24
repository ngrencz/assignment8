/**
 * skill_solve_x.js - v2.5.0
 * UPDATED: Context-aware algebraic hints (Standard vs Distributive vs Fraction).
 * RESTORED: Standardized success screen for Hub hand-off and Supabase sync.
 */

console.log("%c [SolveX] - Pedagogical Build Loaded ", "background: #1e293b; color: #10b981; font-weight: bold;");

var solveXData = {
    equations: [],
    currentIndex: 0,
    needed: 5,
    score: 0,
    isFirstAttempt: true
};

window.initSolveXGame = async function() {
    if (!document.getElementById('q-content')) return;

    solveXData.currentIndex = 0;
    solveXData.isFirstAttempt = true;
    solveXData.equations = [];

    // --- HUB FIX: Safely ensure mastery object exists ---
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('SolveX')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            solveXData.score = data ? (data.SolveX || 0) : 0;
            window.userMastery.SolveX = solveXData.score;
        }
    } catch (e) { 
        console.warn("SolveX DB sync error, falling back to local state."); 
    }

    // Difficulty Scaling
    if (solveXData.score >= 8) solveXData.needed = 3; 
    else if (solveXData.score >= 5) solveXData.needed = 4;
    else solveXData.needed = 5;

    generateXEquations();
    renderSolveXUI();
};

function generateXEquations() {
    solveXData.equations = [];
    
    for (let i = 0; i < solveXData.needed; i++) {
        let useAdvanced = (solveXData.score >= 6);
        let type = Math.floor(Math.random() * 3); 

        if (type === 0) { 
            // Type: ax + b = c
            let a = Math.floor(Math.random() * 8) + 2;
            let ans = Math.floor(Math.random() * 12) - 4;
            let b = Math.floor(Math.random() * 15) + 1;
            let c = (a * ans) + b;
            solveXData.equations.push({ 
                html: `${a}x + ${b} = ${c}`, 
                ans: ans, 
                type: 'standard', a: a, b: b, c: c 
            });
        } 
        else if (type === 1) { 
            // Type: a(x + b) = c
            let a = Math.floor(Math.random() * 5) + 2;
            let ans = Math.floor(Math.random() * 10);
            let b = Math.floor(Math.random() * 6) + 1;
            let c = a * (ans + b);
            solveXData.equations.push({ 
                html: `${a}(x + ${b}) = ${c}`, 
                ans: ans, 
                type: 'distributive', a: a, b: b, c: c 
            });
        } 
        else { 
            // Type: x/a + b = c
            let a = Math.floor(Math.random() * 4) + 2;
            let ans = Math.floor(Math.random() * 8) + 1;
            let b = Math.floor(Math.random() * 10) + 1;
            let xVal = a * ans;
            let c = (xVal / a) + b;

            solveXData.equations.push({ 
                type: 'fraction',
                num: 'x', den: a, constant: b, result: c, 
                ans: xVal 
            });
        }
    }
}

function renderSolveXUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    solveXData.isFirstAttempt = true;

    if(solveXData.currentIndex >= solveXData.equations.length) {
        finishSolveXGame();
        return;
    }

    let eq = solveXData.equations[solveXData.currentIndex];
    let displayHtml = "";

    if (eq.type === 'fraction') {
        displayHtml = `
            <div class="eq-container">
                <div class="fraction">
                    <div class="numer">${eq.num}</div>
                    <div class="denom">${eq.den}</div>
                </div>
                <div class="rest">+ ${eq.constant} = ${eq.result}</div>
            </div>`;
    } else {
        displayHtml = `<div class="eq-container text-eq">${eq.html}</div>`;
    }

    qContent.innerHTML = `
        <div style="max-width:500px; margin:0 auto;">
            <div style="text-align:center; color:#64748b; margin-bottom:10px;">
                Step ${solveXData.currentIndex + 1} of ${solveXData.needed}
            </div>
            
            <div class="card">
                ${displayHtml}
            </div>

            <div style="margin-top:20px; text-align:center;">
                <div style="display:inline-flex; align-items:center; gap:10px;">
                    <span style="font-size:24px; font-weight:bold; color:#334155;">x =</span>
                    <input type="number" id="inp-solve" class="solve-input" placeholder="?">
                    <button onclick="handleSolveSubmit()" class="solve-btn">Check</button>
                </div>
                <div id="solve-feedback" style="margin-top:15px; font-weight:bold; min-height:24px;"></div>
                <div id="solve-hint" style="margin-top: 15px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e; text-align:center;"></div>
            </div>
        </div>
    `;

    setTimeout(() => { document.getElementById('inp-solve')?.focus(); }, 100);
}

// --- HUB FIX: Removed async to prevent UI blocking on submit ---
window.handleSolveSubmit = function() {
    const inp = document.getElementById('inp-solve');
    const feedback = document.getElementById('solve-feedback');
    const hintBox = document.getElementById('solve-hint');
    if (!inp) return;

    const userAns = parseFloat(inp.value);
    const eq = solveXData.equations[solveXData.currentIndex];

    if (isNaN(userAns)) {
        feedback.innerText = "Please enter a number.";
        feedback.style.color = "#ef4444";
        return;
    }

    if (Math.abs(userAns - eq.ans) < 0.01) {
        feedback.innerText = "✅ Correct!";
        feedback.style.color = "#16a34a";
        hintBox.style.display = "none";
        inp.disabled = true;

        let change = solveXData.isFirstAttempt ? 1 : 0; 
        
        // --- HUB FIX: Fire and forget (no await) ---
        updateSolveXScore(change);

        solveXData.currentIndex++;
        setTimeout(renderSolveXUI, 1200);

    } else {
        solveXData.isFirstAttempt = false;
        feedback.innerText = "Not quite. Try again.";
        feedback.style.color = "#dc2626";
        
        // Contextual Hint Logic
        hintBox.style.display = "block";
        if (eq.type === 'standard') {
            hintBox.innerHTML = `<strong>Hint:</strong> First, subtract <b>${eq.b}</b> from both sides. Then, divide the result by <b>${eq.a}</b>.`;
        } else if (eq.type === 'distributive') {
            hintBox.innerHTML = `<strong>Hint:</strong> Try dividing both sides by <b>${eq.a}</b> first to clear the parentheses, then subtract <b>${eq.b}</b>.`;
        } else if (eq.type === 'fraction') {
            hintBox.innerHTML = `<strong>Hint:</strong> First, subtract <b>${eq.constant}</b> from both sides. Then, multiply the result by <b>${eq.den}</b> to isolate x.`;
        }
    }
};

// --- HUB FIX: Removed async, switched to background sync ---
function updateSolveXScore(amount) {
    let next = Math.max(0, Math.min(10, solveXData.score + amount));
    solveXData.score = next;
    window.userMastery.SolveX = next;

    if (window.supabaseClient && window.currentUser) {
        const h = sessionStorage.getItem('target_hour') || "00";
        window.supabaseClient.from('assignment')
            .update({ SolveX: next })
            .eq('userName', window.currentUser)
            .eq('hour', h)
            .catch(e => console.error("DB Update Failed", e));
    }
}

function finishSolveXGame() {
    // --- HUB FIX: Immediately release the lock so the Hub can load the next script ---
    window.isCurrentQActive = false;
    
    const qContent = document.getElementById('q-content');
    qContent.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <div style="font-size: 60px; margin-bottom: 20px;">🎯</div>
            <h2 style="color: #1e293b;">Algebra Set Complete!</h2>
            <p style="color: #64748b;">Current Mastery: ${solveXData.score}/10</p>
            <p style="font-size: 14px; color: #10b981; margin-top: 20px;">Loading next activity...</p>
        </div>
    `;
    
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') {
            window.loadNextQuestion();
        } else {
            location.reload(); 
        }
    }, 2000);
}

// Optimized Styles
const solveStyle = document.createElement('style');
solveStyle.innerHTML = `
    .card { background:white; padding:40px 20px; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.05); display:flex; justify-content:center; }
    .eq-container { display:flex; align-items:center; font-size:32px; font-family: 'Courier New', monospace; color:#1e293b; font-weight:bold; }
    .fraction { display:inline-flex; flex-direction:column; align-items:center; margin-right:10px; }
    .numer { border-bottom:3px solid #1e293b; padding:0 10px; text-align:center; width:100%; }
    .denom { padding:0 10px; text-align:center; width:100%; }
    .solve-input { width:100px; padding:10px; font-size:20px; border:2px solid #cbd5e1; border-radius:8px; text-align:center; }
    .solve-btn { padding:10px 25px; background:#1e293b; color:white; border:none; border-radius:8px; font-size:16px; cursor:pointer; font-weight:bold; }
`;
document.head.appendChild(solveStyle);
