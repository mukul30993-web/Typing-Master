// ============================================
// Typing Master - Enhanced JavaScript
// ============================================

// Word lists by difficulty
const wordLists = {
    easy: [
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
        "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
        "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
        "an", "will", "my", "one", "all", "would", "there", "their", "what", "so"
    ],
    medium: [
        "python", "flask", "html", "css", "javascript", "mysql", "database",
        "developer", "coding", "website", "frontend", "backend", "project",
        "keyboard", "speed", "typing", "software", "programming", "application",
        "internet", "computer", "technology", "learning", "practice", "network",
        "server", "client", "cloud", "algorithm", "function", "variable",
        "object", "class", "method", "framework", "bootstrap", "react"
    ],
    hard: [
        "artificial", "intelligence", "machine", "learning", "authentication",
        "authorization", "microservices", "architecture", "optimization",
        "performance", "scalability", "implementation", "configuration",
        "deployment", "infrastructure", "containerization", "orchestration",
        "kubernetes", "elasticsearch", "postgresql", "mongodb", "redis",
        "rabbitmq", "graphql", "typescript", "nodejs", "django", "angular",
        "kubernetes", "terraform", "ansible", "jenkins", "prometheus"
    ]
};

// Game State
const gameState = {
    time: 60,
    started: false,
    finished: false,
    currentDifficulty: 'medium',
    currentSentence: '',
    correctChars: 0,
    totalChars: 0,
    mistakeCount: 0,
    countdown: null,
    startTime: null,
    username: ''
};

// DOM Elements
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
    saveBtn: document.getElementById("saveBtn")
};

// ============================================
// Core Functions
// ============================================

/**
 * Generate a random sentence based on difficulty
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
        return;
    }

    gameState.username = username;
    gameState.started = true;
    gameState.startTime = Date.now();

    clearNameError();
    elements.input.disabled = false;
    elements.input.focus();

    gameState.countdown = setInterval(() => {
        gameState.time--;
        updateTimerDisplay();

        // Calculate live WPM
        const elapsed = (Date.now() - gameState.startTime) / 60000;
        const currentWPM = Math.round((gameState.correctChars / 5) / elapsed);
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

    // Calculate final results
    const elapsed = 60 - gameState.time;
    const finalWPM = Math.round((gameState.correctChars / 5) / (elapsed / 60));
    const accuracy = gameState.totalChars > 0 
        ? Math.round((gameState.correctChars / gameState.totalChars) * 100) 
        : 100;

    // Display results
    showResult(finalWPM, accuracy);

    // Save score
    saveScore(finalWPM, accuracy);
}

/**
 * Display test results
 */
function showResult(wpm, accuracy) {
    if (!elements.result) return;

    let message = '';
    let icon = '';

    if (wpm >= 80) {
        icon = '🏆';
        message = 'Outstanding! You\'re a typing master!';
    } else if (wpm >= 60) {
        icon = '🌟';
        message = 'Excellent! Keep up the great work!';
    } else if (wpm >= 40) {
        icon = '👍';
        message = 'Good job! You\'re improving!';
    } else {
        icon = '💪';
        message = 'Keep practicing! You\'ll get better!';
    }

    elements.result.innerHTML = `
        <div class="result-box">
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
        </div>
    `;
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
                difficulty: gameState.currentDifficulty
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
 * Handle typing input
 */
function handleTyping() {
    const username = elements.username?.value.trim();

    // Validate username
    if (!username) {
        showNameError("❌ Please enter your name first!");
        elements.input.value = "";
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

    // Compare each character
    for (let i = 0; i < gameState.currentSentence.length; i++) {
        const targetChar = gameState.currentSentence[i];

        if (i < typedText.length) {
            // Character has been typed
            if (typedText[i] === targetChar) {
                // Correct character
                resultHTML += `<span class="char-correct">${targetChar}</span>`;
                if (i === typedText.length - 1) {
                    gameState.correctChars++;
                    gameState.totalChars++;
                }
            } else {
                // Incorrect character
                resultHTML += `<span class="char-incorrect">${targetChar}</span>`;
                currentMistakes++;
                if (i === typedText.length - 1) {
                    gameState.totalChars++;
                }
            }
        } else if (i === typedText.length) {
            // Current position indicator
            resultHTML += `<span class="char-current">${targetChar}</span>`;
        } else {
            // Not yet typed
            resultHTML += `<span class="char-remaining">${targetChar}</span>`;
        }
    }

    // Update display
    elements.textBox.innerHTML = resultHTML;
    gameState.mistakeCount = currentMistakes;
    elements.mistakes.textContent = currentMistakes;

    // Calculate accuracy
    const accuracy = gameState.totalChars > 0 
        ? Math.round(((gameState.totalChars - currentMistakes) / gameState.totalChars) * 100) 
        : 100;
    
    if (elements.accuracy) {
        elements.accuracy.textContent = accuracy;
    }

    // Check if test is complete
    if (typedText.length >= gameState.currentSentence.length) {
        endTest();
    }
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Update timer display
 */
function updateTimerDisplay() {
    if (elements.timer) {
        elements.timer.textContent = gameState.time;
        
        // Add warning class when time is low
        if (gameState.time <= 10) {
            elements.timer.classList.add('warning');
        }
    }
}

/**
 * Update all statistics
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
    gameState.time = 60;
    gameState.started = false;
    gameState.finished = false;
    gameState.correctChars = 0;
    gameState.totalChars = 0;
    gameState.mistakeCount = 0;
    gameState.startTime = null;

    // Reset UI
    elements.timer.textContent = '60';
    elements.timer.classList.remove('warning');
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
 * Save username
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

    clearNameError();
    gameState.username = username;
    elements.input.disabled = false;
    elements.input.focus();

    // Show welcome message
    if (elements.result) {
        elements.result.innerHTML = `
            <div class="result-box">
                <div class="result-icon">👋</div>
                <h2 class="result-title">Welcome, ${username}!</h2>
                <p class="result-message">Start typing to begin the test</p>
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
});