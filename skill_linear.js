/**
 * skill_linear.js - v2.6.0
 * STABILITY PATCH: Deterministic scenario generation to prevent infinite loops.
 * DIFFICULTY SCALING: Introduces fractions and decimals for students with Mastery >= 8.
 * FEATURES: Contextual hints for m and b, robust fractional input parsing, full DB sync.
 */

console.log("%c [LinearMath] - Advanced Scaling Build 2.6.0 ", "background: #1e293b; color: #3b82f6; font-weight: bold;");

var linearData = {
    version: "2.6.0",
    scenario: {},      
    stage: 'variables', 
    errors: 0,          
    pointsClicked: [], 
    gridConfig: { maxVal: 20, scaleStep: 2 }, 
    targetSolveX: 0,
    targetSolveY: 0,
    validEqs: []
};

// Helper function to safely parse user inputs like "1/2" or "0.5"
function parseMath(str) {
    if (!str) return NaN;
    str = str.replace(/\s/g, '');
    if (str.includes('/')) {
        let parts = str.split('/');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return parseFloat(parts[0]) / parseFloat(parts[1]);
        }
    }
    return parseFloat(str);
}

window.initLinearMastery = async function() {
    if (!document.getElementById('q-content')) return;

    // Reset State
    linearData.stage = 'variables';
    linearData.errors = 0;
    linearData.pointsClicked = [];
    
    if (!window.userMastery) window.userMastery = {};

    // 1. Database Sync
    try {
        if (window.supabaseClient && window.currentUser) {
            const currentHour = sessionStorage.getItem('target_hour') || "00";
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

    // Overwrite generic external titles
    setTimeout(() => {
        document.querySelectorAll('h1, h2, h3, h4, .title, .header-title').forEach(el => {
            if (el.textContent && el.textContent.includes('System Analysis')) {
                el.textContent = 'Linear Equations';
            }
        });
    }, 100);
};

function generateLinearScenario() {
    const isAdvanced = (window.userMastery && window.userMastery.LinearMastery >= 8);
    let useFractions = false;
    let scales = [1, 2, 5, 10];

    // If mastery is 8+, 60% chance to trigger advanced mode (decimals/fractions)
    if (isAdvanced && Math.random() > 0.4) {
        scales = [0.5, 2.5]; // Creates grids where intersections are fractional
        useFractions = Math.random() > 0.5; // 50% chance to format text as fractions vs decimals
    }

    const templates = [
        { type: 'growth', prompt: "A botanist tracks a sunflower's growth.", text: "The sunflower is {B} cm tall and grows {M} cm per day.", unitX: "days", unitY: "cm", labelX: "time", labelY: "height", forceDec: false },
        { type: 'growth', prompt: "A contractor charges for a job.", text: "There is a base fee of ${B} plus ${M} per hour of labor.", unitX: "hours", unitY: "dollars", labelX: "labor time", labelY: "total cost", forceDec: true },
        { type: 'decay',  prompt: "A pilot is descending for landing.", text: "The plane is at {B} thousand feet and descends {M} thousand feet per minute.", unitX: "minutes", unitY: "thousand feet", labelX: "time", labelY: "altitude", forceDec: false },
        { type: 'decay',  prompt: "A phone battery is losing charge.", text: "The battery is at {B}% and drops {M}% every hour.", unitX: "hours", unitY: "percent", labelX: "time", labelY: "remaining charge", forceDec: true }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    const scale = scales[Math.floor(Math.random() * scales.length)];
    const maxVal = scale * 10;
    
    let b, m, tx = 6;

    // DETERMINISTIC MATH (Guarantees points land on grid intersections even for decimals)
    if (t.type === 'growth') {
        b = Math.floor(Math.random() * 4) * scale; 
        let maxM_scaled = Math.floor((maxVal - b) / (tx * scale));
        if (maxM_scaled < 1) maxM_scaled = 1; 
        m = (Math.floor(Math.random() * maxM_scaled) + 1) * scale;
    } else {
        b = maxVal - (Math.floor(Math.random() * 2) * scale);
        let maxM_scaled = Math.floor(b / (tx * scale));
        if (maxM_scaled < 1) maxM_scaled = 1;
        m = -(Math.floor(Math.random() * maxM_scaled) + 1) * scale;
    }

    // Formatting helper for prompt text
    const formatText = (num) => {
        if (Number.isInteger(num)) return num.toString();
        if (t.forceDec) return num.toFixed(2); // Money and percentages look better as decimals
        if (useFractions) {
            let abs = Math.abs(num);
            if (abs % 1 === 0.5) return (num < 0 ? "-" : "") + (abs * 2) + "/2";
        }
        return num.toString();
    };

    let bStr = formatText(b);
    let mStr = formatText(Math.abs(m));

    linearData.gridConfig.scaleStep = scale;
    linearData.gridConfig.maxVal = maxVal;
    linearData.targetSolveX = tx;

    // --- Build Robust Equation Answer Key ---
    linearData.validEqs = [];
    
    function getValidTerms(num) {
        let terms = [num.toString()];
        if (!Number.isInteger(num)) {
            let abs = Math.abs(num);
            let sign = num < 0 ? "-" : "";
            if (abs % 1 === 0.5) terms.push(sign + (abs * 2) + "/2"); // Add fraction form
            if (num > 0 && num < 1) terms.push(num.toString().replace("0.", ".")); // Add .5 form
            if (num < 0 && num > -1) terms.push(num.toString().replace("-0.", "-.")); // Add -.5 form
            if (terms.indexOf(num.toFixed(2)) === -1) terms.push(num.toFixed(2)); // Add $2.50 form
        }
        return terms;
    }

    let mTerms = getValidTerms(m);
    let bTerms = getValidTerms(b);

    mTerms.forEach(mt => {
        let mPart = (mt === "1" ? "x" : (mt === "-1" ? "-x" : mt + "x"));
        bTerms.forEach(bt => {
            let bPart = (b === 0 ? "" : (b > 0 ? "+" + bt : bt));
            linearData.validEqs.push("y=" + mPart + bPart);
            linearData.validEqs.push(mPart + bPart);
            if (b > 0 && bt.indexOf('+') === -1) {
                linearData.validEqs.push("y=" + mPart + "+" + bt);
                linearData.validEqs.push(mPart + "+" + bt);
            }
        });
    });

    linearData.scenario = {
        fullText: t.prompt + " " + t.text.replace("{B}", bStr).replace("{M}", mStr),
        b: b, m: m, unitX: t.unitX, unitY: t.unitY, labelX: t.labelX, labelY: t.labelY, type: t.type
    };
}

function renderLinearStage() {
    const qContent = document.getElementById('q-content');
    const s = linearData.scenario;
    const stage = linearData.stage;

    let mPart = (s.m === 1 ? "x" : (s.m === -1 ? "-x" : s.m + "x"));
    let bPart = (s.b === 0 ? "" : (s.b > 0 ? " + " + s.b : " - " + Math.abs(s.b)));
    let displayEq = "y = " + mPart + bPart;

    let html = `<div style="max-width:600px; margin:0 auto; animation: fadeIn 0.5s;">`;
    
    html += `<h2 style="text-align:center; margin: 0 0 15px 0; color:#1e293b; font-size: 1.5rem;">Linear Equations</h2>`;
    html += `<div class="scenario-box"><h3>${s.fullText}</h3></div>`;

    if (stage === 'variables') {
        html += `<h4>Part 1: Variables</h4>
                 <div class="step-input">x = <select id="inp-x"><option value="">--</option><option value="correct">${s.unitX}</option><option value="wrong">${s.unitY}</option></select></div>
                 <div class="step-input" style="margin-top:10px;">y = <select id="inp-y"><option value="">--</option><option value="wrong">${s.unitX}</option><option value="correct">${s.unitY}</option></select></div>
                 <button onclick="checkLinearVars()" class="btn-primary" style="margin-top:15px;">Next Step</button>`;
    }
    else if (stage === 'slope') {
        html += `<h4>Part 2: Slope</h4><p>What is the <b>slope (m)</b>?</p>
                 <input type="text" id="inp-m" class="math-input" autocomplete="off" placeholder="e.g. 0.5 or 1/2"> <button onclick="checkLinearM()" class="btn-primary">Check</button>`;
    }
    else if (stage === 'intercept') {
        html += `<h4>Part 3: Intercept</h4><p>What is the <b>y-intercept (b)</b>?</p>
                 <input type="text" id="inp-b" class="math-input" autocomplete="off" placeholder="e.g. 2.5 or 5/2"> <button onclick="checkLinearB()" class="btn-primary">Check</button>`;
    }
    else if (stage === 'eq') {
        html += `<h4>Part 4: Equation</h4><div style="font-size:22px;">y = <input type="text" id="inp-eq" placeholder="mx + b" style="width:160px;" autocomplete="off"></div>
                 <button onclick="checkLinearEq()" class="btn-primary" style="margin-top:15px;">Check Equation</button>`;
    }
    else if (stage === 'graph') {
        html += `<h4>Part 5: Graphing</h4><div class="eq-highlight">Equation: ${displayEq}</div>
                 <p>Plot 3 points. Each grid line = ${linearData.gridConfig.scaleStep} units.</p>
                 <canvas id="linCanvas" width="400" height="400" style="border:1px solid #000; background:white; cursor:crosshair;"></canvas>`;
    }
    else if (stage === 'solve') {
        let tx = linearData.targetSolveX; 
        linearData.targetSolveY = s.m * tx + s.b;
        html += `<h4>Part 6: Predict</h4><div class="eq-highlight">Equation: ${displayEq}</div>
                 <p>Based on your equation, what would the <b>${s.labelY}</b> be after <b>${tx} ${s.unitX}</b>?</p>
                 <input type="text" id="inp-solve" class="math-input" autocomplete="off"> ${s.unitY} <button onclick="checkLinearD()" class="btn-primary">Submit</button>`;
    }

    html += `<div id="lin-feedback" style="margin-top:15px; min-height:30px; font-weight:bold;"></div>
             <div id="lin-hint" style="margin-top: 10px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e;"></div></div>`;
    qContent.innerHTML = html;

    if (stage === 'graph') setupLinearGraph();
}

window.checkLinearVars = function() {
    const hintBox = document.getElementById('lin-hint');
    if (document.getElementById('inp-x').value === 'correct' && document.getElementById('inp-y').value === 'correct') {
        linearData.stage = 'slope'; renderLinearStage();
    } else {
        document.getElementById('lin-feedback').innerHTML = `<span style="color:#ef4444">Not quite.</span>`;
        hintBox.style.display = "block";
        hintBox.innerHTML = `<strong>Hint:</strong> <b>x</b> is your independent variable (time), and <b>y</b> is the result or total.`;
    }
};

window.checkLinearM = function() {
    const val = parseMath(document.getElementById('inp-m').value);
    const hintBox = document.getElementById('lin-hint');
    const s = linearData.scenario;
    
    if (Math.abs(val - s.m) < 0.001) {
        linearData.stage = 'intercept'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:#ef4444">Incorrect.</span>`;
        hintBox.style.display = "block";
        let dir = s.type === 'decay' ? "decreasing (negative)" : "increasing (positive)";
        hintBox.innerHTML = `<strong>Hint:</strong> Slope is the rate of change. How much is the ${s.labelY} changing every 1 ${s.unitX}? Since it is ${dir}, check your sign!`;
    }
};

window.checkLinearB = function() {
    const val = parseMath(document.getElementById('inp-b').value);
    const hintBox = document.getElementById('lin-hint');
    
    if (Math.abs(val - linearData.scenario.b) < 0.001) {
        linearData.stage = 'eq'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:#ef4444">Incorrect.</span>`;
        hintBox.style.display = "block";
        hintBox.innerHTML = `<strong>Hint:</strong> The y-intercept (b) is the <b>starting value</b>. What was the ${linearData.scenario.labelY} at 0 ${linearData.scenario.unitX}?`;
    }
};

window.checkLinearEq = function() {
    let userVal = document.getElementById('inp-eq').value.replace(/\s/g, '').toLowerCase();
    const { m, b } = linearData.scenario;
    const hintBox = document.getElementById('lin-hint');
    
    if (linearData.validEqs.includes(userVal) || linearData.validEqs.includes("y=" + userVal)) {
        updateSkill('LinearEq', 1); 
        linearData.stage = 'graph'; renderLinearStage();
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:#ef4444">Check your format.</span>`;
        hintBox.style.display = "block";
        hintBox.innerHTML = `<strong>Hint:</strong> Use <b>y = mx + b</b>. You found m = ${m} and b = ${b}.`;
    }
};

function setupLinearGraph() {
    const canvas = document.getElementById('linCanvas');
    const ctx = canvas.getContext('2d');
    const cfg = linearData.gridConfig;
    const pixelStep = 40; 

    const draw = () => {
        ctx.clearRect(0,0,400,400);
        ctx.strokeStyle = "#94a3b8"; 
        
        for(let i=0; i<=10; i++) {
            ctx.beginPath(); ctx.moveTo(i*pixelStep,0); ctx.lineTo(i*pixelStep,400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i*pixelStep); ctx.lineTo(400,i*pixelStep); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(2,400); ctx.lineTo(400,400); ctx.stroke();

        ctx.fillStyle = "#666"; ctx.font = "12px sans-serif";
        for(let i=0; i<=10; i+=2) {
            ctx.fillText(i, (i*pixelStep)+2, 395);
            ctx.fillText(i * cfg.scaleStep, 5, 400 - (i*pixelStep) - 2);
        }

        linearData.pointsClicked.forEach(p => {
            ctx.fillStyle = "#2563eb";
            ctx.beginPath(); ctx.arc(p.cx, p.cy, 6, 0, Math.PI*2); ctx.fill();
        });

        if (linearData.pointsClicked.length >= 3) {
            ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
            const yStart = 400 - ((linearData.scenario.b / cfg.maxVal) * 400);
            const yEnd = 400 - (((linearData.scenario.m * 10 + linearData.scenario.b) / cfg.maxVal) * 400);
            ctx.beginPath(); ctx.moveTo(0, yStart); ctx.lineTo(400, yEnd); ctx.stroke();
            
            setTimeout(() => { 
                updateSkill('LinearGraph', 1); 
                linearData.stage = 'solve'; 
                renderLinearStage(); 
            }, 1500);
        }
    };
    draw();

    canvas.onclick = (e) => {
        if (linearData.pointsClicked.length >= 3) return;
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left) / pixelStep);
        const gy = Math.round((400 - (e.clientY - rect.top)) / pixelStep);
        let valY = gy * cfg.scaleStep;
        
        if (Math.abs(valY - (linearData.scenario.m * gx + linearData.scenario.b)) < 0.001) {
            linearData.pointsClicked.push({cx: gx * pixelStep, cy: 400 - (gy * pixelStep)});
            draw();
        } else {
            linearData.errors++;
            document.getElementById('lin-feedback').innerHTML = `<span style="color:#ef4444">Point (${gx}, ${valY}) is not on the line!</span>`;
        }
    };
}

window.checkLinearD = function() {
    let val = parseMath(document.getElementById('inp-solve').value);
    const hintBox = document.getElementById('lin-hint');
    if (Math.abs(val - linearData.targetSolveY) < 0.01) {
        updateSkill('LinearSolve', 1);
        let inc = linearData.errors <= 1 ? 2 : (linearData.errors >= 4 ? -1 : 0);
        updateSkill('LinearMastery', inc);
        showFinalLinearMessage(inc);
    } else {
        linearData.errors++;
        document.getElementById('lin-feedback').innerHTML = `<span style="color:#ef4444">Try again.</span>`;
        hintBox.style.display = "block";
        hintBox.innerHTML = `<strong>Hint:</strong> Use your equation! Plug <b>${linearData.targetSolveX}</b> into <b>x</b>: y = ${linearData.scenario.m}(${linearData.targetSolveX}) + ${linearData.scenario.b}`;
    }
};

function updateSkill(col, amt) {
    let curr = window.userMastery[col] || 0;
    let next = Math.max(0, Math.min(10, curr + amt));
    window.userMastery[col] = next; 
    
    if (window.supabaseClient && window.currentUser) {
        const h = sessionStorage.getItem('target_hour') || "00";
        window.supabaseClient
            .from('assignment')
            .update({ [col]: next })
            .eq('userName', window.currentUser)
            .eq('hour', h)
            .then(({ error }) => { 
                if (error) console.error("Skill update failed:", error); 
            });
    }
}

function showFinalLinearMessage(inc) {
    window.isCurrentQActive = false; 
    const color = inc > 0 ? "#166534" : (inc < 0 ? "#991b1b" : "#475569");
    
    document.getElementById('q-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
            <div style="font-size:60px;">🏆</div>
            <h2 style="color:#1e293b; margin:10px 0;">Module Complete!</h2>
            <p style="font-size:20px; color:${color}; font-weight:bold;">${inc > 0 ? '+2 Mastery Points' : 'Completed'}</p>
            <p style="color:#64748b; margin-top:15px;"><em>Loading next skill...</em></p>
        </div>`;
        
    setTimeout(() => { 
        if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
        else location.reload(); 
    }, 2500); 
}

const styleId = 'linear-math-styles';
if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .scenario-box { background:#f8fafc; padding:15px; border-radius:8px; border-left:5px solid #3b82f6; margin-bottom:15px; }
        .eq-highlight { background:#eff6ff; padding:8px; border-radius:4px; margin-bottom:10px; font-weight:bold; color:#1d4ed8; border:1px solid #bfdbfe; }
        .btn-primary { background:#1e293b; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:bold; }
        .math-input { font-size:18px; width:90px; padding:6px; border: 2px solid #cbd5e1; border-radius: 4px;}
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    `;
    document.head.appendChild(style);
}
