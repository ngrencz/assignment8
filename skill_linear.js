/**
 * skill_linear.js - v2.2.0
 * Rearranged flow: Variables -> m -> b -> Equation -> Graph -> Solve.
 * Includes Dynamic Scaling, Edge-to-Edge Graphing, and full Supabase syncing.
 */

console.log("%c [LinearMath] v2.2.0 Live ", "background: #1e293b; color: #3b82f6; font-weight: bold;");

var linearData = {
    version: "2.2.0",
    scenario: {},      
    stage: 'variables', // variables, slope, intercept, eq, graph, solve, summary
    errors: 0,         
    pointsClicked: [], 
    gridConfig: { maxVal: 20, scaleStep: 1 }, // Dynamic scaling
    targetSolveX: 0,
    targetSolveY: 0
};

window.initLinearMastery = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    linearData.stage = 'variables';
    linearData.errors = 0;
    linearData.pointsClicked = [];
    
    if (!window.userMastery) window.userMastery = {};

    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearMastery, LinearEq, LinearGraph, LinearInt, LinearSolve')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            
            if (data) {
                window.userMastery.LinearMastery = data.LinearMastery || 0;
                window.userMastery.LinearEq = data.LinearEq || 0;
                window.userMastery.LinearGraph = data.LinearGraph || 0;
                window.userMastery.LinearInt = data.LinearInt || 0;
                window.userMastery.LinearSolve = data.LinearSolve || 0;
            }
        }
    } catch (e) { console.log("Sync error", e); }

    generateLinearScenario();
    renderLinearStage();
};

function generateLinearScenario() {
    const scenarios = [
        { type: 'growth', text: "A bean plant was {B} inches tall. Each week, it grows {M} inches.", unitX: "weeks", unitY: "inches", labelY: "Height", big: false },
        { type: 'growth', text: "A savings account starts with ${B}. You deposit ${M} every month.", unitX: "months", unitY: "dollars", labelY: "Balance", big: true },
        { type: 'decay',  text: "A candle is {B} cm tall. It burns down at a rate of {M} cm per hour.", unitX: "hours", unitY: "cm", labelY: "Height", big: false },
        { type: 'decay',  text: "A water tank has {B} gallons. It drains at {M} gallons per minute.", unitX: "minutes", unitY: "gallons", labelY: "Volume", big: true }
    ];

    const template = scenarios[Math.floor(Math.random() * scenarios.length)];
    let b, m;

    if (template.big) {
        // Larger scales: b up to 100, m up to 20
        b = (Math.floor(Math.random() * 5) + 2) * 20; 
        m = (Math.floor(Math.random() * 4) + 1) * 5;
    } else {
        b = Math.floor(Math.random() * 8) + 2; 
        m = Math.floor(Math.random() * 3) + 1;
    }

    if (template.type === 'decay') m *= -1;

    // Calculate dynamic grid scaling
    let maxNeeded = Math.max(Math.abs(b), Math.abs(b + (m * 10)));
    linearData.gridConfig.maxVal = maxNeeded > 20 ? Math.ceil(maxNeeded / 20) * 20 : 20;
    linearData.gridConfig.scaleStep = linearData.gridConfig.maxVal / 10;

    linearData.scenario = {
        text: template.text.replace("{B}", b).replace("{M}", Math.abs(m)),
        b: b, m: m, unitX: template.unitX, unitY: template.unitY, labelY: template.labelY
    };
}

