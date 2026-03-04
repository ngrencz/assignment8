/**
 * skill_transform_coords.js
 * - 8th Grade: Algebraic Transformations
 * - Tasks students with calculating exact (x, y) coordinates after a sequence of moves.
 * - Dynamic difficulty: 1 move for Mastery < 5, 2 moves for Mastery 5+.
 * - Features a built-in Algebraic Rules Cheat Sheet.
 */

(function() {
    console.log("🚀 skill_transform_coords.js LIVE (Algebraic Transformations)");

    var tcData = {
        round: 1,
        maxRounds: 3,
        errorsThisRound: 0,
        pts: [], // Original Points {label, x, y}
        moves: [], 
        finalPts: [], // Calculated Final Points
        activeSkills: []
    };

    // Helper to format decimals cleanly
    function fmt(num) {
        return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.00$/, '');
    }

    window.initTransformCoordsGame = async function() {
        if (!document.getElementById('q-content')) return;

        window.isCurrentQActive = true;
        window.currentQSeconds = 0;
        tcData.round = 1;
        tcData.errorsThisRound = 0;

        if (!window.userMastery) window.userMastery = {};

        try {
            if (window.supabaseClient && window.currentUser) {
                const h = sessionStorage.getItem('target_hour') || "00";
                const { data } = await window.supabaseClient
                    .from('assignment')
                    .select('TransformCoords, tc_translation, tc_reflection, tc_rotation, tc_dilation')
                    .eq('userName', window.currentUser)
                    .eq('hour', h)
                    .maybeSingle();
                
                if (data) window.userMastery = { ...window.userMastery, ...data };
            }
        } catch (e) {
            console.warn("TransformCoords DB sync error.");
        }

        startTCRound();
    };

    function startTCRound() {
        tcData.errorsThisRound = 0;
        generateTCProblem();
        renderTCUI();
    }

    function generateTCProblem() {
        // Base Triangles (Keep coordinates even so dilations of 0.5 result in clean integers)
        const triangles = [
            [{x:-4, y:2}, {x:-4, y:6}, {x:2, y:2}],
            [{x:2, y:2}, {x:6, y:8}, {x:8, y:2}],
            [{x:-6, y:-2}, {x:-2, y:-2}, {x:-4, y:-6}],
            [{x:4, y:-4}, {x:4, y:-8}, {x:8, y:-4}]
        ];
        
        let base = triangles[Math.floor(Math.random() * triangles.length)];
        tcData.pts = [
            { label: 'A', x: base[0].x, y: base[0].y },
            { label: 'B', x: base[1].x, y: base[1].y },
            { label: 'C', x: base[2].x, y: base[2].y }
        ];

        let mastery = window.userMastery.TransformCoords || 0;
        let numMoves = mastery >= 5 ? 2 : 1;

        tcData.moves = [];
        tcData.activeSkills = [];
        
        let currentCoords = JSON.parse(JSON.stringify(tcData.pts));

        for (let i = 0; i < numMoves; i++) {
            let moveType = ['translation', 'reflectX', 'reflectY', 'rotate', 'dilation'][Math.floor(Math.random() * 5)];
            let move = { type: moveType };

            if (moveType === 'translation') {
                move.dx = Math.floor(Math.random() * 9) - 4; // -4 to 4
                move.dy = Math.floor(Math.random() * 9) - 4;
                if (move.dx === 0 && move.dy === 0) move.dx = 2;
                tcData.activeSkills.push('tc_translation');
                move.text = `Translate by (${move.dx}, ${move.dy})`;
                
                currentCoords.forEach(p => { p.x += move.dx; p.y += move.dy; });
            } 
            else if (moveType === 'reflectX') {
                tcData.activeSkills.push('tc_reflection');
                move.text = `Reflect across the x-axis`;
                currentCoords.forEach(p => { p.y = -p.y; });
            }
            else if (moveType === 'reflectY') {
                tcData.activeSkills.push('tc_reflection');
                move.text = `Reflect across the y-axis`;
                currentCoords.forEach(p => { p.x = -p.x; });
            }
            else if (moveType === 'rotate') {
                let rotOptions = [
                    { deg: 90, dir: 'CW', fn: (p) => { let tmp = p.x; p.x = p.y; p.y = -tmp; } },
                    { deg: 90, dir: 'CCW', fn: (p) => { let tmp = p.x; p.x = -p.y; p.y = tmp; } },
                    { deg: 180, dir: '', fn: (p) => { p.x = -p.x; p.y = -p.y; } }
                ];
                let rot = rotOptions[Math.floor(Math.random() * rotOptions.length)];
                tcData.activeSkills.push('tc_rotation');
                move.text = `Rotate ${rot.deg}° ${rot.dir} about the origin`;
                currentCoords.forEach(p => rot.fn(p));
            }
            else if (moveType === 'dilation') {
                let factor = Math.random() > 0.5 ? 2 : 0.5;
                tcData.activeSkills.push('tc_dilation');
                move.text = `Dilate by a scale factor of ${factor} from the origin`;
                currentCoords.forEach(p => { p.x *= factor; p.y *= factor; });
            }

            tcData.moves.push(move);
        }

        tcData.finalPts = currentCoords;
    }

    function renderTCUI() {
        const qContent = document.getElementById('q-content');
        if (!qContent) return;

        let pLabel = tcData.moves.length === 1 ? "'" : "''"; // A' vs A'' depending on step count

        qContent.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto; animation: fadeIn 0.4s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div style="color:#64748b; font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:13px;">
                        Round ${tcData.round} of ${tcData.maxRounds}
                    </div>
                    <button onclick="document.getElementById('tc-hint-modal').style.display='block'" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; padding:6px 12px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:12px;">💡 Rule Cheat Sheet</button>
                </div>

                <div id="tc-hint-modal" style="display:none; background:#1e293b; color:white; padding:20px; border-radius:12px; margin-bottom:20px; font-size:14px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); position:relative;">
                    <button onclick="document.getElementById('tc-hint-modal').style.display='none'" style="position:absolute; top:10px; right:10px; background:transparent; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">&times;</button>
                    <h4 style="margin:0 0 10px 0; color:#38bdf8; text-transform:uppercase;">Algebraic Rules</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-family:monospace; font-size:13px;">
                        <div><strong>Translation (a,b):</strong><br> (x, y) &rarr; (x + a, y + b)</div>
                        <div><strong>Dilation (scale k):</strong><br> (x, y) &rarr; (kx, ky)</div>
                        <div><strong>Reflect x-axis:</strong><br> (x, y) &rarr; (x, -y)</div>
                        <div><strong>Reflect y-axis:</strong><br> (x, y) &rarr; (-x, y)</div>
                        <div><strong>Rotate 90° CW:</strong><br> (x, y) &rarr; (y, -x)</div>
                        <div><strong>Rotate 90° CCW:</strong><br> (x, y) &rarr; (-y, x)</div>
                        <div style="grid-column: span 2;"><strong>Rotate 180°:</strong> (x, y) &rarr; (-x, -y)</div>
                    </div>
                </div>

                <div style="display:flex; gap:15px; margin-bottom:20px;">
                    <div style="flex:1; background:white; padding:15px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align:center;">
                        <h4 style="margin:0 0 10px 0; color:#475569;">Original Triangle</h4>
                        <div style="font-family:monospace; font-size:16px; color:#1e293b; line-height:1.8;">
                            ${tcData.pts.map(p => `<strong>${p.label}</strong> (${p.x}, ${p.y})`).join('<br>')}
                        </div>
                    </div>

                    <div style="flex:1.5; background:#eff6ff; padding:15px; border-radius:12px; border:1px solid #bfdbfe; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <h4 style="margin:0 0 10px 0; color:#1d4ed8;">Transformation Sequence</h4>
                        <ol style="margin:0; padding-left:20px; color:#1e3a8a; font-weight:bold; line-height:1.6; font-size:15px;">
                            ${tcData.moves.map(m => `<li>${m.text}</li>`).join('')}
                        </ol>
                    </div>
                </div>

                <div style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h4 style="margin:0 0 15px 0; color:#334155; text-align:center;">Calculate the Final Coordinates</h4>
                    <div style="display:flex; justify-content:space-around;">
                        ${tcData.pts.map((p, i) => `
                            <div style="text-align:center;">
                                <div style="font-weight:bold; color:#1e293b; font-size:16px; margin-bottom:5px;">${p.label}${pLabel}</div>
                                <div style="display:flex; align-items:center; justify-content:center; font-size:18px;">
                                    (
                                    <input type="number" id="tc-x-${i}" step="0.5" style="width:60px; padding:8px; text-align:center; border:2px solid #cbd5e1; border-radius:6px; font-size:16px; margin:0 5px;">
                                    ,
                                    <input type="number" id="tc-y-${i}" step="0.5" style="width:60px; padding:8px; text-align:center; border:2px solid #cbd5e1; border-radius:6px; font-size:16px; margin:0 5px;">
                                    )
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top:25px; text-align:center;">
                        <button onclick="checkTCAnswer()" style="background:#1e293b; color:white; border:none; padding:12px 30px; font-size:16px; font-weight:bold; border-radius:8px; cursor:pointer;">Verify Coordinates</button>
                        <div id="tc-feedback" style="margin-top: 15px; font-weight: bold; font-size: 15px; min-height: 24px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    window.checkTCAnswer = function() {
        const feedback = document.getElementById('tc-feedback');
        let allCorrect = true;
        let emptyFields = false;

        tcData.finalPts.forEach((ans, i) => {
            const xInput = document.getElementById(`tc-x-${i}`);
            const yInput = document.getElementById(`tc-y-${i}`);
            
            if (xInput.value === "" || yInput.value === "") emptyFields = true;

            const uX = parseFloat(xInput.value);
            const uY = parseFloat(yInput.value);

            let xCorrect = Math.abs(uX - ans.x) < 0.01;
            let yCorrect = Math.abs(uY - ans.y) < 0.01;

            // Visual feedback on individual fields
            xInput.style.borderColor = xCorrect ? "#16a34a" : "#ef4444";
            xInput.style.backgroundColor = xCorrect ? "#f0fdf4" : "#fef2f2";
            
            yInput.style.borderColor = yCorrect ? "#16a34a" : "#ef4444";
            yInput.style.backgroundColor = yCorrect ? "#f0fdf4" : "#fef2f2";

            if (!xCorrect || !yCorrect) allCorrect = false;
        });

        if (emptyFields) {
            feedback.style.color = "#f59e0b";
            feedback.innerText = "⚠️ Please fill in all coordinates before verifying.";
            return;
        }

        if (allCorrect) {
            feedback.style.color = "#16a34a";
            feedback.innerText = "✅ Excellent! All coordinates are correct.";
            
            // Sub-skill Tracking (Remove duplicates so we don't double count if they do 2 translations)
            let uniqueSkills = [...new Set(tcData.activeSkills)];
            if (tcData.errorsThisRound === 0) {
                uniqueSkills.forEach(skill => updateTCSkill(skill, 1));
            }

            tcData.round++;
            setTimeout(() => {
                if (tcData.round > tcData.maxRounds) finishTCGame();
                else startTCRound();
            }, 1500);

        } else {
            tcData.errorsThisRound++;
            feedback.style.color = "#dc2626";
            feedback.innerText = "❌ Some coordinates are incorrect. Check the red boxes and try using the Rule Cheat Sheet!";
        }
    };

    function updateTCSkill(col, amt) {
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

    function finishTCGame() {
        window.isCurrentQActive = false; 
        const qContent = document.getElementById('q-content');
        
        qContent.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:400px; animation: fadeIn 0.5s;">
                <div style="font-size:60px; margin-bottom:15px;">✍️</div>
                <h2 style="color:#1e293b; margin:0 0 10px 0;">Algebraic Rules Mastered!</h2>
                <p style="color:#64748b; font-size:16px;">Saving results...</p>
            </div>
        `;

        if (window.supabaseClient && window.currentUser) {
            let curMain = window.userMastery.TransformCoords || 0;
            let newMain = Math.min(10, curMain + 1);
            window.userMastery.TransformCoords = newMain;

            const h = sessionStorage.getItem('target_hour') || "00";
            window.supabaseClient.from('assignment').update({ TransformCoords: newMain })
                .eq('userName', window.currentUser).eq('hour', h)
                .then(({error}) => { if (error) console.error("Main fail:", error); });
        }

        setTimeout(() => { 
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion(); 
            else location.reload(); 
        }, 2000);
    }
})();
