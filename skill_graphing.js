/**
 * skill_graphing.js
 * - Interactive Coordinate Plane.
 * - Generates CONVEX Triangles or Quadrilaterals.
 * - Axis Labeling Phase - users must identify Positive/Negative arms before plotting.
 * - Connects dots A->B->C->D automatically as found.
 * - UPDATED: Reduced to 2 rounds, added highly visible progress tracker in the UI.
 */

var graphData = {
    targetPoints: [], 
    foundPoints: [],  
    scale: 20,        
    range: 10,         
    phase: 'axis_setup', // 'axis_setup' or 'plotting'
    axesIdentified: { posX: false, negX: false, posY: false, negY: false },
    axisQueue: [] 
};

var graphRound = 1;
var totalGraphRounds = 2; // Reduced from 4 to 2

window.initGraphingGame = async function() {
    if (typeof log === 'function') {
        log(`📉 Graphing Module Initialized - Problem ${graphRound} of ${totalGraphRounds}`);
    }

    if (!document.getElementById('q-content')) return;

    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    graphRound = 1;

    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('Graphing')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            window.userMastery.Graphing = data?.Graphing || 0;
        }
    } catch (e) { 
        console.log("Supabase sync error, using local state"); 
    }

    startGraphingRound();
};

function startGraphingRound() {
    generateGraphProblem();
    renderGraphingUI();
}

function generateGraphProblem() {
    graphData.foundPoints = [];
    graphData.targetPoints = [];
    graphData.phase = 'axis_setup';
    
    // Reset identified axes for the new round
    graphData.axesIdentified = { posX: false, negX: false, posY: false, negY: false };
    
    // Shuffle the order we ask about the axes
    graphData.axisQueue = ['posX', 'negX', 'posY', 'negY'].sort(() => Math.random() - 0.5);
    
    let numPoints = Math.random() > 0.5 ? 3 : 4;
    let tempPoints = [];
    
    while(tempPoints.length < numPoints) {
        let rx = Math.floor(Math.random() * 14) - 7; 
        let ry = Math.floor(Math.random() * 14) - 7;
        if (!tempPoints.some(p => p.x === rx && p.y === ry)) {
            tempPoints.push({ x: rx, y: ry });
        }
    }

    let cx = tempPoints.reduce((s, p) => s + p.x, 0) / numPoints;
    let cy = tempPoints.reduce((s, p) => s + p.y, 0) / numPoints;

    tempPoints.sort((a, b) => {
        return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
    });

    const labels = ['A', 'B', 'C', 'D'];
    graphData.targetPoints = tempPoints.map((p, i) => ({
        x: p.x, y: p.y, label: labels[i]
    }));
}

function renderGraphingUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;

    let pointsHtml = graphData.targetPoints.map(p => 
        `<div id="pt-${p.label}" style="background:#f1f5f9; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1; font-family:monospace; font-size:16px; transition:0.3s;">
            <strong>${p.label}:</strong> (${p.x}, ${p.y})
         </div>`
    ).join('');

    // Update the main container title just in case
    const qTitle = document.getElementById('q-title');
    if (qTitle) qTitle.innerText = `Graph the Shape`;

    qContent.innerHTML = `
        <div style="text-align:center; font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 20px; background: #e2e8f0; padding: 8px 16px; border-radius: 20px; width: fit-content; margin-left: auto; margin-right: auto; border: 1px solid #cbd5e1;">
            Problem ${graphRound} of ${totalGraphRounds}
        </div>

        <div style="display: flex; gap: 30px; flex-wrap: wrap; justify-content:center;">
            <div style="position:relative; background:white; padding:10px; border-radius:8px; border:1px solid #94a3b8; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <canvas id="graphCanvas" width="400" height="400" style="cursor:crosshair;"></canvas>
                <div id="canvas-hint" style="text-align:center; font-size:12px; color:#64748b; margin-top:5px;">Setup the axes first!</div>
            </div>

            <div style="flex:1; min-width:250px; display:flex; flex-direction:column; justify-content:center;">
                
                <div id="axis-setup-ui" style="background:#fff7ed; padding:20px; border-radius:8px; border:2px solid #fdba74; text-align:center;">
                    <h3 style="color:#c2410c; margin-top:0; margin-bottom:15px;">Identify the highlighted line:</h3>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button onclick="answerAxis('pos')" style="padding:10px 20px; font-size:16px; font-weight:bold; cursor:pointer; background:#3b82f6; color:white; border:none; border-radius:6px;">Positive (+)</button>
                        <button onclick="answerAxis('neg')" style="padding:10px 20px; font-size:16px; font-weight:bold; cursor:pointer; background:#ef4444; color:white; border:none; border-radius:6px;">Negative (-)</button>
                    </div>
                    <div id="axis-feedback" style="min-height:20px; margin-top:10px; color:#ef4444; font-weight:bold; font-size:14px;"></div>
                </div>

                <div id="plotting-ui" style="display:none; flex-direction:column;">
                    <h3 style="color:#1e293b; margin-top:0; margin-bottom:10px;">Plot coordinates:</h3>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
                        ${pointsHtml}
                    </div>
                    <div id="graph-feedback" style="min-height:30px; color:#ef4444; font-weight:bold; font-size:14px;"></div>
                    <div style="background:#f8fafc; padding:15px; border-radius:6px; font-size:13px; color:#475569; border:1px solid #e2e8f0;">
                        <strong>Tip:</strong> The shape connects automatically as you find neighbors.
                    </div>
                </div>

            </div>
        </div>
        <div id="flash-overlay" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px 40px; border-radius:12px; font-size:24px; font-weight:bold; display:none; pointer-events:none; text-align:center; z-index:100;"></div>
    `;

    drawGrid();
    setupCanvasInteractions();
}