function renderLinearStage() {
    const qContent = document.getElementById('q-content');
    const s = linearData.scenario;
    const stage = linearData.stage;

    let html = `<div style="max-width:600px; margin:0 auto;">`;
    html += `<div style="background:#f1f5f9; padding:15px; border-radius:8px; border-left:5px solid #3b82f6; margin-bottom:20px;">
                <h3 style="margin:0; color:#1e293b;">${s.text}</h3>
             </div>`;

    if (stage === 'variables') {
        html += `<h4>Part 1: Define Variables</h4>
                 <p>What do $x$ and $y$ represent in this scenario?</p>
                 <div class="step-input">x = <select id="inp-x"><option value="">--select--</option><option value="correct">${s.unitX}</option><option value="wrong">${s.unitY}</option></select></div>
                 <div class="step-input">y = <select id="inp-y"><option value="">--select--</option><option value="wrong">${s.unitX}</option><option value="correct">${s.unitY}</option></select></div>
                 <button onclick="checkLinearVars()" class="btn-primary">Next Step</button>`;
    }
    else if (stage === 'slope') {
        html += `<h4>Part 2: Rate of Change</h4>
                 <p>What is the <b>slope (m)</b> for this equation?</p>
                 <input type="number" id="inp-m" class="math-input">
                 <button onclick="checkLinearM()" class="btn-primary">Check Slope</button>`;
    }
    else if (stage === 'intercept') {
        html += `<h4>Part 3: Starting Value</h4>
                 <p>What is the <b>y-intercept (b)</b> for this equation?</p>
                 <input type="number" id="inp-b" class="math-input">
                 <button onclick="checkLinearB()" class="btn-primary">Check Intercept</button>`;
    }
    else if (stage === 'eq') {
        html += `<h4>Part 4: The Equation</h4>
                 <p>Write the full equation in $y = mx + b$ form.</p>
                 <div style="font-size:22px;">y = <input type="text" id="inp-eq" placeholder="mx + b" style="width:160px;"></div>
                 <button onclick="checkLinearEq()" class="btn-primary" style="margin-top:10px;">Check Equation</button>`;
    }
    else if (stage === 'graph') {
        html += `<h4>Part 5: Graphing</h4>
                 <p>Plot at least <b>3 points</b>. Click the grid to plot.</p>
                 <canvas id="linCanvas" width="400" height="400" style="background:white; border:1px solid #000; cursor:crosshair;"></canvas>
                 <p style="font-size:12px; color:#64748b;">Grid units: Each line = ${linearData.gridConfig.scaleStep}</p>`;
    }
    else if (stage === 'solve') {
        let tx = Math.floor(Math.random() * 5) + 5; 
        linearData.targetSolveX = tx;
        linearData.targetSolveY = s.m * tx + s.b;
        html += `<h4>Part 6: Predict</h4>
                 <p>Using your equation, what will the ${s.labelY.toLowerCase()} ($y$) be after <b>${tx} ${s.unitX}</b>?</p>
                 <input type="number" id="inp-solve" class="math-input"> ${s.unitY}
                 <button onclick="checkLinearD()" class="btn-primary">Submit Answer</button>`;
    }

    html += `<div id="lin-feedback" style="margin-top:15px; min-height:30px; font-weight:bold;"></div></div>`;
    qContent.innerHTML = html;

    if (stage === 'graph') setupLinearGraph();
}

// --- CHECK LOGIC ---

window.checkLinearVars = function() {
    if (document.getElementById('inp-x').value === 'correct' && document.getElementById('inp-y').value === 'correct') {
        linearData.stage = 'slope'; renderLinearStage();
    } else {
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Think: Which one is "time" or "input" (x), and which one is the "result" (y)?</span>`;
    }
}

window.checkLinearM = function() {
    let val = parseFloat(document.getElementById('inp-m').value);
    if (val === linearData.scenario.m) {
        linearData.stage = 'intercept'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Try again. Slope is the <b>rate of change</b> (how much it changes each ${linearData.scenario.unitX.slice(0,-1)}).</span>`;
    }
}

window.checkLinearB = function() {
    let val = parseFloat(document.getElementById('inp-b').value);
    if (val === linearData.scenario.b) {
        linearData.stage = 'eq'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Try again. The y-intercept is the <b>initial value</b> (the height or amount at time zero).</span>`;
    }
}

async function checkLinearEq() {
    let userVal = document.getElementById('inp-eq').value.replace(/\s/g, '').toLowerCase();
    const { m, b } = linearData.scenario;
    let mPart = (m === 1 ? "x" : (m === -1 ? "-x" : m + "x"));
    let bPart = (b >= 0 ? "+" + b : b);
    let correct = mPart + bPart;

    if (userVal === correct || userVal === "y=" + correct) {
        await handleSubSuccess('LinearEq');
        linearData.stage = 'graph'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Format: y = mx + b. Using your values: y = ${m}x + ${b}</span>`;
    }
}

// --- GRAPHING ---

