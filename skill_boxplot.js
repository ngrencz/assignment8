// Unique variables for this module (keep 'let')
let currentBoxData = {};
let boxErrorCount = 0;

function initBoxPlotGame() {
    isCurrentQActive = true;
    
    // NO 'let' here - these belong to the Hub
    currentQSeconds = 0;
    currentQCap = 120; 
    
    boxErrorCount = 0;

    // Generate random markers
    const median = Math.floor(Math.random() * 5) + 5; 
    const q1 = median - (Math.floor(Math.random() * 2) + 2);
    const q3 = median + (Math.floor(Math.random() * 3) + 3);
    const min = q1 - 3;
    const max = q3 + 10;

    currentBoxData = { min, q1, median, q3, max };

    renderBoxUI();
}

function renderBoxUI() {
    document.getElementById('q-title').innerText = "Interpreting Box Plots";
    document.getElementById('q-content').innerHTML = `
        <div style="text-align:center;">
            <canvas id="boxCanvas" width="400" height="120" style="max-width:100%;"></canvas>
        </div>
        
        <div id="box-question-area" class="card">
            <p><strong>Part A:</strong> What percent of data is <strong>above ${currentBoxData.q3}</strong>?</p>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                <input type="number" id="box-ans-a" placeholder="0" class="math-input"> 
                <span style="font-weight:bold;">%</span>
            </div>
            
            <p><strong>Part B:</strong> Can you find the <strong>mean (average)</strong> just by looking at this plot?</p>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <label><input type="radio" name="mean-logic" value="yes"> Yes</label>
                <label><input type="radio" name="mean-logic" value="no"> No</label>
            </div>

            <button onclick="checkFinalBoxScore()" class="primary-btn">Submit Answer</button>
        </div>
    `;
    drawBoxPlot();
}

function drawBoxPlot() {
    const canvas = document.getElementById('boxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = 15; 
    const offset = 60;
    const y = 60;

    ctx.clearRect(0, 0, 400, 120);
    
    // Image of a standard box plot with labels for min, q1, median, q3, and max
    

    // Draw Axis line
    ctx.strokeStyle = "#cbd5e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, y + 40);
    ctx.lineTo(390, y + 40);
    ctx.stroke();

    // Box Styling
    ctx.strokeStyle = "#1a202c";
    ctx.lineWidth = 2;

    // Whiskers
    ctx.beginPath();
    ctx.moveTo(offset + currentBoxData.min * scale, y);
    ctx.lineTo(offset + currentBoxData.q1 * scale, y);
    ctx.moveTo(offset + currentBoxData.q3 * scale, y);
    ctx.lineTo(offset + currentBoxData.max * scale, y);
    ctx.stroke();

    // Box Fill
    ctx.fillStyle = "#f0fdf4"; // Light green wash
    ctx.fillRect(offset + currentBoxData.q1 * scale, y - 25, (currentBoxData.q3 - currentBoxData.q1) * scale, 50);
    ctx.strokeRect(offset + currentBoxData.q1 * scale, y - 25, (currentBoxData.q3 - currentBoxData.q1) * scale, 50);
    
    // Median Line (Kelly Green)
    ctx.strokeStyle = "#4CBB17";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(offset + currentBoxData.median * scale, y - 25);
    ctx.lineTo(offset + currentBoxData.median * scale, y + 25);
    ctx.stroke();
}

async function checkFinalBoxScore() {
    const ansA = parseInt(document.getElementById('box-ans-a').value);
    const radioSelection = document.querySelector('input[name="mean-logic"]:checked');
    const feedback = document.getElementById('feedback-box');
    
    feedback.style.display = "block";

    if (!radioSelection || isNaN(ansA)) {
        feedback.className = "incorrect";
        feedback.innerText = "Please answer both parts of the question.";
        return;
    }

    const logicPass = radioSelection.value === "no";
    const percentPass = ansA === 25;

    if (logicPass && percentPass) {
        feedback.className = "correct";
        feedback.innerText = "Excellent! You understand that quartiles each contain 25% of the data, and that box plots do not show the mean.";
        
        let finalScore = Math.max(1, 10 - (boxErrorCount * 2));
        
        await supabaseClient.from('assignment').update({ 
            BoxPlot: finalScore 
        }).eq('userName', currentUser);

        setTimeout(() => { loadNextQuestion(); }, 2000);
    } else {
        boxErrorCount++;
        feedback.className = "incorrect";
        
        if (!percentPass && !logicPass) {
            feedback.innerText = "Both parts need another look! Remember: each section of the plot is 25%, and the box only shows the median.";
        } else if (!percentPass) {
            feedback.innerText = "Check Part A. Each quartile (whisker or box-half) represents 1/4 of the total data.";
        } else {
            feedback.innerText = "Check Part B. Does the plot provide the sum of all individual values? If not, you can't find the mean.";
        }
    }
}
