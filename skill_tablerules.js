/**
 * skill_tablerules.js
 * - 8th Grade: Tables and Rules (CL 7-117, Ch 8 Test #8)
 * - Part A: Fill in missing x and y values in an out-of-order table.
 * - Part B: Extract the linear rule (y = mx + b).
 */

(function() {
    console.log("🚀 skill_tablerules.js LIVE (Table Completion & Rules)");

    var trData = {
        round: 1,
        maxRounds: 3,
        currentPart: 0,
        errorsThisPart: 0,
        scenario: {},
        validEqs: []
    };

    window.initTableRulesGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        trData.round = 1;
        trData.currentPart = 0;
        trData.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('TableRules, tr_table, tr_rule')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("TableRules DB sync error.");
        }

        startTRRound();
    };

    function startTRRound() {
        trData.currentPart = 0;
        trData.errorsThisPart = 0;
        generateTRProblem();
        renderTRUI();
    }

    function generateTRProblem() {
        let m, b;
        // Generate nice integer slopes and intercepts
        do { m = Math.floor(Math.random() * 11) - 5; } while (m === 0);
        b = Math.floor(Math.random() * 21) - 10;

        // Generate x values: We want 0, 1, and some random positive/negatives
        let xPool = [0, 1];
        while (xPool.length < 7) {
            let rx = Math.floor(Math.random() * 15) - 7; // -7 to 7
            if (!xPool.includes(rx)) xPool.push(rx);
        }

        // Shuffle the x values to make the table out of order
        xPool.sort(() => Math.random() - 0.5);

        let tableData = xPool.map(x => ({ x: x, y: (m * x) + b, hideX: false, hideY: false }));

        // Decide which cells to hide
        // We need to guarantee at least 2 complete pairs for them to find the slope
        let hideIndices = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
        
        // Hide 3 Y-values
        tableData[hideIndices[0]].hideY = true;
        tableData[hideIndices[1]].hideY = true;
        tableData[hideIndices[2]].hideY = true;

        // Hide 1 X-value (make sure it's not the same column where Y is hidden!)
        let hideXIndex = hideIndices[3];
        tableData[hideXIndex].hideX = true;

        trData.scenario = { m, b, tableData };

        // Generate Valid Equation Formats
        trData.validEqs = [];
        let mStr = m === 1 ? "x" : (m === -1 ? "-x" : `${m}x`);
        let bStr = b === 0 ? "" : (b > 0 ? `+${b}` : `${b}`);
        
        trData.validEqs.push(`y=${mStr}${bStr}`);
        trData.validEqs.push(`${mStr}${bStr}`);
        if (b !== 0) {
            trData.validEqs.push(`y=${b}${m > 0 ? '+' : ''}${mStr}`);
            trData.validEqs.push(`${b}${m > 0 ? '+' : ''}${mStr}`);
        }
    }

    function renderTRUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let s = trData.scenario;
        let part = trData.currentPart;

        // Build the HTML Table
        let tableHTML = `
            <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-size: 18px; text-align: center; background: white; border: 2px solid #94a3b8;">
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 12px; font-weight: bold; background: #f1f5f9; width: 50px;">x</td>
                    ${s.tableData.map((cell, i) => `
                        <td style="border: 1px solid #cbd5e1; padding: 12px; font-weight: bold;">
                            ${cell.hideX ? `<input type="number" id="inp-x-${i}" style="width: 50px; text-align: center; padding: 5px; border: 2px solid #3b82f6; border-radius: 4px; font-size: 16px;" ${part > 0 ? 'disabled value="'+cell.x+'"' : ''}>` : cell.x}
                        </td>
                    `).join('')}
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 12px; font-weight: bold; background: #f1f5f9;">y</td>
                    ${s.tableData.map((cell, i) => `
                        <td style="border: 1px solid #cbd5e1; padding: 12px; font-weight: bold;">
                            ${cell.hideY ? `<input type="number" id="inp-y-${i}" style="width: 50px; text-align: center; padding: 5px; border: 2px solid #3b82f6; border-radius: 4px; font-size: 16px;" ${part > 0 ? 'disabled value="'+cell.y+'"' : ''}>` : cell.y}
                        </td>
                    `).join('')}
                </tr>
            </table>
        `;

        let actionArea = "";
        if (part === 0) {
            actionArea = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold; text-align:center;">
                    <span style="color:#3b82f6;">Part A:</span> Fill in the missing values in the table.
                </div>
                <div style="text-align:center;">
                    <button onclick="checkTRTable()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer;">Check Table</button>
                </div>
            `;
        } else {
            actionArea = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold; text-align:center; animation: fadeIn 0.4s;">
                    <span style="color:#10b981;">Part B:</span> Write the rule for the pattern shown above.
                </div>
                <div style="display:flex; justify-content:center; align-items:center; gap:10px; animation: fadeIn 0.4s;">
                    <span style="font-size:24px; font-family: 'Courier New', monospace; font-weight:bold;">y =</span>
                    <input type="text" id="inp-rule" style="width:150px; padding:10px; font-size:18px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;" placeholder="mx + b" autocomplete="off">
                    <button onclick="checkTRRule()" style="background:#10b981; color:white; border:none; padding:10px 20px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer;">Verify</button>
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="text-align:center; color:#64748b; margin-bottom:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                    Round ${trData.round} of ${trData.maxRounds}
                </div>
                
                <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow-x: auto;">
                    ${tableHTML}
                    ${actionArea}
                    <div id="tr-feedback" style="margin-top: 15px; font-weight: bold; font-size: 15px; text-align:center; min-height: 24px;"></div>
                    <div id="tr-hint" style="margin-top: 10px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e; line-height:1.4; text-align:center;"></div>
                </div>
            </div>
        `;

        if (part === 1) setTimeout(() => { document.getElementById('inp-rule')?.focus(); }, 100);
    }

    window.checkTRTable = function() {
        let s = trData.scenario;
        const feedback = document.getElementById('tr-feedback');
        const hintBox = document.getElementById('tr-hint');
        let allCorrect = true;
        let emptyFields = false;

        s.tableData.forEach((cell, i) => {
            if (cell.hideX) {
                let inp = document.getElementById(`inp-x-${i}`);
                if (inp.value === "") emptyFields = true;
                else if (parseFloat(inp.value) !== cell.x) { allCorrect = false; inp.style.borderColor = "#ef4444"; inp.style.backgroundColor = "#fef2f2"; }
                else { inp.style.borderColor = "#16a34a"; inp.style.backgroundColor = "#f0fdf4"; }
            }
            if (cell.hideY) {
                let inp = document.getElementById(`inp-y-${i}`);
                if (inp.value === "") emptyFields = true;
                else if (parseFloat(inp.value) !== cell.y) { allCorrect = false; inp.style.borderColor = "#ef4444"; inp.style.backgroundColor = "#fef2f2"; }
                else { inp.style.borderColor = "#16a34a"; inp.style.backgroundColor = "#f0fdf4"; }
            }
        });

        if (emptyFields) {
            feedback.style.color = "#f59e0b";
            feedback.innerText = "⚠️ Please fill in all missing boxes.";
            return;
        }

        if (allCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Table Complete!";
            hintBox.style.display = "none";
            
            if (trData.errorsThisPart === 0) updateTRSkill('tr_table', 1);

            trData.currentPart++;
            trData.errorsThisPart = 0;
            setTimeout(renderTRUI, 1000);

        } else {
            trData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Some values are incorrect. Check the red boxes.";
            
            // Find two complete columns to give a targeted hint
            let completeCols = s.tableData.filter(c => !c.hideX && !c.hideY);
            if (completeCols.length >= 2) {
                let c1 = completeCols[0];
                let c2 = completeCols[1];
                let dy = c2.y - c1.y;
                let dx = c2.x - c1.x;
                hintBox.style.display = "block";
                hintBox.innerHTML = `<strong>Hint:</strong> Look at the complete columns. From x=${c1.x} to x=${c2.x}, the y-value goes from ${c1.y} to ${c2.y}.<br>Change in y (${dy}) ÷ Change in x (${dx}) = <strong>${s.m}</strong>. The rule grows by ${s.m} for every 1 x!`;
            }
        }
    };

    window.checkTRRule = function() {
        const inp = document.getElementById('inp-rule');
        const feedback = document.getElementById('tr-feedback');
        const hintBox = document.getElementById('tr-hint');
        if (!inp || inp.value === "") return;

        let uAns = inp.value.replace(/\s/g, '').toLowerCase();
        let s = trData.scenario;

        let isCorrect = trData.validEqs.includes(uAns) || trData.validEqs.includes(`y=${uAns}`);

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Rule Correct!";
            hintBox.style.display = "none";
            inp.disabled = true;
            
            if (trData.errorsThisPart === 0) updateTRSkill('tr_rule', 1);
            if (trData.errorsThisPart === 0) updateTRSkill('TableRules', 1); // Main mastery bump

            trData.currentPart++;
            trData.errorsThisPart = 0;

            setTimeout(() => {
                trData.round++;
                if (trData.round > trData.maxRounds) finishTRGame();
                else { trData.currentPart = 0; startTRRound(); }
            }, 1200);

        } else {
            trData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Incorrect rule. Check your slope and y-intercept.";
            
            hintBox.style.display = "block";
            hintBox.innerHTML = `<strong>Hint:</strong> Use <strong>y = mx + b</strong>.<br><strong>m (slope)</strong> is how much y changes when x increases by 1.<br><strong>b (y-intercept)</strong> is the y-value when x is exactly 0.`;
        }
    };

    function updateTRSkill(col, amt) {
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

    function finishTRGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">📋</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Table Patterns Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
