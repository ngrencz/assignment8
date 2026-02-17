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
    
    let startX = Math.floor(Math.random() * 4) - 2;
    let startY = Math.floor(Math.random() * 4) - 2;
    currentShape = [[startX, startY], [startX, startY+2], [startX+1, startY+1]];
    targetShape = JSON.parse(JSON.stringify(currentShape));

    for (let i = 0; i < moveCount; i++) {
        let moveType = (i === 0) ? 'translation' : ['translation', 'reflectX', 'reflectY', 'rotate', 'dilate'][Math.floor(Math.random() * 5)];
        let m = generateMove(moveType);
        applyMoveToPoints(targetShape, m);
    }

    renderUI();
}

function generateMove(type) {
    if (type === 'translation') return { type, dx: Math.floor(Math.random() * 5) - 2, dy: Math.floor(Math.random() * 5) - 2 };
    if (type === 'reflectX') return { type };
    if (type === 'reflectY') return { type };
    if (type === 'rotate') return { type, deg: 90, dir: 'CW' }; 
    if (type === 'dilate') return { type, factor: 2 };
    return { type: 'translation', dx: 1, dy: 1 };
}

function applyMoveToPoints(pts, m) {
    pts.forEach(p => {
        if (m.type === 'translation') { p[0] += m.dx; p[1] += m.dy; }
        else if (m.type === 'reflectX') { p[1] = -p[1]; }
        else if (m.type === 'reflectY') { p[0] = -p[0]; }
        else if (m.type === 'rotate') {
            let x = p[0], y = p[1];
            if (m.deg === 180) { p[0] = -x; p[1] = -y; }
            else if ((m.deg === 90 && m.dir === 'CW') || (m.deg === 270)) { p[0] = y; p[1] = -x; }
            else if ((m.deg === 90 && m.dir === 'CCW')) { p[0] = -y; p[1] = x; }
        }
        else if (m.type === 'dilate') { p[0] *= m.factor; p[1] *= m.factor; }
    });
}

function renderUI() {
    const qContent = document.getElementById('q-content');
    if (!qContent) return;
    document.getElementById('q-title').innerText = `Transformations (Round ${currentRound}/3)`;
    
    let html = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px; position:relative;">
            <canvas id="gridCanvas" width="300" height="300" style="background: white; border-radius: 8px; border: 1px solid #cbd5e1;"></canvas>
            <div id="playback-label" style="display:none; position:absolute; top:10px; left:10px; background:#3b82f6; color:white; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold;">PLAYBACK</div>
        </div>
        
        <div id="user-sequence" style="min-height:60px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; padding:12px; margin-bottom:15px; display:flex; flex-wrap:wrap; gap:8px;">
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8; font-size:0.9rem;">Add steps to begin...</span>' : 
                moveSequence.map((m, i) => `
                <div style="display:flex; align-items:center; background:${editingIndex === i ? '#3b82f6' : '#edf2f7'}; color:${editingIndex === i ? 'white' : '#2d3748'}; border-radius:8px; overflow:hidden; border: 1px solid #cbd5e1; font-size:12px; font-weight:bold;">
                    <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="padding:8px 10px; cursor:pointer;">${i+1}. ${formatMove(m)}</div>
                    <div onclick="${isAnimating ? '' : `deleteStep(${i})`}" style="padding:8px; background:rgba(0,0,0,0.05); cursor:pointer; border-left:1px solid rgba(0,0,0,0.1); color:#ef4444;">×</div>
                </div>`).join('')}
        </div>

        <div id="control-panel" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:#ffffff; padding:15px; border-radius:16px; border: 1px solid #e2e8f0; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.5 : 1};">
            
            <select id="move-selector" onchange="updateSubInputs()" style="grid-column: span 2; height:40px; font-size:1rem; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc;">
                <option value="translation">Translation</option>
                <option value="reflectX">Reflection (X-Axis)</option>
                <option value="reflectY">Reflection (Y-Axis)</option>
                <option value="rotate">Rotation</option>
                <option value="dilate">Dilation</option>
            </select>

            <div id="sub-inputs" style="grid-column: span 2; display:flex; gap:10px; align-items:center; justify-content:center; padding:5px 0;"></div>

            <div style="display:flex; gap:8px; grid-column: span 2;">
                <button class="primary-btn" onclick="saveMove()" style="flex:2; height:40px; border-radius:8px;">${editingIndex === -1 ? 'Add Step' : 'Save Step'}</button>
                ${editingIndex !== -1 ? `<button onclick="cancelEdit()" style="flex:1; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer;">Cancel</button>` : ''}
            </div>

            <button class="primary-btn" onclick="startPlayback()" style="grid-column: span 2; background:#1e293b; color:white; height:45px; border-radius:8px; font-weight:700;">RUN SEQUENCE</button>
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
    if (m.type === 'rotate') return `Rot ${m.deg}° ${m.dir}`;
    if (m.type === 'dilate') return `Dil x${m.factor}`;
    return "";
}

