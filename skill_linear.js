/**
 * skill_linear.js
 * - Generates a 4-part Linear Word Problem (Equation, Graph, Intercept, Solve).
 * - Handles Positive (Growth) and Negative (Decay) slopes.
 * - Tracks errors across the 4 parts to determine final score increment (+2 or -1).
 * - Updates sub-skills immediately after each part.
 */

var linearData = {
    scenario: {},     // Stores the text, m, b, units
    stage: 'a',       // 'a', 'b', 'c', 'd', 'summary'
    errors: 0,        // Total errors in this full problem set
    pointsClicked: [], // For graph stage
    scale: 1,         // Grid scale
    subScores: {}     // Local cache of sub-scores
};

window.initLinearMastery = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    linearData.stage = 'a';
    linearData.errors = 0;
    linearData.pointsClicked = [];
    
    // Load current scores
    if (!window.userProgress) window.userProgress = {};
    try {
        if (window.supabaseClient && window.currentUser) {
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearMastery, LinearEq, LinearGraph, LinearInt, LinearSolve')
                .eq('userName', window.currentUser)
                .maybeSingle();
            
            if (data) {
                window.userProgress.LinearMastery = data.LinearMastery || 0;
                window.userProgress.LinearEq = data.LinearEq || 0;
                window.userProgress.LinearGraph = data.LinearGraph || 0;
                window.userProgress.LinearInt = data.LinearInt || 0;
                window.userProgress.LinearSolve = data.LinearSolve || 0;
            }
        }
    } catch (e) { console.log("Sync error", e); }

    generateLinearScenario();
    renderLinearStage();
};

function generateLinearScenario() {
    const scenarios = [
        { type: 'growth', text: "I bought a bean plant that was {B} inches tall. Each week, it grows {M} inches.", unitX: "weeks", unitY: "inches", labelY: "Height" },
        { type: 'growth', text: "A savings account starts with ${B}. You deposit ${M} every month.", unitX: "months", unitY: "dollars", labelY: "Balance" },
        { type: 'decay',  text: "A candle is {B} cm tall. It burns down at a rate of {M} cm per hour.", unitX: "hours", unitY: "cm", labelY: "Height" },
        { type: 'decay',  text: "A water tank has {B} gallons. It drains at {M} gallons per minute.", unitX: "minutes", unitY: "gallons", labelY: "Volume" }
    ];

    const template = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    // Generate Numbers based on type
    let b, m;
    if (template.type === 'growth') {
        b = Math.floor(Math.random() * 5) + 1; // Start 1-5
        m = Math.floor(Math.random() * 3) + 1; // Slope 1-3
    } else {
        b = Math.floor(Math.random() * 10) + 10; // Start 10-20
        m = (Math.floor(Math.random() * 3) + 1) * -1; // Slope -1 to -3
    }

    linearData.scenario = {
        text: template.text.replace("{B}", b).replace("{M}", Math.abs(m)),
        b: b,
        m: m,
        unitX: template.unitX,
        unitY: template.unitY,
        labelY: template.labelY
    };
}

