/* ============================================
   Typing Master - Enhanced JavaScript
   ============================================ */

// ============================================
// Word Lists by Difficulty
// ============================================

const wordLists = {
    easy: [
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
        "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
        "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
        "an", "will", "my", "one", "all", "would", "there", "their", "what", "so",
        "up", "out", "if", "about", "who", "get", "which", "go", "me", "when"
    ],
    medium: [
        "python", "flask", "html", "css", "javascript", "mysql", "database",
        "developer", "coding", "website", "frontend", "backend", "project",
        "keyboard", "speed", "typing", "software", "programming", "application",
        "internet", "computer", "technology", "learning", "practice", "network",
        "server", "client", "cloud", "algorithm", "function", "variable",
        "object", "class", "method", "framework", "bootstrap", "react",
        "angular", "nodejs", "django", "security", "authentication"
    ],
    hard: [
        "artificial", "intelligence", "machine", "learning", "authentication",
        "authorization", "microservices", "architecture", "optimization",
        "performance", "scalability", "implementation", "configuration",
        "deployment", "infrastructure", "containerization", "orchestration",
        "kubernetes", "elasticsearch", "postgresql", "mongodb", "redis",
        "rabbitmq", "graphql", "typescript", "nodejs", "django", "angular",
        "kubernetes", "terraform", "ansible", "jenkins", "prometheus",
        "cryptography", "encryption", "blockchain", "quantum", "neural"
    ]
};

// ============================================
// Game State
// ============================================

const gameState = {
    time: 60,
    maxTime: 60,
    started: false,
    finished: false,
    currentDifficulty: 'medium',
    currentSentence: '',
    correctChars: 0,
    totalChars: 0,
    mistakeCount: 0,
    countdown: null,
    startTime: null,
    username: '',
    accuracy: 100
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    textBox: document.getElementById("textBox"),
    input: document.getElementById("typingInput"),
    timer: document.getElementById("timer"),
    wpm: document.getElementById("wpm"),
    mistakes: document.getElementById("mistakes"),
    accuracy: document.getElementById("accuracy"),
    username: document.getElementById("username"),
    nameError: document.getElementById("nameError"),
    result: document.getElementById("result"),
    startBtn: document.getElementById("startBtn"),
    saveBtn: document.getElementById("saveBtn"),
    timerCard: document.querySelector(".stat-card:first-child")
};

// ============================================
// Core Functions
// ============================================

/**
 * Generate a random sentence based on difficulty level
 * @param {number} wordCount - Number of words to generate
 * @returns {string} Generated sentence
 */
function generateSentence(wordCount = 50) {
    const words = wordLists[gameState.currentDifficulty] || wordLists.medium;
    let sentence = [];

    for (let i = 0; i < wordCount; i++) {
        sentence.push(words[Math.floor(Math.random() * words.length)]);
    }

    return sentence.join(' ');
}

/**
 * Initialize the typing test
 */
function initializeTest() {
    gameState.currentSentence = generateSentence();
    gameState.correctChars = 0;
    gameState.totalChars = 0;
    gameState.mistakeCount = 0;
    gameState.accuracy = 100;

    if (elements.textBox) {
        elements.textContent = gameState.currentSentence;
    }

    updateStats();
}

/**
 * Start the countdown timer
 */
function startTimer() {
    if (gameState.started || gameState.finished) return;

    // Validate username
    const username = elements.username?.value.trim();
    if (!username) {
        showNameError("❌ Please enter your name first!");
        elements.username?.focus();
        return;
    }

    gameState.username = username;
    gameState.started = true;
    gameState.startTime = Date.now();

    clearNameError();
    elements.input.disabled = false;
    elements.input.focus();

    // Add started visual feedback
    document.querySelector(".container")?.classList.add("typing-active");

    gameState.countdown = setInterval(() => {
        gameState.time--;
        updateTimerDisplay();

        // Calculate live WPM
        const elapsed = (Date.now() - gameState.startTime) / 60000;
        const currentWPM = elapsed > 0 ? Math.round((gameState.correctChars / 5) / elapsed) : 0;
        elements.wpm.textContent = Math.max(0, currentWPM);

        // Check if time is up
        if (gameState.time <= 0) {
            endTest();
        }
    }, 1000);
}

/**
 * End the typing test
 */
function endTest() {
    clearInterval(gameState.countdown);
    gameState.finished = true;
    elements.input.disabled = true;

    // Remove started visual feedback
    document.querySelector(".container")?.classList.remove("typing-active");

    // Calculate final results
    const elapsed = (Date.now() - gameState.startTime) / 60000;
    const finalWPM = elapsed > 0 ? Math.round((gameState.correctChars / 5) / elapsed) : 0;
    const accuracy = gameState.totalChars > 0 
        ? Math.round((gameState.correctChars / gameState.totalChars) * 100) 
        : 100;

    // Display results
    showResult(finalWPM, accuracy);

    // Save score
    saveScore(finalWPM, accuracy);
}