function setupLinearGraph() {
    const canvas = document.getElementById('linCanvas');
    const ctx = canvas.getContext('2d');
    const cfg = linearData.gridConfig;
    const pixelStep = 400 / 10; // 10 grid sections

    const draw = () => {
        ctx.clearRect(0,0,400,400);
        ctx.strokeStyle = "#e2e8f0";
        for(let i=0; i<=10; i++) {
            ctx.beginPath(); ctx.moveTo(i*pixelStep,0); ctx.lineTo(i*pixelStep,400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i*pixelStep); ctx.lineTo(400,i*pixelStep); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(2,400); ctx.lineTo(400,400); ctx.stroke();

        ctx.fillStyle = "#666"; ctx.font = "10px Arial";
        for(let i=0; i<=10; i+=2) {
            ctx.fillText(i * cfg.scaleStep, (i*pixelStep)+2, 395);
            ctx.fillText(i * cfg.scaleStep, 5, 400 - (i*pixelStep) - 2);
        }

        linearData.pointsClicked.forEach(p => {
            ctx.fillStyle = "#2563eb";
            ctx.beginPath(); ctx.arc(p.cx, p.cy, 5, 0, Math.PI*2); ctx.fill();
        });

        if (linearData.pointsClicked.length >= 3) {
            // Edge-to-edge line extension logic
            ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
            const x0 = 0;
            const y0 = 400 - ((linearData.scenario.b / cfg.maxVal) * 400);
            const xFinal = 400;
            const yFinal = 400 - (((linearData.scenario.m * 10 + linearData.scenario.b) / cfg.maxVal) * 400);
            
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(xFinal, yFinal);
            ctx.stroke();
            
            setTimeout(async () => {
                await handleSubSuccess('LinearGraph');
                linearData.stage = 'solve'; 
                renderLinearStage();
            }, 1500);
        }
    };

    draw();

    canvas.onclick = (e) => {
        if (linearData.pointsClicked.length >= 3) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let gx = Math.round(mx / pixelStep);
        let gy = Math.round((400 - my) / pixelStep);
        
        // Validation check against equation
        let valX = gx * cfg.scaleStep;
        let valY = gy * cfg.scaleStep;

        if (Math.abs(valY - (linearData.scenario.m * valX + linearData.scenario.b)) < 0.1) {
            linearData.pointsClicked.push({cx: gx * pixelStep, cy: 400 - (gy * pixelStep)});
            draw();
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Point (${valX}, ${valY}) does not fit your equation!</span>`;
        }
    };
}

// --- FINAL WRAP UP ---

async function checkLinearD() {
    let val = parseFloat(document.getElementById('inp-solve').value);
    if (Math.abs(val - linearData.targetSolveY) < 0.1) {
        await handleSubSuccess('LinearSolve');
        let inc = linearData.errors <= 1 ? 2 : (linearData.errors >= 4 ? -1 : 0);
        await updateSkill('LinearMastery', inc);
        showFinalLinearMessage(inc);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:red">Check your math. Plug x = ${linearData.targetSolveX} into y = ${linearData.scenario.m}x + ${linearData.scenario.b}</span>`;
    }
}

async function handleSubSuccess(colName) {
    await updateSkill(colName, 1);
}

async function updateSkill(colName, amount) {
    let current = window.userMastery[colName] || 0;
    let next = Math.max(0, Math.min(10, current + amount));
    window.userMastery[colName] = next;

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
    const msg = inc > 0 ? "+2 Mastery Points!" : (inc < 0 ? "-1 Mastery Point." : "Skill Complete.");
    
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; padding:40px;">
            <h2 style="color:#1e293b;">Goal Achieved</h2>
            <p style="font-size:24px; color:${color}; font-weight:bold;">${msg}</p>
            <button onclick="initLinearMastery()" class="btn-primary" style="margin-top:20px;">Next Scenario</button>
        </div>`;
}

// CSS injection
const style = document.createElement('style');
style.innerHTML = `
    .btn-primary { background:#3b82f6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-size:16px; }
    .step-input { margin: 15px 0; font-size: 18px; }
    .math-input { font-size: 18px; padding: 5px; width: 80px; }
    select { padding: 5px; font-size: 16px; }
`;
document.head.appendChild(style);
