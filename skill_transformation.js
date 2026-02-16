// Unique variables for this module
let currentShape = [];
let targetShape = [];
let transErrorCount = 0; // Renamed to avoid collision
let currentSkill = "";

const SKILLS = ['C6Translation', 'C6ReflectionX', 'C6ReflectionY', 'C6ReflectionXY', 'C6Rotation', 'C6Dilation'];

async function initTransformationGame() {
    // NO 'let' here - these belong to the Hub
    isCurrentQActive = true;
    currentQSeconds = 0;
    
    transErrorCount = 0;

    // 1. Diagnostic: Find the lowest score to practice
    const { data, error } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
    if (error) return console.error(error);

    let skillScores = SKILLS.map(s => ({ name: s, val: data[s] || 0 }));
    skillScores.sort((a, b) => a.val - b.val);
    currentSkill = skillScores[0].name;

    // 2. Setup Problem
    let start = [[0, 0], [0, 2], [1, 1]];
    targetShape = JSON.parse(JSON.stringify(start));
    
    // Apply the "Secret Move" to create the target
    applySecretMove(currentSkill);

    // 3. Reset State
    currentShape = JSON.parse(JSON.stringify(start));
    currentQCap = (currentSkill.includes('Rotation') || currentSkill.includes('XY')) ? 150 : 90;

    renderUI();
}

function applySecretMove(skill) {
    let tx = Math.floor(Math.random() * 3) - 1;
    let ty = Math.floor(Math.random() * 3) - 1;

    switch(skill) {
        case 'C6Translation': targetShape.forEach(p => { p[0] += (tx||1); p[1] += (ty||1); }); break;
        case 'C6ReflectionX': targetShape.forEach(p => p[1] = -p[1]); break;
        case 'C6ReflectionY': targetShape.forEach(p => p[0] = -p[0]); break;
        case 'C6ReflectionXY': targetShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=x; }); break;
        case 'C6Rotation': targetShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=-x; }); break;
        case 'C6Dilation': targetShape.forEach(p => { p[0]*=2; p[1]*=2; }); break;
    }
}

function renderUI() {
    document.getElementById('q-title').innerText = `Transformations: ${currentSkill.replace('C6', '')}`;
    
    

    document.getElementById('q-content').innerHTML = `
        <div style="display: flex; justify-content: center; margin-bottom: 10px;">
            <canvas id="gridCanvas" width="300" height="300" style="background: white; border-radius: 8px; border: 1px solid var(--gray-med);"></canvas>
        </div>
        
        <p style="text-align:center; color:var(--gray-text); font-weight: bold;">Move the green shape onto the black ghost shape.</p>

        <div class="test-controls" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; background: transparent; border: none; padding: 0;">
            <button class="primary-btn" style="padding: 8px;" onclick="move('left')">Left</button> 
            <button class="primary-btn" style="padding: 8px;" onclick="move('up')">Up</button> 
            <button class="primary-btn" style="padding: 8px;" onclick="move('reflectX')">Reflect X</button>
            
            <button class="primary-btn" style="padding: 8px;" onclick="move('right')">Right</button> 
            <button class="primary-btn" style="padding: 8px;" onclick="move('down')">Down</button> 
            <button class="primary-btn" style="padding: 8px;" onclick="move('reflectY')">Reflect Y</button>
            
            <button class="primary-btn" style="padding: 8px;" onclick="move('rotate')">Rotate 90°</button> 
            <button class="primary-btn" style="padding: 8px;" onclick="move('dilate')">Dilate x2</button> 
            <button class="primary-btn" style="padding: 8px;" onclick="move('reflectXY')">Reflect Y=X</button>
            
            <button onclick="checkMatch()" style="grid-column: span 3; background:var(--black); color: white; border-radius: 8px; padding: 12px; cursor: pointer; font-weight: bold;">CHECK MY WORK</button>
        </div>
    `;
    draw();
}

function move(type) {
    if (type === 'left') currentShape.forEach(p => p[0] -= 1);
    if (type === 'right') currentShape.forEach(p => p[0] += 1);
    if (type === 'up') currentShape.forEach(p => p[1] += 1);
    if (type === 'down') currentShape.forEach(p => p[1] -= 1);
    if (type === 'reflectX') currentShape.forEach(p => p[1] = -p[1]);
    if (type === 'reflectY') currentShape.forEach(p => p[0] = -p[0]);
    if (type === 'reflectXY') currentShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=x; });
    if (type === 'rotate') currentShape.forEach(p => { let x=p[0]; p[0]=p[1]; p[1]=-x; });
    if (type === 'dilate') currentShape.forEach(p => { p[0]*=2; p[1]*=2; });
    draw();
}

function draw() {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,300,300);

    // Grid Lines
    ctx.strokeStyle="#f1f5f9"; 
    ctx.beginPath();
    for(let i=0; i<=300; i+=30){ 
        ctx.moveTo(i,0); ctx.lineTo(i,300); 
        ctx.moveTo(0,i); ctx.lineTo(300,i); 
    } 
    ctx.stroke();

    // Axes
    ctx.strokeStyle="#94a3b8"; 
    ctx.lineWidth=2; 
    ctx.beginPath();
    ctx.moveTo(150,0); ctx.lineTo(150,300); 
    ctx.moveTo(0,150); ctx.lineTo(300,150); 
    ctx.stroke();

    // Y=X Line
    if(currentSkill === 'C6ReflectionXY'){
        ctx.setLineDash([5,5]); ctx.strokeStyle="#4CBB17"; 
        ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(300,0); ctx.stroke(); ctx.setLineDash([]);
    }

    // Target Shape (The Ghost)
    ctx.lineWidth=2;
    ctx.setLineDash([4,2]);
    ctx.strokeStyle="#000";
    ctx.fillStyle="rgba(0,0,0,0.05)";
    drawShape(ctx, targetShape);

    // Current Shape (The Kelly Green active shape)
    ctx.setLineDash([]);
    ctx.strokeStyle="#14532d";
    ctx.fillStyle="rgba(76, 187, 23, 0.6)"; 
    drawShape(ctx, currentShape);
}

function drawShape(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => {
        let x = 150 + (p[0] * 30); let y = 150 - (p[1] * 30);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

async function checkMatch() {
    const feedback = document.getElementById('feedback-box');
    const isCorrect = currentShape.every((p, i) => Math.abs(p[0]-targetShape[i][0]) < 0.1 && Math.abs(p[1]-targetShape[i][1]) < 0.1);
    
    feedback.style.display = "block";

    if (isCorrect) {
        feedback.className = "correct";
        feedback.innerText = "Match Confirmed! Transformation complete.";

        let score = Math.max(1, 10 - (transErrorCount * 2));
        const { data } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
        
        let updates = {};
        updates[currentSkill] = score;
        
        let total = score; let count = 1;
        SKILLS.forEach(s => { if(s !== currentSkill && data[s] !== null){ total += data[s]; count++; } });
        updates['C6Transformation'] = Math.round(total/count);

        await supabaseClient.from('assignment').update(updates).eq('userName', currentUser);
        
        setTimeout(() => { loadNextQuestion(); }, 1500);
    } else {
        transErrorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Not quite matching. Look at the coordinates and try another move!";
    }
}
