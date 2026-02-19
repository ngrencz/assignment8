/**
 * skill_similarity.js - Fully Restored Logic & Instructions
 * - FIX: Re-added decimal instructions and specific hints.
 * - FIX: Guaranteed solvable side pairing (known matches x/y).
 * - FIX: Labels forced 22px outside using perpendicular vectors.
 * - LAYOUT: Horizontal inputs + Row-based submit button.
 */

var similarityData = {
    round: 1,
    maxRounds: 3,
    shapeName: '',
    shapeType: '',
    scaleFactor: 1,
    baseSides: [],
    scaledSides: [],
    solution: { k: 0, x: 0, y: 0 },
    indices: { known: 0, x: 1, y: 2 } // Fixed pairing indices
};

window.initSimilarityGame = async function() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    similarityData.round = 1;
    if (!window.userMastery) window.userMastery = {};

    try {
        const h = sessionStorage.getItem('target_hour') || "00";
        if (window.supabaseClient && window.currentUser) {
            const { data, error } = await window.supabaseClient
                .from('assignment')
                .select('Similarity')
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .maybeSingle();
            if (data) window.userMastery.Similarity = data.Similarity || 0;
        }
    } catch (e) { console.error("Sync failed", e); }

    generateSimilarityProblem();
    renderSimilarityUI();
};

function generateSimilarityProblem() {
    const templates = [
        { name: 'Triangle', sides: [6, 8, 10], type: 'tri' },
        { name: 'Triangle', sides: [9, 12, 15], type: 'tri' },
        { name: 'Rectangle', sides: [8, 14, 8, 14], type: 'rect' },
        { name: 'Trapezoid', sides: [8, 10, 14, 10], type: 'trap' }
    ];
    
    let template = templates[Math.floor(Math.random() * templates.length)];
    similarityData.shapeName = template.name;
    similarityData.shapeType = template.type;
    
    const factors = [0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10]; 
    similarityData.scaleFactor = factors[Math.floor(Math.random() * factors.length)];
    
    similarityData.baseSides = [...template.sides];
    similarityData.scaledSides = similarityData.baseSides.map(s => s * similarityData.scaleFactor);
    
    // Core Logic: Ensure solvable pairs
    // known side (index 0) exists on both. x (index 1) is scaled side. y (index 2) is original side.
    similarityData.solution = {
        k: similarityData.scaleFactor,
        x: similarityData.scaledSides[1],
        y: similarityData.baseSides[2]
    };
}

function renderSimilarityUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    qContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto; animation: fadeIn 0.4s ease-out;">
            <div style="text-align:center; margin-bottom:10px; color:#475569; font-weight:600;">
                Round ${similarityData.round} of ${similarityData.maxRounds} • ${similarityData.shapeName}
            </div>

            <div style="background:white; border:1px solid #cbd5e1; border-radius:12px; padding:10px; margin-bottom:15px; text-align:center;">
                <canvas id="simCanvas" width="680" height="320" style="max-width:100%; height:auto; display:block; margin:0 auto;"></canvas>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; align-items:center; gap:15px;">
                <p style="margin:0; font-size:14px; color:#64748b;">Find the scale factor (k), then solve for x and y. <b>Use decimal format.</b></p>
                
                <div style="display:flex; gap:15px; justify-content:center; width:100%; flex-wrap: wrap;">
                    <div class="sim-input-wrapper">
                        <span class="sim-tag">k</span>
                        <input type="number" id="inp-k" class="sim-mini-input" step="0.01" placeholder="Scale">
                    </div>
                    <div class="sim-input-wrapper">
                        <span class="sim-tag" style="color:#ef4444;">y</span>
                        <input type="number" id="inp-y" class="sim-mini-input" step="0.01" placeholder="Original">
                    </div>
                    <div class="sim-input-wrapper">
                        <span class="sim-tag" style="color:#2563eb;">x</span>
                        <input type="number" id="inp-x" class="sim-mini-input" step="0.01" placeholder="Scaled">
                    </div>
                </div>
                
                <button onclick="checkSimilarityAnswer()" class="sim-submit-btn">Check Answers</button>
            </div>
            
            <div id="sim-feedback" style="text-align:center; min-height:40px; margin-top:10px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; border-radius:8px;"></div>
        </div>
    `;
    setTimeout(drawSimilarShapes, 50);
}

function drawSimilarShapes() {
    const canvas = document.getElementById('simCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const d = similarityData;
    const maxUnitsWidth = Math.max(...d.baseSides) + Math.max(...d.scaledSides) + 15;
    const maxUnitsHeight = Math.max(...d.baseSides, ...d.scaledSides);
    const drawScale = Math.min((canvas.width - 180) / maxUnitsWidth, (canvas.height - 100) / maxUnitsHeight, 28);

    function getPoints(type, sides, s) {
        if (type === 'tri') return [{x:0, y:sides[1]*s}, {x:sides[0]*s, y:sides[1]*s}, {x:0, y:0}];
        if (type === 'rect') return [{x:0, y:0}, {x:sides[1]*s, y:0}, {x:sides[1]*s, y:sides[0]*s}, {x:0, y:sides[0]*s}];
        if (type === 'trap') return [{x:1.5*s, y:0}, {x:(sides[0]+1.5)*s, y:0}, {x:sides[2]*s, y:sides[1]*s}, {x:0, y:sides[1]*s}];
    }

    function drawPolygon(pts, offsetX, offsetY, sides, isScaled) {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isScaled ? "#16a34a" : "#475569";
        ctx.fillStyle = isScaled ? "#f0fdf4" : "#f8fafc";
        ctx.moveTo(pts[0].x + offsetX, pts[0].y + offsetY);
        pts.forEach(p => ctx.lineTo(p.x + offsetX, p.y + offsetY));
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.font = "bold 15px Arial";
        sides.forEach((val, i) => {
            if (i > 2 && d.shapeType !== 'rect') return;
            const p1 = pts[i];
            const p2 = pts[(i+1)%pts.length];
            const mx = (p1.x + p2.x)/2 + offsetX;
            const my = (p1.y + p2.y)/2 + offsetY;

            const dx = p2.x - p1.x; const dy = p2.y - p1.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = -dy/len; const ny = dx/len;  

            let label = val;
            ctx.fillStyle = "#1e293b";
            
            // Logic to show exactly what is needed for the math
            if (!isScaled) {
                if (i === 1) label = similarityData.baseSides[1]; // Known side 1
                else if (i === 2) { label = "y"; ctx.fillStyle = "#ef4444"; } // Find y
                else if (i === 0) label = similarityData.baseSides[0]; // Known side 0
                else return;
            } else {
                if (i === 1) { label = "x"; ctx.fillStyle = "#2563eb"; } // Find x
                else if (i === 0) label = similarityData.scaledSides[0]; // Matching known side
                else return;
            }

            ctx.textAlign = "center";
            ctx.fillText(label, mx + nx*22, my + ny*22 + 5);
        });
    }

    const pOrig = getPoints(d.shapeType, d.baseSides, drawScale);
    const pScale = getPoints(d.shapeType, d.scaledSides, drawScale);
    const h1 = Math.max(...pOrig.map(p => p.y));
    const h2 = Math.max(...pScale.map(p => p.y));
    const w1 = Math.max(...pOrig.map(p => p.x));

    drawPolygon(pOrig, 50, (canvas.height - h1)/2, d.baseSides, false);
    ctx.fillStyle = "#94a3b8"; ctx.font = "22px Arial";
    ctx.fillText("➔ k", w1 + 105, canvas.height/2 + 7);
    drawPolygon(pScale, w1 + 175, (canvas.height - h2)/2, d.scaledSides, true);
}

window.checkSimilarityAnswer = async function() {
    const kInp = document.getElementById('inp-k');
    const xInp = document.getElementById('inp-x');
    const yInp = document.getElementById('inp-y');
    const fb = document.getElementById('sim-feedback');

    const uk = parseFloat(kInp.value);
    const ux = parseFloat(xInp.value);
    const uy = parseFloat(yInp.value);

    if (isNaN(uk) || isNaN(ux) || isNaN(uy)) {
        fb.style.backgroundColor = "#fee2e2"; fb.style.color = "#991b1b";
        fb.innerText = "Please provide decimal answers for all fields.";
        return;
    }

    const sol = similarityData.solution;
    const kOk = Math.abs(uk - sol.k) < 0.02;
    const xOk = Math.abs(ux - sol.x) < 0.02;
    const yOk = Math.abs(uy - sol.y) < 0.02;

    if (kOk && xOk && yOk) {
        fb.style.backgroundColor = "#dcfce7"; fb.style.color = "#166534";
        fb.innerText = "✅ Correct! Great work.";
        await updateSimilarityScore(1);
        similarityData.round++;
        setTimeout(() => {
            if (similarityData.round > similarityData.maxRounds) finishSimilarityGame();
            else { generateSimilarityProblem(); renderSimilarityUI(); }
        }, 1200);
    } else {
        fb.style.backgroundColor = "#fee2e2"; fb.style.color = "#991b1b";
        if (!kOk) fb.innerText = "❌ Hint: k = Scaled Side ÷ Matching Original Side";
        else if (!yOk) fb.innerText = "❌ Hint for y: Original = Scaled ÷ k";
        else fb.innerText = "❌ Hint for x: Scaled = Original × k";
    }
};

async function updateSimilarityScore(amount) {
    if (!window.userMastery) window.userMastery = {};
    const next = Math.max(0, Math.min(10, (window.userMastery.Similarity || 0) + amount));
    window.userMastery.Similarity = next;
    if (window.supabaseClient && window.currentUser) {
        const h = sessionStorage.getItem('target_hour') || "00";
        await window.supabaseClient.from('assignment').update({ Similarity: next }).eq('userName', window.currentUser).eq('hour', h);
    }
}

function finishSimilarityGame() {
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:80px;"><h2>Complete!</h2></div>`;
    setTimeout(() => { if (window.loadNextQuestion) window.loadNextQuestion(); }, 2000);
}

const simStyle = document.createElement('style');
simStyle.innerHTML = `
    .sim-input-wrapper { display:flex; align-items:center; background:white; border:1px solid #cbd5e1; border-radius:8px; padding:6px 12px; }
    .sim-tag { font-size:14px; font-weight:bold; margin-right:10px; font-family: monospace; }
    .sim-mini-input { border:none; width:90px; height:34px; font-size:16px; text-align:center; outline:none; background:transparent; }
    .sim-submit-btn { background:#0f172a; color:white; border:none; padding:12px 40px; border-radius:8px; font-weight:bold; cursor:pointer; width: 100%; max-width: 320px; }
    .sim-submit-btn:hover { background:#334155; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
`;
document.head.appendChild(simStyle);
