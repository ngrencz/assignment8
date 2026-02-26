/**
 * skill_scatterplot.js
 * - Primary skill for 7.1.3
 * - Generates clear scatterplots (Positive, Negative, No Association).
 * - Matches the visual style of 8th-grade worksheets (Axis arrows, clear labels).
 * - Uses .then() for background Supabase syncing.
 */

console.log("🚀 skill_scatterplot.js is LIVE - Scatterplot Associations");

(function() {
    let spData = {};
    let spRound = 1;
    const totalSpRounds = 3;
    let sessionCorrectFirstTry = 0;

    const scenarios = [
        // Negative Associations
        {
            xLabel: "Average Number of Hours Watching TV per Day", yLabel: "Grade Point Average", type: "negative",
            descCorrect: "As TV hours increase, Grade Point Average tends to decrease.",
            descWrong1: "As TV hours increase, Grade Point Average tends to increase.",
            descWrong2: "There is no connection between TV hours and Grade Point Average."
        },
        {
            xLabel: "Outside Temperature (°F)", yLabel: "Hot Chocolate Sales", type: "negative",
            descCorrect: "As temperature increases, hot chocolate sales tend to decrease.",
            descWrong1: "As temperature increases, hot chocolate sales tend to increase.",
            descWrong2: "There is no connection between temperature and hot chocolate sales."
        },
        // Positive Associations
        {
            xLabel: "Age (Years)", yLabel: "Number of Gray Hairs on One's Head", type: "positive",
            descCorrect: "As age increases, the number of gray hairs tends to increase.",
            descWrong1: "As age increases, the number of gray hairs tends to decrease.",
            descWrong2: "There is no connection between age and the number of gray hairs."
        },
        {
            xLabel: "Hours Studied", yLabel: "Math Test Score", type: "positive",
            descCorrect: "As hours studied increase, test scores tend to increase.",
            descWrong1: "As hours studied increase, test scores tend to decrease.",
            descWrong2: "There is no connection between hours studied and test scores."
        },
        // No Associations
        {
            xLabel: "Length of Hair", yLabel: "Shoe Size", type: "none",
            descCorrect: "There is no connection between hair length and shoe size.",
            descWrong1: "As hair length increases, shoe size tends to increase.",
            descWrong2: "As hair length increases, shoe size tends to decrease."
        },
        {
            xLabel: "Month of Birth", yLabel: "Height (inches)", type: "none",
            descCorrect: "There is no connection between birth month and height.",
            descWrong1: "As the birth month increases, height tends to increase.",
            descWrong2: "As the birth month increases, height tends to decrease."
        }
    ];

    window.initScatterplotGame = async function() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        spRound = 1;
        sessionCorrectFirstTry = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const currentHour = sessionStorage.getItem('target_hour') || "00";
                const { data, error } = await window.supabaseClient
                    .from('assignment')
                    .select('Scatterplot')
                    .eq('userName', window.currentUser)
                    .eq('hour', currentHour)
                    .maybeSingle();
                
                if (error) console.error("[Scatterplot] Fetch error:", error);
                if (data) window.userMastery.Scatterplot = data.Scatterplot || 0;
            }
        } catch (e) { 
            console.error("[Scatterplot] Init error:", e); 
        }
        
        startSpRound();
    };

    function startSpRound() {
        generateSpProblem();
        renderSpUI();
    }

    function generateSpProblem() {
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        let points = [];
        const numPoints = 15; // Fixed number for consistent density

        for (let i = 0; i < numPoints; i++) {
            // Spread X values evenly to ensure the plot covers the graph
            let x = (i / numPoints) * 80 + 10; 
            let y;
            
            if (scenario.type === 'positive') {
                y = x + (Math.random() * 30 - 15); 
            } else if (scenario.type === 'negative') {
                y = (100 - x) + (Math.random() * 30 - 15); 
            } else {
                x = Math.random() * 80 + 10; // Randomize X fully for 'none'
                y = Math.random() * 80 + 10; 
            }
            
            y = Math.max(10, Math.min(90, y));
            points.push({ x, y });
        }

        let sentences = [
            { text: scenario.descCorrect, isCorrect: true },
            { text: scenario.descWrong1, isCorrect: false },
            { text: scenario.descWrong2, isCorrect: false }
        ].sort(() => 0.5 - Math.random());

        spData = { ...scenario, points: points, sentences: sentences };
    }

    function renderSpUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Scatterplot Associations (Round ${spRound}/${totalSpRounds})`;

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; background:#f8fafc; padding:25px; border-radius:12px; border:1px solid #e2e8f0;">
                
                <p style="font-size: 16px; color: #1e293b; line-height: 1.5; margin-bottom: 20px;">
                    Determine if there is an association between the points. Label the graph as showing a positive association, negative association, or no association, and select the sentence that best describes it.
                </p>

                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center;">
                    <canvas id="spCanvas" width="300" height="300" style="max-width:100%;"></canvas>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    <div style="margin-bottom: 20px;">
                        <strong style="font-size: 16px;">1. Type of Association:</strong><br>
                        <select id="sp-ans-type" style="margin-top: 10px; width: 100%; height:40px; padding: 0 10px; font-size:16px; border:2px solid #3b82f6; border-radius:6px; outline:none; background: white; cursor: pointer;">
                            <option value="none">-- Select Association --</option>
                            <option value="positive">Positive Association</option>
                            <option value="negative">Negative Association</option>
                            <option value="none_assoc">No Association</option>
                        </select>
                    </div>

                    <div style="font-size: 16px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                        <strong>2. Description:</strong><br>
                        <select id="sp-ans-desc" style="margin-top: 10px; width: 100%; height:40px; padding: 0 10px; font-size:14px; border:2px solid #3b82f6; border-radius:6px; outline:none; background: white; cursor: pointer;">
                            <option value="none">-- Select the best description --</option>
                            ${spData.sentences.map((s, i) => `<option value="${s.isCorrect ? 'correct' : 'wrong' + i}">${s.text}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button onclick="checkScatterplot()" id="sp-check-btn" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size: 18px; transition: background 0.2s;">CHECK ANSWERS</button>
            </div>
            <div id="sp-flash" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; z-index:100;"></div>
        `;

        setTimeout(drawScatterplot, 50);
    }

    function drawScatterplot() {
        const canvas = document.getElementById('spCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const width = canvas.width;
        const height = canvas.height;
        const padX = 50; 
        const padY = 50; 
        const chartW = width - padX - 20;
        const chartH = height - padY - 20;

        ctx.clearRect(0, 0, width, height);

        // Draw Axes with Arrows
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        ctx.moveTo(padX, height - padY); ctx.lineTo(padX, 20); // Y-axis
        ctx.lineTo(padX - 5, 30); ctx.moveTo(padX, 20); ctx.lineTo(padX + 5, 30); // Y-arrow
        
        ctx.moveTo(padX, height - padY); ctx.lineTo(width - 20, height - padY); // X-axis
        ctx.lineTo(width - 30, height - padY - 5); ctx.moveTo(width - 20, height - padY); ctx.lineTo(width - 30, height - padY + 5); // X-arrow
        ctx.stroke();

        // Axis Labels
        ctx.fillStyle = '#0f172a';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(spData.xLabel, padX + chartW / 2, height - padY + 15);

        ctx.save();
        ctx.translate(padX - 15, height - padY - chartH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(spData.yLabel, 0, 0);
        ctx.restore();

        // Draw Points
        ctx.fillStyle = '#0f172a';
        spData.points.forEach(p => {
            let px = padX + (p.x / 100) * chartW;
            let py = (height - padY) - (p.y / 100) * chartH;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    window.checkScatterplot = function() {
        const elType = document.getElementById('sp-ans-type');
        const elDesc = document.getElementById('sp-ans-desc');

        if (!elType || !elDesc) return;

        const uType = elType.value;
        const uDesc = elDesc.value;
        let allCorrect = true;

        const mappedType = spData.type === 'none' ? 'none_assoc' : spData.type;
        if (uType === mappedType) {
            elType.style.backgroundColor = "#dcfce7"; elType.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            elType.style.backgroundColor = "#fee2e2"; elType.style.borderColor = "#ef4444";
        }

        if (uDesc === 'correct') {
            elDesc.style.backgroundColor = "#dcfce7"; elDesc.style.borderColor = "#22c55e";
        } else {
            allCorrect = false;
            elDesc.style.backgroundColor = "#fee2e2"; elDesc.style.borderColor = "#ef4444";
        }

        if (uType === 'none' || uDesc === 'none') allCorrect = false; 

        if (allCorrect) {
            document.getElementById('sp-check-btn').disabled = true;
            showSpFlash("Correct!", "success");
            sessionCorrectFirstTry++;

            spRound++;
            setTimeout(() => {
                if (spRound > totalSpRounds) finishSpGame();
                else startSpRound();
            }, 1200);
        } else {
            showSpFlash("Review your selections.", "error");
        }
    };

    function finishSpGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        if (!qContent) return;
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px;">📈</div>
                <h2 style="color:#1e293b; margin:10px 0;">Associations Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Skills updated.</p>
            </div>
        `;

        let mainAdjustment = 0;
        if (sessionCorrectFirstTry >= totalSpRounds) mainAdjustment = 1;

        if (mainAdjustment !== 0) {
            const currentMain = window.userMastery?.['Scatterplot'] || 0;
            const newMain = Math.max(0, Math.min(10, currentMain + mainAdjustment));
            window.userMastery['Scatterplot'] = newMain;

            if (window.supabaseClient && window.currentUser) {
                const hour = sessionStorage.getItem('target_hour') || "00";
                window.supabaseClient.from('assignment')
                    .update({ 'Scatterplot': newMain })
                    .eq('userName', window.currentUser)
                    .eq('hour', hour)
                    .then(({ error }) => { if (error) console.error("[Scatterplot] Update Error:", error); });
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

    function showSpFlash(msg, type) {
        const overlay = document.getElementById('sp-flash');
        if (!overlay) return;
        overlay.innerText = msg;
        overlay.style.display = 'block';
        overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        setTimeout(() => { overlay.style.display = 'none'; }, 1500);
    }
})();
