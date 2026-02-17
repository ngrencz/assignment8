
    // 1. Private Variables (Trapped inside this block so they don't conflict)
    let currentBoxData = {};
    let boxErrorCount = 0;
    let boxPlotStep = 0; 
    let boxPlotSessionQuestions = [];

    // 2. Attach the Init function to window so the Hub can call it
    window.initBoxPlotGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        boxErrorCount = 0;
        boxPlotStep = 0;

        // Fetch existing mastery
        try {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('BoxPlot, bp_median, bp_range, bp_quartiles, bp_iqr')
                .eq('userName', window.currentUser)
                .maybeSingle();
            
            window.userMastery = data || {};
        } catch (e) {
            window.userMastery = {};
        }

        // Generate fresh data
        const min = Math.floor(Math.random() * 5) + 2;
        const q1 = min + (Math.floor(Math.random() * 3) + 2);
        const median = q1 + (Math.floor(Math.random() * 4) + 2);
        const q3 = median + (Math.floor(Math.random() * 4) + 2);
        const max = q3 + (Math.floor(Math.random() * 5) + 3);
        currentBoxData = { min, q1, median, q3, max };

        const pool = [
            { q: "What is the median?", a: currentBoxData.median, hint: "Look for the green line.", col: "bp_median" },
            { q: "What is the Range?", a: currentBoxData.max - currentBoxData.min, hint: "Max - Min", col: "bp_range" },
            { q: "What is the Q1 (Lower Quartile)?", a: currentBoxData.q1, hint: "Left edge of the box.", col: "bp_quartiles" },
            { q: "What is the IQR?", a: currentBoxData.q3 - currentBoxData.q1, hint: "Box width (Q3 - Q1)", col: "bp_iqr" }
        ];

        boxPlotSessionQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
        renderBoxUI();
    };

    function renderBoxUI() {
        const current = boxPlotSessionQuestions[boxPlotStep];
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Box Plot Mastery (${boxPlotStep + 1}/3)`;
        qContent.innerHTML = `
            <div style="text-align:center; background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                <canvas id="boxCanvas" width="400" height="160" style="max-width:100%;"></canvas>
            </div>
            <div class="card">
                <p style="font-size: 1.1rem; margin-bottom: 15px;"><strong>Question:</strong> ${current.q}</p>
                <input type="number" id="box-ans" class="math-input" style="width: 100px; padding: 10px; margin-right: 10px;">
                <button onclick="checkStep()" class="primary-btn">Submit Answer</button>
                <div id="feedback-box" style="margin-top: 15px; display: none; padding: 10px; border-radius: 6px;"></div>
            </div>
        `;
        setTimeout(drawBoxPlot, 50); 
    }

    function drawBoxPlot() {
        const canvas = document.getElementById('boxCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const maxVal = 40;
        const scale = chartWidth / maxVal;
        const y = 65;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = "#94a3b8"; 
        ctx.fillStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.font = "10px Arial";
        ctx.textAlign = "center";

        ctx.beginPath();
        ctx.moveTo(padding, y + 50);
        ctx.lineTo(padding + chartWidth, y + 50);
        ctx.stroke();

        for (let i = 0; i <= maxVal; i += 5) {
            let xPos = padding + (i * scale);
            ctx.beginPath();
            ctx.moveTo(xPos, y + 50);
            ctx.lineTo(xPos, y + 55);
            ctx.stroke();
            ctx.fillText(i, xPos, y + 68);
        }

        const pts = {
            min: padding + currentBoxData.min * scale,
            q1: padding + currentBoxData.q1 * scale,
            med: padding + currentBoxData.median * scale,
            q3: padding + currentBoxData.q3 * scale,
            max: padding + currentBoxData.max * scale
        };

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Arial";
        ctx.fillText(currentBoxData.min, pts.min, y - 40);
        ctx.fillText(currentBoxData.q1, pts.q1, y - 40);
        ctx.fillText(currentBoxData.median, pts.med, y - 40);
        ctx.fillText(currentBoxData.q3, pts.q3, y - 40);
        ctx.fillText(currentBoxData.max, pts.max, y - 40);

        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts.min, y); ctx.lineTo(pts.q1, y);
        ctx.moveTo(pts.min, y - 10); ctx.lineTo(pts.min, y + 10);
        ctx.moveTo(pts.q3, y); ctx.lineTo(pts.max, y);
        ctx.moveTo(pts.max, y - 10); ctx.lineTo(pts.max, y + 10);
        ctx.stroke();

        ctx.fillStyle = "#f0fdf4";
        const boxWidth = pts.q3 - pts.q1;
        ctx.fillRect(pts.q1, y - 25, boxWidth, 50);
        ctx.strokeRect(pts.q1, y - 25, boxWidth, 50);
        
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pts.med, y - 25);
        ctx.lineTo(pts.med, y + 25);
        ctx.stroke();
    }

    // 3. Attach the Check function to window so the button can see it
    window.checkStep = async function() {
        const userAns = parseInt(document.getElementById('box-ans').value);
        const current = boxPlotSessionQuestions[boxPlotStep];
        const feedback = document.getElementById('feedback-box');
        
        if (isNaN(userAns)) return;
        feedback.style.display = "block";

        if (userAns === current.a) {
            feedback.className = "correct";
            feedback.innerText = "✅ Correct!";

            let adjustment = (boxErrorCount === 0) ? 1 : 0; 
            const updateObj = {};
            
            updateObj[current.col] = Math.min(10, (window.userMastery?.[current.col] || 0) + adjustment);
            let currentMain = window.userMastery?.['BoxPlot'] || 0;
            updateObj['BoxPlot'] = Math.max(0, Math.min(10, currentMain + adjustment));

            await window.supabaseClient
                .from('assignment')
                .update(updateObj)
                .eq('userName', window.currentUser);

            if (!window.userMastery) window.userMastery = {};
            window.userMastery[current.col] = updateObj[current.col];
            window.userMastery['BoxPlot'] = updateObj['BoxPlot'];

            boxPlotStep++;
            boxErrorCount = 0;

            if (boxPlotStep >= boxPlotSessionQuestions.length) {
                window.isCurrentQActive = false; 
                feedback.innerText = "✅ Box Plot Set Complete!";
                setTimeout(loadNextQuestion, 1500);
            } else {
                setTimeout(renderBoxUI, 1000);
            }
        } else {
            boxErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = `❌ Not quite. Hint: ${current.hint}`;
        }
    };

