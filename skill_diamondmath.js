/**
 * skill_diamondmath.js
 * - Solves Diamond Problems (X Puzzles).
 * - Covers ALL missing variable combinations.
 * - Supports Integers, Negatives, Decimals, and Fractions.
 */

console.log("🚀 skill_diamondmath.js is LIVE - V3 (Forced Decimals & DB Logging)");

var diamondData = {
    A: 0,            
    B: 0,            
    top: 0,          
    bottom: 0,       
    missing: [],     
    level: 0         
};

var diamondRound = 1;
var totalDiamondRounds = 4;

window.initDiamondMath = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    diamondRound = 1;

    // Initialize Mastery State
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            // --- HUB FIX: Added || "00" fallback ---
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            console.log(`[DiamondMath] Fetching from Supabase for User: "${window.currentUser}", Hour: "${currentHour}"`);
            
            const { data, error } = await window.supabaseClient
                .from('assignment')
                .select('DiamondMath')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            if (error) {
                console.error("[DiamondMath] Supabase fetch error:", error);
            } else {
                console.log("[DiamondMath] Data returned from Supabase:", data);
            }
            
            window.userMastery.DiamondMath = data?.DiamondMath || 0;
            console.log(`[DiamondMath] Level set to: ${window.userMastery.DiamondMath}`);
        } else {
            console.warn("[DiamondMath] Missing supabaseClient or currentUser! Defaulting to level 0.");
        }
    } catch (e) { 
        console.error("[DiamondMath] Catch block error:", e); 
    }
    
    startDiamondRound();
};

function startDiamondRound() {
    generateDiamondProblem();
    renderDiamondUI();
}

function generateDiamondProblem() {
    const lvl = Number(window.userMastery.DiamondMath) || 0;
    diamondData.level = lvl;
    
    let a, b;
    // We use these to show "3/4" instead of "0.75" if you want visual fractions
    diamondData.displayA = null; 
    diamondData.displayB = null;

    // --- 1. VALUE GENERATION ---
    if (lvl <= 5) {
        // Positive Integers
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
    } 
    else if (lvl <= 7) {
        // Negative Integers
        a = Math.floor(Math.random() * 21) - 10;
        b = Math.floor(Math.random() * 21) - 10;
        if (a === 0) a = 1; if (b === 0) b = -1;
    } 
    else if (lvl === 8) {
        // Level 8: Decimals (Tenths / Halves)
        a = (Math.floor(Math.random() * 19) - 9) * 0.5;
        b = (Math.floor(Math.random() * 19) - 9) * 0.5;
        if (a === 0) a = 0.5;
    } 
    else if (lvl === 9) {
        // Level 9: Advanced Decimals (Quarters)
        a = (Math.floor(Math.random() * 39) - 19) * 0.25;
        b = (Math.floor(Math.random() * 39) - 19) * 0.25;
        if (a === 0) a = 0.25;
    } 
    else {
        // Level 10+: TRUE FRACTIONS
        const denoms = [2, 4];
        let denA = denoms[Math.floor(Math.random() * 2)];
        let denB = denoms[Math.floor(Math.random() * 2)];
        let numA = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1);
        let numB = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1);

        // Ensure they aren't just whole numbers (e.g., 4/4)
        if (numA % denA === 0) numA++;
        if (numB % denB === 0) numB++;

        a = numA / denA;
        b = numB / denB;

        // Optional: Store strings for your UI to display "3/4"
        diamondData.displayA = `${numA}/${denA}`;
        diamondData.displayB = `${numB}/${denB}`;
    }

    // Standard Math Calculations
    diamondData.A = a;
    diamondData.B = b;
    diamondData.top = parseFloat((a * b).toFixed(4));      // toFixed prevents 0.30000000004 bugs
    diamondData.bottom = parseFloat((a + b).toFixed(4));

    // --- 2. HIDING LOGIC (The "Anti-Quadratic" Filter) ---
    const r = Math.random();
    
    if (r < 0.25) {
        diamondData.missing = ['top', 'bottom'];
    } 
    else if (r < 0.50) {
        // THE FIX: If Level 8+, don't hide both A and B. 
        // We force them to find the "Results" instead.
        if (lvl >= 8) {
            diamondData.missing = ['top', 'bottom'];
        } else {
            diamondData.missing = ['A', 'B'];
        }
    } 
    else if (r < 0.75) {
        const sideToHide = Math.random() > 0.5 ? 'A' : 'B';
        diamondData.missing = ['top', sideToHide];
    } 
    else {
        const sideToHide = Math.random() > 0.5 ? 'A' : 'B';
        diamondData.missing = ['bottom', sideToHide];
    }

    console.log(`[DiamondMath] Lvl:${lvl} | A:${a}, B:${b} | Missing:${diamondData.missing}`);
}

function renderDiamondUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    const renderField = (key, val) => {
        if (diamondData.missing.includes(key)) {
            // Widened to 90px to fit negatives and decimals
            return `<input type="text" id="ans-${key}" placeholder="?" autocomplete="off" 
                    style="width:90px; height:40px; text-align:center; font-size:18px; border:2px solid #3b82f6; border-radius:8px; outline:none; background:white;">`;
        }
        
        let displayVal = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
        
        // This ensures generated fractions aren't forced into decimals on the screen
        if (key === 'A' && diamondData.displayA) displayVal = diamondData.displayA;
        if (key === 'B' && diamondData.displayB) displayVal = diamondData.displayB;
        
        return `<span style="font-size:26px; font-weight:bold; color:#1e293b;">${displayVal}</span>`;
    };

    document.getElementById('q-title').innerText = `Diamond Problems (Round ${diamondRound}/${totalDiamondRounds})`;

    qContent.innerHTML = `
        <div style="display: flex; gap: 40px; flex-wrap: wrap; justify-content:center; align-items:center; min-height: 350px;">
            
            <div style="position:relative; width:300px; height:300px;">
                <svg width="300" height="300" style="position:absolute; top:0; left:0; z-index:0;">
                    <polygon points="150,20 280,150 150,280 20,150" fill="#ffffff" stroke="#1e293b" stroke-width="6" stroke-linejoin="round" />
                    <line x1="85" y1="85" x2="215" y2="215" stroke="#1e293b" stroke-width="6" stroke-linecap="round" />
                    <line x1="85" y1="215" x2="215" y2="85" stroke="#1e293b" stroke-width="6" stroke-linecap="round" />
                </svg>

                <div style="position:absolute; top:85px; left:150px; transform:translate(-50%, -50%); width:100px; text-align:center; z-index:10;">
                    ${renderField('top', diamondData.top)}
                </div>

                <div style="position:absolute; top:215px; left:150px; transform:translate(-50%, -50%); width:100px; text-align:center; z-index:10;">
                    ${renderField('bottom', diamondData.bottom)}
                </div>

                <div style="position:absolute; top:150px; left:85px; transform:translate(-50%, -50%); width:100px; text-align:center; z-index:10;">
                    ${renderField('A', diamondData.A)}
                </div>

                <div style="position:absolute; top:150px; left:215px; transform:translate(-50%, -50%); width:100px; text-align:center; z-index:10;">
                    ${renderField('B', diamondData.B)}
                </div>
            </div>

            <div style="flex:1; min-width:220px; max-width:300px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
                <h3 style="margin-top:0; color:#475569; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Pattern Key</h3>
                
                <div style="display:flex; justify-content:center; margin-bottom:15px; position:relative;">
                    <svg width="150" height="150">
                        <polygon points="75,10 140,75 75,140 10,75" fill="white" stroke="#94a3b8" stroke-width="4" stroke-linejoin="round" />
                        <line x1="42.5" y1="42.5" x2="107.5" y2="107.5" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
                        <line x1="42.5" y1="107.5" x2="107.5" y2="42.5" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
                        
                        <text x="75" y="42" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ef4444" text-anchor="middle" dominant-baseline="middle">Product</text>
                        <text x="75" y="108" font-family="sans-serif" font-size="12" font-weight="bold" fill="#3b82f6" text-anchor="middle" dominant-baseline="middle">Sum</text>
                        <text x="42" y="75" font-family="sans-serif" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle" dominant-baseline="middle">x</text>
                        <text x="108" y="75" font-family="sans-serif" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle" dominant-baseline="middle">y</text>
                    </svg>
                </div>
                
                <button onclick="checkDiamondWin()" style="width:100%; margin-top:10px; height:45px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">CHECK ANSWER</button>
            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;
}

function parseMathInput(str) {
    if (!str) return NaN;
    str = str.trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        return parts.length === 2 ? parseFloat(parts[0]) / parseFloat(parts[1]) : NaN;
    }
    return parseFloat(str);
}

// I left the 'async' keyword here so it perfectly matches your original structure
window.checkDiamondWin = async function() {
    let allCorrect = true;
    const inputs = {}; 

    diamondData.missing.forEach(key => {
        const el = document.getElementById(`ans-${key}`);
        if(el) inputs[key] = { el: el, val: parseMathInput(el.value) };
    });

    if (diamondData.missing.includes('A') && diamondData.missing.includes('B')) {
        const valA = inputs['A'].val;
        const valB = inputs['B'].val;
        
        const prod = valA * valB;
        const sum = valA + valB;
        
        const prodOK = Math.abs(prod - diamondData.top) < 0.05;
        const sumOK = Math.abs(sum - diamondData.bottom) < 0.05;

        if (prodOK && sumOK) {
            inputs['A'].el.style.backgroundColor = "#dcfce7"; inputs['A'].el.style.borderColor = "#22c55e";
            inputs['B'].el.style.backgroundColor = "#dcfce7"; inputs['B'].el.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            inputs['A'].el.style.backgroundColor = "#fee2e2"; inputs['A'].el.style.borderColor = "#ef4444";
            inputs['B'].el.style.backgroundColor = "#fee2e2"; inputs['B'].el.style.borderColor = "#ef4444";
        }
    } else {
        for (let key in inputs) {
            let target = diamondData[key];
            let userVal = inputs[key].val;
            
            if (isNaN(userVal) || Math.abs(userVal - target) > 0.05) {
                allCorrect = false;
                inputs[key].el.style.backgroundColor = "#fee2e2";
                inputs[key].el.style.borderColor = "#ef4444";
            } else {
                inputs[key].el.style.backgroundColor = "#dcfce7";
                inputs[key].el.style.borderColor = "#22c55e";
            }
        }
    }

    if (allCorrect) {
        showFlash("Correct!", "success");
        
        let current = Number(window.userMastery.DiamondMath) || 0;
        let nextScore = Math.min(10, current + 1);
        window.userMastery.DiamondMath = nextScore;
        
        console.log(`[DiamondMath] Updating Supabase to Level: ${nextScore}`);

        // --- HUB FIX: Non-blocking background sync ---
        if (window.supabaseClient && window.currentUser) {
            const hour = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment')
                .update({ DiamondMath: nextScore })
                .eq('userName', window.currentUser)
                .eq('hour', hour)
                .then(({error}) => { if (error) console.error("[DiamondMath] Update Error:", error); })
                .catch(e => console.error("[DiamondMath] Supabase update catch block failed:", e));
        }

        diamondRound++;
        setTimeout(() => {
            if (diamondRound > totalDiamondRounds) finishDiamondGame();
            else startDiamondRound();
        }, 1200);
    } else {
        showFlash("Check your math.", "error");
    }
};

function finishDiamondGame() {
    window.isCurrentQActive = false; 
    const qContent = document.getElementById('q-content');
    
    qContent.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
            <div style="font-size:60px;">💎</div>
            <h2 style="color:#1e293b; margin:10px 0;">Diamond Set Complete!</h2>
            <p style="color:#64748b; font-size:16px;">Skills updated.</p>
        </div>
    `;

    // --- HUB FIX: Standard fallback ---
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') {
            window.loadNextQuestion(); 
        } else {
            location.reload();
        }
    }, 2500);
}

function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    if (!overlay) return;
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}
