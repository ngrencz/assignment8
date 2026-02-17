var linearErrorCount = 0;
var currentStep = 1; 
var currentSystem = {};
var userPoints = [];

window.initLinearSystemGame = async function() {
    window.isCurrentQActive = true;
    window.currentQSeconds = 0;
    linearErrorCount = 0;
    currentStep = 1;
    userPoints = [];

    const type = Math.floor(Math.random() * 3);
    const tx = Math.floor(Math.random() * 15) - 7;
    const ty = Math.floor(Math.random() * 15) - 7;

    const slopes = [-4, -3, -2, -1, 1, 2, 3, 4];
    const m1 = slopes[Math.floor(Math.random() * slopes.length)];
    const b1 = ty - (m1 * tx);

    let m2, b2, correctCount;

    if (type === 0) { 
        do { m2 = slopes[Math.floor(Math.random() * slopes.length)]; } while (m1 === m2);
        b2 = ty - (m2 * tx);
        correctCount = 1;
    } else if (type === 1) { 
        m2 = m1;
        b2 = b1 + (b1 > 0 ? -4 : 4);
        correctCount = 0;
    } else { 
        m2 = m1;
        b2 = b1;
        correctCount = Infinity;
    }

    const formatComplex = (m, b, isSecond) => {
        const coeff = (type === 2 && isSecond) ? [2, 3].At(Math.floor(Math.random()*2)) || 2 : 1;
        let leftSide = coeff === 1 ? "y" : `${coeff}y`;
        let mVal = m * coeff;
        let bVal = b * coeff;
        let mPart = (mVal === 1) ? "x" : (mVal === -1) ? "-x" : mVal + "x";
        let bPart = bVal === 0 ? "" : (bVal > 0 ? " + " + bVal : " - " + Math.abs(bVal));
        return `${leftSide} = ${mPart}${bPart}`;
    };

    currentSystem = {
        m1, b1, m2, b2, tx, ty, correctCount,
        girl: { name: "Elena", x: tx, y: ty, isCorrect: (type !== 1) },
        boy: { name: "Liam", x: tx + 1, y: ty + 1, isCorrect: (type === 2) },
        eq1Disp: formatComplex(m1, b1, false),
        eq2Disp: formatComplex(m2, b2, true)
    };

    renderLinearUI();
};

function renderLinearUI() {
    const qContent = document.getElementById('q-content');
    document.getElementById('q-title').innerText = "System Analysis";

    let html = `
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid #cbd5e1; text-align:center;">
            <p style="font-family:monospace; font-size:1.1rem; margin:0;">
                Eq 1: <strong>${currentSystem.eq1Disp}</strong><br>
                Eq 2: <strong>${currentSystem.eq2Disp}</strong>
            </p>
        </div>`;

    if (currentStep < 4) {
        if (currentStep === 1) {
            html += `<p>Is (${currentSystem.girl.x}, ${currentSystem.girl.y}) a solution to both?</p>
                <button class="primary-btn" onclick="checkPeer(true, 'girl')">Yes</button>
                <button class="secondary-btn" onclick="checkPeer(false, 'girl')">No</button>`;
        } else if (currentStep === 2) {
            html += `<p>Is (${currentSystem.boy.x}, ${currentSystem.boy.y}) a solution to both?</p>
                <button class="primary-btn" onclick="checkPeer(true, 'boy')">Yes</button>
                <button class="secondary-btn" onclick="checkPeer(false, 'boy')">No</button>`;
        } else {
            html += `<p>How many solutions?</p>
                <button class="primary-btn" onclick="checkSolutionCount(1)">One</button>
                <button class="primary-btn" onclick="checkSolutionCount(0)">None</button>
                <button class="primary-btn" onclick="checkSolutionCount(Infinity)">Infinite</button>`;
        }
    } else {
        html += `<p>Graph the simplified lines (y = mx + b).</p>
            <canvas id="systemCanvas" width="340" height="340" style="background:white; border:2px solid #333; display:block; margin:0 auto; cursor:crosshair;"></canvas>
            <div id="graph-status" style="text-align:center; color:#3b82f6; font-weight:bold; margin-top:8px;">Line 1: Plot Point 1</div>`;
    }

    qContent.innerHTML = html;
    if (currentStep === 4) initCanvas();
}

