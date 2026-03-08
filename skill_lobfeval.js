/**
 * skill_lobfeval.js
 * - 8th Grade: Lesson 7.3.1 Evaluating Lines of Best Fit
 * - Generates scatterplots with pre-drawn lines that might be flawed.
 * - Part A: Identify the underlying association (Positive, Negative, None).
 * - Part B: Evaluate the fit of the drawn line.
 */

(function() {
    console.log("🚀 skill_lobfeval.js LIVE (Evaluating Lines of Best Fit)");

    var evalData = {
        round: 1,
        maxRounds: 4,
        currentPart: 0,
        errorsThisPart: 0,
        scenarioType: "", // 'good', 'high', 'low', 'slope', 'none'
        points: [],
        trueTrend: { m: 0, b: 0 },
        drawnLine: { m: 0, b: 0 },
        ansAssoc: "",
        ansLine: ""
    };

    window.initLOBFEvalGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        evalData.round = 1;
        evalData.currentPart = 0;
        evalData.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('LOBFEval, lobf_eval_assoc, lobf_eval_line')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("LOBFEval DB sync error, continuing locally.");
        }

        startEvalRound();
    };

    function startEvalRound() {
        evalData.currentPart = 0;
        evalData.errorsThisPart = 0;
        generateEvalProblem();
        renderEvalUI();
    }

    function generateEvalProblem() {
        evalData.points = [];
        const types = ['good', 'good', 'high', 'low', 'slope', 'none'];
        evalData.scenarioType = types[Math.floor(Math.random() * types.length)];

        let isPositive = Math.random() > 0.5;
        let trueM = isPositive ? (Math.random() * 1.5 + 0.5) : -(Math.random() * 1.5 + 0.5);
        let trueB = isPositive ? (Math.random() * 5 + 2) : (Math.random() * 15 + 25);
        
        if (evalData.scenarioType === 'none') {
            evalData.ansAssoc = "None";
            evalData.ansLine = "No Assoc";
            for (let i = 0; i < 20; i++) {
                evalData.points.push({ x: Math.random() * 20 + 2, y: Math.random() * 30 + 5 });
            }
            // Draw a completely random line through the noise
            evalData.drawnLine = { m: (Math.random() * 2 - 1), b: Math.random() * 20 + 5 };
        } else {
            evalData.ansAssoc = isPositive ? "Positive" : "Negative";
            
            // Generate clustered points
            for (let i = 0; i < 18; i++) {
                let x = Math.random() * 20 + 2;
                let noise = (Math.random() * 10 - 5);
                let y = (trueM * x) + trueB + noise;
                if (y < 0) y = Math.random() * 3; 
                evalData.points.push({ x, y });
            }
            evalData.trueTrend = { m: trueM, b: trueB };

            // Alter the drawn line based on scenario
            if (evalData.scenarioType === 'good') {
                evalData.drawnLine = { m: trueM, b: trueB };
                evalData.ansLine = "Good";
            } else if (evalData.scenarioType === 'high') {
                evalData.drawnLine = { m: trueM, b: trueB + 12 };
                evalData.ansLine = "High";
            } else if (evalData.scenarioType === 'low') {
                evalData.drawnLine = { m: trueM, b: trueB - 12 };
                evalData.ansLine = "Low";
            } else if (evalData.scenarioType === 'slope') {
                // Completely wrong trajectory
                let invertedM = isPositive ? -(Math.random() * 1 + 0.5) : (Math.random() * 1 + 0.5);
                let centerPointX = 12;
                let centerPointY = (trueM * centerPointX) + trueB;
                let invertedB = centerPointY - (invertedM * centerPointX);
                evalData.drawnLine = { m: invertedM, b: invertedB };
                evalData.ansLine = "Slope";
            }
        }
    }

    function renderEvalUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let part = evalData.currentPart;
        
        let questionHTML = "";
        
        if (part === 0) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">Part A:</span> Look at the data points (ignore the line for a moment). Does the data show an association?
                </div>
                <div style="display:flex; gap:10px;">
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-assoc" value="Positive"> Positive
                    </label>
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-assoc" value="Negative"> Negative
                    </label>
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-assoc" value="None"> No Association
                    </label>
                </div>
            `;
            // Sandbox Agent Hook
            window.expectedTestAnswer = { targets: [{ id: `ans-assoc-${evalData.ansAssoc}`, val: true, isRadio: true }], btnId: 'eval-submit-btn' };
        } else if (part === 1) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">Part B:</span> A student drew the line shown on the graph. Do you agree with where they put the line?
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <label style="background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="ans-line" value="Good"> Yes, it is a good line of best fit.
                    </label>
                    <label style="background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="ans-line" value="High"> No, the line is drawn too high above the data.
                    </label>
                    <label style="background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="ans-line" value="Low"> No, the line is drawn too low below the data.
                    </label>
                    <label style="background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="ans-line" value="Slope"> No, the line goes in the wrong direction (wrong slope).
                    </label>
                    <label style="background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="ans-line" value="No Assoc"> No, there is no association, so a line should not be drawn at all.
                    </label>
                </div>
            `;
             // Sandbox Agent Hook
             window.expectedTestAnswer = { targets: [{ id: `ans-line-${evalData.ansLine.replace(' ', '')}`, val: true, isRadio: true }], btnId: 'eval-submit-btn' };
        }

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="text-align:center; color:#64748b; margin-bottom:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                    Round ${evalData.round} of ${evalData.maxRounds}
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align:center;">
                    <canvas id="evalCanvas" width="400" height="250" style="max-width:100%; border-left:2px solid #334155; border-bottom:2px solid #334155;"></canvas>
                </div>

                <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    ${questionHTML}
                    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                        <div id="eval-feedback" style="font-weight:bold; font-size:14px; max-width:70%;"></div>
                        <button id="eval-submit-btn" onclick="checkEvalAnswer()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer;">Submit</button>
                    </div>
                </div>
            </div>
        `;
        
        // Inject IDs into radio buttons for the Sandbox agent
        setTimeout(() => {
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.id = `ans-${radio.name.split('-')[1]}-${radio.value.replace(' ', '')}`;
            });
            drawScatterplot();
        }, 50);
    }

    function drawScatterplot() {
        const canvas = document.getElementById('evalCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,400,250);

        let maxX = 25; 
        let maxY = 40;

        const pX = (val) => (val / maxX) * 380 + 10;
        const pY = (val) => 240 - ((val / maxY) * 230);

        // Draw points
        ctx.fillStyle = "#1e293b";
        evalData.points.forEach(p => {
            ctx.beginPath();
            ctx.arc(pX(p.x), pY(p.y), 4, 0, Math.PI*2);
            ctx.fill();
        });

        // Draw the proposed line
        ctx.strokeStyle = "#3b82f6"; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        let startY = evalData.drawnLine.b;
        let endY = (evalData.drawnLine.m * maxX) + evalData.drawnLine.b;
        ctx.moveTo(pX(0), pY(startY));
        ctx.lineTo(pX(maxX), pY(endY));
        ctx.stroke();
    }

    window.checkEvalAnswer = function() {
        const feedback = document.getElementById('eval-feedback');
        let part = evalData.currentPart;
        let isCorrect = false;

        if (part === 0) {
            let selected = document.querySelector('input[name="ans-assoc"]:checked');
            if (!selected) return;
            isCorrect = (selected.value === evalData.ansAssoc);
        } else if (part === 1) {
            let selected = document.querySelector('input[name="ans-line"]:checked');
            if (!selected) return;
            isCorrect = (selected.value === evalData.ansLine);
        }

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            
            document.getElementById('eval-submit-btn').disabled = true;

            // Sub-skill Tracking
            let dbSkill = part === 0 ? 'lobf_eval_assoc' : 'lobf_eval_line';
            if (evalData.errorsThisPart === 0) updateEvalSkill(dbSkill, 1);

            evalData.currentPart++;
            evalData.errorsThisPart = 0;

            setTimeout(() => {
                if (evalData.currentPart > 1) {
                    evalData.round++;
                    if (evalData.round > evalData.maxRounds) finishEvalGame();
                    else startEvalRound();
                } else {
                    renderEvalUI();
                }
            }, 1000);

        } else {
            evalData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            
            if (part === 0) {
                feedback.innerText = "❌ Look at the cluster of dots. Are they trending up, trending down, or totally random?";
            } else if (part === 1) {
                if (evalData.ansLine === "Good") feedback.innerText = "❌ The line actually splits the data nicely and follows the trend.";
                else if (evalData.ansLine === "High") feedback.innerText = "❌ Look closely. Almost all the data points are BELOW the line.";
                else if (evalData.ansLine === "Low") feedback.innerText = "❌ Look closely. Almost all the data points are ABOVE the line.";
                else if (evalData.ansLine === "Slope") feedback.innerText = "❌ Notice the direction of the dots vs the direction of the line. They cross each other!";
                else if (evalData.ansLine === "No Assoc") feedback.innerText = "❌ Look at Part A. Because the dots are random, you can't draw a trend line.";
            }
        }
    };

    function updateEvalSkill(col, amt) {
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

    function finishEvalGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">🔍</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Evaluation Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.LOBFEval || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.LOBFEval = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ LOBFEval: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();