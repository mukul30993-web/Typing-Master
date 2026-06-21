const words = [
"python","flask","html","css","javascript","mysql","database","developer",
"coding","website","frontend","backend","project","keyboard","speed",
"typing","software","programming","application","internet","computer",
"technology","learning","practice","network","server","client","cloud",
"artificial","intelligence","machine","learning","algorithm","function",
"variable","object","class","method","framework","bootstrap","react",
"angular","nodejs","django","security","authentication","authorization"
];

let time = 60;
let started = false;
let countdown;

const textBox = document.getElementById("textBox");
const input = document.getElementById("typingInput");
const timer = document.getElementById("timer");
const wpm = document.getElementById("wpm");
const mistakes = document.getElementById("mistakes");

function generateSentence() {

    let sentence = "";

    for (let i = 0; i < 50; i++) {
        sentence += words[Math.floor(Math.random() * words.length)] + " ";
    }

    return sentence.trim();
}

let currentSentence = generateSentence();

if (textBox) {
    textBox.textContent = currentSentence;
}

function startTimer() {

    countdown = setInterval(() => {

        time--;
        timer.textContent = time;

        let wordCount = input.value
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0)
            .length;

        wpm.textContent = wordCount;

        if (time <= 0) {

            clearInterval(countdown);

            input.disabled = true;

            const username =
                document.getElementById("username").value.trim();

            if (username === "") {

                const errorBox =
                    document.getElementById("nameError");

                if (errorBox) {
                    errorBox.innerText =
                    "❌ Please enter your name!";
                }

                return;
            }

            fetch("/save_score", {
                method: "POST",
                headers: {
                    "Content-Type":
                    "application/x-www-form-urlencoded"
                },
                body:
                    "username=" +
                    encodeURIComponent(username) +
                    "&wpm=" +
                    encodeURIComponent(wordCount)
            })
            .then(response => response.text())
            .then(data => {

                alert(
                    "Score Saved!\n\n" +
                    "Name: " + username +
                    "\nWPM: " + wordCount
                );

                location.reload();
            })
            .catch(error => {
                console.log(error);
            });
        }

    }, 1000);
}

input.addEventListener("input", () => {

    const username =
        document.getElementById("username").value.trim();

    if (username === "") {

        const errorBox =
            document.getElementById("nameError");

        if (errorBox) {
            errorBox.innerText =
            "❌ Please enter your name first!";
        }

        input.value = "";
        return;
    }

    if (!started) {
        started = true;
        startTimer();
    }

    const typedText = input.value;

    let result = "";
    let mistakeCount = 0;

    for (let i = 0; i < currentSentence.length; i++) {

        const char = currentSentence[i];

        if (i < typedText.length) {

            if (typedText[i] === char) {

                result +=
                `<span style="color:lime">${char}</span>`;

            } else {

                result +=
                `<span style="color:red">${char}</span>`;

                mistakeCount++;
            }

        } else if (i === typedText.length) {

            result +=
            `<span style="background:yellow;color:black">${char}</span>`;

        } else {

            result +=
            `<span style="color:#bbb">${char}</span>`;
        }
    }

    textBox.innerHTML = result;
    mistakes.textContent = mistakeCount;
});

function restartTest() {

    clearInterval(countdown);

    time = 60;
    started = false;

    timer.textContent = "60";
    wpm.textContent = "0";
    mistakes.textContent = "0";

    input.value = "";
    input.disabled = false;

    currentSentence = generateSentence();
    textBox.textContent = currentSentence;

    input.focus();
}

function saveName() {

    const username =
        document.getElementById("username").value.trim();

    const errorBox =
        document.getElementById("nameError");

    if (username === "") {

        if (errorBox) {
            errorBox.innerText =
            "❌ Please enter your name!";
        }

        return;
    }

    if (errorBox) {
        errorBox.innerText = "";
    }

    alert("✅ Welcome " + username + "!");
}

document.getElementById("typingInput").addEventListener("keydown", function(e) {

    if (started && e.key === "Backspace") {
        e.preventDefault();
    }

});