window.checkPeer = function(choice, peerKey) {
    if (choice === currentSystem[peerKey].isCorrect) {
        currentStep++; renderLinearUI();
    } else {
        linearErrorCount++; alert("Check the math!");
    }
};

window.checkSolutionCount = function(val) {
    if (val === currentSystem.correctCount) {
        currentStep = 4; renderLinearUI();
    } else {
        linearErrorCount++; alert("Check the slopes!");
    }
};

function initCanvas() {
    const canvas = document.getElementById('systemCanvas');
    const ctx = canvas.getContext('2d');
    const size = 340, gridMax = 10, step = size / (gridMax * 2);

    function drawFullGrid() {
        ctx.clearRect(0,0,size,size);
        ctx.strokeStyle = "#eee"; ctx.lineWidth = 1;
        for(let i=0; i<=size; i+=step) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
        }
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();
        
        // Always redraw validated lines
        if (userPoints.length >= 2) renderLinePath(userPoints[0], userPoints[1], "blue");
        if (userPoints.length === 4) renderLinePath(userPoints[2], userPoints[3], "red");
    }

    function renderLinePath(p1, p2, color) {
        const m = (p2.y - p1.y) / (p2.x - p1.x);
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(size/2 + (p1.x-15)*step, size/2 - (p1.y + m*(p1.x-15 - p1.x))*step);
        ctx.lineTo(size/2 + (p1.x+15)*step, size/2 - (p1.y + m*(p1.x+15 - p1.x))*step);
        ctx.stroke();
        ctx.fillStyle = color;
        [p1, p2].forEach(p => {
            ctx.beginPath(); ctx.arc(size/2 + p.x*step, size/2 - p.y*step, 5, 0, 7); ctx.fill();
        });
    }

    drawFullGrid();

    canvas.onclick = function(e) {
        if (userPoints.length >= 4) return;
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - size/2) / step);
        const gy = Math.round((size/2 - (e.clientY - rect.top)) / step);
        
        userPoints.push({x: gx, y: gy});
        
        // Draw immediate feedback dot
        ctx.fillStyle = userPoints.length <= 2 ? "blue" : "red";
        ctx.beginPath(); ctx.arc(size/2 + gx*step, size/2 - gy*step, 5, 0, 7); ctx.fill();

        const status = document.getElementById('graph-status');
        if (userPoints.length === 2) {
            if (validate(1)) {
                drawFullGrid();
                if(status) status.innerText = "Line 2: Plot Point 1";
            } else {
                alert("Line 1 is incorrect."); userPoints = []; drawFullGrid();
                if(status) status.innerText = "Line 1: Plot Point 1";
            }
        } else if (userPoints.length === 4) {
            if (validate(2)) {
                drawFullGrid();
                if(status) status.innerText = "Success!";
                setTimeout(finalize, 600);
            } else {
                alert("Line 2 is incorrect."); userPoints = [userPoints[0], userPoints[1]]; drawFullGrid();
                if(status) status.innerText = "Line 2: Plot Point 1";
            }
        } else {
            if(status) status.innerText = userPoints.length === 1 ? "Line 1: Plot Point 2" : "Line 2: Plot Point 2";
        }
    };

    function validate(n) {
        const p1 = userPoints[n===1?0:2], p2 = userPoints[n===1?1:3];
        const m = n===1?currentSystem.m1:currentSystem.m2;
        const b = n===1?currentSystem.b1:currentSystem.b2;
        if (p1.x === p2.x) return false; // Avoid div by zero
        const um = (p2.y-p1.y)/(p2.x-p1.x);
        const ub = p1.y - (um*p1.x);
        return (Math.abs(um - m) < 0.01 && Math.abs(ub - b) < 0.1);
    }
}

async function finalize() {
    const pts = Math.max(1, 10 - linearErrorCount);
    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient.from('assignment').select('LinearSystem').eq('userName', window.currentUser).single();
            const cur = data?.LinearSystem || 0;
            await window.supabaseClient.from('assignment').update({ LinearSystem: Math.min(10, cur + (pts/5)) }).eq('userName', window.currentUser);
        } catch(e) { console.error(e); }
    }
    if(window.loadNextQuestion) window.loadNextQuestion();
}
