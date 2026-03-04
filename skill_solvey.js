/**
 * skill_solvey.js
 * - 8th Grade: Literal Equations (Solve for Y)
 * - Converts Standard Form (Ax + By = C) to Slope-Intercept Form (y = mx + b).
 * - Dynamic difficulty scaling based on mastery (introduces fractions at higher levels).
 * - Contextual hints targeting common algebra mistakes (forgetting to divide both terms).
 */

(function() {
    console.log("🚀 skill_solvey.js LIVE (Solving for Y)");

    var syData = {
        round: 1,
        maxRounds: 4,
        errorsThisRound: 0,
        scenario: {},
        isExpertMode: false
    };

    // Robust parser to handle fractional inputs
    function parseMath(str) {
        if (!str) return NaN;
        str = str.replace(/\s/g, '');
        if (str.includes('/')) {
            let parts = str.split('/');
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return parseFloat(parts[0]) / parseFloat(parts[1]);
            }
        }
        return parseFloat(str);
    }

    window.initSolveYGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        syData.round = 1;
        syData.errorsThisRound = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('SolveY, sy_slope, sy_intercept')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("SolveY DB sync error.");
        }

        let mastery = window.userMastery.SolveY || 0;
        syData.isExpertMode = mastery >= 7;

        startSYRound();
    };

    function startSYRound() {
        syData.errorsThisRound = 0;
        generateSYProblem();
        renderSYUI();
    }

    function generateSYProblem() {
        let A, B, C;
        let m, b;

        let level = Math.floor(Math.random() * 3);
        if (syData.isExpertMode && Math.random() > 0.3) level = 3; // Force hard fractions for experts

        if (level === 0) {
            // Level 1: B = 1 (No division required, just move X)
            A = Math.floor(Math.random() * 8) + 2; 
            if (Math.random() > 0.5) A = -A;
            B = 1;
            C = Math.floor(Math.random() * 20) - 10;
            if (C === 0) C = 5;
        } 
        else if (level === 1) {
            // Level 2: B > 1, but divides A and C evenly (Clean integers)
            B = Math.floor(Math.random() * 4) + 2; // 2 to 5
            if (Math.random() > 0.5) B = -B;
            let mInt = Math.floor(Math.random() * 5) + 1; // 1 to 5
            if (Math.random() > 0.5) mInt = -mInt;
            let bInt = Math.floor(Math.random() * 10) - 5;
            if (bInt === 0) bInt = 3;

            A = -mInt * B;
            C = bInt * B;
        }
        else {
            // Level 3/4: B does NOT divide evenly (Fractions required)
            B = Math.floor(Math.random() * 6) + 2; // 2 to 7
            if (Math.random() > 0.5) B = -B;
            
            do { A = Math.floor(Math.random() * 10) - 5; } while (A === 0 || A === B || A === -B);
            do { C = Math.floor(Math.random() * 20) - 10; } while (C === 0);
        }

        m = -A / B;
        b = C / B;

        // Formatting the equation cleanly (e.g. avoiding "2x + -3y")
        let aStr = A === 1 ? "x" : (A === -1 ? "-x" : `${A}x`);
        let bStr = B === 1 ? "+ y" : (B === -1 ? "- y" : (B > 0 ? `+ ${B}y` : `- ${Math.abs(B)}y`));
        let eqStr = `${aStr} ${bStr} = ${C}`;

        syData.scenario = { A, B, C, m, b, eqStr };
    }

    function renderSYUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let s = syData.scenario;
        let expertBadge = syData.isExpertMode ? `<div style="color: #8b5cf6; font-weight: bold; font-size: 13px; margin-bottom: 5px;">🌟 Advanced Mode: Fractions Active</div>` : ``;

        qContent.innerHTML = `
            <div style="max-width: 550px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="text-align:center; color:#64748b; margin-bottom:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                    ${expertBadge}
                    Round ${syData.round} of ${syData.maxRounds}
                </div>

                <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
                    <h3 style="margin-top:0; color:#475569; font-size:16px;">Solve the equation for <em>y</em>.</h3>
                    <div style="font-size:36px; font-family: 'Courier New', monospace; font-weight:bold; color:#1e293b; letter-spacing: -1px;">
                        ${s.eqStr}
                    </div>
                </div>

                <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align:center;">
                    <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold;">
                        Rewrite in Slope-Intercept Form (y = mx + b)
                    </div>
                    
                    <div style="display:flex; justify-content:center; align-items:center; gap:8px; font-size:24px; font-family:'Courier New', monospace; font-weight:bold; color:#334155;">
                        y = 
                        <input type="text" id="ans-m" style="width:70px; padding:10px; font-size:18px; text-align:center; border:2px solid #94a3b8; border-radius:6px;" placeholder="m" autocomplete="off">
                        x + 
                        <input type="text" id="ans-b" style="width:70px; padding:10px; font-size:18px; text-align:center; border:2px solid #94a3b8; border-radius:6px;" placeholder="b" autocomplete="off">
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-top:10px;"><em>(Use fractions like -2/5 if it doesn't divide evenly)</em></div>

                    <div style="margin-top:25px;">
                        <button onclick="checkSYAnswer()" style="background:#1e293b; color:white; border:none; padding:12px 30px; font-size:16px; font-weight:bold; border-radius:8px; cursor:pointer;">Check Equation</button>
                        <div id="sy-feedback" style="margin-top: 15px; font-weight: bold; font-size: 15px; min-height: 24px;"></div>
                        <div id="sy-hint" style="margin-top: 10px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e; line-height:1.4;"></div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => { document.getElementById('ans-m')?.focus(); }, 100);
    }

    window.checkSYAnswer = function() {
        const mInp = document.getElementById('ans-m');
        const bInp = document.getElementById('ans-b');
        const feedback = document.getElementById('sy-feedback');
        const hintBox = document.getElementById('sy-hint');
        
        if (!mInp || mInp.value === "" || bInp.value === "") return;

        let uM = parseMath(mInp.value);
        let uB = parseMath(bInp.value);
        let s = syData.scenario;

        if (isNaN(uM) || isNaN(uB)) {
            feedback.style.color = "#dc2626";
            feedback.innerText = "Please enter valid numbers or fractions.";
            return;
        }

        let mCorrect = Math.abs(uM - s.m) < 0.001;
        let bCorrect = Math.abs(uB - s.b) < 0.001;

        mInp.style.borderColor = mCorrect ? "#16a34a" : "#ef4444";
        mInp.style.backgroundColor = mCorrect ? "#f0fdf4" : "#fef2f2";
        bInp.style.borderColor = bCorrect ? "#16a34a" : "#ef4444";
        bInp.style.backgroundColor = bCorrect ? "#f0fdf4" : "#fef2f2";

        if (mCorrect && bCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Perfect!";
            hintBox.style.display = "none";
            mInp.disabled = true;
            bInp.disabled = true;
            
            if (syData.errorsThisRound === 0) {
                updateSYSkill('sy_slope', 1);
                updateSYSkill('sy_intercept', 1);
            }

            syData.round++;
            setTimeout(() => {
                if (syData.round > syData.maxRounds) finishSYGame();
                else startSYRound();
            }, 1200);

        } else {
            syData.errorsThisRound++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Not quite. Check the red boxes.";
            
            hintBox.style.display = "block";
            let hText = "<strong>Hint:</strong><br>";
            
            if (!mCorrect && !bCorrect) {
                hText += `Step 1: Move the x-term to the other side.<br>Step 2: Divide EVERYTHING by the number attached to y (${s.B}).`;
            } else if (!mCorrect) {
                let oppositeA = s.A > 0 ? `-${s.A}` : `+${Math.abs(s.A)}`;
                hText += `To find your slope (m), move the x-term (${oppositeA}x) to the other side, then divide it by ${s.B}.`;
            } else if (!bCorrect) {
                hText += `To find your y-intercept (b), you must divide the constant (${s.C}) by the number attached to y (${s.B}).`;
            }
            hintBox.innerHTML = hText;
        }
    };

    function updateSYSkill(col, amt) {
        if (!window.userMastery) window.userMastery = {};
        let current = window.userMastery[col] || 0;
        let next = Math.max(0, Math.min(10, current + amt));
        window.userMastery[col] = next;

        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ [col]: next })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if(error) console.error("Subskill fail:", error); });
        }
    }

    function finishSYGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">⚖️</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Literal Equations Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.SolveY || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.SolveY = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ SolveY: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
