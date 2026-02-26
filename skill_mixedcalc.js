/**
 * skill_mixedcalc.js
 * - Primary skill for 7.1.3
 * - Generates 4 calculation problems per round.
 * - Mixes fractions, decimals, mixed numbers, and negatives.
 * - Uses addition, subtraction, multiplication, and division.
 * - Robust parser accepts equivalent fractions, mixed numbers, or decimals.
 */

console.log("🚀 skill_mixedcalc.js is LIVE - Mixed Rational Calculations");

(function() {
    let mcData = [];
    let mcRound = 1;
    const totalMcRounds = 3;
    let sessionCorrectFirstTry = 0;
    let roundErrors = [0, 0, 0, 0]; 

    window.initMixedCalcGame = async function() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        mcRound = 1;
        sessionCorrectFirstTry = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const currentHour = sessionStorage.getItem('target_hour') || "00";
                const { data, error } = await window.supabaseClient
                    .from('assignment')
                    .select('MixedCalc')
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .maybeSingle();
                
                if (error) console.error("[MixedCalc] Fetch error:", error);
                if (data) window.userMastery.MixedCalc = data.MixedCalc || 0;
            }
        } catch (e) { 
            console.error("[MixedCalc] Init error:", e); 
        }
        
        startMcRound();
    };

    function startMcRound() {
        roundErrors = [0, 0, 0, 0];
        mcData = [];
        for (let i = 0; i < 4; i++) {
            mcData.push(generateExpression());
        }
        renderMcUI();
    }

    function generateExpression() {
        const ops = ['+', '-', '·', '÷'];
        // Heavily weight multiplication and division based on 8th grade standards
        const op = Math.random() > 0.4 ? '·' : ops[Math.floor(Math.random() * ops.length)];

        const getOperand = () => {
            const type = Math.floor(Math.random() * 3); // 0: frac, 1: dec, 2: mixed
            const sign = Math.random() > 0.5 ? 1 : -1;
            const denoms = [2, 3, 4, 5, 8, 10];
            
            if (type === 0) { // Fraction
                let d = denoms[Math.floor(Math.random() * denoms.length)];
                let n = Math.floor(Math.random() * (d - 1)) + 1;
                let val = (n / d) * sign;
                let str = sign < 0 ? `-\\frac{${n}}{${d}}` : `\\frac{${n}}{${d}}`;
                if (sign < 0 && op === '·') str = `(-\\frac{${n}}{${d}})`;
                return { val, str };
            } else if (type === 1) { // Decimal
                let val = (Math.floor(Math.random() * 25) + 1) / 10; 
                val *= sign;
                let str = val.toString();
                if (sign < 0 || op === '·') str = `(${str})`; // Wrap for clarity
                return { val, str };
            } else { // Mixed Number
                let w = Math.floor(Math.random() * 3) + 1;
                let d = denoms[Math.floor(Math.random() * denoms.length)];
                let n = Math.floor(Math.random() * (d - 1)) + 1;
                let val = (w + n / d) * sign;
                let str = sign < 0 ? `-${w}\\frac{${n}}{${d}}` : `${w}\\frac{${n}}{${d}}`;
                if (sign < 0) str = `(-${w}\\frac{${n}}{${d}})`;
                return { val, str };
            }
        };

        let op1 = getOperand();
        let op2 = getOperand();

        // Prevent division by zero
        if (op === '÷' && Math.abs(op2.val) < 0.01) op2.val = 2; 

        let ans;
        if (op === '+') ans = op1.val + op2.val;
        if (op === '-') ans = op1.val - op2.val;
        if (op === '·') ans = op1.val * op2.val;
        if (op === '÷') ans = op1.val / op2.val;

        // Custom HTML fraction renderer
        const renderHTML = (str) => {
            return str.replace(/(-?)(?:(\d+))?\\frac{(\d+)}{(\d+)}/g, (match, pSign, pWhole, pNum, pDen) => {
                let html = `<div style="display:inline-flex; align-items:center; vertical-align:middle; margin:0 2px;">`;
                if (pSign === '-') html += `<span style="margin-right:2px; font-weight:bold;">-</span>`;
                if (pWhole) html += `<span style="margin-right:4px; font-size:1.1em;">${pWhole}</span>`;
                html += `<div style="display:inline-flex; flex-direction:column; align-items:center; font-size:0.9em; line-height:1.2;">
                            <span style="padding:0 3px;">${pNum}</span>
                            <span style="border-top:2px solid #1e293b; width:100%; height:1px;"></span>
                            <span style="padding:0 3px;">${pDen}</span>
                         </div></div>`;
                return html;
            });
        };

        let displayOp = op === '·' ? '&times;' : (op === '÷' ? '&divide;' : op);
        let htmlStr = `${renderHTML(op1.str)} &nbsp;${displayOp}&nbsp; ${renderHTML(op2.str)}`;
        
        // Match the worksheet style: omit multiplication dot if second term is in parens
        if (op === '·' && op2.str.includes('(')) {
            htmlStr = `${renderHTML(op1.str)}${renderHTML(op2.str)}`;
        }

        return { html: htmlStr, ans: ans };
    }

    function renderMcUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Mixed Calculations (Round ${mcRound}/${totalMcRounds})`;
        const letters = ['a', 'b', 'c', 'd'];

        let gridHTML = mcData.map((q, i) => `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
                <div style="font-size: 18px; color: #1e293b; margin-bottom: 20px; display:flex; align-items:center;">
                    <strong style="margin-right:15px;">${letters[i]}.</strong> 
                    <span style="font-family: 'Times New Roman', serif; font-size: 22px;">${q.html}</span>
                </div>
                <input type="text" id="mc-ans-${i}" placeholder="Answer..." autocomplete="off" style="width:100%; height:45px; padding: 0 10px; font-size:16px; border:2px solid #94a3b8; border-radius:6px; outline:none; text-align:center;">
            </div>
        `).join('');

        qContent.innerHTML = `
            <div style="max-width: 750px; margin: 0 auto; background:#f8fafc; padding:25px; border-radius:12px; border:1px solid #e2e8f0;">
                <p style="color: #475569; font-size: 14px; margin-bottom: 20px; text-align: center;">
                    Simplify each expression. You may enter your answer as a fraction (e.g. <strong>-4/5</strong>), a mixed number (e.g. <strong>-1 1/3</strong>), or a decimal.
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    ${gridHTML}
                </div>

                <button onclick="checkMixedCalc()" id="mc-check-btn" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size: 18px; transition: background 0.2s;">CHECK ALL</button>
            </div>
            <div id="mc-flash" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; z-index:100;"></div>
        `;
    }

    // Parses string inputs like "-1 2/3", "-5/6", or "-1.66" into floats
    function parseStudentInput(str) {
        str = str.trim();
        if (!str) return NaN;
        
        str = str.replace(/\s*\/\s*/g, '/'); // Fix accidental spaces around slash

        let mixedMatch = str.match(/^(-?)\s*(\d+)\s+(\d+)\/(\d+)$/);
        if (mixedMatch) {
            let sign = mixedMatch[1] === '-' ? -1 : 1;
            return sign * (parseFloat(mixedMatch[2]) + (parseFloat(mixedMatch[3]) / parseFloat(mixedMatch[4])));
        }

        let fracMatch = str.match(/^(-?\d+)\/(\d+)$/);
        if (fracMatch) {
            return parseFloat(fracMatch[1]) / parseFloat(fracMatch[2]);
        }

        return parseFloat(str);
    }

    window.checkMixedCalc = function() {
        let allCorrect = true;

        mcData.forEach((q, i) => {
            const inputEl = document.getElementById(`mc-ans-${i}`);
            if (!inputEl || inputEl.disabled) return;

            const userFloat = parseStudentInput(inputEl.value);
            
            // Allow a small margin of error (0.02) to forgive decimal rounding
            if (!isNaN(userFloat) && Math.abs(userFloat - q.ans) < 0.02) {
                inputEl.style.backgroundColor = "#dcfce7"; 
                inputEl.style.borderColor = "#22c55e";
                inputEl.disabled = true; 
                roundErrors[i] = -1; 
            } else {
                allCorrect = false;
                roundErrors[i]++;
                inputEl.style.backgroundColor = "#fee2e2"; 
                inputEl.style.borderColor = "#ef4444";
            }
        });

        if (allCorrect) {
            document.getElementById('mc-check-btn').disabled = true;
            showMcFlash("Round Complete!", "success");
            
            if (roundErrors.every(err => err === -1)) sessionCorrectFirstTry++;

            mcRound++;
            setTimeout(() => {
                if (mcRound > totalMcRounds) finishMcGame();
                else startMcRound();
            }, 1200);
        } else {
            showMcFlash("Check your math.", "error");
        }
    };

    function finishMcGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        if (!qContent) return;
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px;">🧮</div>
                <h2 style="color:#1e293b; margin:10px 0;">Calculations Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Skills updated.</p>
            </div>
        `;

        let mainAdjustment = 0;
        if (sessionCorrectFirstTry >= totalMcRounds) mainAdjustment = 1;

        if (mainAdjustment !== 0) {
            const currentMain = window.userMastery?.['MixedCalc'] || 0;
            const newMain = Math.max(0, Math.min(10, currentMain + mainAdjustment));
            window.userMastery['MixedCalc'] = newMain;

            if (window.supabaseClient && window.currentUser) {
                const hour = sessionStorage.getItem('target_hour') || "00";
                window.supabaseClient.from('assignment')
                    .update({ 'MixedCalc': newMain })
                    .eq('userName', window.currentUser)
                    .eq('hour', hour)
                    .then(({ error }) => { if (error) console.error("[MixedCalc] Update Error:", error); });
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

    function showMcFlash(msg, type) {
        const overlay = document.getElementById('mc-flash');
        if (!overlay) return;
        overlay.innerText = msg;
        overlay.style.display = 'block';
        overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        setTimeout(() => { overlay.style.display = 'none'; }, 1500);
    }

})();