// Handles the Positive/Negative button clicks
window.answerAxis = function(answer) {
    if (graphData.phase !== 'axis_setup' || graphData.axisQueue.length === 0) return;

    let currentTarget = graphData.axisQueue[0];
    let isCorrect = false;

    if ((currentTarget === 'posX' || currentTarget === 'posY') && answer === 'pos') isCorrect = true;
    if ((currentTarget === 'negX' || currentTarget === 'negY') && answer === 'neg') isCorrect = true;

    const feedback = document.getElementById('axis-feedback');

    if (isCorrect) {
        feedback.innerText = "";
        graphData.axesIdentified[currentTarget] = true;
        graphData.axisQueue.shift(); // Remove from queue

        // Check if all axes are done
        if (graphData.axisQueue.length === 0) {
            graphData.phase = 'plotting';
            document.getElementById('axis-setup-ui').style.display = 'none';
            document.getElementById('plotting-ui').style.display = 'flex';
            document.getElementById('canvas-hint').innerText = 'Click the grid intersections to plot points';
        }
        drawGrid(); // Redraw to show new numbers / new highlight
    } else {
        feedback.innerText = "Oops! Try again.";
    }
};

function drawGrid() {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const scale = graphData.scale; 
    const center = w / 2; 

    ctx.clearRect(0, 0, w, h);
    
    // 1. Draw Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    for (let i = 0; i <= w; i += scale) {
        ctx.moveTo(i, 0); ctx.lineTo(i, h);
        ctx.moveTo(0, i); ctx.lineTo(w, i);
    }
    ctx.stroke();

    // 2. Draw Base Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(center, 0); ctx.lineTo(center, h); // Y Axis
    ctx.moveTo(0, center); ctx.lineTo(w, center); // X Axis
    ctx.stroke();

    // 3. Highlight Current Target Axis (Phase 1)
    if (graphData.phase === 'axis_setup' && graphData.axisQueue.length > 0) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#f97316"; // Bright Orange
        ctx.lineCap = "round";
        ctx.beginPath();
        let target = graphData.axisQueue[0];
        
        if (target === 'posX') { ctx.moveTo(center, center); ctx.lineTo(w, center); }
        if (target === 'negX') { ctx.moveTo(center, center); ctx.lineTo(0, center); }
        if (target === 'posY') { ctx.moveTo(center, center); ctx.lineTo(center, 0); } // Y goes up
        if (target === 'negY') { ctx.moveTo(center, center); ctx.lineTo(center, h); } // Y goes down
        ctx.stroke();
    }

    // 4. Draw Axis Numbers (Only for identified axes)
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = -graphData.range; i <= graphData.range; i++) {
        if (i === 0) continue; 
        
        if (i % 2 === 0) {
            // Check X Axis
            if (i > 0 && graphData.axesIdentified.posX) {
                ctx.fillText(i, center + (i * scale), center + 12);
            } else if (i < 0 && graphData.axesIdentified.negX) {
                ctx.fillText(i, center + (i * scale), center + 12);
            }

            // Check Y Axis (Note: HTML Canvas Y is inverted from Math Y)
            if (i > 0 && graphData.axesIdentified.posY) {
                ctx.fillText(i, center - 12, center - (i * scale)); // Going up
            } else if (i < 0 && graphData.axesIdentified.negY) {
                ctx.fillText(i, center - 12, center - (i * scale)); // Going down
            }
        }
    }

    // 5. Draw Shape and Points (Phase 2 only)
    if (graphData.phase === 'plotting') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#3b82f6";
        
        const allFound = graphData.targetPoints.every(p => graphData.foundPoints.includes(p.label));
        
        if (allFound) {
            ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
            ctx.beginPath();
            const start = graphData.targetPoints[0];
            ctx.moveTo(center + start.x*scale, center - start.y*scale);
            for(let i=1; i<graphData.targetPoints.length; i++) {
                const p = graphData.targetPoints[i];
                ctx.lineTo(center + p.x*scale, center - p.y*scale);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.beginPath();
        for (let i = 0; i < graphData.targetPoints.length; i++) {
            const current = graphData.targetPoints[i];
            const next = graphData.targetPoints[(i + 1) % graphData.targetPoints.length];

            if (graphData.foundPoints.includes(current.label) && graphData.foundPoints.includes(next.label)) {
                ctx.moveTo(center + current.x*scale, center - current.y*scale);
                ctx.lineTo(center + next.x*scale, center - next.y*scale);
            }
        }
        ctx.stroke();

        graphData.targetPoints.forEach(p => {
            if (graphData.foundPoints.includes(p.label)) {
                const px = center + (p.x * scale);
                const py = center - (p.y * scale);
                
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fillStyle = "#2563eb"; 
                ctx.fill();
                
                ctx.fillStyle = "#000";
                ctx.font = "bold 14px Arial";
                ctx.fillText(p.label, px + 10, py - 10);
            }
        });
    }
}

