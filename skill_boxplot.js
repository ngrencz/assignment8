let currentBoxData = {};
let boxErrorCount = 0;
let currentStep = 0;
let sessionQuestions = [];

function initBoxPlotGame() {
    isCurrentQActive = true;
    currentQSeconds = 0;
    currentQCap = 120; 
    boxErrorCount = 0;
    currentStep = 0;

    // 1. Data Generation
    const min = Math.floor(Math.random() * 5) + 2;
    const q1 = min + (Math.floor(Math.random() * 3) + 2);
    const median = q1 + (Math.floor(Math.random() * 4) + 2);
    const q3 = median + (Math.floor(Math.random() * 4) + 2);
    const max = q3 + (Math.floor(Math.random() * 5) + 3);
    currentBoxData = { min, q1, median, q3, max };

    // 2. Define the Question Pool
    const pool = [
        { q: "What is the median?", a: currentBoxData.median, hint: "Look for the bold green line inside the box.", col: "bp_median" },
        { q: "What is the Range?", a: currentBoxData.max - currentBoxData.min, hint: "Range = Max - Min.", col: "bp_range" },
        { q: "What is the Lower Quartile (Q1)?", a: currentBoxData.q1, hint: "Q1 is the left edge of the box.", col: "bp_quartiles" },
        { q: "What is the IQR?", a: currentBoxData.q3 - currentBoxData.q1, hint: "IQR = Q3 - Q1 (the box width).", col: "bp_iqr" },
        { q: `What % of data is above ${currentBoxData.q3}?`, a: 25, hint: "Every section (whisker or box-part) is 25%.", col: "bp_percent" }
    ];

    // 3. Pick 3 random questions
    sessionQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, 3);

    renderBoxUI();
}

function renderBoxUI() {
    const current = sessionQuestions[currentStep];
    document.getElementById('q-title').innerText = `Box Plot Analysis (${currentStep + 1}/3)`;
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center; background: white; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <canvas id="boxCanvas" width="400" height="150" style="max-width:100%;"></canvas>
        </div>
        <div class="card">
            <p><strong>Question:</strong> ${current.q}</p>
            <input type="number" id="box-ans" placeholder="?" class="math-input" style="width: 100px; margin-bottom: 10px;">
            <button onclick="checkStep()" class="primary-btn" style="width:100%;">Submit Answer</button>
        </div>
    `;
    drawBoxPlot();
}

function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Layout settings
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const maxVal = 40;
    const scale = chartWidth / maxVal;
    
    // Vertical positions
    const y = 60; // Main horizontal line of the plot
    const labelY = y - 40; // Where the numbers sit
    const axisY = y + 50; // Where the number line sits

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- 1. Draw Axis (Closer to plot) ---
    ctx.strokeStyle = "#cbd5e1";
    ctx.fillStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.font = "10px Arial";
    ctx.textAlign = "center";

    ctx.beginPath();
    ctx.moveTo(padding, axisY);
    ctx.lineTo(padding + chartWidth, axisY);
    ctx.stroke();

    for (let i = 0; i <= maxVal; i += 5) {
        let xPos = padding + (i * scale);
        ctx.beginPath();
        ctx.moveTo(xPos, axisY);
        ctx.lineTo(xPos, axisY + 5);
        ctx.stroke();
        ctx.fillText(i, xPos, axisY + 15);
    }

    // --- 2. Helper to draw labels on the plot ---
    const drawLabel = (val, x) => {
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Arial";
        ctx.fillText(val, x, labelY);
    };

    // --- 3. Draw Whiskers (With End Caps) ---
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    
    const minX = padding + currentBoxData.min * scale;
    const q1X = padding + currentBoxData.q1 * scale;
    const q3X = padding + currentBoxData.q3 * scale;
    const maxX = padding + currentBoxData.max * scale;
    const medX = padding + currentBoxData.median * scale;

    ctx.beginPath();
    // Left whisker line
    ctx.moveTo(minX, y);
    ctx.lineTo(q1X, y);
    // Left cap
    ctx.moveTo(minX, y - 10);
    ctx.lineTo(minX, y + 10);
    
    // Right whisker line
    ctx.moveTo(q3X, y);
    ctx.lineTo(maxX, y);
    // Right cap
    ctx.moveTo(maxX, y - 10);
    ctx.lineTo(maxX, y + 10);
    ctx.stroke();

    // Labels for extremes
    drawLabel(currentBoxData.min, minX);
    drawLabel(currentBoxData.max, maxX);

    // --- 4. Draw Box ---
    const boxW = q3X - q1X;
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(q1X, y - 25, boxW, 50);
    ctx.strokeRect(q1X, y - 25, boxW, 50);
    
    // Labels for quartiles
    drawLabel(currentBoxData.q1, q1X);
    drawLabel(currentBoxData.q3, q3X);

    // --- 5. Draw Median Line (Green) ---
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(medX, y - 25);
    ctx.lineTo(medX, y + 25);
    ctx.stroke();
    
    // Label for median
    ctx.fillStyle = "#15803d"; // Darker green for text
    drawLabel(currentBoxData.median, medX);
}

async function checkStep() {
    const userAns = parseInt(document.getElementById('box-ans').value);
    const current = sessionQuestions[currentStep];
    const feedback = document.getElementById('feedback-box');
    
    if (isNaN(userAns)) return;
    feedback.style.display = "block";

    // Track errors specifically for THIS sub-question to calculate its value
    if (!current.errors) current.errors = 0;

    if (userAns === current.a) {
        feedback.className = "correct";
        feedback.innerText = "Correct!";
        
        // Calculate performance-based value (10 is max, floor of 1)
        const stepScore = Math.max(1, 10 - (current.errors * 2));
        
        // Directly assign the value to the specific sub-skill column
        const updateData = {};
        updateData[current.col] = stepScore;
        
        await supabaseClient
            .from('assignment')
            .update(updateData)
            .eq('userName', currentUser);

        currentStep++;

        if (currentStep >= sessionQuestions.length) {
            // Master score for the whole BoxPlot skill based on total session errors
            let finalScore = Math.max(1, 10 - (boxErrorCount * 1));
            await supabaseClient.from('assignment').update({ BoxPlot: finalScore }).eq('userName', currentUser);
            
            log(`Box Plot Session Complete. Final Score: ${finalScore}`);
            setTimeout(() => { loadNextQuestion(); }, 1500);
        } else {
            setTimeout(() => { 
                feedback.style.display = "none";
                renderBoxUI(); 
            }, 1000);
        }
    } else {
        // Increment both session errors and current question errors
        boxErrorCount++; 
        current.errors++; 
        
        feedback.className = "incorrect";
        feedback.innerText = `Not quite. ${current.hint}`;
    }
}
