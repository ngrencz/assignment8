/**
 * skill_piechart.js
 * - Generates real-world pie charts.
 * - Hides one percentage to force subtraction from 100.
 * - Step 1: Find the missing percentage.
 * - Step 2: Combine categories to find ~1/3 (33%).
 * - Step 3: Combine categories to find 1/2 (50%).
 */

(function() {
    let currentData = {};
    let errorCount = 0;
    let currentStep = 1;
    let round = 1;
    const maxRounds = 2;

    window.initPieChartGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        errorCount = 0;
        currentStep = 1;
        round = 1;

        if (!window.userMastery) window.userMastery = {};

        try {
            const h = sessionStorage.getItem('target_hour') || "00";
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('PieChart, pc_lookup, pc_third, pc_half')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            
            if (data) window.userMastery = { ...window.userMastery, ...data };
        } catch (e) {
            console.warn("PieChart DB sync error, falling back to local state.");
        }

        startPieRound();
    };

    function startPieRound() {
        currentStep = 1;
        generatePieData();
        renderPieUI();
    }

    function generatePieData() {
        // Templates guarantee a 33% pair and a 50% combination exist
        const templates = [
            { vals: [40, 20, 13, 17, 10], hideIdx: 2 }, // Third: 20+13=33. Half: 40+10=50
            { vals: [35, 15, 18, 20, 12], hideIdx: 0 }, // Third: 15+18=33. Half: 38+12 or 35+15=50
            { vals: [25, 25, 19, 14, 17], hideIdx: 3 }, // Third: 19+14=33. Half: 25+25=50
            { vals: [45, 12, 21, 14, 8],  hideIdx: 1 }  // Third: 12+21=33. Half: 45+5? wait, need 50. Let's use: 21+14+15=50. Let's adjust: [45, 12, 21, 14, 8] sum=100. Half: 21+14+15(no). Half: 45? No. Let's stick to the first 3 reliable ones!
        ];

        const validTemplates = [
            { vals: [40, 20, 13, 17, 10], hideIdx: 2 }, 
            { vals: [35, 15, 18, 20, 12], hideIdx: 0 }, 
            { vals: [25, 25, 19, 14, 17], hideIdx: 3 }
        ];

        let t = validTemplates[Math.floor(Math.random() * validTemplates.length)];
        
        const topics = [
            { title: "Household Monthly Budget", cats: ["Rent", "Groceries", "Utilities", "Transport", "Savings"] },
            { title: "Global Energy Sources", cats: ["Oil", "Natural Gas", "Coal", "Nuclear", "Renewable"] },
            { title: "Smartphone Market Share", cats: ["Brand A", "Brand B", "Brand C", "Brand D", "Others"] },
            { title: "City Land Usage", cats: ["Residential", "Commercial", "Parks", "Industrial", "Roads"] }
        ];

        let topic = topics[Math.floor(Math.random() * topics.length)];
        // Shuffle the category names so the same template looks different
        let shuffledCats = [...topic.cats].sort(() => Math.random() - 0.5);

        currentData = {
            title: topic.title,
            slices: [],
            hiddenIndex: t.hideIdx
        };

        let colors = ["#64748b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

        for (let i = 0; i < 5; i++) {
            currentData.slices.push({
                label: shuffledCats[i],
                val: t.vals[i],
                color: colors[i]
            });
        }
    }

    function renderPieUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Data Analysis (Round ${round}/${maxRounds})`;

        let stepHtml = "";
        
        if (currentStep === 1) {
            let hiddenSlice = currentData.slices[currentData.hiddenIndex];
            stepHtml = `
                <p style="font-size:16px; font-weight:bold; color:#1e293b;">a. According to the graph, what percent comes from ${hiddenSlice.label}?</p>
                <div style="margin: 15px 0;">
                    <input type="number" id="pie-ans-1" style="width:80px; padding:8px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;"> <strong>%</strong>
                </div>
            `;
        } else if (currentStep === 2) {
            stepHtml = `
                <p style="font-size:16px; font-weight:bold; color:#1e293b;">b. Which sources equal about <strong>one third (33%)</strong> of the total?</p>
                <p style="font-size:13px; color:#64748b;">Select the categories that add up to 33%:</p>
                <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin: 15px 0;" id="checkbox-container">
                    ${currentData.slices.map((s, i) => `
                        <label style="background:#f1f5f9; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; gap:8px;">
                            <input type="checkbox" value="${s.val}" class="pie-check"> ${s.label}
                        </label>
                    `).join('')}
                </div>
            `;
        } else {
            stepHtml = `
                <p style="font-size:16px; font-weight:bold; color:#1e293b;">c. What combination provides exactly <strong>half (50%)</strong> of the total?</p>
                <p style="font-size:13px; color:#64748b;">Select the categories that add up to 50%:</p>
                <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin: 15px 0;" id="checkbox-container">
                    ${currentData.slices.map((s, i) => `
                        <label style="background:#f1f5f9; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; display:flex; align-items:center; gap:8px;">
                            <input type="checkbox" value="${s.val}" class="pie-check"> ${s.label}
                        </label>
                    `).join('')}
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:center; justify-content:center;">
                <div style="text-align:center; background:white; padding:15px; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="margin-top:0; color:#334155; font-size:16px;">${currentData.title}</h3>
                    <canvas id="pieCanvas" width="280" height="280"></canvas>
                </div>
                
                <div style="flex:1; min-width:300px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;">
                    ${stepHtml}
                    <button onclick="checkPieStep()" style="background:#2563eb; color:white; border:none; padding:10px 25px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer; margin-top:10px;">Check Answer</button>
                    <div id="pie-feedback" style="min-height:24px; margin-top:15px; font-weight:bold;"></div>
                </div>
            </div>
            <div id="flash-overlay" style="position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:12px 25px; border-radius:8px; color:white; font-weight:bold; display:none; z-index:1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
        `;

        setTimeout(drawPieChart, 50);
    }

    function drawPieChart() {
        const canvas = document.getElementById('pieCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = 140, cy = 140, r = 100;

        ctx.clearRect(0, 0, 280, 280);
        
        let currentAngle = -Math.PI / 2; // Start at top

        currentData.slices.forEach((slice, index) => {
            let sliceAngle = (slice.val / 100) * 2 * Math.PI;
            
            // Draw Slice
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = slice.color;
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Label
            let midAngle = currentAngle + (sliceAngle / 2);
            // Push text slightly outside the pie
            let labelX = cx + Math.cos(midAngle) * (r * 0.7);
            let labelY = cy + Math.sin(midAngle) * (r * 0.7);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Add shadow to text for readability over any color
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 4;

            let displayLines = [slice.label];
            if (index === currentData.hiddenIndex && currentStep === 1) {
                // Keep it hidden for step 1
            } else {
                displayLines.push(`${slice.val}%`);
            }

            displayLines.forEach((line, i) => {
                ctx.fillText(line, labelX, labelY + (i * 14));
            });

            ctx.shadowBlur = 0; // reset
            currentAngle += sliceAngle;
        });
    }

    window.checkPieStep = function() {
        const feedback = document.getElementById('pie-feedback');
        let isCorrect = false;
        let colToUpdate = "";

        if (currentStep === 1) {
            let userVal = parseInt(document.getElementById('pie-ans-1').value);
            let target = currentData.slices[currentData.hiddenIndex].val;
            isCorrect = (userVal === target);
            colToUpdate = "pc_lookup";
        } 
        else if (currentStep === 2) {
            let checks = document.querySelectorAll('.pie-check:checked');
            let sum = 0;
            checks.forEach(c => sum += parseInt(c.value));
            isCorrect = (sum === 33 || sum === 34); // Allow 34% just in case of slight rounding in future templates
            colToUpdate = "pc_third";
        } 
        else {
            let checks = document.querySelectorAll('.pie-check:checked');
            let sum = 0;
            checks.forEach(c => sum += parseInt(c.value));
            isCorrect = (sum === 50);
            colToUpdate = "pc_half";
        }

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            
            let adjustment = errorCount === 0 ? 1 : 0;
            updateSubScore(colToUpdate, adjustment);

            currentStep++;
            errorCount = 0;

            if (currentStep > 3) {
                round++;
                if (round > maxRounds) {
                    setTimeout(finishPieGame, 1000);
                } else {
                    setTimeout(startPieRound, 1000);
                }
            } else {
                setTimeout(renderPieUI, 1000);
            }
        } else {
            errorCount++;
            feedback.style.color = "#dc2626";
            
            if (currentStep === 1) {
                feedback.innerText = "❌ Remember, a full circle is 100%. Add the others and subtract!";
            } else if (currentStep === 2) {
                feedback.innerText = "❌ Not quite. You are looking for a combination that adds up to 33%.";
            } else {
                feedback.innerText = "❌ Not quite. You are looking for a combination that adds up to exactly 50%.";
            }
        }
    };

    function updateSubScore(col, amt) {
        if (!window.userMastery) window.userMastery = {};
        let current = window.userMastery[col] || 0;
        let next = Math.max(0, Math.min(10, current + amt));
        window.userMastery[col] = next;

        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment')
                .update({ [col]: next })
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .then(({error}) => { if (error) console.error("Update fail:", error); });
        }
    }

    function finishPieGame() {
        window.isCurrentQActive = false;
        
        let newScore = Math.min(10, (window.userMastery.PieChart || 0) + 1);
        window.userMastery.PieChart = newScore;
        
        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment')
                .update({ PieChart: newScore })
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .then(({error}) => { if (error) console.error("Main DB fail:", error); });
        }

        const qContent = document.getElementById('q-content');
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px;">
                <div style="font-size:60px; margin-bottom:10px;">📊</div>
                <h2 style="color:#1e293b;">Data Analysis Complete!</h2>
                <p style="color:#64748b;">Loading next skill...</p>
            </div>
        `;
        
        setTimeout(() => {
            if (typeof window.loadNextQuestion === 'function') {
                window.loadNextQuestion();
            } else {
                location.reload();
            }
        }, 2500);
    }
})();