window.updateSubInputs = function() {
    const val = document.getElementById('move-selector')?.value;
    const container = document.getElementById('sub-inputs');
    if (!container) return;
    
    let move = editingIndex !== -1 ? moveSequence[editingIndex] : null;

    if (val === 'translation') {
        container.innerHTML = `
            <input type="number" id="dx" value="${move?.dx || 0}" style="width:60px; height:40px; font-size:1.1rem; text-align:center; border-radius:8px; border:1px solid #cbd5e1;">
            <input type="number" id="dy" value="${move?.dy || 0}" style="width:60px; height:40px; font-size:1.1rem; text-align:center; border-radius:8px; border:1px solid #cbd5e1;">`;
    } else if (val === 'rotate') {
        container.innerHTML = `
            <select id="rot-deg" style="height:40px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="90" ${move?.deg == 90 ? 'selected' : ''}>90°</option>
                <option value="180" ${move?.deg == 180 ? 'selected' : ''}>180°</option>
            </select>
            <select id="rot-dir" style="height:40px; border-radius:8px; border:1px solid #cbd5e1;">
                <option value="CW" ${move?.dir == 'CW' ? 'selected' : ''}>CW</option>
                <option value="CCW" ${move?.dir == 'CCW' ? 'selected' : ''}>CCW</option>
            </select>`;
    } else if (val === 'dilate') {
        container.innerHTML = `
            <span style="font-size:0.8rem; color:#64748b;">Factor:</span>
            <input type="number" id="dil-factor" step="0.5" value="${move?.factor || 2}" style="width:70px; height:40px; font-size:1.1rem; text-align:center; border-radius:8px; border:1px solid #cbd5e1;">`;
    } else {
        container.innerHTML = `<span style="color:#94a3b8; font-size:0.8rem;">No parameters required.</span>`;
    }
}

window.saveMove = function() {
    const type = document.getElementById('move-selector').value;
    let move = { type };
    if (type === 'translation') {
        move.dx = parseInt(document.getElementById('dx').value) || 0;
        move.dy = parseInt(document.getElementById('dy').value) || 0;
    } else if (type === 'rotate') {
        move.deg = parseInt(document.getElementById('rot-deg').value);
        move.dir = document.getElementById('rot-dir').value;
    } else if (type === 'dilate') {
        move.factor = parseFloat(document.getElementById('dil-factor').value) || 1;
    }

    if (editingIndex === -1) moveSequence.push(move);
    else { moveSequence[editingIndex] = move; editingIndex = -1; }
    renderUI();
};

window.editStep = function(i) { editingIndex = i; renderUI(); };
window.cancelEdit = function() { editingIndex = -1; renderUI(); };
window.deleteStep = function(i) { moveSequence.splice(i, 1); editingIndex = -1; renderUI(); };

async function startPlayback() {
    if (moveSequence.length === 0 || isAnimating) return;
    isAnimating = true; renderUI();
    const label = document.getElementById('playback-label');
    label.style.display = 'block';

    let tempPoints = JSON.parse(JSON.stringify(currentShape));
    for (let i = 0; i < moveSequence.length; i++) {
        label.innerText = `STEP ${i + 1}`;
        await new Promise(r => setTimeout(r, 600)); 
        applyMoveToPoints(tempPoints, moveSequence[i]);
        draw(tempPoints);
    }
    await new Promise(r => setTimeout(r, 400));
    label.style.display = 'none'; isAnimating = false;
    checkFinalMatch(tempPoints);
}

function draw(pts) {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 300, step = 30;
    ctx.clearRect(0,0,size,size);
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath();
    for(let i=0; i<=size; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.moveTo(0,i); ctx.lineTo(size,i); } ctx.stroke();
    ctx.strokeStyle="#cbd5e1"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();
    
    // Target Ghost
    ctx.setLineDash([5,3]); ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.fillStyle="rgba(0,0,0,0.03)";
    drawShape(ctx, targetShape, size/2, step);

    // Active Shape
    ctx.setLineDash([]); ctx.strokeStyle="#166534"; ctx.fillStyle="rgba(34, 197, 94, 0.6)"; 
    drawShape(ctx, pts, size/2, step);
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
    const isCorrect = finalPts.every((p, i) => Math.abs(p[0] - targetShape[i][0]) < 0.1 && Math.abs(p[1] - targetShape[i][1]) < 0.1);
    if (isCorrect) {
        currentRound++;
        if (currentRound > 3) finishGame();
        else { alert("✅ Correct!"); startNewRound(); }
    } else {
        transErrorCount++; alert("❌ No match. Adjust your sequence."); renderUI();
    }
}

async function finishGame() {
    window.isCurrentQActive = false; 
    if (window.supabaseClient && window.currentUser) {
        let adj = (transErrorCount === 0) ? 1 : (transErrorCount > 3 ? -1 : 0);
        let newScore = Math.max(0, Math.min(10, currentMastery + adj));
        await window.supabaseClient.from('assignment').update({ C6Transformation: newScore }).eq('userName', window.currentUser);
    }
    setTimeout(() => { if (typeof loadNextQuestion === 'function') loadNextQuestion(); }, 1500);
}