function renderLinearStage() {
    const qContent = document.getElementById('q-content');
    const s = linearData.scenario;
    const stage = linearData.stage;

    // Header
    let html = `<div style="max-width:600px; margin:0 auto;">`;
    html += `<div style="background:#f1f5f9; padding:15px; border-radius:8px; border-left:5px solid #3b82f6; margin-bottom:20px;">
                <h3 style="margin:0; color:#1e293b;">${s.text}</h3>
             </div>`;

    // Stage Content
    if (stage === 'a') {
        html += `
            <h4 style="color:#475569;">Part A: Write the Equation</h4>
            <p>Write an equation to represent the ${s.labelY} (y) after x ${s.unitX}.</p>
            <div style="margin:20px 0;">
                <span style="font-size:20px; font-weight:bold;">y = </span>
                <input type="text" id="inp-eq" placeholder="mx + b" style="font-size:20px; padding:5px; width:150px;">
            </div>
            <button onclick="checkLinearA()" class="btn-primary">Check Equation</button>
        `;
    } 
    else if (stage === 'b') {
        html += `
            <h4 style="color:#475569;">Part B: Graph the Equation</h4>
            <p>Plot at least <strong>3 points</strong> on the grid that fit your equation.</p>
            <div style="position:relative; display:inline-block; border:1px solid #ccc;">
                <canvas id="linCanvas" width="400" height="400" style="cursor:crosshair; background:white;"></canvas>
            </div>
            <p style="font-size:12px; color:#64748b;">Click intersections to plot points.</p>
        `;
    }
    else if (stage === 'c') {
        html += `
            <h4 style="color:#475569;">Part C: Interpret the Y-Intercept</h4>
            <div style="display:flex; flex-direction:column; gap:15px;">
                <div>
                    <label>1. What is the value of the y-intercept?</label><br>
                    <input type="number" id="inp-int-val" style="padding:5px; margin-top:5px;">
                </div>
                <div>
                    <label>2. What does it represent in this context?</label><br>
                    <select id="inp-int-desc" style="padding:5px; margin-top:5px; width:100%;">
                        <option value="">-- Select --</option>
                        <option value="rate">How fast the ${s.labelY.toLowerCase()} changes per ${s.unitX.slice(0,-1)}</option>
                        <option value="start">The starting ${s.labelY.toLowerCase()} at time zero</option>
                        <option value="end">The final ${s.labelY.toLowerCase()} when it finishes</option>
                    </select>
                </div>
            </div>
            <button onclick="checkLinearC()" class="btn-primary" style="margin-top:15px;">Check Intercept</button>
        `;
    }
    else if (stage === 'd') {
        // Calculate a target that results in an integer if possible, else just random
        let targetX = Math.floor(Math.random() * 5) + 3; 
        let targetY = s.m * targetX + s.b;
        
        // If solving for X given Y (Reverse) or Y given X? 
        // The prompt example asks "When will the plant be 65 inches?" (Find X given Y)
        
        // Ensure valid positive Y for the question
        if (targetY < 0) targetY = 0; // Don't ask for negative height

        linearData.targetSolveX = targetX;
        linearData.targetSolveY = targetY;

        html += `
            <h4 style="color:#475569;">Part D: Solve</h4>
            <p>When will the ${s.labelY.toLowerCase()} be <strong>${targetY} ${s.unitY}</strong>?</p>
            <div style="margin:20px 0;">
                <input type="number" id="inp-solve" placeholder="?" style="font-size:20px; padding:5px; width:100px;">
                <span style="font-size:18px;"> ${s.unitX}</span>
            </div>
            <p style="font-size:14px; color:#64748b;">(Show your work separately)</p>
            <button onclick="checkLinearD()" class="btn-primary">Check Answer</button>
        `;
    }

    html += `<div id="lin-feedback" style="margin-top:15px; min-height:30px; font-weight:bold;"></div>`;
    html += `</div>`; // End container

    qContent.innerHTML = html;

    if (stage === 'b') setupLinearGraph();
}

// --- PART A: EQUATION ---
function checkLinearA() {
    const userVal = document.getElementById('inp-eq').value.replace(/\s/g, '').toLowerCase();
    const m = linearData.scenario.m;
    const b = linearData.scenario.b;
    
    // Expected formats: y=mx+b, mx+b, b+mx
    // Examples: "2x+5", "5+2x", "-3x+10"
    
    let isCorrect = false;
    
    // Simple parsing logic
    // We check if it contains the m*x part and the b part
    let mPart = (m === 1 ? "x" : (m === -1 ? "-x" : m + "x"));
    let bPart = (b > 0 ? "+" + b : b); // +5 or -5
    
    // Check variation 1: mx + b
    if (userVal === (mPart + bPart) || userVal === ("y=" + mPart + bPart)) isCorrect = true;
    
    // Check variation 2: b + mx
    let mPartSigned = (m > 0 ? "+" + mPart : mPart);
    if (userVal === (b + mPartSigned) || userVal === ("y=" + b + mPartSigned)) isCorrect = true;

    if (isCorrect) {
        handleSubSuccess('LinearEq');
        document.getElementById('lin-feedback').innerHTML = `<span style="color:green">Correct! Equation is y = ${m}x + ${b}</span>`;
        setTimeout(() => { linearData.stage = 'b'; renderLinearStage(); }, 1500);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Try again. Slope is ${m}, Intercept is ${b}. Format: y = mx + b</span>`;
    }
}

// --- PART B: GRAPHING ---
function setupLinearGraph() {
    const canvas = document.getElementById('linCanvas');
    const ctx = canvas.getContext('2d');
    
    // Configure Grid
    // Max Y is likely around 20-30. Let's make the grid 20x20 units.
    // Canvas 400px -> 20px per unit.
    const scale = 20; 
    linearData.scale = scale;

    const draw = () => {
        ctx.clearRect(0,0,400,400);
        
        // Grid Lines
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        for(let i=0; i<=400; i+=scale) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(400,i); ctx.stroke();
        }

        // Axes (L-shape because word problems are mostly Q1)
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2,0); ctx.lineTo(2,400); ctx.lineTo(400,400); // Y and X axis (bottom-left origin visual)
        ctx.stroke();

        // Labels (Every 5 units)
        ctx.fillStyle = "#666";
        ctx.font = "10px Arial";
        for(let i=0; i<=20; i+=5) {
            ctx.fillText(i, 5, 400 - (i*scale) - 2); // Y axis numbers
            ctx.fillText(i, (i*scale) + 2, 395); // X axis numbers
        }

        // Plot User Points
        linearData.pointsClicked.forEach(p => {
            let px = p.x * scale;
            let py = 400 - (p.y * scale);
            
            ctx.fillStyle = "#2563eb";
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
        });

        // Draw Line if 3 points exist
        if (linearData.pointsClicked.length >= 3) {
            // Sort by x
            const sorted = [...linearData.pointsClicked].sort((a,b) => a.x - b.x);
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let start = sorted[0];
            ctx.moveTo(start.x*scale, 400-(start.y*scale));
            for(let i=1; i<sorted.length; i++) {
                ctx.lineTo(sorted[i].x*scale, 400-(sorted[i].y*scale));
            }
            ctx.stroke();
            
            // Auto-check logic trigger
            setTimeout(checkLinearGraph, 500);
        }
    };

    draw();

    canvas.onclick = (e) => {
        if (linearData.pointsClicked.length >= 3) return; // Max 3 points

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Snap to grid
        let gx = Math.round(mx / scale);
        let gy = Math.round((400 - my) / scale); // Invert Y

        // Prevent duplicates
        if (!linearData.pointsClicked.some(p => p.x === gx && p.y === gy)) {
            linearData.pointsClicked.push({x: gx, y: gy});
            draw();
        }
    };
}

function checkLinearGraph() {
    // Validate Points
    // Every point must satisfy y = mx + b
    const { m, b } = linearData.scenario;
    let allCorrect = true;

    linearData.pointsClicked.forEach(p => {
        let expectedY = (m * p.x) + b;
        if (p.y !== expectedY) allCorrect = false;
    });

    if (allCorrect && linearData.pointsClicked.length >= 3) {
        handleSubSuccess('LinearGraph');
        document.getElementById('lin-feedback').innerHTML = `<span style="color:green">Perfect Graph!</span>`;
        setTimeout(() => { linearData.stage = 'c'; renderLinearStage(); }, 1500);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Incorrect points. Clear and try again.</span> <button onclick="resetGraph()">Clear</button>`;
    }
}

