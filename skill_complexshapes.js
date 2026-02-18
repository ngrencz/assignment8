/**
 * skill_complexshapes.js - Single Round Series Version
 * - Generates a composite figure (2-3 parts: rectangles, triangles, semicircles).
 * - Requires both Area and Perimeter to be correct.
 * - Handles unit validation (linear vs square).
 * - Clickable hint regions for formulas.
 */

var complexData = {
    components: [],
    totalArea: 0,
    totalPerimeter: 0,
    unit: 'units',
};

var complexRound = 1; 

window.initComplexShapesGame = async function() {
    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;

    // Reset progress tracking
    if (!window.userProgress) window.userProgress = {};

    // Fetch existing progress from Supabase
    try {
        if (window.supabaseClient && window.currentUser) {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('ComplexShapes')
                .eq('userName', window.currentUser)
                .maybeSingle();
            
            window.userProgress.ComplexShapes = data?.ComplexShapes || 0;
        }
    } catch (e) {
        console.log("Supabase sync error, using local state");
    }
    
    startComplexRound();
};

function startComplexRound() {
    generateComplexProblem();
    renderComplexUI();
}

function generateComplexProblem() {
    const units = ['ft', 'in', 'cm', 'mm', 'm', 'mi', 'km', 'units'];
    complexData.unit = units[Math.floor(Math.random() * units.length)];
    complexData.components = [];
    
    // 1. Foundation Rectangle (Base)
    let baseW = Math.floor(Math.random() * 80) + 40;
    let baseH = Math.floor(Math.random() * 50) + 30;
    
    complexData.components.push({
        type: 'rectangle',
        w: baseW, h: baseH, x: 80, y: 120,
        area: baseW * baseH,
        hintA: `Area of Rectangle = L × W (${baseW} × ${baseH})`,
        hintP: `Perimeter is the distance around the outside edges.`
    });

    // 2. Add a sub-shape (Triangle or Semicircle)
    let type = Math.random() > 0.5 ? 'triangle' : 'semicircle';
    let attachX = 80 + baseW;
    let attachY = 120;

    if (type === 'triangle') {
        let triH = Math.floor(Math.random() * 40) + 20;
        complexData.components.push({
            type: 'triangle', base: baseH, height: triH, x: attachX, y: attachY,
            area: 0.5 * baseH * triH,
            // Hypotenuse for perimeter logic
            sideC: Math.sqrt(Math.pow(baseH, 2) + Math.pow(triH, 2)),
            hintA: `Area of Triangle = ½ × base × height (½ × ${baseH} × ${triH})`,
            hintP: `Remember: Use the Pythagorean theorem for slanted edges!`
        });
        // Calculation logic (Simplified for composite)
        complexData.totalArea = (baseW * baseH) + (0.5 * baseH * triH);
        complexData.totalPerimeter = (baseW * 2) + triH + Math.sqrt(Math.pow(baseH, 2) + Math.pow(triH, 2));
    } else {
        let r = baseH / 2;
        complexData.components.push({
            type: 'semicircle', r: r, x: attachX, y: attachY + r,
            area: (Math.PI * Math.pow(r, 2)) / 2,
            hintA: `Area of Semicircle = (π × r²) / 2 (Radius: ${r})`,
            hintP: `Arc Length = π × r. Only add outer edges!`
        });
        complexData.totalArea = (baseW * baseH) + ((Math.PI * Math.pow(r, 2)) / 2);
        complexData.totalPerimeter = (baseW * 2) + baseH + (Math.PI * r);
    }
}

function renderComplexUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    document.getElementById('q-title').innerText = `Complex Shapes (Mixed Review)`;

    qContent.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap; position: relative;">
            <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
                <canvas id="complexCanvas" width="450" height="350" style="cursor: help;"></canvas>
                <div id="hint-bubble" style="position: absolute; display: none; background: #1e293b; color: white; padding: 10px; border-radius: 6px; font-size: 13px; z-index: 50; pointer-events:none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
                <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 5px;">Click parts of the shape for formula hints!</p>
            </div>

            <div style="flex: 1; min-width: 280px; background: #f1f5f9; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">Shape Analysis</h3>
                <p style="font-size: 13px; margin-bottom: 15px;">Solve for both properties. Round to 1 decimal.</p>

                <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2563eb;">
                    <label style="font-weight:bold; font-size:11px; color:#2563eb;">PART A: TOTAL AREA</label>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <input type="number" id="ans-area-val" placeholder="Value" style="flex:2; height:35px; border-radius:4px; border:1px solid #cbd5e1; text-align:center;">
                        <select id="ans-area-unit" style="flex:1; height:35px; border-radius:4px; border:1px solid #cbd5e1;">
                            <option value="">Unit</option>
                            <option value="linear">${complexData.unit}</option>
                            <option value="square">${complexData.unit}²</option>
                        </select>
                    </div>
                </div>

                <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
                    <label style="font-weight:bold; font-size:11px; color:#059669;">PART B: PERIMETER</label>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <input type="number" id="ans-perim-val" placeholder="Value" style="flex:2; height:35px; border-radius:4px; border:1px solid #cbd5e1; text-align:center;">
                        <select id="ans-perim-unit" style="flex:1; height:35px; border-radius:4px; border:1px solid #cbd5e1;">
                            <option value="">Unit</option>
                            <option value="linear">${complexData.unit}</option>
                            <option value="square">${complexData.unit}²</option>
                        </select>
                    </div>
                </div>

                <button onclick="checkComplexWin()" style="width:100%; height:50px; background:#1e293b; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">SUBMIT RESULTS</button>
            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;

    drawComplex();
}

function drawComplex() {
    const canvas = document.getElementById('complexCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 450, 350);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#334155";
    ctx.fillStyle = "#e2e8f0";

    complexData.components.forEach(p => {
        ctx.beginPath();
        if (p.type === 'rectangle') {
            ctx.rect(p.x, p.y, p.w, p.h);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.fillText(`${p.w} ${complexData.unit}`, p.x + p.w/2 - 10, p.y - 10);
            ctx.fillText(`${p.h} ${complexData.unit}`, p.x - 45, p.y + p.h/2);
        } else if (p.type === 'triangle') {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.height, p.y + p.base/2);
            ctx.lineTo(p.x, p.y + p.base);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.fillText(`h: ${p.height}`, p.x + 10, p.y + p.base/2 + 5);
        } else if (p.type === 'semicircle') {
            ctx.arc(p.x, p.y, p.r, -Math.PI/2, Math.PI/2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#000";
            ctx.fillText(`r: ${p.r}`, p.x + 5, p.y + 5);
        }
        ctx.fillStyle = "#e2e8f0";
    });

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const bubble = document.getElementById('hint-bubble');
        
        let part = complexData.components.find(p => mx > p.x - 20 && mx < p.x + 150 && my > p.y - 20 && my < p.y + 100);
        
        if (part) {
            bubble.innerHTML = `<strong>Formula Hint:</strong><br>${part.hintA}<br>${part.hintP}`;
            bubble.style.left = `${mx + 15}px`;
            bubble.style.top = `${my - 40}px`;
            bubble.style.display = 'block';
            setTimeout(() => { bubble.style.display = 'none'; }, 4000);
        }
    };
}

window.checkComplexWin = async function() {
    const aVal = parseFloat(document.getElementById('ans-area-val').value);
    const aUnit = document.getElementById('ans-area-unit').value;
    const pVal = parseFloat(document.getElementById('ans-perim-val').value);
    const pUnit = document.getElementById('ans-perim-unit').value;

    const areaOK = (Math.abs(aVal - complexData.totalArea) < 2.0) && (aUnit === 'square');
    const perimOK = (Math.abs(pVal - complexData.totalPerimeter) < 2.0) && (pUnit === 'linear');

    if (areaOK && perimOK) {
        let newVal = Math.min(10, (window.userProgress.ComplexShapes || 0) + 1);
        window.userProgress.ComplexShapes = newVal;

        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient
                .from('assignment')
                .update({ ComplexShapes: newVal })
                .eq('userName', window.currentUser)
                .eq('hour', currentHour);
        }

        showFlash("Excellent! Mastery increased.", "success");
        setTimeout(() => finishComplex(), 1500);
    } else {
        let msg = (!areaOK && !perimOK) ? "Both answers need review." : 
                  (!areaOK ? "Check Area or Units (²)." : "Check Perimeter or Units.");
        showFlash(msg, "error");
    }
};

function finishComplex() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px;">
            <div style="font-size:60px;">📐</div>
            <h2 style="color:#1e293b;">Shape Completed!</h2>
            <p style="color:#64748b;">Moving to next skill...</p>
        </div>
    `;
    setTimeout(() => {
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 2500);
}

function showFlash(msg, type) {
    const overlay = document.getElementById('flash-overlay');
    if (!overlay) return;
    overlay.innerText = msg;
    overlay.style.display = 'block';
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    setTimeout(() => { overlay.style.display = 'none'; }, 2000);
}
