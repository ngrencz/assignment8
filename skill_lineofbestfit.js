/**
 * skill_lineofbestfit.js
 * - Primary skill for 7.1.3
 * - Generates real-world scatter data tables.
 * - Desmos-style interactive graph with drag-and-drop grabbers.
 * - FIXED: First grabber is locked to the Y-axis to clearly define 'b'.
 * - FIXED: Allows fraction inputs (e.g., -1/3) and wider boxes.
 */

console.log("🚀 skill_lineofbestfit.js is LIVE - Y-Axis Locked & Fractions Allowed");

(function() {
    let lbfData = {};
    let lbfRound = 1;
    const totalLbfRounds = 3;
    let sessionCorrectFirstTry = 0;
    let currentStep = 1;
    let errorCount = 0;

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
                    .from('assignment8')
                    .select('LineOfBestFit')
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .maybeSingle();
                
                if (error) console.error("[LineOfBestFit] Fetch error:", error);
                if (data) window.userMastery.LineOfBestFit = data.LineOfBestFit || 0;
            }
        } catch (e) { console.error("[LineOfBestFit] Init error:", e); }
        
        startLbfRound();
    };

    function startLbfRound() {
        currentStep = 1;
        errorCount = 0;
        generateLbfProblem();
        renderLbfUI();
    }

    function generateLbfProblem() {
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        let b = Math.floor(Math.random() * 20) + 20; 
        if (scenario.mSign === 1) b = Math.floor(Math.random() * 10) + 5; 
        
        let m = scenario.mSign * (Math.floor(Math.random() * 3) + 2); 
        
        let xStep = Math.floor(Math.random() * 3) + 3; 
        let points = [];
        let tableData = [];

        for (let i = 0; i <= 6; i++) {
            let cx = i * xStep;
            let noise = (Math.random() * 16 - 8); 
            let cy = Math.max(0, Math.round(b + m * cx + noise)); 
            points.push({ x: cx, y: cy });
            tableData.push({ x: cx, y: cy });
        }

        let predictX = (7 * xStep) + Math.floor(Math.random() * xStep);

        let interpretations = [
            { text: scenario.intCorrect, isCorrect: true },
            { text: scenario.intWrong1, isCorrect: false },
            { text: scenario.intWrong2, isCorrect: false }
        ].sort(() => 0.5 - Math.random());

        lbfData = {
            ...scenario, m: m, b: b,
            points: points, tableData: tableData,
            predictX: predictX, interpretations: interpretations,
            grabbers: null 
        };
    }

    function renderLbfUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Lines of Best Fit (Round ${lbfRound}/${totalLbfRounds})`;

        let tableHTML = `<table style="width:100%; border-collapse: collapse; text-align: center; margin-bottom: 15px; font-size: 14px;">`;
        tableHTML += `<tr><th style="border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; text-align: left; width: 40%;">${lbfData.xLabel}</th>`;
        lbfData.tableData.forEach(d => { tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${d.x}</td>`; });
        tableHTML += `</tr><tr><th style="border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; text-align: left;">${lbfData.yLabel}</th>`;
        lbfData.tableData.forEach(d => { tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${d.y}</td>`; });
        tableHTML += `</tr></table>`;

        let stepHTML = "";
        let ruleDisplay = (currentStep > 1) ? `
            <div style="background: #ecfdf5; border: 1px dashed #10b981; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; color: #065f46; font-size: 16px;">
                <strong>Accepted Equation:</strong> y = ${lbfData.acceptedM}x + ${lbfData.acceptedB}
            </div>` : "";

        if (currentStep === 1) {
            stepHTML = `
                <div style="margin-bottom: 15px;">
                    <strong style="font-size: 16px;">Step 1. Equation:</strong> 
                    <span style="color: #475569; font-size: 14px;">Drag the blue points on the graph to create a line of best fit. (Notice the left point is locked to the Y-Axis). Then calculate your equation.</span><br>
                    <div style="display:flex; align-items:center; justify-content:center; gap: 8px; margin-top: 15px; font-size: 18px;">
                        y = <input type="text" id="lbf-ans-m" placeholder="m" autocomplete="off" style="width: 100px; height:40px; text-align:center; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none;"> 
                        x + 
                        <input type="text" id="lbf-ans-b" placeholder="b" autocomplete="off" style="width: 100px; height:40px; text-align:center; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none;">
                    </div>
                </div>`;
            window.expectedTestAnswer = { targets: [{ id: 'lbf-ans-m', val: lbfData.m }, { id: 'lbf-ans-b', val: lbfData.b }], btnId: 'lbf-check-btn' };
        } else if (currentStep === 2) {
            stepHTML = ruleDisplay + `
                <div style="margin-bottom: 15px;">
                    <strong style="font-size: 16px;">Step 2. Prediction:</strong> Use your equation to predict the ${lbfData.yLabel.toLowerCase()} when the ${lbfData.xLabel.toLowerCase()} is <strong>${lbfData.predictX}</strong>.<br>
                    <div style="margin-top: 15px; text-align: center;">
                        <input type="text" id="lbf-ans-pred" placeholder="?" autocomplete="off" style="width: 120px; height:40px; text-align:center; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none;">
                    </div>
                </div>`;
            window.expectedTestAnswer = { targets: [{ id: 'lbf-ans-pred', val: lbfData.predictY }], btnId: 'lbf-check-btn' };
        } else {
            stepHTML = ruleDisplay + `
                <div style="margin-bottom: 15px;">
                    <strong style="font-size: 16px;">Step 3. Interpretation:</strong> What does the y-intercept represent in this situation?<br>
                    <select id="lbf-ans-int" style="margin-top: 15px; width: 100%; height:45px; padding: 0 10px; font-size:14px; border:2px solid #3b82f6; border-radius:6px; outline:none; background: white; cursor: pointer;">
                        <option value="none">-- Select the best interpretation --</option>
                        ${lbfData.interpretations.map((s, i) => `<option value="${s.isCorrect ? 'correct' : 'wrong' + i}">${s.text}</option>`).join('')}
                    </select>
                </div>`;
            window.expectedTestAnswer = { targets: [{ id: 'lbf-ans-int', val: 'correct' }], btnId: 'lbf-check-btn' };
        }

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; background:#f8fafc; padding:25px; border-radius:12px; border:1px solid #e2e8f0;">
                ${tableHTML}
                <div style="background: white; padding: 20px 10px 10px 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center;">
                    <canvas id="lbfCanvas" width="550" height="350" style="max-width:100%; touch-action: none; cursor: crosshair;"></canvas>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    ${stepHTML}
                </div>
                <div id="lbf-hint" style="margin-bottom: 15px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 14px; color: #92400e; text-align:center; line-height:1.4;"></div>
                <button onclick="checkLbfStep()" id="lbf-check-btn" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size: 18px; transition: background 0.2s;">CHECK ANSWER</button>
            </div>
            <div id="lbf-flash" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; z-index:100;"></div>
        `;

        setTimeout(setupInteractiveCanvas, 50);
    }

    function setupInteractiveCanvas() {
        const canvas = document.getElementById('lbfCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const padX = 60; const padY = 50;
        const chartW = canvas.width - padX - 20;
        const chartH = canvas.height - padY - 20;

        let maxX = Math.max(...lbfData.points.map(p => p.x));
        maxX = Math.ceil(maxX / 10) * 10 || 10;
        if (maxX < 20) maxX = 20;

        let maxY = Math.max(...lbfData.points.map(p => p.y), lbfData.b);
        maxY = Math.ceil(maxY / 10) * 10 || 10;

        const scaleX = chartW / maxX;
        const scaleY = chartH / maxY;
        lbfData.chartOpts = { padX, padY, chartW, chartH, maxX, maxY, scaleX, scaleY };

        if (!lbfData.grabbers) {
            lbfData.grabbers = [
                { x: 0, y: maxY * 0.8 }, // LEFT GRABBER LOCKED TO X=0
                { x: maxX * 0.8, y: maxY * 0.2 }
            ];
        }

        window.drawLbfInteractive = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Grid
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
            ctx.font = '12px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            
            for(let i=0; i<=5; i++) {
                let val = (maxY / 5) * i;
                let py = (canvas.height - padY) - (val * scaleY);
                ctx.beginPath(); ctx.moveTo(padX, py); ctx.lineTo(canvas.width - 20, py); ctx.stroke();
                ctx.fillText(Math.round(val), padX - 10, py);
            }

            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            for(let i=0; i<=5; i++) {
                let val = (maxX / 5) * i;
                let px = padX + (val * scaleX);
                ctx.beginPath(); ctx.moveTo(px, canvas.height - padY); ctx.lineTo(px, 20); ctx.stroke();
                ctx.fillText(Math.round(val), px, canvas.height - padY + 10);
            }

            // Draw Axes
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(padX, canvas.height - padY); ctx.lineTo(canvas.width - 20, canvas.height - padY);
            ctx.moveTo(padX, canvas.height - padY); ctx.lineTo(padX, 20); ctx.stroke();

            // Draw Labels
            ctx.save(); ctx.translate(15, canvas.height/2); ctx.rotate(-Math.PI/2);
            ctx.textAlign = 'center'; ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
            ctx.fillText(lbfData.yLabel, 0, 0); ctx.restore();
            ctx.fillText(lbfData.xLabel, padX + chartW/2, canvas.height - 15);

            // Draw Scatter Points
            ctx.fillStyle = '#0f172a';
            lbfData.points.forEach(p => {
                let px = padX + (p.x * scaleX);
                let py = (canvas.height - padY) - (p.y * scaleY);
                ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
            });

            let g1 = lbfData.grabbers[0]; let g2 = lbfData.grabbers[1];
            let px1 = padX + (g1.x * scaleX); let py1 = (canvas.height - padY) - (g1.y * scaleY);
            let px2 = padX + (g2.x * scaleX); let py2 = (canvas.height - padY) - (g2.y * scaleY);

            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
            if (px1 !== px2) {
                let mPixel = (py2 - py1) / (px2 - px1);
                let bPixel = py1 - mPixel * px1;
                ctx.beginPath();
                ctx.moveTo(padX, mPixel * padX + bPixel);
                ctx.lineTo(canvas.width - 20, mPixel * (canvas.width - 20) + bPixel);
                ctx.stroke();
            }

            lbfData.grabbers.forEach((g) => {
                let px = padX + (g.x * scaleX);
                let py = (canvas.height - padY) - (g.y * scaleY);
                ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
                ctx.fillText(`(${Math.round(g.x)}, ${Math.round(g.y)})`, px + 12, py - 12);
            });
        };

        let draggingIdx = -1;

        const getDragIndex = (mx, my) => {
            let idx = -1;
            lbfData.grabbers.forEach((g, i) => {
                let px = lbfData.chartOpts.padX + (g.x * lbfData.chartOpts.scaleX);
                let py = (canvas.height - lbfData.chartOpts.padY) - (g.y * lbfData.chartOpts.scaleY);
                if (Math.hypot(mx - px, my - py) < 30) idx = i;
            });
            return idx;
        };

        const updateDrag = (mx, my) => {
            if (draggingIdx === -1) return;
            let newX = (mx - lbfData.chartOpts.padX) / lbfData.chartOpts.scaleX;
            let newY = ((canvas.height - lbfData.chartOpts.padY) - my) / lbfData.chartOpts.scaleY;
            
            if (newX < 0) newX = 0; if (newX > lbfData.chartOpts.maxX) newX = lbfData.chartOpts.maxX;
            if (newY < 0) newY = 0; if (newY > lbfData.chartOpts.maxY) newY = lbfData.chartOpts.maxY;
            
            // NEW: Lock the first grabber strictly to the Y-axis
            if (draggingIdx === 0) newX = 0;

            lbfData.grabbers[draggingIdx] = { x: newX, y: newY };
            window.drawLbfInteractive();
        };

        canvas.onmousedown = (e) => {
            if(currentStep > 1) return;
            const rect = canvas.getBoundingClientRect();
            draggingIdx = getDragIndex(e.clientX - rect.left, e.clientY - rect.top);
        };
        canvas.onmousemove = (e) => {
            if (draggingIdx !== -1) {
                const rect = canvas.getBoundingClientRect();
                updateDrag(e.clientX - rect.left, e.clientY - rect.top);
            }
        };
        canvas.onmouseup = () => draggingIdx = -1;
        canvas.onmouseleave = () => draggingIdx = -1;

        canvas.ontouchstart = (e) => {
            if(currentStep > 1) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            draggingIdx = getDragIndex(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        };
        canvas.ontouchmove = (e) => {
            if (draggingIdx !== -1) {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                updateDrag(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
            }
        };
        canvas.ontouchend = () => draggingIdx = -1;

        window.drawLbfInteractive();
    }

    // Fraction parser for math inputs
    function parseMathString(str) {
        if (!str) return NaN;
        str = str.trim();
        if (str.includes('/')) {
            const parts = str.split('/');
            return parts.length === 2 ? parseFloat(parts[0]) / parseFloat(parts[1]) : NaN;
        }
        return parseFloat(str);
    }

    window.showLbfHint = function(msg) {
        const hintBox = document.getElementById('lbf-hint');
        if (!hintBox) return;
        hintBox.style.display = 'block';
        hintBox.innerHTML = `<strong>Need a hint?</strong><br>${msg}`;
    };

    window.checkLbfStep = function() {
        let isCorrect = false;

        if (currentStep === 1) {
            const elM = document.getElementById('lbf-ans-m');
            const elB = document.getElementById('lbf-ans-b');
            if (!elM || !elB) return;
            
            const uM = parseMathString(elM.value);
            const uB = parseMathString(elB.value);

            if (isNaN(uM) || isNaN(uB)) {
                showLbfFlash("Enter numbers or fractions!", "error");
                return;
            }

            let gx1 = Math.round(lbfData.grabbers[0].x);
            let gy1 = Math.round(lbfData.grabbers[0].y);
            let gx2 = Math.round(lbfData.grabbers[1].x);
            let gy2 = Math.round(lbfData.grabbers[1].y);

            if (gx1 === gx2) {
                showLbfFlash("Line cannot be vertical!", "error");
                return;
            }

            let userLineM = (gy2 - gy1) / (gx2 - gx1);
            let userLineB = gy1; // Since gx1 is locked to 0, gy1 is explicitly 'b'!

            let fitErrorM = Math.abs(userLineM - lbfData.m);
            let fitErrorB = Math.abs(userLineB - lbfData.b);
            let isGoodFit = (fitErrorM <= Math.abs(lbfData.m * 0.75) + 0.5) && (fitErrorB <= lbfData.b * 0.5 + 10);

            if (!isGoodFit) {
                showLbfFlash("Fit error!", "error");
                showLbfHint("Your line doesn't seem to follow the data trend. Drag the blue points to match the scatter plot before doing the math.");
                return; 
            }

            if (Math.abs(uM - userLineM) <= 0.25 && Math.abs(uB - userLineB) <= 2) {
                isCorrect = true;
                elM.style.backgroundColor = "#dcfce7"; elM.style.borderColor = "#22c55e";
                elB.style.backgroundColor = "#dcfce7"; elB.style.borderColor = "#22c55e";
                lbfData.acceptedM = uM;
                lbfData.acceptedB = uB;
                lbfData.predictY = (uM * lbfData.predictX) + uB;
            } else {
                showLbfFlash("Math error!", "error");
                showLbfHint(`Calculate the slope using your two points: <br><span style="font-family: monospace;">(${gy2} - ${gy1}) / (${gx2} - 0)</span>`);
                elM.style.backgroundColor = "#fee2e2"; elM.style.borderColor = "#ef4444";
                elB.style.backgroundColor = "#fee2e2"; elB.style.borderColor = "#ef4444";
            }
        } 
        else if (currentStep === 2) {
            const elPred = document.getElementById('lbf-ans-pred');
            if (!elPred) return;
            const uPred = parseMathString(elPred.value);
            
            if (!isNaN(uPred) && Math.abs(uPred - lbfData.predictY) < 1.0) isCorrect = true;
            else { 
                elPred.style.backgroundColor = "#fee2e2"; elPred.style.borderColor = "#ef4444"; 
                showLbfHint(`Plug ${lbfData.predictX} into your equation: <strong>y = ${lbfData.acceptedM}(${lbfData.predictX}) + ${lbfData.acceptedB}</strong>`);
            }
        } 
        else if (currentStep === 3) {
            const elInt = document.getElementById('lbf-ans-int');
            if (!elInt) return;
            if (elInt.value === 'correct') isCorrect = true;
            else { 
                elInt.style.backgroundColor = "#fee2e2"; elInt.style.borderColor = "#ef4444"; 
                showLbfHint(`The y-intercept happens when the x-axis value (${lbfData.xLabel.toLowerCase()}) is exactly 0.`);
            }
        }

        if (isCorrect) {
            document.getElementById('lbf-hint').style.display = 'none';
            if (currentStep < 3) {
                currentStep++;
                renderLbfUI(); 
            } else {
                document.getElementById('lbf-check-btn').disabled = true;
                showLbfFlash("Correct!", "success");
                if (errorCount === 0) sessionCorrectFirstTry++;
                lbfRound++;
                setTimeout(() => {
                    if (lbfRound > totalLbfRounds) finishLbfGame();
                    else startLbfRound();
                }, 1200);
            }
        } else {
            errorCount++;
        }
    };

    function finishLbfGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        if (!qContent) return;
        qContent.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;"><div style="font-size:60px;">📈</div><h2 style="color:#1e293b; margin:10px 0;">Predictions Mastered!</h2></div>`;

        let mainAdjustment = 0;
        if (sessionCorrectFirstTry >= totalLbfRounds) mainAdjustment = 1;
        if (mainAdjustment !== 0 && window.supabaseClient && window.currentUser) {
            const currentMain = window.userMastery?.['LineOfBestFit'] || 0;
            const newMain = Math.max(0, Math.min(10, currentMain + mainAdjustment));
            window.userMastery['LineOfBestFit'] = newMain;
            const hour = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment8').update({ 'LineOfBestFit': newMain }).eq('userName', window.currentUser).eq('hour', hour);
        }
        setTimeout(() => { if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); else location.reload(); }, 2000);
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