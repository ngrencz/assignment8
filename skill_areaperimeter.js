/**
 * skill_areaperimeter.js
 * - 8th Grade: Area & Perimeter Fundamentals
 * - Covers: Rectangles, Triangles (Right), Trapezoids (Isosceles), Circles, Semicircles.
 * - Features dynamic canvas rendering and shape-specific hint buttons.
 */

(function() {
    console.log("🚀 skill_areaperimeter.js LIVE (Basic Shapes & Formulas)");

    var apData = {
        round: 1,
        maxRounds: 5,
        errorsThisRound: 0,
        shapeType: '',
        dbSkill: '',
        unit: 'cm',
        dim: {}, // Stores the randomized dimensions
        area: 0,
        perim: 0,
        formulas: { area: '', perim: '' }
    };

    window.initAreaPerimeterGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        apData.round = 1;
        apData.errorsThisRound = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('AreaPerimeter, ap_rectangle, ap_triangle, ap_trapezoid, ap_circle, ap_semicircle')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("AreaPerimeter DB sync error.");
        }

        startAPRound();
    };

    function startAPRound() {
        apData.errorsThisRound = 0;
        generateAPProblem();
        renderAPUI();
    }

    function generateAPProblem() {
        const shapes = ['rectangle', 'triangle', 'trapezoid', 'circle', 'semicircle'];
        const units = ['cm', 'm', 'in', 'ft'];
        
        apData.shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        apData.unit = units[Math.floor(Math.random() * units.length)];
        apData.dbSkill = `ap_${apData.shapeType}`;

        let d = {};

        if (apData.shapeType === 'rectangle') {
            d.w = Math.floor(Math.random() * 15) + 5;
            d.h = Math.floor(Math.random() * 15) + 5;
            if (d.w === d.h) d.w += 2; // Prevent squares just to ensure distinct labels
            
            apData.area = d.w * d.h;
            apData.perim = (2 * d.w) + (2 * d.h);
            apData.formulas = { area: "A = base × height", perim: "P = add all 4 outer sides" };
        
        } else if (apData.shapeType === 'triangle') {
            // Right triangle for clean math
            d.b = Math.floor(Math.random() * 12) + 6;
            d.h = Math.floor(Math.random() * 12) + 6;
            d.hyp = Math.sqrt((d.b * d.b) + (d.h * d.h)); // We will round this for display
            
            apData.area = 0.5 * d.b * d.h;
            apData.perim = d.b + d.h + d.hyp;
            apData.formulas = { area: "A = ½ × base × height", perim: "P = add all 3 outer sides" };
        
        } else if (apData.shapeType === 'trapezoid') {
            // Isosceles trapezoid
            d.b1 = Math.floor(Math.random() * 10) + 14; // Bottom base (larger)
            d.b2 = Math.floor(Math.random() * 8) + 6;   // Top base (smaller)
            d.h = Math.floor(Math.random() * 8) + 6;
            let diff = (d.b1 - d.b2) / 2;
            d.slant = Math.sqrt((d.h * d.h) + (diff * diff));
            
            apData.area = 0.5 * (d.b1 + d.b2) * d.h;
            apData.perim = d.b1 + d.b2 + (2 * d.slant);
            apData.formulas = { area: "A = ½ × (base1 + base2) × height", perim: "P = add all 4 outer sides" };
        
        } else if (apData.shapeType === 'circle') {
            d.r = Math.floor(Math.random() * 10) + 3;
            
            apData.area = Math.PI * (d.r * d.r);
            apData.perim = 2 * Math.PI * d.r; // Circumference
            apData.formulas = { area: "A = π × r²", perim: "C = 2 × π × r  (or π × d)" };
        
        } else if (apData.shapeType === 'semicircle') {
            d.r = Math.floor(Math.random() * 10) + 3;
            
            apData.area = (Math.PI * (d.r * d.r)) / 2;
            apData.perim = (Math.PI * d.r) + (2 * d.r); // Arc + flat bottom
            apData.formulas = { area: "A = (π × r²) ÷ 2", perim: "P = (π × r) + flat diameter" };
        }

        apData.dim = d;
    }

    function renderAPUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Area & Perimeter (Round ${apData.round}/${apData.maxRounds})`;

        qContent.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; margin-bottom: 20px;">
                    <canvas id="apCanvas" width="400" height="250" style="max-width:100%;"></canvas>
                </div>

                <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                    <button onclick="document.getElementById('ap-hint-box').style.display='block'" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; padding:8px 15px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:13px;">💡 View Formulas</button>
                </div>

                <div id="ap-hint-box" style="display:none; background:#1e293b; color:white; padding:15px; border-radius:8px; margin-bottom:20px; font-size:14px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                    <div style="color:#94a3b8; font-size:12px; text-transform:uppercase; margin-bottom:8px; font-weight:bold;">Formulas for ${apData.shapeType}</div>
                    <div><strong>Area:</strong> ${apData.formulas.area}</div>
                    <div style="margin-top:5px;"><strong>Perimeter:</strong> ${apData.formulas.perim}</div>
                    <div style="margin-top:10px; font-size:12px; color:#cbd5e1;"><em>(Use 3.14 for π, round answers to 1 decimal place)</em></div>
                </div>

                <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold; color:#3b82f6; margin-bottom:5px;">AREA</label>
                        <div style="display:flex; align-items:center; gap:5px;">
                            <input type="number" id="ap-area" step="0.1" style="width:100%; padding:10px; border-radius:6px; border:1px solid #cbd5e1; font-size:16px; text-align:center;">
                            <span style="color:#64748b; font-weight:bold;">${apData.unit}²</span>
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold; color:#10b981; margin-bottom:5px;">PERIMETER</label>
                        <div style="display:flex; align-items:center; gap:5px;">
                            <input type="number" id="ap-perim" step="0.1" style="width:100%; padding:10px; border-radius:6px; border:1px solid #cbd5e1; font-size:16px; text-align:center;">
                            <span style="color:#64748b; font-weight:bold;">${apData.unit}</span>
                        </div>
                    </div>
                    <div style="grid-column: span 2; text-align:center; margin-top:10px;">
                        <button onclick="checkAPAnswer()" style="background:#1e293b; color:white; border:none; padding:12px 30px; font-size:16px; font-weight:bold; border-radius:8px; cursor:pointer; width:100%;">Submit Answers</button>
                        <div id="ap-feedback" style="margin-top: 15px; font-weight: bold; min-height: 24px;"></div>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(drawShape, 50);
    }

    function drawShape() {
        const canvas = document.getElementById('apCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = 200, cy = 125;
        const d = apData.dim;
        const u = apData.unit;

        ctx.clearRect(0,0,400,250);
        ctx.strokeStyle = "#334155";
        ctx.fillStyle = "#e0f2fe";
        ctx.lineWidth = 3;

        function drawLabel(text, x, y) {
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            const w = ctx.measureText(text).width;
            ctx.fillRect(x - w/2 - 4, y - 10, w + 8, 20);
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, x, y);
        }

        ctx.beginPath();

        if (apData.shapeType === 'rectangle') {
            let drawW = d.w * 8; let drawH = d.h * 8;
            // Cap sizes so they fit on canvas
            if (drawW > 250) { drawW = 250; drawH = (d.h/d.w) * 250; }
            if (drawH > 150) { drawH = 150; drawW = (d.w/d.h) * 150; }
            
            let lx = cx - drawW/2, ly = cy - drawH/2;
            ctx.rect(lx, ly, drawW, drawH);
            ctx.fill(); ctx.stroke();
            
            drawLabel(`${d.w} ${u}`, cx, ly - 15);
            drawLabel(`${d.h} ${u}`, lx - 25, cy);

        } else if (apData.shapeType === 'triangle') {
            let drawB = d.b * 10; let drawH = d.h * 10;
            if (drawB > 200) { drawB = 200; drawH = (d.h/d.b) * 200; }
            if (drawH > 150) { drawH = 150; drawB = (d.b/d.h) * 150; }
            
            let lx = cx - drawB/2, ly = cy + drawH/2;
            ctx.moveTo(lx, ly); 
            ctx.lineTo(lx + drawB, ly); 
            ctx.lineTo(lx, ly - drawH);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            
            // Right angle square
            ctx.strokeRect(lx, ly - 15, 15, 15);

            drawLabel(`${d.b} ${u}`, cx, ly + 15);
            drawLabel(`${d.h} ${u}`, lx - 25, cy);
            drawLabel(`${d.hyp.toFixed(1)} ${u}`, cx + 20, cy - 10);

        } else if (apData.shapeType === 'trapezoid') {
            let scale = 180 / d.b1;
            let db1 = d.b1 * scale, db2 = d.b2 * scale, dh = d.h * scale;
            let diff = (db1 - db2) / 2;
            
            let lx = cx - db1/2, ly = cy + dh/2;
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + db1, ly);
            ctx.lineTo(lx + db1 - diff, ly - dh);
            ctx.lineTo(lx + diff, ly - dh);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Height dashed line
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(lx + diff, ly);
            ctx.lineTo(lx + diff, ly - dh);
            ctx.stroke();
            ctx.setLineDash([]);

            drawLabel(`${d.b1} ${u}`, cx, ly + 15);
            drawLabel(`${d.b2} ${u}`, cx, ly - dh - 15);
            drawLabel(`${d.h} ${u}`, lx + diff + 20, cy);
            drawLabel(`${d.slant.toFixed(1)} ${u}`, lx - 10, cy);

        } else if (apData.shapeType === 'circle') {
            let r = 75; 
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();

            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r, cy);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fillStyle="#334155"; ctx.fill();
            drawLabel(`${d.r} ${u}`, cx + r/2, cy - 15);

        } else if (apData.shapeType === 'semicircle') {
            let r = 90;
            ctx.arc(cx, cy + 30, r, Math.PI, 0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(cx, cy + 30);
            ctx.lineTo(cx + r, cy + 30);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath(); ctx.arc(cx, cy + 30, 3, 0, Math.PI*2); ctx.fillStyle="#334155"; ctx.fill();
            drawLabel(`${d.r} ${u}`, cx + r/2, cy + 15);
        }
    }

    window.checkAPAnswer = function() {
        const aInput = document.getElementById('ap-area').value;
        const pInput = document.getElementById('ap-perim').value;
        const feedback = document.getElementById('ap-feedback');

        if (aInput === "" || pInput === "") {
            feedback.style.color = "#dc2626";
            feedback.innerText = "Please enter both values.";
            return;
        }

        const uA = parseFloat(aInput);
        const uP = parseFloat(pInput);

        // Generous tolerance to account for students using 3.14 vs the Pi button
        const tolA = Math.max(0.5, apData.area * 0.03); 
        const tolP = Math.max(0.5, apData.perim * 0.03);

        const aCorrect = Math.abs(uA - apData.area) <= tolA;
        const pCorrect = Math.abs(uP - apData.perim) <= tolP;

        if (aCorrect && pCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            
            if (apData.errorsThisRound === 0) {
                updateAPSubScore(apData.dbSkill, 1);
            }

            apData.round++;
            setTimeout(() => {
                if (apData.round > apData.maxRounds) finishAPGame();
                else startAPRound();
            }, 1000);

        } else {
            apData.errorsThisRound++;
            feedback.style.color = "#dc2626";
            if (!aCorrect && !pCorrect) feedback.innerText = "❌ Both are incorrect. Try clicking 'View Formulas'.";
            else if (!aCorrect) feedback.innerText = "❌ Area is incorrect. Check your formula!";
            else feedback.innerText = "❌ Perimeter is incorrect. Remember to add ALL outer edges.";
        }
    };

    function updateAPSubScore(col, amt) {
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
                .then(({error}) => { if (error) console.error("Subskill update fail:", error); });
        }
    }

    function finishAPGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">📐</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Shape Formulas Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.AreaPerimeter || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.AreaPerimeter = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment')
                .update({ AreaPerimeter: newMain })
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .then(({error}) => { if(error) console.error("Main update fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