/**
 * Display test results with animation
 */
function showResult(wpm, accuracy) {
    if (!elements.result) return;

    let message = '';
    let icon = '';
    let rating = '';

    if (wpm >= 100) {
        icon = '👑';
        message = 'Legendary! You are a typing master!';
        rating = 'legendary';
    } else if (wpm >= 80) {
        icon = '🏆';
        message = 'Outstanding! Exceptional typing skills!';
        rating = 'outstanding';
    } else if (wpm >= 60) {
        icon = '🌟';
        message = 'Excellent! Keep up the great work!';
        rating = 'excellent';
    } else if (wpm >= 40) {
        icon = '👍';
        message = 'Good job! You are improving!';
        rating = 'good';
    } else if (wpm >= 20) {
        icon = '💪';
        message = 'Keep practicing! You will get better!';
        rating = 'average';
    } else {
        icon = '🎯';
        message = 'Everyone starts somewhere! Keep going!';
        rating = 'beginner';
    }

    elements.result.innerHTML = `
        <div class="result-content ${rating}">
            <div class="result-icon">${icon}</div>
            <h2 class="result-title">Test Complete!</h2>
            <div class="result-stats">
                <div class="result-stat">
                    <span class="stat-label">WPM</span>
                    <span class="stat-value">${wpm}</span>
                </div>
                <div class="result-stat">
                    <span class="stat-label">Accuracy</span>
                    <span class="stat-value">${accuracy}%</span>
                </div>
                <div class="result-stat">
                    <span class="stat-label">Mistakes</span>
                    <span class="stat-value">${gameState.mistakeCount}</span>
                </div>
            </div>
            <p class="result-message">${message}</p>
            <button class="btn btn-primary" onclick="restartTest()" style="margin-top: 20px;">
                🔄 Try Again
            </button>
        </div>
    `;

    // Add celebration effect for high scores
    if (wpm >= 60) {
        celebrateSuccess();
    }
}

/**
 * Save score to server
 */
async function saveScore(wpm, accuracy) {
    try {
        const response = await fetch("/save_score", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: gameState.username,
                wpm: wpm,
                accuracy: accuracy,
                mistakes: gameState.mistakeCount,
                difficulty: gameState.currentDifficulty,
                tests_completed: 1
            })
        });

        const data = await response.text();
        
        if (elements.saveBtn) {
            elements.saveBtn.disabled = false;
        }

        console.log("Score saved:", data);
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// ============================================
// Typing Handler
// ============================================

/**
 * Handle typing input with real-time feedback
 */
function handleTyping() {
    const username = elements.username?.value.trim();

    // Validate username
    if (!username) {
        showNameError("❌ Please enter your name first!");
        elements.input.value = "";
        elements.input.blur();
        return;
    }

    // Start timer on first keystroke
    if (!gameState.started && !gameState.finished) {
        startTimer();
    }

    if (gameState.finished) return;

    const typedText = elements.input.value;
    let resultHTML = '';
    let currentMistakes = 0;
    let correctCount = 0;

    // Compare each character
    for (let i = 0; i < gameState.currentSentence.length; i++) {
        const targetChar = gameState.currentSentence[i];

        if (i < typedText.length) {
            // Character has been typed
            if (typedText[i] === targetChar) {
                // Correct character
                resultHTML += `<span class="char-correct">${escapeHtml(targetChar)}</span>`;
                correctCount++;
            } else {
                // Incorrect character
                resultHTML += `<span class="char-incorrect">${escapeHtml(targetChar)}</span>`;
                currentMistakes++;
            }
        } else if (i === typedText.length) {
            // Current position indicator
            resultHTML += `<span class="char-current">${escapeHtml(targetChar)}</span>`;
        } else {
            // Not yet typed
            resultHTML += `<span class="char-remaining">${escapeHtml(targetChar)}</span>`;
        }
    }

    // Update state
    gameState.correctChars = correctCount;
    gameState.totalChars = typedText.length;
    gameState.mistakeCount = currentMistakes;
    gameState.accuracy = typedText.length > 0 
        ? Math.round((correctCount / typedText.length) * 100) 
        : 100;

    // Update display
    elements.textBox.innerHTML = resultHTML;
    elements.mistakes.textContent = currentMistakes;
    
    if (elements.accuracy) {
        elements.accuracy.textContent = gameState.accuracy;
    }

    // Check if test is complete
    if (typedText.length >= gameState.currentSentence.length) {
        endTest();
    }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Update timer display with warning states
 */
function updateTimerDisplay() {
    if (elements.timer) {
        elements.timer.textContent = gameState.time;
        
        // Add warning class when time is low
        if (gameState.time <= 10) {
            elements.timerCard?.classList.add('warning');
        }
        if (gameState.time <= 5) {
            elements.timerCard?.classList.add('critical');
        }
    }
}

/**
 * Update all statistics displays
 */
function updateStats() {
    elements.wpm.textContent = '0';
    elements.mistakes.textContent = '0';
    if (elements.accuracy) {
        elements.accuracy.textContent = '100';
    }
}

/**
 * Show name error message
 */
function showNameError(message) {
    if (elements.nameError) {
        elements.nameError.textContent = message;
        elements.nameError.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            clearNameError();
        }, 3000);
    }
}

