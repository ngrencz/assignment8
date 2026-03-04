/**
 * skill_association.js
 * - 8th Grade: Scatterplots & Association
 * - Part A: Describe association (Direction, Form, Strength).
 * - Part B: Interpret the y-intercept in context.
 * - Part C: Evaluate if the y-intercept makes real-world sense.
 * - Part D: Identify Association from purely text-based scenarios (CL 7-118).
 */

(function() {
    console.log("🚀 skill_association.js LIVE (Scatterplot & Context Analysis)");

    var assocData = {
        round: 1,
        maxRounds: 4,
        errorsThisPart: 0,
        currentPart: 0, 
        context: {},
        points: [],
        trend: { m: 0, b: 0 },
        textScenario: {}
    };

    window.initAssociationGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        assocData.round = 1;
        assocData.currentPart = 0;
        assocData.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('Association, assoc_describe, assoc_intercept, assoc_text')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("Association DB sync error, continuing locally.");
        }

        startAssocRound();
    };

    function startAssocRound() {
        assocData.currentPart = 0;
        assocData.errorsThisPart = 0;
        generateAssocProblem();
        renderAssocUI();
    }

    function generateAssocProblem() {
        // --- Graph Scenarios (Parts A, B, C) ---
        const contexts = [
            { 
                title: "Child Growth", xL: "Age (years)", yL: "Height (inches)", 
                dir: "Positive", form: "Linear",
                intMeaning: "The height of a newborn baby (age 0).", 
                wrongInt1: "The age when someone is 0 inches tall.",
                wrongInt2: "The average height of all children.",
                makesSense: "Yes", senseReason: "Babies are born with a starting length."
            },
            { 
                title: "Used Cars", xL: "Age of Car (years)", yL: "Value ($1000s)", 
                dir: "Negative", form: "Linear",
                intMeaning: "The value of a brand new car (age 0).", 
                wrongInt1: "The age of a car when it becomes worthless ($0).",
                wrongInt2: "The average value of a used car.",
                makesSense: "Yes", senseReason: "Cars have a starting retail value when new."
            },
            { 
                title: "Heating Bill", xL: "Outside Temp (°F)", yL: "Heater Run Time (hours)", 
                dir: "Negative", form: "Linear",
                intMeaning: "How long the heater runs when it is 0°F outside.", 
                wrongInt1: "The temperature when the heater runs for 0 hours.",
                wrongInt2: "The total hours the heater runs all winter.",
                makesSense: "Yes", senseReason: "0°F is a real temperature that requires heating."
            },
            {
                title: "Typing Speed", xL: "Practice Time (hours)", yL: "Errors per Page",
                dir: "Negative", form: "Linear",
                intMeaning: "The number of errors made with 0 hours of practice.",
                wrongInt1: "The practice needed to make 0 errors.",
                wrongInt2: "The total number of errors made.",
                makesSense: "Yes", senseReason: "A beginner (0 hours practice) will naturally make a baseline number of errors."
            }
        ];

        let ctx = contexts[Math.floor(Math.random() * contexts.length)];
        let strength = Math.random() > 0.5 ? "Strong" : "Weak";
        ctx.strength = strength;

        assocData.context = ctx;
        assocData.points = [];

        let m = ctx.dir === "Positive" ? (Math.random() * 1.5 + 1) : -(Math.random() * 1.5 + 1);
        let b = ctx.dir === "Positive" ? (Math.random() * 10 + 15) : (Math.random() * 20 + 80);
        let noiseLevel = strength === "Strong" ? 4 : 15;

        for (let i = 0; i < 18; i++) {
            let x = Math.random() * 20;
            if (x < 1) x += 1; 
            let y = (m * x) + b + ((Math.random() * noiseLevel * 2) - noiseLevel);
            if (y < 0) y = 0; 
            assocData.points.push({x, y});
        }
        assocData.trend = { m, b };

        // --- Text Scenarios (Part D) ---
        const textScenarios = [
            { text: "The number of inches of rain per hour and the height of water in a reservoir.", ans: "Positive", hint: "As rain goes up, the water level goes up." },
            { text: "The amount of food a person eats and how many pets he or she has.", ans: "None", hint: "Eating habits do not affect pet ownership." },
            { text: "The height of a tree and the amount of nutrients it gets.", ans: "Positive", hint: "More nutrients usually means more growth." },
            { text: "The number of hours spent hiking in the mountains and the amount of water left in your water bottle.", ans: "Negative", hint: "As hours of hiking go up, the water left goes down." },
            { text: "The outside temperature and the number of winter coats sold.", ans: "Negative", hint: "As the temperature goes up, coat sales go down." },
            { text: "A student's shoe size and their score on a math test.", ans: "None", hint: "Shoe size does not logically affect math ability." },
            { text: "The time spent practicing free throws and the percentage of shots made.", ans: "Positive", hint: "More practice generally leads to a higher percentage of shots made." }
        ];
        
        assocData.textScenario = textScenarios[Math.floor(Math.random() * textScenarios.length)];
    }

    function renderAssocUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let ctx = assocData.context;

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div id="graph-container" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h3 style="margin-top:0; text-align:center; color:#1e293b;">${ctx.title}</h3>
                    <div style="position:relative; width:400px; height:300px; margin:0 auto;">
                        <canvas id="assocCanvas" width="400" height="300" style="border-left:2px solid #334155; border-bottom:2px solid #334155;"></canvas>
                        <div style="position:absolute; bottom:-25px; width:100%; text-align:center; font-weight:bold; color:#64748b; font-size:13px;">${ctx.xL}</div>
                        <div style="position:absolute; top:130px; left:-50px; transform:rotate(-90deg); font-weight:bold; color:#64748b; font-size:13px;">${ctx.yL}</div>
                    </div>
                </div>

                <div id="assoc-question-container" style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    </div>
            </div>
        `;

        drawScatterplot();
        renderQuestionPart();
    }

    function drawScatterplot() {
        const canvas = document.getElementById('assocCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,400,300);

        let maxX = 25; 
        let maxY = Math.max(...assocData.points.map(p => p.y)) * 1.2;
        if (maxY < 10) maxY = 10; 

        const pX = (val) => (val / maxX) * 380 + 10;
        const pY = (val) => 290 - ((val / maxY) * 280);

        ctx.fillStyle = "#1e293b";
        assocData.points.forEach(p => {
            ctx.beginPath();
            ctx.arc(pX(p.x), pY(p.y), 4, 0, Math.PI*2);
            ctx.fill();
        });

        if (assocData.currentPart > 0) {
            ctx.strokeStyle = "rgba(59, 130, 246, 0.7)"; 
            ctx.lineWidth = 3;
            ctx.beginPath();
            let startY = assocData.trend.b;
            let endY = (assocData.trend.m * maxX) + assocData.trend.b;
            ctx.moveTo(pX(0), pY(startY));
            ctx.lineTo(pX(maxX), pY(endY));
            ctx.stroke();

            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(pX(0), pY(startY), 6, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function renderQuestionPart() {
        const container = document.getElementById('assoc-question-container');
        let ctx = assocData.context;
        let part = assocData.currentPart;
        let html = "";

        if (part === 0) {
            html = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">a.</span> Fully describe the association shown in the scatterplot.
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold; color:#64748b; margin-bottom:5px;">Form</label>
                        <select id="ans-form" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;">
                            <option value="">--</option>
                            <option value="Linear">Linear</option>
                            <option value="Non-linear">Non-linear</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold; color:#64748b; margin-bottom:5px;">Direction</label>
                        <select id="ans-dir" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;">
                            <option value="">--</option>
                            <option value="Positive">Positive</option>
                            <option value="Negative">Negative</option>
                            <option value="None">None</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold; color:#64748b; margin-bottom:5px;">Strength</label>
                        <select id="ans-str" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;">
                            <option value="">--</option>
                            <option value="Strong">Strong</option>
                            <option value="Weak">Weak</option>
                        </select>
                    </div>
                </div>
            `;
        } 
        else if (part === 1) {
            let options = [ctx.intMeaning, ctx.wrongInt1, ctx.wrongInt2].sort(() => Math.random() - 0.5);
            html = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">b.</span> A trend line has been drawn. The red dot represents the <i>y</i>-intercept. <br><br>What does the <i>y</i>-intercept represent in this specific situation?
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${options.map(opt => `
                        <label style="background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; gap:10px; transition:0.2s;">
                            <input type="radio" name="ans-int" value="${opt}">
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            `;
        }
        else if (part === 2) {
            html = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">c.</span> Does this <i>y</i>-intercept make sense in the real world?
                </div>
                <div style="display:flex; gap:15px;">
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-sense" value="Yes"> Yes
                    </label>
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-sense" value="No"> No
                    </label>
                </div>
            `;
        }
        else if (part === 3) {
            // Hide the graph for the text portion
            document.getElementById('graph-container').style.display = 'none';
            
            html = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">d.</span> Read the following situation. Do you expect a positive association, negative association, or no association?
                </div>
                <div style="background:white; padding:15px; border-radius:8px; border:1px solid #cbd5e1; font-weight:bold; color:#334155; margin-bottom:15px; text-align:center;">
                    "${assocData.textScenario.text}"
                </div>
                <div style="display:flex; gap:10px;">
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-text" value="Positive"> Positive
                    </label>
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-text" value="Negative"> Negative
                    </label>
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold;">
                        <input type="radio" name="ans-text" value="None"> No Association
                    </label>
                </div>
            `;
        }

        html += `
            <div style="margin-top:20px; text-align:right;">
                <span id="assoc-feedback" style="font-weight:bold; margin-right:15px;"></span>
                <button onclick="checkAssocAnswer()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer;">Submit</button>
            </div>
        `;
        
        container.innerHTML = html;
    }

    window.checkAssocAnswer = function() {
        const feedback = document.getElementById('assoc-feedback');
        let ctx = assocData.context;
        let part = assocData.currentPart;
        let isCorrect = false;

        if (part === 0) {
            let uForm = document.getElementById('ans-form').value;
            let uDir = document.getElementById('ans-dir').value;
            let uStr = document.getElementById('ans-str').value;
            if (!uForm || !uDir || !uStr) return;
            isCorrect = (uForm === ctx.form && uDir === ctx.dir && uStr === ctx.strength);
        } 
        else if (part === 1) {
            let selected = document.querySelector('input[name="ans-int"]:checked');
            if (!selected) return;
            isCorrect = (selected.value === ctx.intMeaning);
        }
        else if (part === 2) {
            let selected = document.querySelector('input[name="ans-sense"]:checked');
            if (!selected) return;
            isCorrect = (selected.value === ctx.makesSense);
        }
        else if (part === 3) {
            let selected = document.querySelector('input[name="ans-text"]:checked');
            if (!selected) return;
            isCorrect = (selected.value === assocData.textScenario.ans);
        }

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            if (part === 2) feedback.innerText = `✅ Correct! ${ctx.senseReason}`;
            else if (part === 3) feedback.innerText = `✅ Correct!`;
            else feedback.innerText = "✅ Correct!";
            
            // Sub-skill Tracking
            let dbSkill = '';
            if (part === 0) dbSkill = 'assoc_describe';
            else if (part === 1 || part === 2) dbSkill = 'assoc_intercept';
            else if (part === 3) dbSkill = 'assoc_text';

            if (assocData.errorsThisPart === 0) updateAssocSkill(dbSkill, 1);

            assocData.currentPart++;
            assocData.errorsThisPart = 0;

            setTimeout(() => {
                if (assocData.currentPart > 3) {
                    assocData.round++;
                    if (assocData.round > assocData.maxRounds) {
                        finishAssocGame();
                    } else {
                        startAssocRound();
                    }
                } else {
                    if (assocData.currentPart === 1) drawScatterplot();
                    renderQuestionPart();
                }
            }, part === 2 || part === 3 ? 2500 : 1000); 

        } else {
            assocData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            if (part === 0) feedback.innerText = "❌ Look closely at the pattern, direction, and how tightly packed the dots are.";
            if (part === 1) feedback.innerText = "❌ Remember: The y-intercept is the y-value when x is EXACTLY zero.";
            if (part === 2) feedback.innerText = "❌ Incorrect. Think about what the zero value literally means in real life.";
            if (part === 3) feedback.innerText = `❌ Incorrect. ${assocData.textScenario.hint}`;
        }
    };

    function updateAssocSkill(col, amt) {
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

    function finishAssocGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">📈</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Data Association Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.Association || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.Association = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ Association: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
