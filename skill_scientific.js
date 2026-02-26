/**
 * skill_scientific.js
 * - Generates 4 conversion problems per round.
 * - Standard to Scientific (Large & Small).
 * - Scientific to Standard (Positive & Negative Exponents).
 */

console.log("🚀 skill_scientific.js is LIVE - Scientific Notation");

(function() {
    let snData = [];
    let snRound = 1;
    const totalSnRounds = 3;
    let sessionCorrectFirstTry = 0;
    let roundErrors = [0, 0, 0, 0]; 

    window.initScientificGame = async function() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        snRound = 1;
        sessionCorrectFirstTry = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const currentHour = sessionStorage.getItem('target_hour') || "00";
                const { data, error } = await window.supabaseClient
                    .from('assignment')
                    .select('ScientificNotation')
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .maybeSingle();
                
                if (error) console.error("[ScientificNotation] Fetch error:", error);
                if (data) window.userMastery.ScientificNotation = data.ScientificNotation || 0;
            }
        } catch (e) { 
            console.error("[ScientificNotation] Init error:", e); 
        }
        
        startSnRound();
    };

    function startSnRound() {
        roundErrors = [0, 0, 0, 0];
        snData = [
            generateProblem('toScientificLarge'),
            generateProblem('toScientificSmall'),
            generateProblem('toStandardPos'),
            generateProblem('toStandardNeg')
        ];
        renderSnUI();
    }

    function generateProblem(type) {
        let base = (Math.floor(Math.random() * 900) + 100) / 100; // 1.00 to 9.99
        // Clean trailing zeros for cleaner display
        base = parseFloat(base.toFixed(2)); 
        
        if (type === 'toScientificLarge') {
            let exp = Math.floor(Math.random() * 5) + 4; // 10^4 to 10^8
            let standard = (base * Math.pow(10, exp)).toLocaleString('en-US');
            return { type, prompt: standard, ansBase: base, ansExp: exp };
        } 
        else if (type === 'toScientificSmall') {
            let exp = -(Math.floor(Math.random() * 4) + 3); // 10^-3 to 10^-6
            let standard = (base * Math.pow(10, exp)).toFixed(Math.abs(exp) + 2);
            return { type, prompt: standard, ansBase: base, ansExp: exp };
        }
        else if (type === 'toStandardPos') {
            let exp = Math.floor(Math.random() * 4) + 3; // 10^3 to 10^6
            let standard = (base * Math.pow(10, exp)).toLocaleString('en-US');
            return { type, promptBase: base, promptExp: exp, ans: standard.replace(/,/g, '') }; // Check against string without commas
        }
        else { // toStandardNeg
            let exp = -(Math.floor(Math.random() * 3) + 3); // 10^-3 to 10^-5
            let standard = (base * Math.pow(10, exp)).toFixed(Math.abs(exp) + 2);
            return { type, promptBase: base, promptExp: exp, ans: standard };
        }
    }

    function renderSnUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Scientific Notation (Round ${snRound}/${totalSnRounds})`;
        const letters = ['a', 'b', 'c', 'd'];

        let gridHTML = snData.map((q, i) => {
            if (q.type.startsWith('toScientific')) {
                return `
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 16px; color: #475569; margin-bottom: 5px;">Convert to Scientific Notation:</div>
                        <div style="font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 15px;">${letters[i]}. ${q.prompt}</div>
                        <div style="display:flex; align-items:center; gap: 5px; font-size: 18px;">
                            <input type="number" id="sn-base-${i}" step="0.01" style="width:70px; height:35px; text-align:center; font-size:16px; border:2px solid #94a3b8; border-radius:6px; outline:none;">
                            &times; 10 <sup style="margin-top:-10px;"><input type="number" id="sn-exp-${i}" style="width:45px; height:25px; text-align:center; font-size:14px; border:2px solid #94a3b8; border-radius:4px; outline:none;"></sup>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 16px; color: #475569; margin-bottom: 5px;">Convert to Standard Form:</div>
                        <div style="font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 15px;">${letters[i]}. ${q.promptBase} &times; 10<sup>${q.promptExp}</sup></div>
                        <input type="text" id="sn-std-${i}" placeholder="Standard Form..." autocomplete="off" style="width:100%; height:40px; padding: 0 10px; font-size:16px; border:2px solid #94a3b8; border-radius:6px; outline:none; text-align:center;">
                    </div>
                `;
            }
        }).join('');

        qContent.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto; background:#f8fafc; padding:25px; border-radius:12px; border:1px solid #e2e8f0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    ${gridHTML}
                </div>
                <button onclick="checkScientific()" id="sn-check-btn" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size: 18px; transition: background 0.2s;">CHECK ALL</button>
            </div>
            <div id="sn-flash" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; z-index:100;"></div>
        `;
    }

    window.checkScientific = function() {
        let allCorrect = true;

        snData.forEach((q, i) => {
            if (q.type.startsWith('toScientific')) {
                const elBase = document.getElementById(`sn-base-${i}`);
                const elExp = document.getElementById(`sn-exp-${i}`);
                if (!elBase || !elExp || elBase.disabled) return;

                const uBase = parseFloat(elBase.value);
                const uExp = parseInt(elExp.value);

                if (Math.abs(uBase - q.ansBase) < 0.01 && uExp === q.ansExp) {
                    elBase.style.backgroundColor = "#dcfce7"; elBase.style.borderColor = "#22c55e";
                    elExp.style.backgroundColor = "#dcfce7"; elExp.style.borderColor = "#22c55e";
                    elBase.disabled = true; elExp.disabled = true;
                    roundErrors[i] = -1;
                } else {
                    allCorrect = false;
                    roundErrors[i]++;
                    elBase.style.backgroundColor = "#fee2e2"; elBase.style.borderColor = "#ef4444";
                    elExp.style.backgroundColor = "#fee2e2"; elExp.style.borderColor = "#ef4444";
                }
            } else {
                const elStd = document.getElementById(`sn-std-${i}`);
                if (!elStd || elStd.disabled) return;

                // Remove commas and spaces for flexible grading
                const uStd = elStd.value.replace(/,/g, '').replace(/\s/g, '');
                
                // Allow exact string match or float match to prevent trailing zero errors
                if (uStd === q.ans || parseFloat(uStd) === parseFloat(q.ans)) {
                    elStd.style.backgroundColor = "#dcfce7"; elStd.style.borderColor = "#22c55e";
                    elStd.disabled = true;
                    roundErrors[i] = -1;
                } else {
                    allCorrect = false;
                    roundErrors[i]++;
                    elStd.style.backgroundColor = "#fee2e2"; elStd.style.borderColor = "#ef4444";
                }
            }
        });

        if (allCorrect) {
            document.getElementById('sn-check-btn').disabled = true;
            showSnFlash("Round Complete!", "success");
            
            if (roundErrors.every(err => err === -1)) sessionCorrectFirstTry++;

            snRound++;
            setTimeout(() => {
                if (snRound > totalSnRounds) finishSnGame();
                else startSnRound();
            }, 1200);
        } else {
            showSnFlash("Check your work.", "error");
        }
    };

    function finishSnGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        if (!qContent) return;
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px;">🔬</div>
                <h2 style="color:#1e293b; margin:10px 0;">Notation Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Skills updated.</p>
            </div>
        `;

        let mainAdjustment = 0;
        if (sessionCorrectFirstTry >= totalSnRounds) mainAdjustment = 1;

        if (mainAdjustment !== 0) {
            const currentMain = window.userMastery?.['ScientificNotation'] || 0;
            const newMain = Math.max(0, Math.min(10, currentMain + mainAdjustment));
            window.userMastery['ScientificNotation'] = newMain;

            if (window.supabaseClient && window.currentUser) {
                const hour = sessionStorage.getItem('target_hour') || "00";
                window.supabaseClient.from('assignment')
                    .update({ 'ScientificNotation': newMain })
                    .eq('userName', window.currentUser)
                    .eq('hour', hour)
                    .then(({ error }) => { if (error) console.error("[ScientificNotation] Update Error:", error); });
            }
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') {
                window.loadNextQuestion(); 
            } else {
                location.reload();
            }
        }, 2000);
    }

    function showSnFlash(msg, type) {
        const overlay = document.getElementById('sn-flash');
        if (!overlay) return;
        overlay.innerText = msg;
        overlay.style.display = 'block';
        overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        setTimeout(() => { overlay.style.display = 'none'; }, 1500);
    }

})();
