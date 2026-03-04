/**
 * skill_c7review.js
 * - 8th Grade: Chapter 7 Test Review Router
 * - Randomly pools from the exact skills assessed on the Chapter 7 Individual Test.
 * - Extends the session timer to 30 minutes.
 */

(function() {
    console.log("🚀 skill_c7review.js LIVE (Chapter 7 Review Router)");

    window.initC7ReviewGame = function() {
        // The exact skills mapped to the Chapter 7 Individual Test
        const c7Skills = [
            'SolveY',           // Q1: Solve for y
            'LinearMastery',    // Q2: Graph to equation
            'Graphing',         // Q2: Graphing basics
            'Association',      // Q3: Scatterplot association
            'LineOfBestFit',    // Q4: LOBF predictions
            'SolveX',           // Q5: Fraction busters / multi-step
            'SolutionTypes',    // Q5: Number of solutions
            'TransformCoords',  // Q6: Transformation coordinates
            'Similarity',       // Q7: Similar figures
            'TableRules'        // Q8: Missing table values & rule
        ];

        // Override the standard timer for this specific review (30 mins = 1800 seconds)
        // This adjusts the global variable your hub uses to track required time
        if (typeof window.targetSeconds !== 'undefined') window.targetSeconds = 1800;
        if (typeof window.requiredSeconds !== 'undefined') window.requiredSeconds = 1800;
        
        // Pick a random skill from the pool
        const targetSkill = c7Skills[Math.floor(Math.random() * c7Skills.length)];
        console.log("🎯 C7 Review routing to:", targetSkill);

        // Execute the chosen skill's init function
        let fnToCall = window['init' + targetSkill + 'Game'];
        
        // Catch the modules that have slightly different naming conventions
        if (targetSkill === 'LinearMastery') fnToCall = window.initLinearMastery;
        if (targetSkill === 'SolveX') fnToCall = window.initSolveXGame;
        
        if (typeof fnToCall === 'function') {
            // Launch the actual game
            fnToCall();
            
            // Override the title slightly delayed so they know they are in the review
            setTimeout(() => {
                const titleEl = document.getElementById('q-title') || document.querySelector('h2');
                if (titleEl) {
                    titleEl.innerHTML = `⭐ Chapter 7 Test Review <br><span style="font-size:14px; color:#64748b; font-weight:normal;">Currently practicing: ${targetSkill}</span>`;
                }
            }, 150);
        } else {
            console.error(`Could not find initialization function for ${targetSkill}`);
            if (typeof window.loadNextQuestion === 'function') window.loadNextQuestion();
        }
    };
})();
