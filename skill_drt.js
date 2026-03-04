/**
 * skill_drt.js
 * - 8th Grade: Distance, Rate, Time Word Problems (CL 7-121)
 * - Part A/B: Calculate rates for two different subjects given distance and time.
 * - Part C: Calculate remaining time given total distance and previously found rate.
 */

(function() {
    console.log("🚀 skill_drt.js LIVE (Distance, Rate, Time)");

    var drtData = {
        round: 1,
        maxRounds: 4,
        currentPart: 0,
        errorsThisPart: 0,
        scenario: {}
    };

    window.initDRTGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        drtData.round = 1;
        drtData.currentPart = 0;
        drtData.errorsThisPart = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('DRT, drt_rate, drt_remaining')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("DRT DB sync error, continuing locally.");
        }

        startDRTRound();
    };

    function startDRTRound() {
        drtData.currentPart = 0;
        drtData.errorsThisPart = 0;
        generateDRTProblem();
        renderDRTUI();
    }

    function generateDRTProblem() {
        const names = ["Ryan", "Janelle", "Marcus", "Sarah", "Leo", "Maya", "Chloe", "David"];
        const dests = ["Mammoth Lakes", "the Grand Canyon", "the beach house", "Chicago", "the ski resort", "the national park"];
        
        // Shuffle and pick 2 names
        let shuffledNames = names.sort(() => 0.5 - Math.random());
        let n1 = shuffledNames[0];
        let n2 = shuffledNames[1];
        let dest = dests[Math.floor(Math.random() * dests.length)];

        // Generate clean rates (e.g., 50, 55, 60, 65)
        const rates = [40, 45, 50, 55, 60, 65, 70, 75];
        let r1 = rates[Math.floor(Math.random() * rates.length)];
        let r2;
        do { r2 = rates[Math.floor(Math.random() * rates.length)]; } while (r1 === r2);

        // Generate times (include half hours to match curriculum rigor)
        const times = [2, 2.5, 3, 3.5, 4, 4.5, 5];
        let t1 = times[Math.floor(Math.random() * times.length)];
        let t2 = times[Math.floor(Math.random() * times.length)];

        let d1 = r1 * t1;
        let d2 = r2 * t2;

        // Part C: Remaining Time
        // Pick one person to focus on for the final question
        let remainT = [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)];
        let focusIndex = Math.random() > 0.5 ? 1 : 2;
        
        let focusName = focusIndex === 1 ? n1 : n2;
        let focusRate = focusIndex === 1 ? r1 : r2;
        let focusDDone = focusIndex === 1 ? d1 : d2;
        let totalD = focusDDone + (focusRate * remainT);

        drtData.scenario = {
            n1, n2, dest,
            r1, r2, t1, t2, d1, d2,
            focusName, focusRate, focusDDone, totalD, remainT
        };
    }

    function formatTime(t) {
        if (t % 1 === 0.5) return `${Math.floor(t)} ½`;
        return t;
    }

    function renderDRTUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let s = drtData.scenario;
        let part = drtData.currentPart;

        let storyHTML = `
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-size: 16px; color: #334155; line-height: 1.6;">
                <strong>${s.n1}</strong> and <strong>${s.n2}</strong> are driving from different locations to meet at ${s.dest}. When they each stopped for lunch, they called each other on their cell phones.
                <ul style="margin-top: 10px; margin-bottom: 0;">
                    <li>${s.n1} had traveled <strong>${s.d1} miles</strong> in <strong>${formatTime(s.t1)} hours</strong>.</li>
                    <li>${s.n2} had driven <strong>${s.d2} miles</strong> in <strong>${formatTime(s.t2)} hours</strong>.</li>
                </ul>
            </div>
        `;

        let questionHTML = "";
        if (part === 0) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold;">
                    <span style="color:#3b82f6;">Part A:</span> How fast was ${s.n1} driving?
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="number" id="ans-input" style="width:100px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;" placeholder="Rate">
                    <span style="font-size:16px; font-weight:bold; color:#64748b;">mph</span>
                </div>
            `;
        } else if (part === 1) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; font-weight:bold;">
                    <span style="color:#3b82f6;">Part B:</span> How fast was ${s.n2} driving?
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="number" id="ans-input" style="width:100px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;" placeholder="Rate">
                    <span style="font-size:16px; font-weight:bold; color:#64748b;">mph</span>
                </div>
            `;
        } else if (part === 2) {
            questionHTML = `
                <div style="font-size:16px; color:#1e293b; margin-bottom:15px; line-height: 1.5;">
                    <span style="font-weight:bold; color:#3b82f6;">Part C:</span> If <strong>${s.focusName}</strong> originally started <strong>${s.totalD} miles</strong> from ${s.dest} and continues traveling at the same rate, <strong>how many MORE hours</strong> will it take them to arrive at their destination?
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="number" id="ans-input" step="0.5" style="width:100px; padding:10px; font-size:16px; text-align:center; border:2px solid #cbd5e1; border-radius:6px;" placeholder="Hours">
                    <span style="font-size:16px; font-weight:bold; color:#64748b;">hours</span>
                </div>
            `;
        }

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="text-align:center; color:#64748b; margin-bottom:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                    Round ${drtData.round} of ${drtData.maxRounds}
                </div>
                ${storyHTML}
                <div style="background:#f1f5f9; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    ${questionHTML}
                    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                        <button onclick="checkDRTAnswer()" style="background:#1e293b; color:white; border:none; padding:10px 25px; font-size:16px; font-weight:bold; border-radius:6px; cursor:pointer;">Submit</button>
                    </div>
                    <div id="drt-feedback" style="margin-top: 15px; font-weight: bold; font-size: 15px;"></div>
                    <div id="drt-hint" style="margin-top: 10px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; display: none; font-size: 0.95rem; color: #92400e; line-height:1.4;"></div>
                </div>
            </div>
        `;

        setTimeout(() => { document.getElementById('ans-input')?.focus(); }, 100);
    }

    window.checkDRTAnswer = function() {
        const inp = document.getElementById('ans-input');
        const feedback = document.getElementById('drt-feedback');
        const hintBox = document.getElementById('drt-hint');
        if (!inp || inp.value === "") return;

        let uAns = parseFloat(inp.value);
        let s = drtData.scenario;
        let part = drtData.currentPart;
        let isCorrect = false;

        if (part === 0) isCorrect = (uAns === s.r1);
        else if (part === 1) isCorrect = (uAns === s.r2);
        else if (part === 2) isCorrect = (Math.abs(uAns - s.remainT) < 0.01);

        if (isCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            hintBox.style.display = "none";
            inp.disabled = true;
            
            let dbSkill = part < 2 ? 'drt_rate' : 'drt_remaining';
            if (drtData.errorsThisPart === 0) updateDRTSkill(dbSkill, 1);

            drtData.currentPart++;
            drtData.errorsThisPart = 0;

            setTimeout(() => {
                if (drtData.currentPart > 2) {
                    drtData.round++;
                    if (drtData.round > drtData.maxRounds) finishDRTGame();
                    else startDRTRound();
                } else {
                    renderDRTUI();
                }
            }, 1000);

        } else {
            drtData.errorsThisPart++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Incorrect. Try again.";
            
            hintBox.style.display = "block";
            if (part === 0) {
                hintBox.innerHTML = `<strong>Hint:</strong> Rate = Distance ÷ Time.<br>Divide ${s.n1}'s distance (${s.d1}) by their time (${s.t1}).`;
            } else if (part === 1) {
                hintBox.innerHTML = `<strong>Hint:</strong> Rate = Distance ÷ Time.<br>Divide ${s.n2}'s distance (${s.d2}) by their time (${s.t2}).`;
            } else if (part === 2) {
                let remainD = s.totalD - s.focusDDone;
                if (drtData.errorsThisPart === 1) {
                    hintBox.innerHTML = `<strong>Hint:</strong> Step 1: How many miles does ${s.focusName} have <em>left</em> to drive? (Total Distance - Distance Already Driven).`;
                } else {
                    hintBox.innerHTML = `<strong>Hint:</strong> Step 1: ${s.totalD} - ${s.focusDDone} = <strong>${remainD} miles left.</strong><br>Step 2: Divide the remaining distance by ${s.focusName}'s speed (${s.focusRate} mph) to find the remaining time.`;
                }
            }
        }
    };

    function updateDRTSkill(col, amt) {
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

    function finishDRTGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">🚗</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Trip Calculations Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.DRT || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.DRT = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ DRT: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
