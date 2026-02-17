// Global State
var currentShape = [];
var targetShape = [];
var transErrorCount = 0;
var currentMastery = 0;
var moveSequence = []; 
var targetPath = [];   
var currentRound = 1;
var editingIndex = -1; 
var isAnimating = false;

const SKILLS = ['C6Translation', 'C6ReflectionX', 'C6ReflectionY', 'C6ReflectionXY', 'C6Rotation', 'C6Dilation'];

window.initTransformationGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    transErrorCount = 0;
    currentRound = 1;
    editingIndex = -1;

    try {
        const { data } = await window.supabaseClient
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .maybeSingle();
        currentMastery = data?.C6Transformation || 0;
    } catch (e) {
        currentMastery = 0;
    }

    startNewRound();
};

function startNewRound() {
    moveSequence = [];
    editingIndex = -1;
    isAnimating = false;
    
    let moveCount = currentMastery >= 8 ? 6 : (currentMastery >= 5 ? 5 : 3);
    
    let startX = Math.floor(Math.random() * 5) - 2;
    let startY = Math.floor(Math.random() * 5) - 2;
    currentShape = [[startX, startY], [startX, startY+2], [startX+1, startY+1]];
    targetShape = JSON.parse(JSON.stringify(currentShape));

    targetPath = [];
    for (let i = 0; i < moveCount; i++) {
        let moveType = (i === 0) ? 'translation' : ['translation', 'reflectX', 'reflectY', 'rotate', 'dilate'][Math.floor(Math.random() * 5)];
        let m = generateMove(moveType);
        applyMoveToPoints(targetShape, m);
        targetPath.push(m);
    }

    renderUI();
}

function generateMove(type) {
    if (type === 'translation') {
        let dx = Math.floor(Math.random() * 7) - 3;
        let dy = Math.floor(Math.random() * 7) - 3;
        if (dx === 0 && dy === 0) dx = 1;
        return { type, dx, dy };
    }
    if (type === 'reflectX') return { type };
    if (type === 'reflectY') return { type };
    if (type === 'rotate') return { type }; 
    if (type === 'dilate') return { type, factor: 2 };
    return { type: 'translation', dx: 1, dy: 1 };
}

function applyMoveToPoints(pts, m) {
    pts.forEach(p => {
        if (m.type === 'translation') { p[0] += m.dx; p[1] += m.dy; }
        else if (m.type === 'reflectX') { p[1] = -p[1]; }
        else if (m.type === 'reflectY') { p[0] = -p[0]; }
        else if (m.type === 'rotate') { let x=p[0]; p[0]=p[1]; p[1]=-x; }
        else if (m.type === 'dilate') { p[0]*=m.factor; p[1]*=m.factor; }
    });
}

function renderUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = `Complex Transformations (Round ${currentRound}/3)`;
    
    let html = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px; position:relative;">
            <canvas id="gridCanvas" width="300" height="300" style="background: white; border-radius: 8px; border: 1px solid #cbd5e1;"></canvas>
            <div id="playback-label" style="display:none; position:absolute; top:10px; left:10px; background:#3b82f6; color:white; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">PLAYBACK</div>
        </div>
        
        <div id="user-sequence" style="min-height:60px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; padding:12px; margin-bottom:15px; display:flex; flex-wrap:wrap; gap:8px;">
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8; font-size:0.9rem;">Add steps to begin...</span>' : 
                moveSequence.map((m, i) => `
                <div style="display:flex; align-items:center; background:${editingIndex === i ? '#3b82f6' : '#edf2f7'}; color:${editingIndex === i ? 'white' : '#2d3748'}; border-radius:8px; overflow:hidden; border: 1px solid #cbd5e1; font-size:13px; font-weight:bold;">
                    <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="padding:8px 12px; cursor:pointer;">
                        ${i+1}. ${formatMove(m)}
                    </div>
                    <div onclick="${isAnimating ? '' : `deleteStep(${i})`}" style="padding:8px; background:rgba(0,0,0,0.05); cursor:pointer; border-left:1px solid rgba(0,0,0,0.1); color:#ef4444;">×</div>
                </div>`).join('')}
        </div>

        <div id="control-panel" style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; background:#ffffff; padding:20px; border-radius:16px; border: 1px solid #e2e8f0; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.5 : 1};">
            
            <label style="grid-column: span 2; font-weight:600; color:#64748b; font-size:0.85rem;">MOVE TYPE</label>
            <select id="move-selector" class="math-input" onchange="updateSubInputs()" style="grid-column: span 2; height:45px; font-size:1rem; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc;">
                <option value="translation">Translation (x,y)</option>
                <option value="reflectX">Reflect over X-Axis</option>
                <option value="reflectY">Reflect over Y-Axis</option>
                <option value="rotate">Rotate 90° CW</option>
                <option value="dilate">Dilate (x2)</option>
            </select>

            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:12px; align-items:center; justify-content:center; padding:5px 0;">
                </div>

            <div style="display:flex; gap:8px; grid-column: span 2;">
                <button class="primary-btn" onclick="saveMove()" style="flex:2; height:45px; border-radius:8px;">
                    ${editingIndex === -1 ? 'Add Instruction' : 'Save Changes'}
                </button>
                ${editingIndex !== -1 ? `<button class="secondary-btn" onclick="cancelEdit()" style="flex:1; background:#f1f5f9; border-radius:8px;">Cancel</button>` : ''}
            </div>

            <button class="primary-btn" onclick="startPlayback()" style="grid-column: span 2; background:#1e293b; color:white; padding:12px; margin-top:5px; border-radius:8px; font-weight:700;">RUN SEQUENCE</button>
        </div>
    `;

    qContent.innerHTML = html;
    updateSubInputs(); 
    draw(currentShape); 
}

function formatMove(m) {
    if (m.type === 'translation') return `T(${m.dx}, ${m.dy})`;
    if (m.type === 'reflectX') return `Ref-X`;
    if (m.type === 'reflectY') return `Ref-Y`;
    if (m.type === 'rotate') return `Rot-90`;
    if (m.type === 'dilate') return `Dil-x2`;
    return "";
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector')?.value;
    const container = document.getElementById('sub-inputs');
    if (!container) return;
    
    let currentDX = 0; let currentDY = 0;
    if (editingIndex !== -1 && moveSequence[editingIndex].type === 'translation') {
        currentDX = moveSequence[editingIndex].dx;
        currentDY = moveSequence[editingIndex].dy;
    }

    if (val === 'translation') {
        container.innerHTML = `
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:0.8rem; color:#94a3b8;">X</span>
                <input type="number" id="dx" value="${currentDX}" style="width:65px; height:45px; font-size:1.2rem; text-align:center; border-radius:8px; border:1px solid #cbd5e1; color:#334155;">
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:0.8rem; color:#94a3b8;">Y</span>
                <input type="number" id="dy" value="${currentDY}" style="width:65px; height:45px; font-size:1.2rem; text-align:center; border-radius:8px; border:1px solid #cbd5e1; color:#334155;">
            </div>`;
    } else {
        container.innerHTML = `<span style="color:#94a3b8; font-size:0.85rem;">Standard move - no parameters.</span>`;
    }
}

window.saveMove = function() {
    const type = document.getElementById('move-selector').value;
    let move = { type };
    if (type === 'translation') {
        move.dx = parseInt(document.getElementById('dx').value) || 0;
        move.dy = parseInt(document.getElementById('dy').value) || 0;
    }
    if (editingIndex === -1) moveSequence.push(move);
    else { moveSequence[editingIndex] = move; editingIndex = -1; }
    renderUI();
};

window.editStep = function(index) { editingIndex = index; renderUI(); };
window.cancelEdit = function() { editingIndex = -1; renderUI(); };

window.deleteStep = function(index) {
    moveSequence.splice(index, 1);
    if (editingIndex === index) editingIndex = -1;
    else if (editingIndex > index) editingIndex--;
    renderUI();
}

async function startPlayback() {
    if (moveSequence.length === 0 || isAnimating) return;
    isAnimating = true;
    renderUI(); 

    const label = document.getElementById('playback-label');
    label.style.display = 'block';

    let tempPoints = JSON.parse(JSON.stringify(currentShape));
    draw(tempPoints);

    for (let i = 0; i < moveSequence.length; i++) {
        label.innerText = `STEP ${i + 1}`;
        await new Promise(r => setTimeout(r, 600)); 
        applyMoveToPoints(tempPoints, moveSequence[i]);
        draw(tempPoints);
    }

    await new Promise(r => setTimeout(r, 400));
    label.style.display = 'none';
    isAnimating = false;
    checkFinalMatch(tempPoints);
}

function draw(ptsToDraw) {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 300, step = 30;
    ctx.clearRect(0,0,size,size);

    ctx.strokeStyle="#f1f5f9"; ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0; i<=size; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.moveTo(0,i); ctx.lineTo(size,i); } ctx.stroke();
    
    ctx.strokeStyle="#cbd5e1"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();

    // Ghost Target
    ctx.lineWidth=2; ctx.setLineDash([5,3]); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.fillStyle="rgba(0,0,0,0.03)";
    drawShape(ctx, targetShape, size/2, step);

    // Live Shape
    ctx.setLineDash([]); ctx.strokeStyle="#166534"; ctx.fillStyle="rgba(34, 197, 94, 0.6)"; 
    drawShape(ctx, ptsToDraw, size/2, step);
}

function drawShape(ctx, pts, center, step) {
    ctx.beginPath();
    pts.forEach((p, i) => {
        let x = center + (p[0] * step); let y = center - (p[1] * step);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

function checkFinalMatch(finalPts) {
    const isCorrect = finalPts.every((p, i) => 
        Math.abs(p[0] - targetShape[i][0]) < 0.1 && Math.abs(p[1] - targetShape[i][1]) < 0.1
    );

    if (isCorrect) {
        currentRound++;
        if (currentRound > 3) finishGame();
        else { alert("✅ Success! Next round."); startNewRound(); }
    } else {
        transErrorCount++;
        alert("❌ No match. Check your steps and run again.");
        renderUI();
    }
}

async function finishGame() {
    window.isCurrentQActive = false; 
    if (window.supabaseClient && window.currentUser) {
        let adjustment = (transErrorCount === 0) ? 1 : (transErrorCount > 3 ? -1 : 0);
        let newScore = Math.max(0, Math.min(10, currentMastery + adjustment));
        await window.supabaseClient.from('assignment').update({ C6Transformation: newScore }).eq('userName', window.currentUser);
    }
    setTimeout(() => { if (typeof loadNextQuestion === 'function') loadNextQuestion(); }, 1500);
}
