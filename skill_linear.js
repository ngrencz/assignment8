/**
 * skill_linear.js - v2.1.0 (Live Debug Active)
 * Flow: Variables -> m -> b -> Equation -> Graph -> Solve
 */

console.log("[DEBUG] Linear Skill Script v2.1.0 Loaded");

var linearData = {
    version: "2.1.0",
    stage: 'variables', // variables, slope, intercept, equation, graph, solve, summary
    scenario: {},
    errors: 0,
    pointsClicked: [],
    graphConfig: {
        maxX: 20,
        maxY: 20,
        stepX: 2,
        stepY: 2
    },
    targetX: 0,
    targetY: 0
};

window.initLinearMastery = async function() {
    console.log(`[Linear] Initializing Version ${linearData.version}`);
    linearData.stage = 'variables';
    linearData.errors = 0;
    linearData.pointsClicked = [];

    if (!window.userMastery) window.userMastery = {};

    // Standard Supabase Sync
    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour');
            const { data } = await window.supabaseClient
                .from('assignment')
                .select('LinearMastery, LinearEq, LinearGraph, LinearInt, LinearSolve')
                .eq('userName', window.currentUser)
                .eq('hour', currentHour)
                .maybeSingle();
            if (data) Object.assign(window.userMastery, data);
        }
    } catch (e) { console.log("Sync error", e); }

    generateLinearScenario();
    renderLinearStage();
};

