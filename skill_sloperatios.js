/**
 * skill_sloperatios.js
 * - 8th Grade: Comparing Slope Ratios
 * - Generates 5 rapid-fire rounds comparing two fractions.
 * - 50% chance of equivalent ratios, 50% chance of inequality.
 * - Tracks main skill (SlopeRatios) and sub-skills (sr_equal, sr_compare).
 */

(function() {
    console.log("🚀 skill_sloperatios.js LIVE (Rapid Ratio Comparison)");

    var srData = {
        round: 1,
        maxRounds: 5,
        errorsThisRound: 0,
        type: '', // 'sr_equal' or 'sr_compare'
        f1: { n: 0, d: 0 },
        f2: { n: 0, d: 0 },
        correctSymbol: ''
    };

    window.initSlopeRatiosGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        srData.round = 1;
        srData.errorsThisRound = 0;

        if (!window.userMastery) window.userMastery = {};

        // Fetch existing mastery to sync with local state
        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('SlopeRatios, sr_equal, sr_compare')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("SlopeRatios DB sync error, falling back to local state.");
        }

        startSRRound();
    };

    function startSRRound() {
        srData.errorsThisRound = 0;
        generateSRProblem();
        renderSRUI();
    }

    function generateSRProblem() {
        // 50% chance to test equivalence, 50% chance to test inequalities
        let isEquivalent = Math.random() > 0.5;
        srData.type = isEquivalent ? 'sr_equal' : 'sr_compare';

        if (isEquivalent) {
            // Generate a base fraction and multiply it
            let n1 = Math.floor(Math.random() * 8) + 1;
            let d1 = Math.floor(Math.random() * 8) + 2;
            let multiplier = Math.floor(Math.random() * 4) + 2;
            
            // Randomize which side gets the larger numbers
            if (Math.random() > 0.5) {
                srData.f1 = { n: n1, d: d1 };
                srData.f2 = { n: n1 * multiplier, d: d1 * multiplier };
            } else {
                srData.f1 = { n: n1 * multiplier, d: d1 * multiplier };
                srData.f2 = { n: n1, d: d1 };
            }
            srData.correctSymbol = '=';
        } else {
            // Generate two non-equivalent fractions
            let n1, d1, n2, d2;
            do {
                n1 = Math.floor(Math.random() * 12) + 1;
                d1 = Math.floor(Math.random() * 10) + 2;
                
                // To make it challenging, sometimes make the numerators or denominators close
                if (Math.random() > 0.5) {
                    n2 = n1 + (Math.random() > 0.5 ? 1 : -1);
                    d2 = d1;
                } else {
                    n2 = Math.floor(Math.random() * 12) + 1;
                    d2 = Math.floor(Math.random() * 10) + 2;
                }
                
                // Prevent negative numbers and zeroes from the +/- 1 logic
                if (n2 <= 0) n2 = 1;
                if (d2 <= 1) d2 = 2;

            } while (n1 * d2 === n2 * d1); // Re-roll if they accidentally turned out equal

            srData.f1 = { n: n1, d: d1 };
            srData.f2 = { n: n2, d: d2 };
            
            // Cross-multiply to determine which is greater safely without floating point errors
            if (n1 * d2 > n2 * d1) srData.correctSymbol = '>';
            else srData.correctSymbol = '<';
        }
    }

    function renderSRUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        document.getElementById('q-title').innerText = `Comparing Slopes (Round ${srData.round}/${srData.maxRounds})`;

        qContent.innerHTML = `
            <style>
                .frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 15px; font-size: 2rem; font-weight: bold; color: #1e293b; }
                .frac-num { border-bottom: 3px solid #1e293b; padding: 0 8px; }
                .frac-den { padding: 0 8px; }
                .sym-btn { background: white; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 2rem; font-weight: bold; color: #3b82f6; width: 60px; height: 60px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .sym-btn:hover { background: #eff6ff; border-color: #3b82f6; transform: scale(1.05); }
            </style>

            <div style="max-width: 600px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; margin-bottom: 20px;">
                    <p style="font-size: 16px; color: #64748b; margin-top: 0; margin-bottom: 25px;">
                        Decide if the slope ratios are equivalent (<strong>=</strong>), or if one slope is greater (<strong>&gt;</strong> or <strong>&lt;</strong>).
                    </p>
                    
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                        <div class="frac">
                            <div class="frac-num">${srData.f1.n}</div>
                            <div class="frac-den">${srData.f1.d}</div>
                        </div>

                        <div id="symbol-box" style="width: 50px; height: 50px; border: 3px dashed #94a3b8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: #1e293b; background: #f8fafc;">
                            ?
                        </div>

                        <div class="frac">
                            <div class="frac-num">${srData.f2.n}</div>
                            <div class="frac-den">${srData.f2.d}</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; display: flex; justify-content: center; gap: 15px;">
                    <button class="sym-btn" onclick="checkSRAnswer('<')">&lt;</button>
                    <button class="sym-btn" onclick="checkSRAnswer('=')">=</button>
                    <button class="sym-btn" onclick="checkSRAnswer('>')">&gt;</button>
                </div>
                
                <div id="sr-feedback" style="margin-top: 15px; text-align: center; font-weight: bold; font-size: 1.1rem; min-height: 25px;"></div>
            </div>
        `;
    }

    window.checkSRAnswer = function(chosenSymbol) {
        const symbolBox = document.getElementById('symbol-box');
        const feedback = document.getElementById('sr-feedback');
        
        // Temporarily lock buttons to prevent spam clicking
        const buttons = document.querySelectorAll('.sym-btn');
        buttons.forEach(b => b.disabled = true);

        symbolBox.innerText = chosenSymbol;
        symbolBox.style.borderStyle = "solid";

        if (chosenSymbol === srData.correctSymbol) {
            symbolBox.style.borderColor = "#22c55e";
            symbolBox.style.backgroundColor = "#dcfce7";
            symbolBox.style.color = "#16a34a";
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Correct!";

            // Reward sub-skill point if correct on first try
            if (srData.errorsThisRound === 0) {
                updateSRScore(srData.type, 1);
            }

            srData.round++;
            setTimeout(() => {
                if (srData.round > srData.maxRounds) {
                    finishSRGame();
                } else {
                    startSRRound();
                }
            }, 1000);

        } else {
            srData.errorsThisRound++;
            symbolBox.style.borderColor = "#ef4444";
            symbolBox.style.backgroundColor = "#fee2e2";
            symbolBox.style.color = "#ef4444";
            
            feedback.style.color = "#ef4444";
            
            // Contextual hint
            if (srData.correctSymbol === '=') {
                feedback.innerText = `❌ Incorrect. Try multiplying or dividing the top and bottom by the same number to check for equivalence!`;
            } else {
                feedback.innerText = `❌ Incorrect. Tip: Find a common denominator, or turn them both into decimals to compare.`;
            }

            setTimeout(() => {
                symbolBox.innerText = "?";
                symbolBox.style.borderStyle = "dashed";
                symbolBox.style.borderColor = "#94a3b8";
                symbolBox.style.backgroundColor = "#f8fafc";
                symbolBox.style.color = "#1e293b";
                feedback.innerText = "";
                buttons.forEach(b => b.disabled = false);
            }, 2500);
        }
    };

    function updateSRScore(col, amt) {
        if (!window.userMastery) window.userMastery = {};
        
        let curSub = window.userMastery[col] || 0;
        let nextSub = Math.max(0, Math.min(10, curSub + amt));
        window.userMastery[col] = nextSub;

        if (window.supabaseClient && window.currentUser) {
            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment')
                .update({ [col]: nextSub })
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .then(({error}) => { if (error) console.error("Subskill update fail:", error); });
        }
    }

    function finishSRGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">⚖️</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Slope Ratios Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        // Update main aggregate score (overall mastery of the module)
        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.SlopeRatios || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.SlopeRatios = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment')
                .update({ SlopeRatios: newMain })
                .eq('userName', window.currentUser)
                .eq('hour', h)
                .then(({error}) => { if(error) console.error("Main update fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
