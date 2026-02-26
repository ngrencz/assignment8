/**
 * skill_lineofbestfit.js
 * - Primary skill for 7.1.3
 * - Generates real-world scatter data tables.
 * - Draws scatterplot with a line of best fit.
 * - Asks for equation (y=mx+b), prediction, and y-intercept interpretation.
 */

console.log("🚀 skill_lineofbestfit.js is LIVE - Line of Best Fit");

(function() {
    let lbfData = {};
    let lbfRound = 1;
    const totalLbfRounds = 3;
    let sessionCorrectFirstTry = 0;

    const scenarios = [
        {
            xLabel: "Depth of seed (cm)", yLabel: "Plant height (cm)",
            mSign: -1,
            intCorrect: "The expected plant height if the seed is planted at a depth of 0 cm.",
            intWrong1: "The depth of the seed when the plant height reaches 0 cm.",
            intWrong2: "The amount the plant shrinks for each additional cm of depth."
        },
        {
            xLabel: "Months Since Purchase", yLabel: "Value of Phone ($)",
            mSign: -1,
            intCorrect: "The initial value of the phone when it was brand new (0 months).",
            intWrong1: "The amount of value the phone loses each month.",
            intWrong2: "The number of months it takes for the phone's value to reach $0."
        },
        {
            xLabel: "Hours of Practice", yLabel: "Points Scored in Game",
            mSign: 1,
            intCorrect: "The expected points scored with 0 hours of practice.",
            intWrong1: "The additional points scored for every extra hour of practice.",
            intWrong2: "The total number of hours needed to score the maximum points."
        },
        {
            xLabel: "Cars Washed", yLabel: "Money Raised ($)",
            mSign: 1,
            intCorrect: "The starting money in the fundraiser before washing any cars.",
            intWrong1: "The amount of money earned for each car washed.",
            intWrong2: "The total number of cars needed to reach the fundraiser goal."
        }
    ];

    window.initLineOfBestFitGame = async function() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        lbfRound = 1;
        sessionCorrectFirstTry = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const currentHour = sessionStorage.getItem('target_hour') || "00";
                const { data, error } = await window.supabaseClient
                    .from('assignment')
                    .select('LineOfBestFit')
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .maybeSingle();
                
                if (error) console.error("[LineOfBestFit] Fetch error:", error);
                if (data) window.userMastery.LineOfBestFit = data.LineOfBestFit || 0;
            }
        } catch (e) { 
            console.error("[LineOfBestFit] Init error:", e); 
        }
        
        startLbfRound();
    };

    function startLbfRound() {
        generateLbfProblem();
        renderLbfUI();
    }

    function generateLbfProblem() {
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        // Pick a clean, integer-based slope and y-intercept
        let b = Math.floor(Math.random() * 20) + 20; // y-int between 20 and 40
        if (scenario.mSign === 1) b = Math.floor(Math.random() * 10) + 5; // lower y-int for positive growth
        
        let m = scenario.mSign * (Math.floor(Math.random() * 3) + 2); // slope +/- 2, 3, or 4
        
        // Two clear points the line will pass through
        let p1 = { x: 0, y: b };
        let xStep = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
        let p2 = { x: xStep * 2, y: b + m * (xStep * 2) };

        // Generate scatter points around the line
        let points = [];
        let tableData = [];
        for (let i = 0; i <= 5; i++) {
            let cx = i * xStep;
            // Add a little noise so it's a scatterplot, not a perfect line
            let noise = (Math.random() * 4 - 2);
            let cy = Math.max(0, Math.round(b + m * cx + noise)); 
            points.push({ x: cx, y: cy });
            tableData.push({ x: cx, y: cy });
        }

        // Generate prediction target (further down the x-axis)
        let predictX = (6 * xStep) + Math.floor(Math.random() * xStep);
        let expectedPredictY = m * predictX + b;

        let interpretations = [
            { text: scenario.intCorrect, isCorrect: true },
            { text: scenario.intWrong1, isCorrect: false },
            { text: scenario.intWrong2, isCorrect: false }
        ].sort(() => 0.5 - Math.random());

        lbfData = {
            ...scenario,
            m: m,
            b: b,
            p1: p1,
            p2: p2,
            points: points,
            tableData: tableData,
            predictX: predictX,
            predictY: expectedPredictY,
            interpretations: interpretations
        };
    }

    function renderLbfUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Lines of Best Fit (Round ${lbfRound}/${totalLbfRounds})`;

        // Build HTML Table
        let tableHTML = `<table style="width:100%; border-collapse: collapse; text-align: center; margin-bottom: 15px; font-size: 14px;">`;
        
        tableHTML += `<tr><th style="border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; text-align: left; width: 40%;">${lbfData.xLabel}</th>`;
        lbfData.tableData.forEach(d => { tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${d.x}</td>`; });
        tableHTML += `</tr>`;

        tableHTML += `<tr><th style="border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; text-align: left;">${lbfData.yLabel}</th>`;
        lbfData.tableData.forEach(d => { tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${d.y}</td>`; });
        tableHTML += `</tr></table>`;

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; background:#f8fafc; padding:25px; border-radius:12px; border:1px solid #e2e8f0;">
                
                ${tableHTML}

                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center;">
                    <canvas id="lbfCanvas" width="350" height="250" style="max-width:100%;"></canvas>
                    <p style="font-size: 13px; color: #475569; margin-top: 10px;"><em>The drawn line of best fit passes exactly through <strong>(0, ${lbfData.b})</strong> and <strong>(${lbfData.p2.x}, ${lbfData.p2.y})</strong>.</em></p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    
                    <div style="margin-bottom: 20px;">
                        <strong style="font-size: 16px;">a. Equation:</strong> Find the equation of the line of best fit.<br>
                        <div style="display:flex; align-items:center; gap: 8px; margin-top: 10px; font-size: 18px;">
                            y = <input type="number" id="lbf-ans-m" step="0.1" placeholder="m" style="width: 60px; height:35px; text-align:center; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none;"> 
                            x + 
                            <input type="number" id="lbf-ans-b" step="0.1" placeholder="b" style="width: 60px; height:35px; text-align:center; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none;">
                        </div>
                    </div>

                    <div style="margin-bottom: 20px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                        <strong style="font-size: 16px;">b. Prediction:</strong> Use your equation to predict the ${lbfData.yLabel.toLowerCase()} when the ${lbfData.xLabel.toLowerCase()} is <strong>${lbfData.predictX}</strong>.<br>
                        <div style="margin-top: 10px;">
                            <input type="number" id="lbf-ans-pred" step="0.1" placeholder="?" style="width: 80px; height:35px; text-align:center; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none;">
                        </div>
                    </div>

                    <div style="font-size: 16px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                        <strong style="font-size: 16px;">c. Interpretation:</strong> What does the y-intercept represent in this situation?<br>
                        <select id="lbf-ans-int" style="margin-top: 10px; width: 100%; height:40px; padding: 0 10px; font-size:14px; border:2px solid #3b82f6; border-radius:6px; outline:none; background: white; cursor: pointer;">
                            <option value="none">-- Select the best interpretation --</option>
                            ${lbfData.interpretations.map((s, i) => `<option value="${s.isCorrect ? 'correct' : 'wrong' + i}">${s.text}</option>`).join('')}
                        </select>
                    </div>

                </div>

                <button onclick="checkLbf()" id="lbf-check-btn" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size: 18px; transition: background 0.2s;">CHECK ANSWERS</button>
            </div>
            <div id="lbf-flash" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; z-index:100;"></div>
        `;

        setTimeout(drawLbfGraph, 50);
    }

    function drawLbfGraph() {
        const canvas = document.getElementById('lbfCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const padX = 40; 
        const padY = 40; 
        const chartW = canvas.width - padX - 10;
        const chartH = canvas.height - padY - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Find max values for scaling
        let maxX = Math.max(...lbfData.points.map(p => p.x)) + 5;
        let maxY = Math.max(...lbfData.points.map(p => p.y), lbfData.b) + 10;

        const scaleX = chartW / maxX;
        const scaleY = chartH / maxY;

        // Draw Axes
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padX, canvas.height - padY);
        ctx.lineTo(canvas.width - 10, canvas.height - padY);
        ctx.moveTo(padX, canvas.height - padY);
        ctx.lineTo(padX, 10);
        ctx.stroke();

        // Draw Points
        ctx.fillStyle = '#0f172a';
        lbfData.points.forEach(p => {
            let px = padX + (p.x * scaleX);
            let py = (canvas.height - padY) - (p.y * scaleY);
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Line of Best Fit
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        let lineStartX = padX + (0 * scaleX);
        let lineStartY = (canvas.height - padY) - (lbfData.b * scaleY);
        
        // Extend line slightly past last point
        let endX = maxX;
        let endY = lbfData.m * endX + lbfData.b;
        let lineEndX = padX + (endX * scaleX);
        let lineEndY = (canvas.height - padY) - (endY * scaleY);

        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    window.checkLbf = function() {
        const elM = document.getElementById('lbf-ans-m');
        const elB = document.getElementById('lbf-ans-b');
        const elPred = document.getElementById('lbf-ans-pred');
        const elInt = document.getElementById('lbf-ans-int');

        if (!elM || !elB || !elPred || !elInt) return;

        const uM = parseFloat(elM.value);
        const uB = parseFloat(elB.value);
        const uPred = parseFloat(elPred.value);
        const uInt = elInt.value;

        let allCorrect = true;

        if (Math.abs(uM - lbfData.m) < 0.05) {
            elM.style.backgroundColor = "#dcfce7"; elM.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            elM.style.backgroundColor = "#fee2e2"; elM.style.borderColor = "#ef4444";
        }

        if (Math.abs(uB - lbfData.b) < 0.05) {
            elB.style.backgroundColor = "#dcfce7"; elB.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            elB.style.backgroundColor = "#fee2e2"; elB.style.borderColor = "#ef4444";
        }

        if (Math.abs(uPred - lbfData.predictY) < 0.05) {
            elPred.style.backgroundColor = "#dcfce7"; elPred.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            elPred.style.backgroundColor = "#fee2e2"; elPred.style.borderColor = "#ef4444";
        }

        if (uInt === 'correct') {
            elInt.style.backgroundColor = "#dcfce7"; elInt.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            elInt.style.backgroundColor = "#fee2e2"; elInt.style.borderColor = "#ef4444";
        }

        if (uInt === 'none') allCorrect = false; 

        if (allCorrect) {
            document.getElementById('lbf-check-btn').disabled = true;
            showLbfFlash("Correct!", "success");
            sessionCorrectFirstTry++;

            lbfRound++;
            setTimeout(() => {
                if (lbfRound > totalLbfRounds) finishLbfGame();
                else startLbfRound();
            }, 1200);
        } else {
            showLbfFlash("Check your work.", "error");
        }
    };

    function finishLbfGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        if (!qContent) return;
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px;">📈</div>
                <h2 style="color:#1e293b; margin:10px 0;">Predictions Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Skills updated.</p>
            </div>
        `;

        let mainAdjustment = 0;
        if (sessionCorrectFirstTry >= totalLbfRounds) mainAdjustment = 1;

        if (mainAdjustment !== 0) {
            const currentMain = window.userMastery?.['LineOfBestFit'] || 0;
            const newMain = Math.max(0, Math.min(10, currentMain + mainAdjustment));
            window.userMastery['LineOfBestFit'] = newMain;

            if (window.supabaseClient && window.currentUser) {
                const hour = sessionStorage.getItem('target_hour') || "00";
                window.supabaseClient.from('assignment')
                    .update({ 'LineOfBestFit': newMain })
                    .eq('userName', window.currentUser)
                    .eq('hour', hour)
                    .then(({ error }) => { if (error) console.error("[LineOfBestFit] Update Error:", error); });
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

    function showLbfFlash(msg, type) {
        const overlay = document.getElementById('lbf-flash');
        if (!overlay) return;
        overlay.innerText = msg;
        overlay.style.display = 'block';
        overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        setTimeout(() => { overlay.style.display = 'none'; }, 1500);
    }
})();