function generateLinearScenario() {
    const templates = [
        { type: 'growth', text: "A young redwood tree is {B} feet tall. It grows at a rate of {M} feet per year.", x: "years", y: "feet", labelY: "Tree Height", bigScale: false },
        { type: 'growth', text: "A phone battery starts at {B}%. It charges at {M}% per minute.", x: "minutes", y: "percent", labelY: "Battery Life", bigScale: true },
        { type: 'growth', text: "You start a job with a {B} dollar signing bonus. You earn {M} dollars per hour.", x: "hours", y: "dollars", labelY: "Total Pay", bigScale: true },
        { type: 'decay',  text: "A plane is at an altitude of {B} thousand feet. It descends at {M} thousand feet per minute.", x: "minutes", y: "feet", labelY: "Altitude", bigScale: true },
        { type: 'decay',  text: "A 100-gallon pool has {B} gallons left. It leaks at {M} gallons per hour.", x: "hours", y: "gallons", labelY: "Volume", bigScale: true }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    let m, b;

    if (t.bigScale) {
        b = (Math.floor(Math.random() * 5) + 2) * 20; // 40 to 120
        m = (Math.floor(Math.random() * 4) + 2) * 5;  // 10 to 30
    } else {
        b = Math.floor(Math.random() * 8) + 2; 
        m = Math.floor(Math.random() * 3) + 1;
    }

    if (t.type === 'decay') m *= -1;

    linearData.scenario = {
        text: t.text.replace("{B}", b).replace("{M}", Math.abs(m)),
        m: m, b: b, unitX: t.x, unitY: t.y, labelY: t.labelY
    };

    // Calculate Dynamic Graph Scale
    const endY = b + (m * 10);
    const maxNeededY = Math.max(b, endY, 20);
    linearData.graphConfig.maxY = Math.ceil(maxNeededY / 10) * 10;
    linearData.graphConfig.maxX = 10;
    linearData.graphConfig.stepY = linearData.graphConfig.maxY / 10;
    linearData.graphConfig.stepX = 1;
}

function renderLinearStage() {
    const qContent = document.getElementById('q-content');
    const s = linearData.scenario;
    const stage = linearData.stage;

    let html = `<div style="max-width:600px; margin:0 auto; font-family:sans-serif;">`;
    html += `<div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h3 style="margin:0; color:#1e293b; line-height:1.5;">${s.text}</h3>
             </div>`;

    if (stage === 'variables') {
        html += `<h4>Part 1: Identify Variables</h4>
                 <p>What do the variables represent in this story?</p>
                 <div style="margin:15px 0;">
                    <label><b>x</b> represents the number of: </label>
                    <select id="sel-x"><option value="wrong">---</option><option value="correct">${s.unitX}</option><option value="wrong">${s.unitY}</option></select>
                 </div>
                 <div style="margin:15px 0;">
                    <label><b>y</b> represents the total: </label>
                    <select id="sel-y"><option value="wrong">---</option><option value="wrong">${s.unitX}</option><option value="correct">${s.unitY}</option></select>
                 </div>
                 <button onclick="checkVars()" class="btn-primary">Continue</button>`;
    }
    else if (stage === 'slope') {
        html += `<h4>Part 2: The Rate of Change</h4>
                 <p>What is the <b>slope (m)</b>? (Include a negative sign if the value is decreasing)</p>
                 <input type="number" id="inp-m" style="font-size:18px; width:80px;">
                 <button onclick="checkSlope()" class="btn-primary">Check Slope</button>`;
    }
    else if (stage === 'intercept') {
        html += `<h4>Part 3: The Starting Value</h4>
                 <p>What is the <b>y-intercept (b)</b>?</p>
                 <input type="number" id="inp-b" style="font-size:18px; width:80px;">
                 <button onclick="checkIntercept()" class="btn-primary">Check Intercept</button>`;
    }
    else if (stage === 'equation') {
        html += `<h4>Part 4: Write the Equation</h4>
                 <p>Combine your values into a <b>y = mx + b</b> equation.</p>
                 <div style="font-size:22px;">y = <input type="text" id="inp-eq" placeholder="mx + b" style="width:160px;"></div>
                 <button onclick="checkEq()" class="btn-primary" style="margin-top:10px;">Build Equation</button>`;
    }
    else if (stage === 'graph') {
        html += `<h4>Part 5: Graph the Behavior</h4>
                 <p>Plot <b>3 points</b> to verify the trend. We've scaled the graph for you.</p>
                 <canvas id="linCanvas" width="400" height="400" style="border:2px solid #000; background:white; cursor:crosshair;"></canvas>
                 <div id="graph-controls" style="margin-top:10px;"></div>`;
    }
    else if (stage === 'solve') {
        const askX = Math.floor(Math.random() * 5) + 5;
        linearData.targetX = askX;
        linearData.targetY = s.m * askX + s.b;
        html += `<h4>Part 6: Predict</h4>
                 <p>Using your equation, what will the ${s.labelY.toLowerCase()} (y) be after <b>${askX} ${s.unitX}</b>?</p>
                 <input type="number" id="inp-solve" style="font-size:18px; width:100px;"> ${s.unitY}
                 <button onclick="checkSolve()" class="btn-primary">Final Check</button>`;
    }

    html += `<div id="lin-feedback" style="margin-top:15px; min-height:30px; padding:10px; border-radius:6px;"></div></div>`;
    qContent.innerHTML = html;

    if (stage === 'graph') setupLinearGraph();
}

// --- LOGIC CHECKS ---

window.checkVars = function() {
    if (document.getElementById('sel-x').value === 'correct' && document.getElementById('sel-y').value === 'correct') {
        linearData.stage = 'slope'; renderLinearStage();
    } else {
        showFeedback("Identify which unit is 'time' or 'input' (x) and which is the 'result' (y).", "red");
    }
};

window.checkSlope = function() {
    const val = parseFloat(document.getElementById('inp-m').value);
    if (val === linearData.scenario.m) {
        linearData.stage = 'intercept'; renderLinearStage();
    } else {
        linearData.errors++;
        showFeedback(`Incorrect. Remember, the slope is the <b>rate of change</b> (how much it changes per ${linearData.scenario.unitX.slice(0,-1)}).`, "red");
    }
};

window.checkIntercept = function() {
    const val = parseFloat(document.getElementById('inp-b').value);
    if (val === linearData.scenario.b) {
        linearData.stage = 'equation'; renderLinearStage();
    } else {
        linearData.errors++;
        showFeedback("Incorrect. The y-intercept is the <b>initial height</b> or starting value at time zero.", "red");
    }
};

window.checkEq = function() {
    const input = document.getElementById('inp-eq').value.replace(/\s/g, '').toLowerCase();
    const s = linearData.scenario;
    const mPart = s.m === 1 ? "x" : (s.m === -1 ? "-x" : s.m + "x");
    const bPart = s.b >= 0 ? "+" + s.b : s.b;
    const correct = mPart + bPart;

    if (input === correct || input === "y=" + correct) {
        linearData.stage = 'graph'; renderLinearStage();
    } else {
        linearData.errors++;
        showFeedback(`Plug m and b into y = mx + b. Your m is ${s.m} and your b is ${s.b}.`, "red");
    }
};

// --- GRAPHING ENGINE ---

function setupLinearGraph() {
    const canvas = document.getElementById('linCanvas');
    const ctx = canvas.getContext('2d');
    const cfg = linearData.graphConfig;

    const draw = () => {
        ctx.clearRect(0, 0, 400, 400);
        
        // Draw Grid
        ctx.strokeStyle = "#e2e8f0";
        for(let i=0; i<=10; i++) {
            let pos = i * 40;
            ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, 400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(400, pos); ctx.stroke();
        }

        // Labels
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Arial";
        for(let i=0; i<=10; i+=2) {
            ctx.fillText(i * cfg.stepX, i * 40 + 2, 395);
            ctx.fillText(i * cfg.stepY, 5, 400 - (i * 40) - 5);
        }

        // Points
        linearData.pointsClicked.forEach(p => {
            ctx.fillStyle = "#3b82f6";
            ctx.beginPath(); ctx.arc(p.canvasX, p.canvasY, 6, 0, Math.PI*2); ctx.fill();
        });

        // Extend Line to edges if 3 points correct
        if (linearData.pointsClicked.length >= 3) {
            const s = linearData.scenario;
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 4;
            ctx.beginPath();
            
            // Calculate start (x=0) and end (x=maxX) for full extension
            let x0 = 0; let y0 = 400 - (s.b / cfg.maxY * 400);
            let xEnd = 400; let yEnd = 400 - ((s.m * cfg.maxX + s.b) / cfg.maxY * 400);
            
            ctx.moveTo(x0, y0);
            ctx.lineTo(xEnd, yEnd);
            ctx.stroke();
            
            showFeedback("Excellent graphing! Line extended. Proceeding...", "green");
            setTimeout(() => { linearData.stage = 'solve'; renderLinearStage(); }, 2000);
        }
    };

    draw();

    canvas.onclick = (e) => {
        if (linearData.pointsClicked.length >= 3) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Snap to grid intersections
        const snapX = Math.round(mx / 40) * 40;
        const snapY = Math.round(my / 40) * 40;

        const valX = (snapX / 40) * cfg.stepX;
        const valY = ((400 - snapY) / 40) * cfg.stepY;

        if (valY === linearData.scenario.m * valX + linearData.scenario.b) {
            linearData.pointsClicked.push({canvasX: snapX, canvasY: snapY});
            draw();
        } else {
            linearData.errors++;
            showFeedback("That point is not on the line. Check your y = mx + b calculation.", "red");
        }
    };
}

window.checkSolve = async function() {
    const val = parseFloat(document.getElementById('inp-solve').value);
    if (Math.abs(val - linearData.targetY) < 0.1) {
        showFeedback("Correct! You've mastered this scenario.", "green");
        await updateLinearMastery();
    } else {
        linearData.errors++;
        showFeedback("Check your math. Plug x into your equation and solve for y.", "red");
    }
};

function showFeedback(text, color) {
    const fb = document.getElementById('lin-feedback');
    if (!fb) return;
    fb.innerHTML = text;
    fb.style.background = color === "red" ? "#fee2e2" : "#dcfce7";
    fb.style.color = color === "red" ? "#991b1b" : "#166534";
}

async function updateLinearMastery() {
    let inc = linearData.errors === 0 ? 3 : (linearData.errors < 3 ? 1 : 0);
    // Add Supabase update logic here (similar to your existing updateSkill function)
    document.getElementById('q-content').innerHTML = `<div style="text-align:center; padding:50px;">
        <h2>Problem Solved!</h2>
        <p style="font-size:24px; color:green;">+${inc} Mastery Points</p>
        <button onclick="initLinearMastery()" class="btn-primary">Next Problem</button>
    </div>`;
}
