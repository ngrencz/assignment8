/**
 * skill_rateofchange.js
 * - 8th Grade: Lesson 7.2.2 How y changes with respect to x
 * - Alternates between "Graph Slope Comparison" and "Athlete Rate Comparison".
 * - Uses proper Canvas rendering for coordinate planes.
 */

(function() {
    console.log("🚀 skill_rateofchange.js LIVE (Proper Canvas & Exact Image Scenarios)");

    var gameState = {
        type: '', // 'graph' or 'racer'
        currentScenario: {},
        currentPart: 0, 
        errorsThisPart: 0
    };

    window.initRateOfChangeGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        gameState.currentPart = 0;
        gameState.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('RateOfChange, roc_total_change, roc_unit_rate, roc_predict')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("roc sync error, continuing locally.");
        }

        generateRateOfChangeScenario();
        renderMainROCUI();
    };

    function generateRateOfChangeScenario() {
        gameState.type = Math.random() < 0.5 ? 'graph' : 'racer';

        if (gameState.type === 'graph') {
            // Generate 3 lines: One steep positive, one shallow positive, one different (negative or mixed)
            let m1 = Math.floor(Math.random() * 3) + 2; // Slope 2, 3, 4
            let m2 = 1 / (Math.floor(Math.random() * 3) + 2); // Slope 1/2, 1/3, 1/4
            let m3 = Math.random() > 0.5 ? -1 : (Math.floor(Math.random() * 2) + 1); // Negative or mild
            
            // Ensure no duplicate slopes conceptually
            if (m3 === m1) m3 = -2;

            let lines = [
                { id: 'A', m: m1, b: Math.floor(Math.random() * -4) }, // steep
                { id: 'B', m: m2, b: Math.floor(Math.random() * 5) + 1 }, // shallow
                { id: 'C', m: m3, b: Math.floor(Math.random() * 8) - 2 } // wild
            ].sort(() => 0.5 - Math.random()); // Shuffle A, B, C assignments

            // Find which line actually has the greatest slope
            let greatestLine = lines.reduce((prev, current) => (prev.m > current.m) ? prev : current);

            // Pick a line and an X to ask for a Y value. Ensure it lands on an integer.
            let targetLine = lines[Math.floor(Math.random() * 3)];
            let targetX = 2;
            if (targetLine.m < 1 && targetLine.m > 0) {
                targetX = Math.round(1 / targetLine.m) * (Math.floor(Math.random() * 2) + 1); // Ensure integer y
            }
            let targetY = (targetLine.m * targetX) + targetLine.b;

            gameState.currentScenario = {
                lines: lines,
                questions: [
                    { text: `Which line has the <strong>greatest slope</strong>?`, ans: greatestLine.id, type: 'select', options: ['A', 'B', 'C'], dbSkill: 'roc_unit_rate' },
                    { text: `What is the $y$-value of <strong>line ${targetLine.id}</strong> when $x = ${targetX}$?`, ans: targetY, type: 'number', dbSkill: 'roc_predict' }
                ]
            };

        } else {
            // Racer Scenario
            let contexts = ["triathlon", "swim meet", "cycling race", "marathon"];
            let context = contexts[Math.floor(Math.random() * contexts.length)];
            
            let racers = [
                { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
            ];

            racers.forEach(r => {
                r.n = Math.floor(Math.random() * 6) + 2; 
                r.d = r.n + Math.floor(Math.random() * 8) + 1; // Always a proper fraction < 1
                r.dec = r.n / r.d;
            });

            // Ensure no ties
            racers.sort((a, b) => b.dec - a.dec);
            // After sort: index 0 is fastest, index 3 is slowest
            let fastest = racers[0].id;
            let slowest = racers[3].id;

            // Re-sort alphabetically for display
            racers.sort((a, b) => a.id.localeCompare(b.id));

            gameState.currentScenario = {
                context: context,
                racers: racers,
                questions: [
                    { text: `Which runner has the <strong>fastest</strong> rate?`, ans: fastest, type: 'select', options: ['A', 'B', 'C', 'D'], dbSkill: 'roc_unit_rate' },
                    { text: `Which runner has the <strong>slowest</strong> rate?`, ans: slowest, type: 'select', options: ['A', 'B', 'C', 'D'], dbSkill: 'roc_total_change' }
                ]
            };
        }
    }

    function renderMainROCUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let mainVisual = "";

        if (gameState.type === 'graph') {
            mainVisual = `
                <div style="text-align:center; background:white; padding:15px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
                    <p style="margin-top:0; font-weight:bold; color:#64748b;">Compare the graphs of lines A, B, and C.</p>
                    <canvas id="rocCanvas" width="400" height="400" style="max-width:100%; border-radius:8px; border:1px solid #cbd5e1;"></canvas>
                </div>
            `;
            setTimeout(drawCoordinateGraph, 50);
        } else {
            let s = gameState.currentScenario;
            mainVisual = `
                <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
                    <p style="font-size:16px; color:#1e293b; line-height:1.5; margin-top:0;">
                        Lydia drew a graph of four athletes in the final part of the ${s.context}. She found the slope of each runner's line. Her results are listed below.
                    </p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px; font-size:18px;">
                        ${s.racers.map(r => `
                            <div style="display:flex; align-items:center; justify-content:center; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #cbd5e1;">
                                <span style="margin-right:10px;">Runner ${r.id}: slope = </span>
                                <div style="display:inline-flex; flex-direction:column; align-items:center;">
                                    <span>${r.n}</span>
                                    <div style="width:100%; height:2px; background:#1e293b;"></div>
                                    <span>${r.d}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.5s;">
                ${mainVisual}
                <div id="roc-question-container" style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    </div>
            </div>
        `;

        renderROCQuestionPart();
    }

    function drawCoordinateGraph() {
        const canvas = document.getElementById('rocCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const w = 400, h = 400, cx = 200, cy = 200, step = 20;

        ctx.clearRect(0,0,w,h);

        // Draw Grid
        ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
        for(let i=0; i<=w; i+=step) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(w,i); ctx.stroke();
        }

        // Draw Axes
        ctx.strokeStyle = "#334155"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,h); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(w,cy); ctx.stroke(); 

        // Axis Labels
        ctx.fillStyle = "#64748b"; ctx.font = "12px Arial";
        ctx.fillText("y", cx + 10, 15);
        ctx.fillText("x", w - 15, cy - 10);
        for(let i = -8; i <= 8; i+=2) {
            if(i === 0) continue;
            ctx.fillText(i, cx + (i*step) - 5, cy + 15); // X
            ctx.fillText(i, cx - 20, cy - (i*step) + 4); // Y
        }

        // Draw Lines
        const colors = ["#2563eb", "#10b981", "#8b5cf6"];
        
        gameState.currentScenario.lines.forEach((line, index) => {
            // Find points at x = -10 and x = 10
            let x1 = -10; let y1 = (line.m * x1) + line.b;
            let x2 = 10; let y2 = (line.m * x2) + line.b;

            ctx.strokeStyle = colors[index];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + (x1 * step), cy - (y1 * step));
            ctx.lineTo(cx + (x2 * step), cy - (y2 * step));
            ctx.stroke();

            // Label Placement (find a spot near the edge of the graph)
            let lx = 8; let ly = (line.m * lx) + line.b;
            if (ly > 9) { ly = 9; lx = (ly - line.b) / line.m; }
            if (ly < -9) { ly = -9; lx = (ly - line.b) / line.m; }

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 18px Arial";
            // Draw a white halo behind text for readability
            ctx.shadowColor="white"; ctx.shadowBlur=4;
            ctx.fillText(line.id, cx + (lx * step) - 10, cy - (ly * step) - 10);
            ctx.shadowBlur=0;
        });
    }

    function renderROCQuestionPart() {
        const container = document.getElementById('roc-question-container');
        let partIdx = gameState.currentPart;
        let q = gameState.currentScenario.questions[partIdx];
        
        let inputHtml = "";
        let labels = ["a.", "b."];

        if (q.type === 'select') {
            inputHtml = `
                <select id="roc-ans" style="margin-top:15px; width:100px; padding:10px; font-size:16px; border:2px solid #cbd5e1; border-radius:6px; cursor:pointer;">
                    <option value="">--</option>
                    ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
        } else {
            inputHtml = `
                <input type="number" id="roc-ans" style="margin-top:15px; width:100px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;">
            `;
        }

        container.innerHTML = `
            <div style="font-size:18px; color:#1e293b; line-height:1.5;">
                <span style="font-weight:bold; margin-right:8px; color:#3b82f6;">${labels[partIdx]}</span>
                ${q.text}
            </div>
            ${inputHtml}
            <div style="margin-top:20px;">
                <button onclick="checkROCAnswer()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer; transition:0.2s;">Submit Answer</button>
                <div id="roc-feedback" style="margin-top:10px; min-height:24px; font-weight:bold;"></div>
            </div>
        `;
    }

    window.checkROCAnswer = function() {
        const feedback = document.getElementById('roc-feedback');
        const ansInput = document.getElementById('roc-ans').value;
        let q = gameState.currentScenario.questions[gameState.currentPart];
        
        if (ansInput === "") return; 
        
        let isCorrect = false;
        if (q.type === 'select') {
            isCorrect = (ansInput === q.ans);
        } else {
            isCorrect = (parseFloat(ansInput) === q.ans);
        }

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            
            // Sub-skill DB Tracking
            if (q.dbSkill && gameState.errorsThisPart === 0 && window.supabaseClient && window.currentUser) {
                let current = window.userMastery[q.dbSkill] || 0;
                let newVal = Math.min(10, current + 1);
                window.userMastery[q.dbSkill] = newVal;
                
                const h = sessionStorage.getItem('target_hour') || "00";
                window.supabaseClient.from('assignment').update({ [q.dbSkill]: newVal })
                    .eq('userName', window.currentUser).eq('hour', h)
                    .then(({error}) => { if(error) console.error("Subskill update fail:", error); });
            }
            
            gameState.currentPart++;
            gameState.errorsThisPart = 0;
            
            setTimeout(() => {
                if (gameState.currentPart >= gameState.currentScenario.questions.length) {
                    finishROCGame();
                } else {
                    renderROCQuestionPart();
                }
            }, 1000);

        } else {
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Incorrect. Look closely at the data and try again.";
            gameState.errorsThisPart++;
        }
    };

    function finishROCGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">📈</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Rate of Change Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMastery = window.userMastery.RateOfChange || 0;
            let newMastery = Math.min(10, curMastery + 1);
            window.userMastery.RateOfChange = newMastery;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ RateOfChange: newMastery })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main update fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2500);
    }
})();
