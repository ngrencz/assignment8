// Global State
var currentShape = [];
var targetShape = [];
var transErrorCount = 0;
var currentMastery = 0;
var moveSequence = []; 
var targetPath = [];   
var currentRound = 1;
var editingIndex = -1; 
var isAnimating = false; // Prevents input during playback

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
            <div id="playback-label" style="display:none; position:absolute; top:10px; left:10px; background:#3b82f6; color:white; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">PLAYBACK: STEP 1</div>
        </div>
        
        <div id="user-sequence" style="min-height:50px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:10px; margin-bottom:10px; display:flex; flex-wrap:wrap; gap:8px;">
            ${moveSequence.length === 0 ? '<span style="color:#94a3b8; font-size:0.85rem;">Build your sequence...</span>' : 
                moveSequence.map((m, i) => `
                <div onclick="${isAnimating ? '' : `editStep(${i})`}" style="cursor:pointer; background:${editingIndex === i ? '#3b82f6' : '#14532d'}; color:white; padding:6px 10px; border-radius:6px; font-size:12px; border: ${editingIndex === i ? '2px solid #1e3a8a' : 'none'};">
                    ${i+1}. ${formatMove(m)}
                </div>`).join('')}
        </div>

        <div id="control-panel" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; background:#f1f5f9; padding:12px; border-radius:8px; border:1px solid #e2e8f0; pointer-events: ${isAnimating ? 'none' : 'auto'}; opacity: ${isAnimating ? 0.5 : 1};">
            <select id="move-selector" class="math-input" onchange="updateSubInputs()" style="grid-column: span 2;">
                <option value="translation">Translation (x,y)</option>
                <option value="reflectX">Reflect over X-Axis</option>
                <option value="reflectY">Reflect over Y-Axis</option>
                <option value="rotate">Rotate 90° CW</option>
                <option value="dilate">Dilate (x2)</option>
            </select>
            <div id="sub-inputs" style="display:flex; gap:4px; align-items:center; justify-content:center;"></div>
            <div style="display:flex; gap:5px; grid-column: span 2;">
                <button class="primary-btn" onclick="saveMove()" style="flex:2;">${editingIndex === -1 ? 'Add Instruction' : 'Update Step'}</button>
                ${editingIndex !== -1 ? `<button class="secondary-btn" onclick="cancelEdit()" style="flex:1;">Cancel</button>` : ''}
            </div>
            <button class="primary-btn" onclick="startPlayback()" style="grid-column: span 2; background:#000; color:white; padding:12px; margin-top:5px; border-radius:8px;">RUN SEQUENCE</button>
        </div>
    `;

    qContent.innerHTML = html;
    updateSubInputs(); 
    draw(currentShape); // Initial draw
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
    if (val === 'translation') {
        container.innerHTML = `<input type="number" id="dx" value="0" style="width:40px" class="math-input"> <input type="number" id="dy" value="0" style="width:40px" class="math-input">`;
    } else {
        container.innerHTML = `<span style="color:#64748b; font-size:0.8rem;">Ready</span>`;
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

async function startPlayback() {
    if (moveSequence.length === 0 || isAnimating) return;
    isAnimating = true;
    renderUI(); // Lock UI

    const label = document.getElementById('playback-label');
    label.style.display = 'block';

    let tempPoints = JSON.parse(JSON.stringify(currentShape));
    draw(tempPoints);

    for (let i = 0; i < moveSequence.length; i++) {
        label.innerText = `PLAYBACK: STEP ${i + 1}`;
        await new Promise(r => setTimeout(r, 600)); // Delay between steps
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

    // Grid & Axes
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath();
    for(let i=0; i<=size; i+=step){ ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.moveTo(0,i); ctx.lineTo(size,i); } ctx.stroke();
    ctx.strokeStyle="#94a3b8"; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();

    // Ghost Target
    ctx.lineWidth=2; ctx.setLineDash([4,2]); ctx.strokeStyle="#000"; ctx.fillStyle="rgba(0,0,0,0.05)";
    drawShape(ctx, targetShape, size/2, step);

    // Live Result
    ctx.setLineDash([]); ctx.strokeStyle="#14532d"; ctx.fillStyle="rgba(76, 187, 23, 0.6)"; 
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
        else { alert("Confirmed! Next puzzle."); startNewRound(); }
    } else {
        transErrorCount++;
        alert("Mismatch. Adjust your instructions and run it again.");
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
