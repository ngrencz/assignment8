let currentShape = [];
let targetShape = [];
let errorCount = 0;
let currentSkill = "";

const SKILLS = ['C6Translation', 'C6ReflectionX', 'C6ReflectionY', 'C6ReflectionXY', 'C6Rotation', 'C6Dilation'];

async function initTransformationGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    errorCount = 0;

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
        <canvas id="gridCanvas" width="300" height="300"></canvas>
        
        <p style="text-align:center; color:var(--gray-text);">Move the green shape onto the black ghost shape.</p>

        <div style="margin-top:15px; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
            <button onclick="move('left')">Left</button> 
            <button onclick="move('up')">Up</button> 
            <button onclick="move('reflectX')">Reflect X</button>
            
            <button onclick="move('right')">Right</button> 
            <button onclick="move('down')">Down</button> 
            <button onclick="move('reflectY')">Reflect Y</button>
            
            <button onclick="move('rotate')">Rotate 90°</button> 
            <button onclick="move('dilate')">Dilate x2</button> 
            <button onclick="move('reflectXY')">Reflect Y=X</button>
            
            <button onclick="checkMatch()" style="grid-column: span 3; background:var(--black); box-shadow:0 4px 0 #000;">CHECK MY WORK</button>
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
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,300,300);

    // Grid Lines
    ctx.strokeStyle="var(--gray-light)"; 
    ctx.beginPath();
    for(let i=0; i<=300; i+=30){ 
        ctx.moveTo(i,0); ctx.lineTo(i,300); 
        ctx.moveTo(0,i); ctx.lineTo(300,i); 
    } 
    ctx.stroke();

    // Axes
    ctx.strokeStyle="var(--gray-med)"; 
    ctx.lineWidth=2; 
    ctx.beginPath();
    ctx.moveTo(150,0); ctx.lineTo(150,300); 
    ctx.moveTo(0,150); ctx.lineTo(300,150); 
    ctx.stroke();

    // Y=X Line (Dashboard effect)
    if(currentSkill === 'C6ReflectionXY'){
        ctx.setLineDash([5,5]); ctx.strokeStyle="var(--kelly-green)"; 
        ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(300,0); ctx.stroke(); ctx.setLineDash([]);
    }

    // Shapes
    // Target Shape (The Ghost)
    ctx.lineWidth=2;
    ctx.setLineDash([4,2]);
    ctx.strokeStyle="var(--black)";
    ctx.fillStyle="rgba(0,0,0,0.05)";
    drawShape(ctx, targetShape);

    // Current Shape (The Kelly Green active shape)
    ctx.setLineDash([]);
    ctx.strokeStyle="var(--dark-green)";
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

        let score = Math.max(1, 10 - (errorCount * 2));
        const { data } = await supabaseClient.from('assignment').select('*').eq('userName', currentUser).single();
        
        let updates = {};
        updates[currentSkill] = score;
        
        // Calculate Aggregate
        let total = score; let count = 1;
        SKILLS.forEach(s => { if(s !== currentSkill && data[s] !== null){ total += data[s]; count++; } });
        updates['C6Transformation'] = Math.round(total/count);

        await supabaseClient.from('assignment').update(updates).eq('userName', currentUser);
        
        setTimeout(() => {
            initTransformationGame();
        }, 1500);
    } else {
        errorCount++;
        feedback.className = "incorrect";
        feedback.innerText = "Not quite matching. Look at the coordinates and try another move!";
    }
}
