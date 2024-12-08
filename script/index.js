
/**
 * @param {number[]} values
 * @returns {string[]}
 */
function mix(values) {
    const results = values.slice();
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [
            results[j],
            results[i]
        ];
    }
    return results;
}

/** @param {string} value  */
function convertToUpperCase(value) {
    function convert(inner) {
        return inner.charAt(0).toUpperCase() + inner.slice(1);
    }

    return value.split(" ").map(convert).join(" ");
}

function convertToDuration(value) {
    const seconds = Math.round(value / 1000);

    // Convert seconds unit to minute unit.
    if (seconds > 60) {
        return `${Math.round(seconds / 60 * 10) / 10}분`;
    }

    return `${seconds}초`;
}

addEventListener("DOMContentLoaded", async () => {
    const startButton = document.getElementById("start_button");
    const readyPage = document.getElementById("ready_page");
    const studyPage = document.getElementById("study_page");

    /** @type {HTMLInputElement} */
    const minRange = document.getElementById("min_range");

    /** @type {HTMLInputElement} */
    const maxRange = document.getElementById("max_range");

    /** @type {HTMLInputElement} */
    const reverseOption = document.getElementById("reverse_option");

    /** @type {HTMLInputElement} */
    const speakingOption = document.getElementById("speaking_option");

    /** @type {string[]} */
    const words = JSON.parse(await (await fetch("words.json")).text());

    minRange.value = 0;
    maxRange.value = words.length;
    minRange.setAttribute("min", 0);
    minRange.setAttribute("max", words.length - 1);
    maxRange.setAttribute("min", 0);
    maxRange.setAttribute("max", words.length);

    startButton.onclick = () => {
        const startTime = performance.now();
        const isSpeakingMode = speakingOption.checked;

        readyPage.style.display = "none";
        studyPage.style.display = "flex";

        const activeWords = words.slice(minRange.value, maxRange.value);
        const renderWords = mix(activeWords);
        const resultButton = studyPage.getElementsByClassName("result_button")[0];
        const summitButton = studyPage.getElementsByClassName("summit_button")[0];
        const problemText = studyPage.getElementsByClassName("problem")[0];
        const historyText = studyPage.getElementsByClassName("history")[0];
        const resultText = studyPage.getElementsByClassName("result")[0];
        const statusText = studyPage.getElementsByClassName("status")[0];
        const answerText = studyPage.getElementsByTagName("input")[0];
        const getProblem = () => reverseOption.checked ? renderWords[0]["kr"] : renderWords[0]["en"];
        const getResult = () => reverseOption.checked ? renderWords[0]["en"] : renderWords[0]["kr"];

        problemText.textContent = convertToUpperCase(getProblem());
        resultText.style.display = "none";
        resultText.textContent = convertToUpperCase(getResult());
        statusText.textContent = `${renderWords.length}개 남음`;

        /** @type {speechRecognition} */
        let speechRecognition;

        if (isSpeakingMode) {
            answerText.style.opacity = "0.5";
            answerText.style.userSelect = "none";
            answerText.style.pointerEvents = "none";
            answerText.setAttribute("placeholder", "음성으로 정답을 말하세요.");
            resultButton.textContent = "넘기기";

            speechRecognition = new webkitSpeechRecognition() || new SpeechRecognition();
            speechRecognition.lang = "en-US";
            speechRecognition.maxAlternatives = 1;
            if (!speechRecognition) {
                alert("음성 인식이 지원되지 않는 브라우저를 사용하고 있습니다.");
            }

            speechRecognition.addEventListener("end", speechRecognition.start);
            speechRecognition.addEventListener("error", (event) => {
                if (event.error = "no-speech") {
                    alert("오랜시간 동안 음성이 감지되지 않았습니다.");
                    speechRecognition.stop();
                } else {
                    switch (event.error) {
                        case "audio-capture": alert("마이크에 접근할 수 없습니다. 설정을 확인해주세요."); break;
                        case "not-allowed"  : alert("마이크 권한이 거부되었습니다."); break;
                        default             : alert("알 수 없는 에러가 발생했습니다."); break;
                    }
                }
            });

            speechRecognition.addEventListener("result", event => {
                const result = event.results[0][0]["transcript"];
                if (result != "") {
                    answerText.value = event.results[0][0]["transcript"];
                    summitButton.click();
                } else {
                    speechRecognition.stop();
                    speechRecognition.start();
                }
            });

            speechRecognition.start();
        }

        resultButton.onclick = () => {
            if (isSpeakingMode) {
                answerText.value = getProblem();
                summitButton.click();
                return;
            }

            if (resultText.style.display == "flex") {
                answerText.value = getResult();
                resultButton.textContent = "정답보기";
                summitButton.click();
            } else {
                resultText.style.display = "flex";
                resultButton.textContent = "넘기기";
            }
        }

        summitButton.onclick = () => {
            const resultA = isSpeakingMode ? getProblem() : getResult();
            const resultB = resultA.split(" ").join("");

            if (answerText.value == resultA
             || answerText.value == convertToUpperCase(resultA)
             || answerText.value == resultB
             || answerText.value == convertToUpperCase(resultB)) {
                renderWords.shift();

                if (renderWords.length == 0) {
                    const currentTime = startTime - performance.now();
                    const consumeTime = startTime - currentTime;
                    alert(`학습 종료 (평균: ${convertToDuration(consumeTime / activeWords.length)}, 최종: ${convertToDuration(consumeTime)})`);
                    return;
                }

                const previousText = `${problemText.textContent} (${resultText.textContent})`;
                historyText.textContent = `${previousText}`;
                problemText.textContent = convertToUpperCase(getProblem());
                resultText.textContent = convertToUpperCase(getResult());
                resultText.style.display = "none";
                resultButton.textContent = "정답보기";
                answerText.value = "";
            } else {
                if (isSpeakingMode == null && answerText.value) alert("정답이 아닙니다.");
                if (isSpeakingMode) {
                    speechRecognition.stop();
                }
            }
        }

        answerText.onkeydown = event => {
            if (event.key == "Enter") summitButton.click();
        }

        setInterval(() => {
            const currentTime = startTime - performance.now();
            const consumeTime = startTime - currentTime;
            statusText.textContent = `${renderWords.length}개 남음 (${convertToDuration(consumeTime)})`;
        }, 1);
    }
});