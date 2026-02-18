/**
 * Complex Shapes & Composite Area Module
 * - Generates procedural composite shapes (2-3 components).
 * - Clickable "Hint" regions mapped over component shapes.
 * - Validates numeric answer + correct units (e.g., cm²).
 * - SUPABASE: Updates 'ComplexShapes' column.
 */

var complexData = {
    components: [],
    totalArea: 0,
    totalPerimeter: 0,
    unit: 'units',
    correctAnswer: null
};

var complexRound = 1;

window.initComplexShapesGame = async function() {
    if (!document.getElementById('q-content')) return;
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    complexRound = 1;

    // Load progress from Supabase
    try {
        if (window.supabaseClient && window.currentUser) {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('ComplexShapes')
                .eq('userName', window.currentUser)
                .maybeSingle();
            window.userProgress.ComplexShapes = data?.ComplexShapes || 0;
        }
    } catch (e) { console.log("Sync error"); }

    startComplexRound();
};

function startComplexRound() {
    generateCompositeShape();
    renderComplexUI();
}

function generateCompositeShape() {
    const units = ['ft', 'in', 'cm', 'mm', 'm', 'units'];
    complexData.unit = units[Math.floor(Math.random() * units.length)];
    complexData.components = [];
    
    // Choose 2 components for simpler rounds, 3 for harder
    let numParts = complexRound > 2 ? 3 : 2;
    
    // 1. Base Shape (Always a Rectangle/Square for foundation)
    let baseW = Math.floor(Math.random() * 100) + 50;
    let baseH = Math.floor(Math.random() * 60) + 40;
    
    complexData.components.push({
        type: 'rectangle',
        w: baseW,
        h: baseH,
        x: 100,
        y: 150,
        area: baseW * baseH,
        hint: `Area of Rectangle = length × width (${baseW} × ${baseH})`
    });

    // 2. Add a sub-shape (Triangle or Semicircle) attached to the right or top
    let shapeType = Math.random() > 0.5 ? 'triangle' : 'semicircle';
    if (shapeType === 'triangle') {
        let triH = Math.floor(Math.random() * 40) + 20;
        complexData.components.push({
            type: 'triangle',
            base: baseH,
            height: triH,
            x: 100 + baseW,
            y: 150,
            area: 0.5 * baseH * triH,
            hint: `Area of Triangle = ½ × base × height (½ × ${baseH} × ${triH})`
        });
    } else {
        let radius = baseH / 2;
        complexData.components.push({
            type: 'semicircle',
            r: radius,
            x: 100 + baseW,
            y: 150 + radius,
            area: (Math.PI * Math.pow(radius, 2)) / 2,
            hint: `Area of Semicircle = (π × r²) ÷ 2 (Radius is ${radius})`
        });
    }

    // Calculate totals
    complexData.totalArea = complexData.components.reduce((sum, part) => sum + part.area, 0);
}

function renderComplexUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    document.getElementById('q-title').innerText = `Composite Shapes (Round ${complexRound}/3)`;

    qContent.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="position: relative; background: white; border-radius: 8px; border: 1px solid #cbd5e1; padding: 10px;">
                <canvas id="complexCanvas" width="400" height="350" style="cursor: help;"></canvas>
                <div id="hint-bubble" style="position: absolute; display: none; background: #0f172a; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 20; max-width: 200px;"></div>
                <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 5px;">Click parts of the shape for hints!</p>
            </div>

            <div style="flex: 1; min-width: 250px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin-top: 0;">Calculate the Total Area</h4>
                <p style="font-size: 14px; color: #475569;">Round your answer to 1 decimal place.</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size: 12px; font-weight: bold;">Value</label>
                    <input type="number" id="ans-value" step="0.1" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 0 10px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size: 12px; font-weight: bold;">Units</label>
                    <select id="ans-unit" style="width: 100%; height: 40px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        <option value="">-- Select Units --</option>
                        <option value="${complexData.unit}">${complexData.unit}</option>
                        <option value="${complexData.unit}2">${complexData.unit}²</option>
                        <option value="${complexData.unit}3">${complexData.unit}³</option>
                    </select>
                </div>

                <button onclick="checkComplexWin()" style="width: 100%; height: 45px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">SUBMIT ANSWER</button>
            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;

    drawComplexShape();
}

function drawComplexShape() {
    const canvas = document.getElementById('complexCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear and draw
    ctx.clearRect(0, 0, 400, 350);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#334155";
    ctx.fillStyle = "#e2e8f0";

    complexData.components.forEach(p => {
        ctx.beginPath();
        if (p.type === 'rectangle') {
            ctx.rect(p.x, p.y, p.w, p.h);
            ctx.fill(); ctx.stroke();
            // Labels
            ctx.fillStyle = "#000";
            ctx.fillText(`${p.w} ${complexData.unit}`, p.x + p.w/2 - 10, p.y - 5);
            ctx.fillText(`${p.h} ${complexData.unit}`, p.x - 40, p.y + p.h/2);
        } else if (p.type === 'triangle') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.height, p.y + p.base/2);
            ctx.lineTo(p.x, p.y + p.base);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillText(`h: ${p.height}`, p.x + p.height/2, p.y + p.base/2 + 20);
        } else if (p.type === 'semicircle') {
            ctx.arc(p.x, p.y, p.r, -Math.PI/2, Math.PI/2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillText(`r: ${p.r}`, p.x + 5, p.y);
        }
        ctx.fillStyle = "#e2e8f0";
    });

    // Hover Hint Logic
    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const bubble = document.getElementById('hint-bubble');
        
        // Simple bounding box check for hints
        let foundHint = complexData.components.find(p => mx > p.x - 20 && mx < p.x + 150 && my > p.y - 20 && my < p.y + 100);
        
        if (foundHint) {
            bubble.innerText = foundHint.hint;
            bubble.style.left = `${mx + 10}px`;
            bubble.style.top = `${my - 40}px`;
            bubble.style.display = 'block';
            setTimeout(() => { bubble.style.display = 'none'; }, 3000);
        }
    };
}

window.checkComplexWin = async function() {
    const val = parseFloat(document.getElementById('ans-value').value);
    const unit = document.getElementById('ans-unit').value;
    
    const isValueCorrect = Math.abs(val - complexData.totalArea) < 1.0;
    const isUnitCorrect = unit === (complexData.unit + '2'); // Area must be square units

    if (isValueCorrect && isUnitCorrect) {
        let current = window.userProgress.ComplexShapes || 0;
        let next = Math.min(10, current + 1);
        window.userProgress.ComplexShapes = next;

        if (window.supabaseClient && window.currentUser) {
            const hour = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment').update({ ComplexShapes: next }).eq('userName', window.currentUser).eq('hour', hour);
        }

        showFlash("Correct! Area is squared.", "success");
        complexRound++;
        setTimeout(() => {
            if (complexRound > 3) finishComplexGame();
            else startComplexRound();
        }, 1500);
    } else {
        let msg = !isUnitCorrect ? "Check your units (Area!)" : "Calculation is off";
        showFlash(msg, "error");
    }
};

function finishComplexGame() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:50px;"><h2>Composite Master!</h2><p>You've mastered area of complex shapes.</p></div>`;
    setTimeout(() => { window.loadNextQuestion(); }, 2500);
}

function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.background = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}
