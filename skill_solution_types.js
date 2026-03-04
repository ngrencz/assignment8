/**
 * skill_solution_types.js
 * - 8th Grade: Number of Solutions (One, None, Infinite)
 * - Generates multi-step equations requiring students to combine like terms.
 * - Provides conceptual hints based on the simplified equation.
 */

(function() {
    console.log("🚀 skill_solution_types.js LIVE (One, None, Infinite Solutions)");

    var stData = {
        round: 1,
        maxRounds: 5,
        errorsThisRound: 0,
        scenario: {}
    };

    window.initSolutionTypesGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        stData.round = 1;
        stData.errorsThisRound = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('SolutionTypes, st_one, st_none, st_infinite')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("SolutionTypes DB sync error.");
        }

        startSTRound();
    };

    function startSTRound() {
        stData.errorsThisRound = 0;
        generateSTProblem();
        renderSTUI();
    }

    function generateSTProblem() {
        // 0 = One Solution, 1 = No Solution, 2 = Infinite Solutions
        let type = Math.floor(Math.random() * 3); 
        let ansStr = type === 0 ? "One" : (type === 1 ? "None" : "Infinite");

        // Base equation logic: ax + b = cx + d
        let a = Math.floor(Math.random() * 6) + 2; // 2 to 7
        let b = Math.floor(Math.random() * 16) - 8; // -8 to 7
        if (b === 0) b = 4;

        let c, d;
        if (type === 0) { // One Solution (a != c)
            do { c = Math.floor(Math.random() * 8) + 2; } while (c === a);
            d = Math.floor(Math.random() * 16) - 8;
            if (d === 0) d = -3;
        } else if (type === 1) { // No Solution (a == c, b != d)
            c = a;
            do { d = Math.floor(Math.random() * 16) - 8; } while (d === b || d === 0);
        } else { // Infinite Solutions (a == c, b == d)
            c = a;
            d = b;
        }

        // Formatter to add "distractions" (combining like terms)
        function formatSide(coeff, constTerm) {
            let r = Math.random();
            let constStr = constTerm > 0 ? `+ ${constTerm}` : (constTerm < 0 ? `- ${Math.abs(constTerm)}` : ``);
            
            if (r < 0.4 && coeff > 1) {
                // Split the x term (e.g. 5x -> 2x + 3x)
                let part1 = Math.floor(coeff / 2) || 1;
                let part2 = coeff - part1;
                return `${part1}x ${constStr} + ${part2}x`.trim();
            } else if (r < 0.8) {
                // Split the constant term (e.g. + 5 -> + 7 - 2)
                let p1 = constTerm + 3;
                let p1Str = p1 > 0 ? `+ ${p1}` : (p1 < 0 ? `- ${Math.abs(p1)}` : ``);
                return `${coeff}x ${p1Str} - 3`.trim();
            } else {
                // Standard formatting
                return `${coeff}x ${constStr}`.trim();
            }
        }

        let leftExp = formatSide(a, b);
        let rightExp = formatSide(c, d);

        // Calculate simplified strings for hints
        let simLeft = `${a}x ${b > 0 ? '+ '+b : (b < 0 ? '- '+Math.abs(b) : '')}`.trim();
        let simRight = `${c}x ${d > 0 ? '+ '+d : (d < 0 ? '- '+Math.abs(d) : '')}`.trim();

        stData.scenario = {
            html: `${leftExp} = ${rightExp}`,
            simLeft: simLeft,
            simRight: simRight,
            a: a, b: b, c: c, d: d,
            ans: ansStr
        };
    }

    function renderSTUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let s = stData.scenario;

        qContent.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="text-align:center; color:#64748b; margin-bottom:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                    Round ${stData.round} of ${stData.maxRounds}
                </div>

                <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
                    <h3 style="margin-top:0; color:#475569; font-size:16px;">How many solutions does this equation have?</h3>
                    <div style="font-size:28px; font-family: 'Courier New', monospace; font-weight:bold; color:#1e293b; letter-spacing: -1px; margin-top:15px; margin-bottom: 10px;">
                        ${s.html}
                    </div>
                    <div style="font-size: 13px; color: #94a3b8; font-style: italic;">
                        (Tip: Combine your like terms first!)
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px;">
                    <button onclick="checkSTAnswer('One')" class="st-btn" style="background:#eff6ff; color:#1d4ed8; border:2px solid #bfdbfe;">
                        <span style="display:block; font-size:20px; margin-bottom:5px;">1️⃣</span>
                        One Solution<br><small style="font-size:11px; opacity:0.8;">(x = #)</small>
                    </button>
                    <button onclick="checkSTAnswer('None')" class="st-btn" style="background:#fef2f2; color:#b91c1c; border:2px solid #fecaca;">
                        <span style="display:block; font-size:20px; margin-bottom:5px;">🚫</span>
                        No Solution<br><small style="font-size:11px; opacity:0.8;">(False Statement)</small>
                    </button>
                    <button onclick="checkSTAnswer('Infinite')" class="st-btn" style="background:#f0fdf4; color:#15803d; border:2px solid #bbf7d0;">
                        <span style="display:block; font-size:20px; margin-bottom:5px;">♾️</span>
                        Infinite Solutions<br><small style="font-size:11px; opacity:0.8;">(True Statement)</small>
                    </button>
                </div>

                <div id="st-feedback" style="margin-top: 20px; font-weight: bold; font-size: 16px; text-align:center; min-height: 24px;"></div>
                <div id="st-hint" style="margin-top: 15px; padding: 15px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; display: none; font-size: 14px; color: #334155; text-align:center; line-height:1.5;"></div>
            </div>
        `;
    }

    window.checkSTAnswer = function(userAns) {
        const feedback = document.getElementById('st-feedback');
        const hintBox = document.getElementById('st-hint');
        let s = stData.scenario;

        // Disable buttons to prevent spam clicking
        document.querySelectorAll('.st-btn').forEach(btn => btn.style.pointerEvents = 'none');

        if (userAns === s.ans) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";
            hintBox.style.display = "none";
            
            let dbSkill = s.ans === "One" ? 'st_one' : (s.ans === "None" ? 'st_none' : 'st_infinite');
            if (stData.errorsThisRound === 0) updateSTSkill(dbSkill, 1);

            stData.round++;
            setTimeout(() => {
                if (stData.round > stData.maxRounds) finishSTGame();
                else startSTRound();
            }, 1200);

        } else {
            stData.errorsThisRound++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Incorrect.";
            
            hintBox.style.display = "block";
            let hText = `If we combine like terms and simplify both sides, the equation becomes:<br>
                         <div style="font-family:monospace; font-size:18px; font-weight:bold; margin:10px 0; color:#0f172a;">${s.simLeft} = ${s.simRight}</div>`;
            
            if (s.ans === "One") {
                hText += `Because the <strong>x-amounts are different</strong> (${s.a}x vs ${s.c}x), they will cross exactly once. There is <strong>One Solution</strong>.`;
            } else if (s.ans === "None") {
                hText += `Because the <strong>x-amounts are the same</strong> but the constants are different, these lines are parallel. They will never cross, so there is <strong>No Solution</strong>.`;
            } else {
                hText += `Because <strong>both sides are identical</strong>, they represent the exact same line! Any number works, so there are <strong>Infinite Solutions</strong>.`;
            }
            
            hintBox.innerHTML = hText;

            // Re-enable buttons for retry
            setTimeout(() => {
                document.querySelectorAll('.st-btn').forEach(btn => btn.style.pointerEvents = 'auto');
            }, 1000);
        }
    };

    function updateSTSkill(col, amt) {
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

    function finishSTGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">🔍</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Solution Types Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.SolutionTypes || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.SolutionTypes = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ SolutionTypes: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }

    // Styles for the big buttons
    const stStyleId = 'st-styles';
    if (!document.getElementById(stStyleId)) {
        const style = document.createElement('style');
        style.id = stStyleId;
        style.innerHTML = `
            .st-btn { padding:15px 10px; border-radius:10px; cursor:pointer; font-weight:bold; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .st-btn:hover { filter: brightness(0.95); transform: translateY(-2px); }
            .st-btn:active { transform: translateY(0); }
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        `;
        document.head.appendChild(style);
    }
})();
