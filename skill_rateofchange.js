/**
 * skill_rateofchange.js
 * - 8th Grade: Lesson 7.2.2 How y changes with respect to x
 * - Fits architecture of skill_figuregrowth.js etc.
 * - Handles randomized "Table Positive" and "Graph Negative" scenarios sequentially.
 * - Tracks primary skill (RateOfChange) and sub-skills (roc_total_change, roc_unit_rate, roc_predict)
 */

(function() {
    console.log("🚀 skill_rateofchange.js LIVE (Infinite randomization & sequential steps)");

    var gameState = {
        currentScenario: {},
        currentPart: 0, // 0: Total Change, 1: Ratio Setup, 2: Unit Rate, 3: Prediction
        errorsThisPart: 0
    };

    window.initRateOfChangeGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        
        // Reset state for new skill instance
        gameState.currentPart = 0;
        gameState.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            // Load current mastery using 'supabaseAdmin' defined in glogin.html
            if (window.supabaseAdmin && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseAdmin
                    .from('assignment')
                    .select('RateOfChange, roc_total_change, roc_unit_rate, roc_predict')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) {
                    window.userMastery = { ...window.userMastery, ...data };
                }
            }
        } catch (e) {
            console.warn("roc sync error, continuing locally.");
        }

        generateRateOfChangeScenario();
        renderMainROCUI();
    };

    function generateRateOfChangeScenario() {
        // Massive template bank for infinite replayability
        const templates = {
            positive: [ // Test A (Table) type
                { ctx: "[N] walks at a constant rate.", xL: "Time", xU: "minutes", yL: "Total Distance", yU: "feet", xS: [0], b: [100, 200], m: [4, 15], xI: [5, 15], pD: "walked" },
                { ctx: "[N] saves money at a constant rate.", xL: "Time", xU: "weeks", yL: "Total Savings", yU: "$", xS: [0], b: [20, 100], m: [10, 30], xI: [2, 10], pD: "saved" },
                { ctx: "[N] reads pages at a constant rate.", xL: "Time", xU: "hours", yL: "Total Pages Read", yU: "pages", xS: [0, 5], b: [0, 50], m: [15, 45], xI: [1, 5], pD: "read" }
            ],
            negative: [ // Test B (Graph) type
                { ctx: "[N]'s fuel usage while driving:", xL: "Distance Traveled", xU: "miles", yL: "Fuel remaining", yU: "gallons", b: [15, 30], m: [-0.05, -0.2], xI: [50, 200], pD: "runs out" },
                { ctx: "[N]'s battery charge while gaming:", xL: "Time Played", xU: "minutes", yL: "Battery Charge", yU: "%", b: [100], m: [-0.5, -2], xI: [10, 60], pD: "is dead" },
                { ctx: "[N] drains water from a large container:", xL: "Time Draining", xU: "seconds", yL: "Water remaining", yU: "liters", b: [500, 1000], m: [-5, -25], xI: [10, 30], pD: "is empty" }
            ]
        };

        const names = ["Marcus", "Maya", "Leo", "Sarah", "Alex", "Olivia", "Chloe", "Jamal"];
        
        const type = Math.random() < 0.5 ? 'positive' : 'negative';
        let name = names[Math.floor(Math.random() * names.length)];
        let t = templates[type][Math.floor(Math.random() * templates[type].length)];

        // Randomized Variables
        let b = (t.b.length === 1) ? t.b[0] : Math.floor(Math.random() * (t.b[1] - t.b[0] + 1)) + t.b[0];
        let m = (t.m.length === 1) ? t.m[0] : (Math.random() * (t.m[1] - t.m[0]) + t.m[0]).toFixed(2);
        let xInterval = (t.xI.length === 1) ? t.xI[0] : Math.floor(Math.random() * (t.xI[1] - t.xI[0] + 1)) + t.xI[0];
        let x0 = t.xS ? t.xS[Math.floor(Math.random() * t.xS.length)] : 0;

        // Generate dynamic parts sequential checking
        let p3_m = type === 'positive' ? m : Math.abs(m); // Match prompt 'positive' feel for B context
        
        let questions = [
            { text: `What is the total change in <strong>${t.yL} (${t.yU})</strong> from point 1 to point 3?`, ans: (parseFloat(m) * (xInterval * 2)).toFixed(2), dbSkill: 'roc_total_change' },
            { text: `Set up a ratio showing total change in <strong>${t.yU}</strong> per total change in <strong>${t.xU}</strong>. <br><small>(${name} changed _ ${t.yU} in _ ${t.xU})</small>`, ans: [(parseFloat(m) * (xInterval * 2)).toFixed(2), (xInterval * 2).toFixed(2)] },
            { text: `What is the **rate of change** in <strong>${t.yU} per ${t.xU}</strong>? <br><small>(Enter the unit rate)</small>`, ans: p3_m, dbSkill: 'roc_unit_rate' }
        ];

        // Part D Prediction (Solve for y or solve for intercept)
        if (type === 'positive') {
            let predictX = Math.floor(Math.random() * 50) + 100;
            let finalY = (parseFloat(m) * predictX) + b;
            questions.push({ text: `At this rate, how many <strong>${t.yU}</strong> will ${name} have ${t.pD} after <strong>${predictX} ${t.xU}</strong>?`, ans: finalY.toFixed(2), dbSkill: 'roc_predict' });
        } else {
            // Solve for x when y = 0
            let interceptX = Math.abs(b / parseFloat(m));
            questions.push({ text: `At this rate, how many <strong>${t.xU}</strong> can ${name} go until the container ${t.pD} (reaches zero)?`, ans: interceptX.toFixed(2), dbSkill: 'roc_predict' });
        }

        // Generate Data Points
        let data = [];
        for (let i = 0; i < 4; i++) {
            let x = x0 + (i * xInterval);
            let y = (parseFloat(m) * x) + b;
            if (y < 0) y = 0;
            data.push({x, y: y.toFixed(2)});
        }

        gameState.currentScenario = { context: t.ctx.replace('[Name]', name), name, type, ...t, data, questions, m, b };
    }

    function renderMainROCUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let s = gameState.currentScenario;
        let mainVisual = "";

        if (s.type === 'positive') {
            // Render Table Visual (Test A type)
            mainVisual = `
                <table style="width:100%; max-width:400px; margin:0 auto; border-collapse:collapse; text-align:center; font-size:16px;">
                    <tr style="border-bottom:2px solid #334155; color:#64748b; font-weight:bold; font-size:14px;">
                        <th style="padding:10px;">Pt #</th>
                        <th style="padding:10px; border-left:1px solid #cbd5e1;">${s.xLabel} (${s.xU})</th>
                        <th style="padding:10px; border-left:1px solid #cbd5e1;">${s.yLabel} (${s.yU})</th>
                    </tr>
                    ${s.data.map((pt, i) => `
                        <tr style="border-bottom:1px solid #e2e8f0; ${i === 2 ? 'background:#f1f5f9; color:#1e293b; font-weight:bold;' : ''}">
                            <td style="padding:10px;">${i+1}</td>
                            <td style="padding:10px; border-left:1px solid #cbd5e1; font-family:monospace;">${pt.x}</td>
                            <td style="padding:10px; border-left:1px solid #cbd5e1; font-family:monospace;">${pt.y}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else {
            // Render basic styled graph concept (Test B type) using CSS
            mainVisual = `
                <div style="width:300px; height:200px; margin:0 auto; position:relative; border-left:3px solid #334155; border-bottom:3px solid #334155; background:#f8fafc;">
                    <div style="position:absolute; top:-25px; left:-5px; font-weight:bold; color:#64748b; font-size:12px;">${s.yU}</div>
                    <div style="position:absolute; bottom:-25px; right:-10px; font-weight:bold; color:#64748b; font-size:12px;">${s.xU}</div>
                    
                    <div style="position:absolute; bottom:20px; left:20px; width:260px; height:160px; border-top:3px solid #3b82f6; transform:rotate(-15deg); transform-origin: top left; box-shadow:0 0 10px rgba(59,130,246,0.3);"></div>
                    
                    <div style="position:absolute; top:25px; left:20px; background:white; padding:4px 8px; border-radius:4px; border:1px solid #cbd5e1; font-size:14px; font-family:monospace;">(<strong>${s.data[0].x}</strong>, <strong>${s.data[0].y}</strong>)</div>
                    <div style="position:absolute; bottom:50px; left:160px; background:white; padding:4px 8px; border-radius:4px; border:1px solid #cbd5e1; font-size:14px; font-family:monospace;">(<strong>${s.data[2].x}</strong>, <strong>${s.data[2].y}</strong>)</div>
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; animation: fadeIn 0.5s;">
                <div style="background:white; padding:20px; border-radius:12px; border:1px solid #cbd5e1; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <p style="font-size:16px; color:#1e293b; font-weight:bold; margin:0 0 15px 0;">Scenario: ${s.context}</p>
                    ${mainVisual}
                </div>

                <div id="roc-question-container" style="background:#f1f5f9; padding:25px; border-radius:12px; border:1px solid #cbd5e1;">
                    </div>
            </div>
        `;

        renderROCQuestionPart();
    }

    function renderROCQuestionPart() {
        const container = document.getElementById('roc-question-container');
        let s = gameState.currentScenario;
        let partIdx = gameState.currentPart;
        let q = s.questions[partIdx];
        
        let inputHtml = "";
        let labels = ["A", "B", "C", "D"];

        if (partIdx === 1) {
            // Ratio Setup - Two inputs (numerator / denominator setup)
            inputHtml = `
                <div style="display:flex; align-items:center; gap:10px; margin-top:15px;">
                    <input type="number" id="roc-num" style="width:80px; padding:12px; font-size:18px; text-align:center; border:2px solid #cbd5e1; border-radius:8px;">
                    <span style="font-size:18px; font-weight:bold; color:#64748b;">${s.yU} IN</span>
                    <input type="number" id="roc-den" style="width:80px; padding:12px; font-size:18px; text-align:center; border:2px solid #cbd5e1; border-radius:8px;">
                    <span style="font-size:18px; font-weight:bold; color:#64748b;">${s.xU}</span>
                </div>
            `;
        } else {
            // Standard decimal/number inputs
            inputHtml = `
                <div style="display:flex; align-items:center; gap:10px; margin-top:15px;">
                    <input type="number" id="roc-ans" step="0.01" style="width:120px; padding:12px; font-size:18px; text-align:center; border:2px solid #cbd5e1; border-radius:8px;">
                    <span style="font-size:18px; font-weight:bold; color:#64748b;">${partIdx < 3 ? '' : s.yU}</span>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="font-size:18px; color:#1e293b; line-height:1.5;">
                <span style="background:#8b5cf6; color:white; font-weight:bold; padding:4px 10px; border-radius:100px; margin-right:10px;">${labels[partIdx]}</span>
                ${q.text}
            </div>
            ${inputHtml}
            <div style="margin-top:20px;">
                <button onclick="checkROCAnswer()" style="background:#1e293b; color:white; border:none; padding:12px 25px; font-size:16px; font-weight:bold; border-radius:8px; cursor:pointer; transition:all 0.2s;">Submit Answer</button>
                <div id="roc-feedback" style="margin-top:10px; min-height:24px; font-weight:bold;"></div>
            </div>
        `;
        
        // Focus first input
        if (partIdx === 1) document.getElementById('roc-num').focus();
        else document.getElementById('roc-ans').focus();
    }

    window.checkROCAnswer = function() {
        const feedback = document.getElementById('roc-feedback');
        let s = gameState.currentScenario;
        let partIdx = gameState.currentPart;
        let q = s.questions[partIdx];
        
        let isCorrect = false;
        
        // Architectural architectural check for admin defined in glogin.html
        if (!window.supabaseAdmin) {
            console.warn("supabaseAdmin missing. mastery updates disabled.");
        }

        if (partIdx === 1) {
            // Ratio Setup - validate both inputs
            let n = document.getElementById('roc-num').value.trim();
            let d = document.getElementById('roc-den').value.trim();
            if (n === "" || d === "") return; // Required
            
            // Image suggests absolute values ("__ fuel used in __ miles"). Let's check against dynamic answer.
            // Convert everything to string for strict match or float for loose match? Image are integers.
            // Ratio parts: ans[0] is dy, ans[1] is dx. Check strict match as they are setup questions.
            if (parseFloat(n).toFixed(2) === q.ans[0] && parseFloat(d).toFixed(2) === q.ans[1]) {
                isCorrect = true;
            }
        } else {
            // Decimal check - loose float match for rounding
            let a = document.getElementById('roc-ans').value.trim();
            if (a === "") return; // Required
            
            let studentAns = parseFloat(a);
            let correctAns = parseFloat(q.ans);
            
            if (Math.abs(studentAns - correctAns) < 0.05) {
                isCorrect = true;
            }
        }

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            
            // Handle DB updates for subskills if available and first attempt
            if (q.dbSkill && gameState.errorsThisPart === 0 && window.supabaseAdmin && window.currentUser) {
                let current = window.userMastery[q.dbSkill] || 0;
                let newVal = Math.min(10, current + 1);
                window.userMastery[q.dbSkill] = newVal;
                
                // Fire and forget update using 'supabaseAdmin' global
                const h = sessionStorage.getItem('target_hour') || "00";
                window.supabaseAdmin
                    .from('assignment')
                    .update({ [q.dbSkill]: newVal })
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .then(({error}) => { if (error) console.error("DB subskill update failed:", error); });
            }
            
            gameState.currentPart++;
            
            // Wait slightly before showing next part
            setTimeout(() => {
                if (gameState.currentPart >= 4) {
                    finishROCGame();
                } else {
                    renderROCQuestionPart();
                }
            }, 800);

        } else {
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Incorrect. Look closely at the data.";
            gameState.errorsThisPart++;
        }
    };

    function finishROCGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">📊</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Mastered: Unit Rate!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        // Update main skill mastery in DB using 'supabaseAdmin' global
        if (window.supabaseAdmin && window.currentUser) {
            let curMastery = window.userMastery.RateOfChange || 0;
            let newMastery = Math.min(10, curMastery + 1);
            window.userMastery.RateOfChange = newMastery;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseAdmin
                .from('assignment')
                .update({ RateOfChange: newMastery })
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .then(({error}) => { if (error) console.error("DB final update failed:", error); });
        }

        setTimeout(() => { 
            // Standard Eighth-Grade complete signal
            if (typeof window.loadNextQuestion === 'function') {
                window.loadNextQuestion(); 
            } else {
                location.reload(); 
            }
        }, 2500);
    }
})();
