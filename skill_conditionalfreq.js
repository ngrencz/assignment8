/**
 * skill_conditionalfreq.js
 * - 8th Grade: Lesson 7.3.3 Conditional Relative Frequencies & Association
 * - Generates 2x2 two-way tables with varying contexts.
 * - Part A: Calculate missing marginal totals.
 * - Part B: Calculate a specific conditional relative frequency (percentage).
 * - Part C: Compare frequencies to determine if an association exists.
 */

(function() {
    console.log("🚀 skill_conditionalfreq.js LIVE (Two-Way Tables & Association)");

    var freqData = {
        round: 1,
        maxRounds: 3,
        currentPart: 0,
        errorsThisPart: 0,
        context: {},
        table: {},
        calcPercentage1: 0,
        calcPercentage2: 0,
        hasAssociation: false
    };

    window.initConditionalFreqGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        freqData.round = 1;
        freqData.currentPart = 0;
        freqData.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('ConditionalFreq, freq_totals, freq_conditional, freq_association')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("ConditionalFreq DB sync error, continuing locally.");
        }

        startFreqRound();
    };

    function startFreqRound() {
        freqData.currentPart = 0;
        freqData.errorsThisPart = 0;
        generateFreqProblem();
        renderFreqUI();
    }

    function generateFreqProblem() {
        const contexts = [
            {
                desc: "Researchers asked adults about their sleep habits and whether they forget where they placed their keys.",
                colVar: "Hours of Sleep", col1: "Less than 7 hours", col2: "7 or more hours",
                rowVar: "Lost Keys?", row1: "Yes", row2: "No"
            },
            {
                desc: "A dealership tracked the price of fuel and the types of vehicles purchased over two years.",
                colVar: "Fuel Prices", col1: "Low Prices", col2: "High Prices",
                rowVar: "Vehicle Type", row1: "Fuel-Efficient", row2: "Standard Truck"
            },
            {
                desc: "A school surveyed students on whether they studied for the final exam and if they passed.",
                colVar: "Study Habits", col1: "Did Not Study", col2: "Studied",
                rowVar: "Exam Result", row1: "Passed", row2: "Failed"
            },
            {
                desc: "A streaming service tracked user age groups and their preference for action movies.",
                colVar: "Age Group", col1: "Under 25", col2: "25 and Older",
                rowVar: "Prefers Action?", row1: "Yes", row2: "No"
            }
        ];

        let ctx = contexts[Math.floor(Math.random() * contexts.length)];
        freqData.context = ctx;
        freqData.hasAssociation = Math.random() > 0.4; // 60% chance of association

        // Generate base column totals
        let c1Total = Math.floor(Math.random() * 150) + 50;
        let c2Total = Math.floor(Math.random() * 150) + 50;

        // Generate rates for Row 1
        let rate1 = Math.random() * 0.5 + 0.2; // 20% to 70%
        let rate2;

        if (freqData.hasAssociation) {
            // Force a clear difference (at least 20%)
            rate2 = rate1 > 0.5 ? rate1 - (Math.random() * 0.2 + 0.2) : rate1 + (Math.random() * 0.2 + 0.2);
        } else {
            // Force them to be nearly identical (within 2%)
            rate2 = rate1 + (Math.random() * 0.04 - 0.02);
        }

        // Calculate cells
        let r1c1 = Math.round(c1Total * rate1);
        let r2c1 = c1Total - r1c1;

        let r1c2 = Math.round(c2Total * rate2);
        let r2c2 = c2Total - r1c2;

        freqData.table = {
            r1c1, r2c1, c1Total,
            r1c2, r2c2, c2Total,
            r1Total: r1c1 + r1c2,
            r2Total: r2c1 + r2c2,
            grandTotal: c1Total + c2Total
        };

        // Pre-calculate exact percentages for questions
        freqData.calcPercentage1 = Math.round((r1c1 / c1Total) * 100);
        freqData.calcPercentage2 = Math.round((r1c2 / c2Total) * 100);
    }

    function renderFreqUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let ctx = freqData.context;
        let t = freqData.table;
        let part = freqData.currentPart;

        // Dynamic table rendering based on current step
        let tableHTML = `
            <table style="width:100%; border-collapse:collapse; text-align:center; background:white; margin-top:15px; font-size:15px; border:2px solid #cbd5e1;">
                <thead>
                    <tr>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc;"></th>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#e0f2fe; color:#0369a1;" colspan="2">${ctx.colVar}</th>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc;"></th>
                    </tr>
                    <tr>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc;">${ctx.rowVar}</th>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#f0f9ff;">${ctx.col1}</th>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#f0f9ff;">${ctx.col2}</th>
                        <th style="border:1px solid #cbd5e1; padding:10px; background:#f1f5f9; font-weight:bold;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #cbd5e1; padding:10px; font-weight:bold; background:#f8fafc;">${ctx.row1}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px;">${t.r1c1}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px;">${t.r1c2}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc; font-weight:bold;">${part >= 1 ? t.r1Total : `<input type="number" id="inp-r1" style="width:60px; text-align:center; padding:4px;">`}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #cbd5e1; padding:10px; font-weight:bold; background:#f8fafc;">${ctx.row2}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px;">${t.r2c1}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px;">${t.r2c2}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc; font-weight:bold;">${part >= 1 ? t.r2Total : t.r2Total}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #cbd5e1; padding:10px; font-weight:bold; background:#f1f5f9;">TOTAL</td>
                        <td style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc; font-weight:bold;">${part >= 1 ? t.c1Total : `<input type="number" id="inp-c1" style="width:60px; text-align:center; padding:4px;">`}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px; background:#f8fafc; font-weight:bold;">${part >= 1 ? t.c2Total : t.c2Total}</td>
                        <td style="border:1px solid #cbd5e1; padding:10px; background:#e2e8f0; font-weight:bold;">${part >= 1 ? t.grandTotal : t.grandTotal}</td>
                    </tr>
                </tbody>
            </table>
        `;

        let questionHTML = "";
        
        if (part === 0) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">a.</span> Fill in the missing totals in the table above.
                </div>
            `;
        } else if (part === 1) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">b.</span> Create a conditional relative frequency. <br><br>
                    Of the subjects who <strong>${ctx.col1}</strong>, what percentage answered <strong>${ctx.row1}</strong>? <br>
                    <small style="color:#64748b;">(Round to the nearest whole percent)</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="number" id="inp-percent" style="width:80px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;">
                    <span style="font-size:18px; font-weight:bold; color:#64748b;">%</span>
                </div>
            `;
        } else if (part === 2) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px;">
                    <span style="font-weight:bold; color:#3b82f6;">c.</span> Determine Association.<br><br>
                    You found that <strong>${freqData.calcPercentage1}%</strong> of the [${ctx.col1}] group answered [${ctx.row1}].<br>
                    If we check the other column, <strong>${freqData.calcPercentage2}%</strong> of the [${ctx.col2}] group answered [${ctx.row1}].<br><br>
                    Based on these percentages, is there an association between <strong>${ctx.colVar}</strong> and <strong>${ctx.rowVar}</strong>?
                </div>
                <div style="display:flex; gap:15px;">
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold; transition:0.2s;">
                        <input type="radio" name="ans-assoc" value="Yes"> Yes, there is an association.
                    </label>
                    <label style="flex:1; background:white; padding:12px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; text-align:center; font-weight:bold; transition:0.2s;">
                        <input type="radio" name="ans-assoc" value="No"> No, there is no association.
                    </label>
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <p style="font-size:15px; color:#475569; margin-top:0;">Scenario: ${ctx.desc}</p>
                    ${tableHTML}
                </div>

                <div id="freq-question-container" style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    ${questionHTML}
                    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                        <div id="freq-feedback" style="font-weight:bold; font-size:14px; max-width:70%;"></div>
                        <button onclick="checkFreqAnswer()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer; white-space:nowrap;">Submit</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.checkFreqAnswer = function() {
        const feedback = document.getElementById('freq-feedback');
        let ctx = freqData.context;
        let t = freqData.table;
        let part = freqData.currentPart;
        let isCorrect = false;

        if (part === 0) {
            let uR1 = parseInt(document.getElementById('inp-r1').value);
            let uC1 = parseInt(document.getElementById('inp-c1').value);
            if (isNaN(uR1) || isNaN(uC1)) return;
            isCorrect = (uR1 === t.r1Total && uC1 === t.c1Total);
        } 
        else if (part === 1) {
            let uPct = parseInt(document.getElementById('inp-percent').value);
            if (isNaN(uPct)) return;
            // Allow +/- 1% for rounding variations
            isCorrect = Math.abs(uPct - freqData.calcPercentage1) <= 1; 
        }
        else if (part === 2) {
            let selected = document.querySelector('input[name="ans-assoc"]:checked');
            if (!selected) return;
            let ansYes = selected.value === "Yes";
            isCorrect = (ansYes === freqData.hasAssociation);
        }

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            
            // Sub-skill Tracking
            let dbSkills = ['freq_totals', 'freq_conditional', 'freq_association'];
            if (freqData.errorsThisPart === 0) updateFreqSkill(dbSkills[part], 1);

            freqData.currentPart++;
            freqData.errorsThisPart = 0;

            setTimeout(() => {
                if (freqData.currentPart > 2) {
                    freqData.round++;
                    if (freqData.round > freqData.maxRounds) finishFreqGame();
                    else startFreqRound();
                } else {
                    renderFreqUI();
                }
            }, 1200);

        } else {
            freqData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            
            // Contextual Hints
            if (part === 0) {
                feedback.innerHTML = "❌ <strong>Hint:</strong> Add across the row to find the Row Total. Add down the column to find the Column Total.";
            } else if (part === 1) {
                feedback.innerHTML = `❌ <strong>Hint:</strong> Formula: (Inner Cell ÷ Column Total) × 100.<br>Divide ${t.r1c1} by ${t.c1Total}.`;
            } else if (part === 2) {
                let diff = Math.abs(freqData.calcPercentage1 - freqData.calcPercentage2);
                if (freqData.hasAssociation) {
                    feedback.innerHTML = `❌ <strong>Hint:</strong> Look at the percentages. There is a ${diff}% difference! Because they are very different, there IS an association.`;
                } else {
                    feedback.innerHTML = `❌ <strong>Hint:</strong> Look at the percentages. They are almost identical! Because the condition didn't change the outcome much, there is NO association.`;
                }
            }
        }
    };

    function updateFreqSkill(col, amt) {
        if (!window.userMastery) window.userMastery = {};
        let current = window.userMastery[col] || 0;
        let next = Math.max(0, Math.min(10, current + amt));
        window.userMastery[col] = next;

        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ [col]: next })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if(error) console.error("Subskill fail:", error); });
        }
    }

    function finishFreqGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">📊</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Data Tables Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.ConditionalFreq || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.ConditionalFreq = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ ConditionalFreq: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