function setupCanvasInteractions() {
    const canvas = document.getElementById('graphCanvas');
    
    canvas.onclick = (e) => {
        // Disable canvas clicking during Phase 1
        if (graphData.phase !== 'plotting') return;
        if (graphData.foundPoints.length === graphData.targetPoints.length) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let gridX = Math.round((mouseX - 200) / 20);
        let gridY = Math.round((200 - mouseY) / 20);

        const match = graphData.targetPoints.find(p => p.x === gridX && p.y === gridY);
        const feedback = document.getElementById('graph-feedback');

        if (match) {
            if (graphData.foundPoints.includes(match.label)) {
                feedback.innerText = "Already found that one!";
                return;
            }

            graphData.foundPoints.push(match.label);
            
            const item = document.getElementById(`pt-${match.label}`);
            if(item) {
                item.style.background = "#dcfce7";
                item.style.borderColor = "#22c55e";
            }
            feedback.innerText = "";
            
            drawGrid(); 

            if (graphData.foundPoints.length === graphData.targetPoints.length) {
                handleRoundWin();
            }

        } else {
            feedback.innerText = `Missed! You clicked (${gridX}, ${gridY})`;
        }
    };
}

async function handleRoundWin() {
    showFlash("Nice Shape!", "success");
    
    let current = window.userMastery.Graphing || 0;
    let nextScore = Math.min(10, current + 1);
    window.userMastery.Graphing = nextScore;

    if (window.supabaseClient && window.currentUser) {
        try {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
            await window.supabaseClient
                .from('assignment')
                .update({ Graphing: nextScore })
                .eq('userName', window.currentUser)
                .eq('hour', currentHour);
        } catch (e) { 
            console.error("DB Save Fail", e); 
        }
    }

    graphRound++;
    setTimeout(() => {
        if (graphRound > totalGraphRounds) finishGraphingGame();
        else startGraphingRound(); 
    }, 1500);
}

function finishGraphingGame() {
    window.isCurrentQActive = false;
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; text-align:center;">
            <div style="font-size:60px; margin-bottom:10px;">📉</div>
            <h2 style="color:#1e293b;">Graphing Completed!</h2>
            <p style="color:#64748b;">Loading next skill...</p>
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
    overlay.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}
