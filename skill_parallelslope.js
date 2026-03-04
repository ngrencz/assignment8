/**
 * skill_parallelslope.js
 * - 8th Grade: Slope from Two Points & Parallel Lines (CL 7-122)
 * - Part A: Calculate slope (m) from two given coordinate points.
 * - Part B: Identify the slope of a parallel line.
 * - Features dynamic canvas graphing and robust fractional input parsing.
 */

(function() {
    console.log("🚀 skill_parallelslope.js LIVE (Two-Point Slope & Parallel Lines)");

    var psData = {
        round: 1,
        maxRounds: 4,
        currentPart: 0,
        errorsThisPart: 0,
        scenario: {}
    };

    // Robust parser to handle "1/2", "-3/4", "0.5", etc.
    function parseMath(str) {
        if (!str) return NaN;
        str = str.replace(/\s/g, '');
        if (str.includes('/')) {
            let parts = str.split('/');
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return parseFloat(parts[0]) / parseFloat(parts[1]);
            }
        }
        return parseFloat(str);
    }

    window.initParallelSlopeGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        psData.round = 1;
        psData.currentPart = 0;
        psData.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('ParallelSlope, ps_calc, ps_parallel')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("ParallelSlope DB sync error, continuing locally.");
        }

        startPSRound();
    };

    function startPSRound() {
        psData.currentPart = 0;
        psData.errorsThisPart = 0;
        generatePSProblem();
        renderPSUI();
    }

    function generatePSProblem() {
        // Generate two distinct points between -8 and 8 to fit on a 10x10 grid
        let x1, y1, x2, y2, dx, dy;
        
        do {
            x1 = Math.floor(Math.random() * 17) - 8;
            y1 = Math.floor(Math.random() * 17) - 8;
            x2 = Math.floor(Math.random() * 17) - 8;
            y2 = Math.floor(Math.random() * 17) - 8;
            dx = x2 - x1;
            dy = y2 - y1;
        } while (dx === 0 || (x1 === x2 && y1 === y2)); // Prevent vertical lines and identical points

        let slope = dy / dx;

        // Calculate a nice offset for the parallel line to draw later (make sure it stays somewhat on grid)
        let b1 = y1 - (slope * x1);
        let parallelOffset = b1 > 0 ? -4 : 4; 

        psData.scenario = {
            p1: {x: x1, y: y1},
            p2: {x: x2, y: y2},
            dx: dx,
            dy: dy,
            slope: slope,
            parallelOffset: parallelOffset
        };
    }

    function renderPSUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let s = psData.scenario;
        let part = psData.currentPart;

        let questionHTML = "";
        
        if (part === 0) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold;">
                    <span style="color:#3b82f6;">Part A:</span> Find the slope of the line that passes through the points <strong>(${s.p1.x}, ${s.p1.y})</strong> and <strong>(${s.p2.x}, ${s.p2.y})</strong>.
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:20px; font-weight:bold; color:#334155;">m =</span>
                    <input type="text" id="ans-input" style="width:120px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;" placeholder="e.g. 1/2 or 0.5" autocomplete="off">
                </div>
            `;
        } else if (part === 1) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold;">
                    <span style="color:#3b82f6;">Part B:</span> What is the slope of a line that is <strong>parallel</strong> to this line?
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:20px; font-weight:bold; color:#334155;">m =</span>
                    <input type="text" id="ans-input" style="width:120px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;" placeholder="e.g. 1/2 or 0.5" autocomplete="off">
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="text-align:center; color:#64748b; margin-bottom:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                    Round ${psData.round} of ${psData.maxRounds}
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; justify-content: center;">
                    <canvas id="psCanvas" width="300" height="300" style="border: 1px solid #94a3b8; background: white;"></canvas>
                </div>

                <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    ${questionHTML}
                    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                        <button onclick="checkPSAnswer()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer;">Submit</button>
                    </div>
                    <div id="ps-feedback" style="margin-top: 15px; font-weight: bold; font-size: 15px;"></div>
                    <div id="ps-hint" style="margin-top: 10px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e; line-height:1.4;"></div>
                </div>
            </div>
        `;

        drawPSGraph();
        setTimeout(() => { document.getElementById('ans-input')?.focus(); }, 100);
    }

    function drawPSGraph() {
        const canvas = document.getElementById('psCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = psData.scenario;
        const part = psData.currentPart;
        
        const cx = 150; 
        const cy = 150; 
        const unit = 15; // 15 pixels per grid unit (allows -10 to +10)

        ctx.clearRect(0,0,300,300);

        // Draw Grid
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i++) {
            ctx.beginPath(); ctx.moveTo(0, cy + (i * unit)); ctx.lineTo(300, cy + (i * unit)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + (i * unit), 0); ctx.lineTo(cx + (i * unit), 300); ctx.stroke();
        }

        // Draw Axes
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(300, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 300); ctx.stroke();

        const pX = (val) => cx + (val * unit);
        const pY = (val) => cy - (val * unit);

        // Plot the two base points
        ctx.fillStyle = "#2563eb";
        ctx.beginPath(); ctx.arc(pX(s.p1.x), pY(s.p1.y), 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(pX(s.p2.x), pY(s.p2.y), 5, 0, Math.PI*2); ctx.fill();

        // Draw the main line if they passed Part A
        if (part >= 1) {
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            // Calculate extended points for drawing the line infinitely
            let drawX1 = -10; let drawY1 = s.p1.y + (s.slope * (drawX1 - s.p1.x));
            let drawX2 = 10;  let drawY2 = s.p1.y + (s.slope * (drawX2 - s.p1.x));
            
            ctx.moveTo(pX(drawX1), pY(drawY1));
            ctx.lineTo(pX(drawX2), pY(drawY2));
            ctx.stroke();
        }

        // Draw the parallel line if they finished Part B
        if (part >= 2) {
            ctx.strokeStyle = "#10b981"; // Green
            ctx.setLineDash([8, 6]);
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            let drawX1 = -10; let drawY1 = s.p1.y + (s.slope * (drawX1 - s.p1.x)) + s.parallelOffset;
            let drawX2 = 10;  let drawY2 = s.p1.y + (s.slope * (drawX2 - s.p1.x)) + s.parallelOffset;
            
            ctx.moveTo(pX(drawX1), pY(drawY1));
            ctx.lineTo(pX(drawX2), pY(drawY2));
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    window.checkPSAnswer = function() {
        const inp = document.getElementById('ans-input');
        const feedback = document.getElementById('ps-feedback');
        const hintBox = document.getElementById('ps-hint');
        if (!inp || inp.value === "") return;

        let uAns = parseMath(inp.value);
        let s = psData.scenario;
        let part = psData.currentPart;

        if (isNaN(uAns)) {
            feedback.style.color = "#dc2626";
            feedback.innerText = "Please enter a valid number or fraction.";
            return;
        }

        let isCorrect = (Math.abs(uAns - s.slope) < 0.001);

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            hintBox.style.display = "none";
            inp.disabled = true;
            
            let dbSkill = part === 0 ? 'ps_calc' : 'ps_parallel';
            if (psData.errorsThisPart === 0) updatePSSkill(dbSkill, 1);

            psData.currentPart++;
            psData.errorsThisPart = 0;
            drawPSGraph(); // Instantly draw the line upon success!

            setTimeout(() => {
                if (psData.currentPart > 1) {
                    psData.round++;
                    if (psData.round > psData.maxRounds) finishPSGame();
                    else startPSRound();
                } else {
                    renderPSUI();
                }
            }, 1200);

        } else {
            psData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Incorrect. Try again.";
            
            hintBox.style.display = "block";
            if (part === 0) {
                if (psData.errorsThisPart === 1) {
                    hintBox.innerHTML = `<strong>Hint:</strong> Slope is (Change in Y) ÷ (Change in X).<br>Use the formula: (y₂ - y₁) / (x₂ - x₁)`;
                } else {
                    hintBox.innerHTML = `<strong>Hint:</strong><br>Change in Y = ${s.p2.y} - ${s.p1.y} = <strong>${s.dy}</strong><br>Change in X = ${s.p2.x} - ${s.p1.x} = <strong>${s.dx}</strong><br>Slope = ${s.dy} / ${s.dx}. Try writing it as a fraction!`;
                }
            } else if (part === 1) {
                hintBox.innerHTML = `<strong>Hint:</strong> Parallel lines never intersect because they have the <strong>exact same slope!</strong>`;
            }
        }
    };

    function updatePSSkill(col, amt) {
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

    function finishPSGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">🛤️</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Parallel Slopes Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.ParallelSlope || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.ParallelSlope = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ ParallelSlope: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
