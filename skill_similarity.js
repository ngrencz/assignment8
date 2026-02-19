/**
 * skill_similarity.js - Final Layout & Label Polish
 * - FIX: Labels forced to 22px outside boundary using perpendicular vectors.
 * - FIX: Input fields lengthened for better visibility.
 * - FIX: "Check" button moved to a new row below inputs.
 * - Adaptive scaling based on largest shape dimension.
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
    indices: { known: 0, x: 0, y: 0 }
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
            
            if (error) throw error;
            if (data) window.userMastery.Similarity = data.Similarity || 0;
        }
    } catch (e) { 
        console.error("Mastery sync failed:", e); 
    }

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
    
    similarityData.indices = { known: 0, x: 1, y: 2 };
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
            <div style="text-align:center; margin-bottom:10px; color:#475569; font-weight:600; font-size:14px;">
                Round ${similarityData.round} of ${similarityData.maxRounds} • ${similarityData.shapeName}
            </div>

            <div style="background:white; border:1px solid #cbd5e1; border-radius:12px; padding:10px; margin-bottom:15px; text-align:center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <canvas id="simCanvas" width="680" height="320" style="max-width:100%; height:auto; display:block; margin:0 auto;"></canvas>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; align-items:center; gap:15px;">
                <div style="display:flex; gap:15px; justify-content:center; width:100%;">
                    <div class="sim-input-wrapper">
                        <span class="sim-tag">k</span>
                        <input type="number" id="inp-k" class="sim-mini-input" step="0.01" placeholder="Scale">
                    </div>
                    <div class="sim-input-wrapper">
                        <span class="sim-tag" style="color:#ef4444;">y</span>
                        <input type="number" id="inp-y" class="sim-mini-input" step="0.01" placeholder="Orig">
                    </div>
                    <div class="sim-input-wrapper">
                        <span class="sim-tag" style="color:#2563eb;">x</span>
                        <input type="number" id="inp-x" class="sim-mini-input" step="0.01" placeholder="Scaled">
                    </div>
                </div>
                <button onclick="checkSimilarityAnswer()" class="sim-submit-btn">Check Answers</button>
            </div>
            
            <div id="sim-feedback" style="text-align:center; min-height:35px; margin-top:10px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; border-radius:8px;"></div>
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
    
    // Calculate adaptive draw scale
    const maxUnitsWidth = Math.max(...d.baseSides) + Math.max(...d.scaledSides) + 15;
    const maxUnitsHeight = Math.max(...d.baseSides, ...d.scaledSides);
    const drawScale = Math.min((canvas.width - 180) / maxUnitsWidth, (canvas.height - 100) / maxUnitsHeight, 30);

    function getPoints(type, sides, s) {
        if (type === 'tri') return [{x:0, y:sides[1]*s}, {x:sides[0]*s, y:sides[1]*s}, {x:0, y:0}];
        if (type === 'rect') return [{x:0, y:0}, {x:sides[1]*s, y:0}, {x:sides[1]*s, y:sides[0]*s}, {x:0, y:sides[0]*s}];
        if (type === 'trap') return [{x:1.5*s, y:0}, {x:(sides[0]+1.5)*s, y:0}, {x:sides[2]*s, y:sides[1]*s}, {x:0, y:sides[1]*s}];
        return [];
    }

    function drawPolygon(pts, offsetX, offsetY, sides, isScaled) {
        if (!pts.length) return;
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isScaled ? "#16a34a" : "#475569";
        ctx.fillStyle = isScaled ? "#f0fdf4" : "#f8fafc";
        
        ctx.moveTo(pts[0].x + offsetX, pts[0].y + offsetY);
        pts.forEach(p => ctx.lineTo(p.x + offsetX, p.y + offsetY));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 15px Arial";
        sides.forEach((val, i) => {
            if (i > 2 && d.shapeType !== 'rect') return;
            const p1 = pts[i];
            const p2 = pts[(i+1)%pts.length];
            
            const mx = (p1.x + p2.x)/2 + offsetX;
            const my = (p1.y + p2.y)/2 + offsetY;

            // Strict Outside Vector Math
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = -dy/len; 
            const ny = dx/len;  

            let label = val;
            ctx.fillStyle = "#1e293b";
            if (!isScaled && i === d.indices.y) { label = "y"; ctx.fillStyle = "#ef4444"; }
            else if (isScaled && i === d.indices.x) { label = "x"; ctx.fillStyle = "#2563eb"; }
            else if (i !== d.indices.known) return;

            ctx.textAlign = "center";
            // Pushing label further out (22px) to ensure no overlap
            ctx.fillText(label, mx + nx*22, my + ny*22 + 5);
        });
    }

    const pOrig = getPoints(d.shapeType, d.baseSides, drawScale);
    const pScale = getPoints(d.shapeType, d.scaledSides, drawScale);

    const h1 = Math.max(...pOrig.map(p => p.y));
    const h2 = Math.max(...pScale.map(p => p.y));
    const w1 = Math.max(...pOrig.map(p => p.x));

    drawPolygon(pOrig, 50, (canvas.height - h1)/2, d.baseSides, false);
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "22px Arial";
    ctx.fillText("➔ k", w1 + 105, canvas.height/2 + 7);
    
    drawPolygon(pScale, w1 + 170, (canvas.height - h2)/2, d.scaledSides, true);
}

window.checkSimilarityAnswer = async function() {
    const uk = parseFloat(document.getElementById('inp-k').value);
    const ux = parseFloat(document.getElementById('inp-x').value);
    const uy = parseFloat(document.getElementById('inp-y').value);
    const fb = document.getElementById('sim-feedback');

    if (isNaN(uk) || isNaN(ux) || isNaN(uy)) {
        fb.style.backgroundColor = "#fee2e2";
        fb.style.color = "#991b1b";
        fb.innerText = "Please fill all fields.";
        return;
    }

    const sol = similarityData.solution;
    const kOk = Math.abs(uk - sol.k) < 0.01;
    const xOk = Math.abs(ux - sol.x) < 0.01;
    const yOk = Math.abs(uy - sol.y) < 0.01;

    if (kOk && xOk && yOk) {
        fb.style.backgroundColor = "#dcfce7";
        fb.style.color = "#166534";
        fb.innerText = "✅ Correct! Next round...";
        await updateSimilarityScore(1);
        similarityData.round++;
        setTimeout(() => {
            if (similarityData.round > similarityData.maxRounds) finishSimilarityGame();
            else { generateSimilarityProblem(); renderSimilarityUI(); }
        }, 1200);
    } else {
        fb.style.backgroundColor = "#fee2e2";
        fb.style.color = "#991b1b";
        fb.innerText = "❌ Keep trying! Check your k value first.";
    }
};

async function updateSimilarityScore(amount) {
    if (!window.userMastery) window.userMastery = {};
    const current = window.userMastery.Similarity || 0;
    const next = Math.max(0, Math.min(10, current + amount));
    window.userMastery.Similarity = next;
    if (window.supabaseClient && window.currentUser) {
        try {
            const h = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient.from('assignment').update({ Similarity: next }).eq('userName', window.currentUser).eq('hour', h);
        } catch (e) { console.error("Supabase sync failed"); }
    }
}

function finishSimilarityGame() {
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:80px;"><h2>Complete!</h2></div>`;
    setTimeout(() => { if (window.loadNextQuestion) window.loadNextQuestion(); }, 2000);
}

const simStyle = document.createElement('style');
simStyle.innerHTML = `
    .sim-input-wrapper { display:flex; align-items:center; background:white; border:1px solid #cbd5e1; border-radius:8px; padding:6px 12px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
    .sim-tag { font-size:14px; font-weight:bold; margin-right:10px; font-family: monospace; }
    .sim-mini-input { border:none; width:90px; height:34px; font-size:16px; text-align:center; outline:none; background:transparent; }
    .sim-submit-btn { background:#0f172a; color:white; border:none; padding:12px 40px; border-radius:8px; font-weight:bold; cursor:pointer; width: 100%; max-width: 300px; }
    .sim-submit-btn:hover { background:#334155; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
`;
document.head.appendChild(simStyle);
