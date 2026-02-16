// --- Configuration & Supabase Init ---
const SB_URL = "https://khazeoycsjdqnmwodncw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYXplb3ljc2pkcW5td29kbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDMwOTMsImV4cCI6MjA3ODQ3OTA5M30.h-WabaGcQZ968sO2ImetccUaRihRFmO2mUKCdPiAbEI";

// Initialize the client globally so test.html can see it
window.supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// Global State
window.totalSecondsWorked = parseInt(sessionStorage.getItem('total_work_time')) || 0;
window.isCurrentQActive = false;
window.currentQSeconds = 0;
window.currentUser = sessionStorage.getItem('current_user') || 'test_user';
window.targetLesson = sessionStorage.getItem('target_lesson') || '6.2.4';

// Logic Tracking - Must be window. so loadNextQuestion sees them
window.hasDonePrimaryLesson = false;
window.skillsCompletedThisSession = []; 
let lastActivity = Date.now();
let canCount = false; 
let resumeTimeout = null;

// --- Tab Visibility Logic ---
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        canCount = false;
        clearTimeout(resumeTimeout);
        if (typeof log === "function") log("⏸️ Tab hidden: Timer stopped.");
    } else {
        if (typeof log === "function") log("⏱️ Tab active: Resuming in 20s...");
        resumeTimeout = setTimeout(() => {
            canCount = true;
            if (typeof log === "function") log("▶️ 20s elapsed: Timer resumed.");
        }, 20000); 
    }
});

// Initial trigger to start the first 20s countdown on load
resumeTimeout = setTimeout(() => { canCount = true; }, 20000);

// --- The Master Timer Loop ---
setInterval(() => {
    const statePill = document.getElementById('timer-state-pill');
    const totalDisplay = document.getElementById('debug-total-time');
    
    // Check if a question is actually visible (not just "Wait...")
    const qContent = document.getElementById('q-content');
    const hasQuestion = qContent && qContent.innerHTML.length > 50 && !qContent.innerText.includes("Wait...");

    if (window.isCurrentQActive && canCount && hasQuestion) {
        window.totalSecondsWorked++;
        window.currentQSeconds++;
        sessionStorage.setItem('total_work_time', window.totalSecondsWorked);

        // UI Updates
        let mins = Math.floor(window.totalSecondsWorked / 60);
        let secs = window.totalSecondsWorked % 60;
        if (totalDisplay) totalDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs} / 12:00`;
        if (statePill) {
            statePill.innerText = "RUNNING";
            statePill.style.background = "#22c55e";
        }
        
        if (window.totalSecondsWorked >= 720) finishAssignment();
    } else {
        if (statePill) {
            if (!hasQuestion) {
                statePill.innerText = "NO QUESTION LOADED";
                statePill.style.background = "#ef4444";
            } else if (!canCount) {
                statePill.innerText = "TAB COOLDOWN (20s)";
                statePill.style.background = "#3b82f6";
            } else {
                statePill.innerText = "PAUSED";
                statePill.style.background = "#64748b";
            }
        }
    }
}, 1000);

// --- Adaptive Routing Logic ---
async function loadNextQuestion() {
    const feedback = document.getElementById('feedback-box');
    if(feedback) {
        feedback.style.display = 'none';
        feedback.className = '';
    }
    
    window.scrollTo(0,0);

    const skillMap = [
        { id: 'C6Transformation', fn: initTransformationGame },
        { id: 'LinearSystem', fn: initLinearSystemGame },
        { id: 'FigureGrowth', fn: initFigureGrowthGame },
        { id: 'SolveX', fn: initSolveXGame },
        { id: 'BoxPlot', fn: initBoxPlotGame }
    ];

    if (window.targetLesson === '6.2.4') {
        // ADD window. HERE
        if (!window.hasDonePrimaryLesson) {
            window.hasDonePrimaryLesson = true;
            window.skillsCompletedThisSession.push('C6Transformation');
            return initTransformationGame();
        }

        const { data, error } = await window.supabaseClient // Use window. here too
            .from('assignment')
            .select('*')
            .eq('userName', window.currentUser)
            .maybeSingle(); 

        if (error || !data) {
            console.error("Mastery fetch issue, falling back to random.");
            return skillMap[Math.floor(Math.random() * skillMap.length)].fn();
        }

        // ADD window. HERE
        let availableSkills = skillMap.filter(s => !window.skillsCompletedThisSession.includes(s.id));
        
        if (availableSkills.length === 0) {
            window.skillsCompletedThisSession = [];
            availableSkills = skillMap;
        }

        availableSkills.sort((a, b) => (data[a.id] || 0) - (data[b.id] || 0));

        const nextSkill = availableSkills[0];
        window.skillsCompletedThisSession.push(nextSkill.id); // AND window. HERE
        nextSkill.fn();

    } else {
        document.getElementById('q-title').innerText = "Under Construction";
        document.getElementById('q-content').innerHTML = `Lesson ${window.targetLesson} is not yet available.`;
    }
}

async function finishAssignment() {
    window.isCurrentQActive = false;

    try {
        const { error } = await supabaseClient
            .from('assignment')
            .update({ C624_Completed: true })
            .eq('userName', window.currentUser);

        if (error) throw error;

        document.getElementById('work-area').innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 2px solid #22c55e;">
                <h1 style="color: #22c55e;">Goal Reached!</h1>
                <p>Your 12 minutes of practice are logged.</p>
                <div style="margin: 20px 0; font-size: 3rem;">🌟</div>
                <button onclick="window.location.href='index.html'" style="background: #000; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;">Return to Dashboard</button>
            </div>
        `;
    } catch (err) {
        console.error("Completion Error:", err);
        alert("Practice goal reached! Progress saved.");
    }
}

window.onload = loadNextQuestion;