window.resetGraph = function() {
    linearData.pointsClicked = [];
    setupLinearGraph();
};

// --- PART C: INTERCEPT ---
function checkLinearC() {
    const val = parseFloat(document.getElementById('inp-int-val').value);
    const desc = document.getElementById('inp-int-desc').value;
    
    const correctVal = linearData.scenario.b;
    // Meaning: It is the 'start' value
    
    if (val === correctVal && desc === 'start') {
        handleSubSuccess('LinearInt');
        document.getElementById('lin-feedback').innerHTML = `<span style="color:green">Correct!</span>`;
        setTimeout(() => { linearData.stage = 'd'; renderLinearStage(); }, 1500);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Incorrect. The y-intercept is where x=0 (the beginning).</span>`;
    }
}

// --- PART D: SOLVE ---
async function checkLinearD() {
    const val = parseFloat(document.getElementById('inp-solve').value);
    // Solving for X: (y - b) / m
    const correctX = linearData.targetSolveX; // We pre-calculated this integer
    
    if (Math.abs(val - correctX) < 0.1) {
        // --- FINAL SUCCESS ---
        handleSubSuccess('LinearSolve');
        
        // Main Mastery Update Logic
        let mainIncrement = 0;
        if (linearData.errors <= 1) mainIncrement = 2; // Bonus for high accuracy
        else if (linearData.errors >= 2) mainIncrement = -1; // Penalty for many errors
        
        await updateSkill('LinearMastery', mainIncrement);
        
        showFinalLinearMessage(mainIncrement);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Check your algebra. ${linearData.targetSolveY} = ${linearData.scenario.m}x + ${linearData.scenario.b}</span>`;
    }
}

// --- HELPERS ---

async function handleSubSuccess(colName) {
    // Only +1 max per question
    await updateSkill(colName, 1);
}

async function updateSkill(colName, amount) {
    let current = window.userProgress[colName] || 0;
    let next = Math.max(0, Math.min(10, current + amount)); // Clamp 0-10
    window.userProgress[colName] = next;

    if (window.supabaseClient && window.currentUser) {
        const h = sessionStorage.getItem('target_hour') || "00";
        try {
            await window.supabaseClient.from('assignment')
                .update({ [colName]: next })
                .eq('userName', window.currentUser)
                .eq('hour', h);
        } catch(e) { console.error(e); }
    }
}

function showFinalLinearMessage(inc) {
    const color = inc > 0 ? "green" : (inc < 0 ? "red" : "gray");
    const msg = inc > 0 ? "+2 Mastery Points!" : (inc < 0 ? "-1 Mastery Point." : "No change.");
    
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; padding:40px;">
            <h2 style="color:#1e293b;">Problem Complete</h2>
            <p style="font-size:24px; color:${color}; font-weight:bold;">${msg}</p>
            <p>Errors made: ${linearData.errors}</p>
            <button onclick="initLinearMastery()" class="btn-primary" style="margin-top:20px;">Next Problem</button>
        </div>
    `;
    setTimeout(() => {
       if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
    }, 3000);
}

// CSS injection for button if needed
const style = document.createElement('style');
style.innerHTML = `
    .btn-primary { background:#3b82f6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-size:16px; transition:0.2s; }
    .btn-primary:hover { background:#2563eb; }
`;
document.head.appendChild(style);
