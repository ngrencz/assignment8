/**
 * skill_boxplot.js - Full Integrated Version (RESTORED LABELS)
 * Handles: Median, Mean, Range, Q1, and IQR
 * UPDATED: Targeted sub-skill weighting & .then() Supabase fixes.
 */

(function() {
    // 1. Private Variables
    let currentBoxData = {};
    let currentDataset = []; // Sorted (Math)
    let displayDataset = []; // Shuffled (Display)
    let boxErrorCount = 0;
    let boxPlotStep = 0; 
    let boxPlotSessionQuestions = [];
    let sessionCorrectFirstTry = 0; 

    // 2. Init Function
    window.initBoxPlotGame = async function() {
        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        boxErrorCount = 0;
        boxPlotStep = 0;
        sessionCorrectFirstTry = 0;

        // --- HUB FIX: Ensure mastery object exists safely ---
        if (!window.userMastery) window.userMastery = {};

        try {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('BoxPlot, bp_median, bp_mean, bp_range, bp_quartiles, bp_iqr')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            // --- HUB FIX: Safely merge data instead of overwriting ---
            if (data) {
                window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("BoxPlot DB sync error, falling back to local state.");
        }

        generateSkewedDataset();

        // --- TARGETED QUESTION POOL ---
        const fullPool = [
            { q: "What is the Median?", a: currentBoxData.median, hint: "Order the numbers first! Find the middle one.", col: "bp_median" },
            { q: "What is the Mean? (Round to 1 decimal)", a: currentBoxData.mean, hint: "Sum ÷ 11. Round to 1 decimal place.", col: "bp_mean" },
            { q: "What is the Range?", a: currentBoxData.max - currentBoxData.min, hint: "Highest Number - Lowest Number", col: "bp_range" },
            { q: "What is Q1 (Lower Quartile)?", a: currentBoxData.q1, hint: "The median of the lower half.", col: "bp_quartiles" },
            { q: "What is the IQR?", a: currentBoxData.q3 - currentBoxData.q1, hint: "Q3 - Q1 (The width of the box).", col: "bp_iqr" }
        ];

        let weightedBag = [];
        fullPool.forEach(item => {
            let score = window.userMastery[item.col] || 0;
            // Mastery 0-3: 4 entries | 4-7: 2 entries | 8-10: 1 entry
            let weight = score <= 3 ? 4 : (score <= 7 ? 2 : 1);
            for (let i = 0; i < weight; i++) {
                weightedBag.push(item);
            }
        });

        boxPlotSessionQuestions = [];
        while (boxPlotSessionQuestions.length < 3) {
            let randomIndex = Math.floor(Math.random() * weightedBag.length);
            let selected = weightedBag[randomIndex];
            // Ensure no duplicates in the current session
            if (!boxPlotSessionQuestions.some(q => q.col === selected.col)) {
                boxPlotSessionQuestions.push(selected);
            }
        }

        renderBoxUI();
    };

    function generateSkewedDataset() {
        let attempts = 0;
        let valid = false;

        while (!valid && attempts < 50) {
            let arr = [];
            const skewFactor = (Math.random() * 2) + 0.5; 

            for(let i=0; i<11; i++) {
                let rand = Math.pow(Math.random(), skewFactor);
                let val = Math.floor(rand * 36) + 2;
                arr.push(val);
            }
            
            displayDataset = [...arr].sort(() => 0.5 - Math.random());
            arr.sort((a, b) => a - b);

            const min = arr[0];
            const q1 = arr[2];
            const median = arr[5]; 
            const q3 = arr[8];
            const max = arr[10];
            const sum = arr.reduce((a, b) => a + b, 0);
            const mean = Math.round((sum / 11) * 10) / 10;

            if (q3 > q1 && median > min && max > median) {
                currentDataset = arr; 
                currentBoxData = { min, q1, median, q3, max, mean };
                valid = true;
            }
            attempts++;
        }
    }

    function renderBoxUI() {
        const current = boxPlotSessionQuestions[boxPlotStep];
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        const titleElem = document.getElementById('q-title');
        if (titleElem) titleElem.innerText = `Box Plot Mastery (${boxPlotStep + 1}/3)`;
        
        const dataString = displayDataset.join(', ');

        qContent.innerHTML = `
            <div style="text-align:center; margin-bottom: 20px;">
                <p style="margin-bottom:5px; color:#64748b; font-size:0.9rem; font-weight:bold;">DATA SET (Random Order):</p>
                <div style="font-family: 'Courier New', monospace; font-size: 1.25rem; background: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; letter-spacing: 1px; display:inline-block; max-width: 90%;">
                    { ${dataString} }
                </div>
            </div>

            <div style="text-align:center; background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                <canvas id="boxCanvas" width="400" height="120" style="max-width:100%;"></canvas>
            </div>
            
            <div class="card">
                <p style="font-size: 1.1rem; margin-bottom: 15px;"><strong>Question:</strong> ${current.q}</p>
                <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
                    <input type="number" id="box-ans" step="0.1" class="math-input" placeholder="?" style="width: 100px; padding: 10px;">
                    <button onclick="checkStep()" class="primary-btn">Submit</button>
                </div>
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
        const y = 60; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Number Line
        ctx.strokeStyle = "#94a3b8"; 
        ctx.fillStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.font = "10px Arial";
        ctx.textAlign = "center";

        ctx.beginPath();
        ctx.moveTo(padding, y + 40);
        ctx.lineTo(padding + chartWidth, y + 40);
        ctx.stroke();

        for (let i = 0; i <= maxVal; i += 5) {
            let xPos = padding + (i * scale);
            ctx.beginPath();
            ctx.moveTo(xPos, y + 40);
            ctx.lineTo(xPos, y + 45);
            ctx.stroke();
            ctx.fillText(i, xPos, y + 58);
        }

        const pts = {
            min: padding + currentBoxData.min * scale,
            q1: padding + currentBoxData.q1 * scale,
            med: padding + currentBoxData.median * scale,
            q3: padding + currentBoxData.q3 * scale,
            max: padding + currentBoxData.max * scale
        };

        // --- RESTORED: Draw Stats Text Labels ---
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Arial";
        ctx.fillText(currentBoxData.min, pts.min, y - 35);
        ctx.fillText(currentBoxData.q1, pts.q1, y - 35);
        ctx.fillText(currentBoxData.median, pts.med, y - 35);
        ctx.fillText(currentBoxData.q3, pts.q3, y - 35);
        ctx.fillText(currentBoxData.max, pts.max, y - 35);

        // Whiskers
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts.min, y); ctx.lineTo(pts.q1, y);
        ctx.moveTo(pts.min, y - 10); ctx.lineTo(pts.min, y + 10);
        ctx.moveTo(pts.q3, y); ctx.lineTo(pts.max, y);
        ctx.moveTo(pts.max, y - 10); ctx.lineTo(pts.max, y + 10);
        ctx.stroke();

        // Box
        ctx.fillStyle = "#f0fdf4";
        const boxWidth = pts.q3 - pts.q1;
        ctx.fillRect(pts.q1, y - 20, boxWidth, 40);
        ctx.strokeRect(pts.q1, y - 20, boxWidth, 40);
        
        // Median Line
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pts.med, y - 20);
        ctx.lineTo(pts.med, y + 20);
        ctx.stroke();
    }

    // --- HUB FIX: Removed async to make it non-blocking ---
    window.checkStep = function() {
        const input = document.getElementById('box-ans');
        if(!input) return;
        
        const userAns = parseFloat(input.value);
        const current = boxPlotSessionQuestions[boxPlotStep];
        const feedback = document.getElementById('feedback-box');
        
        if (isNaN(userAns)) return;
        feedback.style.display = "block";

        if (Math.abs(userAns - current.a) < 0.11) {
            feedback.className = "correct";
            feedback.innerText = "✅ Correct!";

            if (boxErrorCount === 0) {
                sessionCorrectFirstTry++;
            }

            let subAdjustment = (boxErrorCount === 0) ? 1 : 0; 
            const updateObj = {};
            
            // --- HUB FIX: Use safe local mastery merge ---
            if (!window.userMastery) window.userMastery = {};
            let currentScore = window.userMastery[current.col] || 0;
            updateObj[current.col] = Math.min(10, currentScore + subAdjustment);
            window.userMastery[current.col] = updateObj[current.col]; // Update instantly

            const currentHour = sessionStorage.getItem('target_hour') || "00";

            // --- HUB FIX: Background DB Sync (using .then) ---
            if (window.supabaseClient && window.currentUser) {
                window.supabaseClient
                    .from('assignment')
                    .update(updateObj)
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .then(({ error }) => {
                        if (error) console.error("Sub-score update failed:", error);
                    });
            }

            boxPlotStep++;
            boxErrorCount = 0;

            if (boxPlotStep >= boxPlotSessionQuestions.length) {
                finishBoxPlotSession();
            } else {
                setTimeout(renderBoxUI, 1000);
            }
        } else {
            boxErrorCount++;
            feedback.className = "incorrect";
            feedback.innerText = `❌ Not quite. Hint: ${current.hint}`;
        }
    };

   function finishBoxPlotSession() {
        window.isCurrentQActive = false;
        const feedback = document.getElementById('feedback-box');
        if(feedback) feedback.innerText = "✅ Box Plot Set Complete!";

        let mainAdjustment = 0;
        if (sessionCorrectFirstTry === 3) mainAdjustment = 1;
        else if (sessionCorrectFirstTry <= 1) mainAdjustment = -1;

        if (mainAdjustment !== 0) {
            const currentMain = window.userMastery?.['BoxPlot'] || 0;
            const newMain = Math.max(0, Math.min(10, currentMain + mainAdjustment));
            const currentHour = sessionStorage.getItem('target_hour') || "00";

            if (window.userMastery) window.userMastery['BoxPlot'] = newMain;

            if (window.supabaseClient && window.currentUser) {
                // Fire and forget using .then
                window.supabaseClient
                    .from('assignment')
                    .update({ 'BoxPlot': newMain })
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .then(({ error }) => {
                        if (error) console.error("Score update failed:", error);
                    });
            }
        }

        // This will now reliably fire after exactly 1.5 seconds
        setTimeout(() => {
            if (typeof window.loadNextQuestion === 'function') {
                window.loadNextQuestion();
            } else {
                location.reload();
            }
        }, 1500);
    }
})();