/**
 * Clear name error message
 */
function clearNameError() {
    if (elements.nameError) {
        elements.nameError.textContent = '';
        elements.nameError.classList.remove('show');
    }
}

// ============================================
// Control Functions
// ============================================

/**
 * Restart the typing test
 */
function restartTest() {
    clearInterval(gameState.countdown);

    // Reset game state
    gameState.time = gameState.maxTime;
    gameState.started = false;
    gameState.finished = false;
    gameState.correctChars = 0;
    gameState.totalChars = 0;
    gameState.mistakeCount = 0;
    gameState.accuracy = 100;
    gameState.startTime = null;

    // Reset UI
    elements.timer.textContent = gameState.maxTime;
    elements.timerCard?.classList.remove('warning', 'critical');
    updateStats();

    elements.input.value = "";
    elements.input.disabled = true;

    // Generate new sentence
    initializeTest();
    elements.input.focus();

    // Reset result
    if (elements.result) {
        elements.result.innerHTML = `
            <div class="result-box">
                <div class="result-icon">🎯</div>
                <h2 class="result-title">Ready to Practice?</h2>
                <p class="result-message">Enter your name and click Start Practice to begin</p>
            </div>
        `;
    }
}

/**
 * Save username and prepare for test
 */
function saveName() {
    const username = elements.username?.value.trim();

    if (!username) {
        showNameError("❌ Please enter your name!");
        return;
    }

    if (username.length < 3) {
        showNameError("❌ Name must be at least 3 characters!");
        return;
    }

    if (username.length > 20) {
        showNameError("❌ Name must be less than 20 characters!");
        return;
    }

    clearNameError();
    gameState.username = username;
    elements.input.disabled = false;
    elements.input.focus();

    // Show welcome message
    if (elements.result) {
        elements.result.innerHTML = `
            <div class="result-box welcome">
                <div class="result-icon">👋</div>
                <h2 class="result-title">Welcome, ${escapeHtml(username)}!</h2>
                <p class="result-message">Start typing to begin the test. Good luck!</p>
            </div>
        `;
    }
}

/**
 * Change difficulty level
 */
function setDifficulty(level) {
    gameState.currentDifficulty = level;

    // Update button states
    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level === level) {
            btn.classList.add('active');
        }
    });

    // Generate new sentence with new difficulty
    if (!gameState.started) {
        initializeTest();
    }
}

/**
 * Change test duration
 */
function setDuration(seconds) {
    gameState.maxTime = seconds;
    gameState.time = seconds;
    elements.timer.textContent = seconds;
}

// ============================================
// Visual Effects
// ============================================

/**
 * Celebrate success with confetti effect
 */
function celebrateSuccess() {
    const colors = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createConfetti(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 30);
    }
}

/**
 * Create a single confetti piece
 */
function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${Math.random() * 100}vw;
        top: -10px;
        animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 4000);
}

// Add confetti animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// Keyboard Shortcuts
// ============================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to restart
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        restartTest();
    }
    
    // Escape to blur input
    if (e.key === 'Escape') {
        elements.input.blur();
    }
});

// ============================================
// Event Listeners
// ============================================

// Input handler
if (elements.input) {
    elements.input.addEventListener('input', handleTyping);

    // Prevent backspace after test starts
    elements.input.addEventListener('keydown', function(e) {
        if (gameState.started && e.key === 'Backspace') {
            e.preventDefault();
        }
    });
}

// Difficulty buttons
document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', function() {
        setDifficulty(this.dataset.level);
    });
});

// ============================================
// Initialize on page load
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeTest();
    elements.input.disabled = true;
    
    // Focus username input
    elements.username?.focus();
    
    console.log('⌨️ Typing Master initialized!');
});