
/** @returns {string[]} */
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

addEventListener("DOMContentLoaded", async () => {
    const startButton = document.getElementById("start_button");
    const readyPage = document.getElementById("ready_page");
    const studyPage = document.getElementById("study_page");

    /** @type {HTMLInputElement} */
    const minRange = document.getElementById("min_range");

    /** @type {HTMLInputElement} */
    const maxRange = document.getElementById("max_range");

    /** @type {HTMLInputElement} */
    const reverseCheckbox = document.getElementById("reverse_checkbox");

    /** @type {string[]} */
    const words = JSON.parse(await (await fetch("words.json")).text());

    minRange.value = 0;
    maxRange.value = words.length;
    minRange.setAttribute("min", 0);
    minRange.setAttribute("max", words.length);
    maxRange.setAttribute("min", 0);
    maxRange.setAttribute("max", words.length);

    startButton.onclick = () => {
        const startTime = performance.now();

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
        const getProblem = () => reverseCheckbox.checked ? renderWords[0]["kr"] : renderWords[0]["en"];
        const getResult = () => reverseCheckbox.checked ? renderWords[0]["en"] : renderWords[0]["kr"];

        problemText.textContent = getProblem();
        resultText.style.display = "none";
        resultText.textContent = getResult();
        statusText.textContent = `${renderWords.length}개 남음`;

        resultButton.onclick = () => resultText.style.display = "flex";
        summitButton.onclick = () => {
            if (answerText.value == getResult()) {
                renderWords.shift();

                if (renderWords.length == 0) {
                    alert("학습 종료");
                    return;
                }

                const previousText = `${problemText.textContent} (${resultText.textContent})`;
                historyText.textContent = previousText;
                problemText.textContent = getProblem();
                resultText.textContent = getResult();
                resultText.style.display = "none";
                answerText.value = "";
            } else {
                if (answerText.value) alert("정답이 아닙니다.");
            }
        }

        answerText.onkeydown = event => {
            if (event.key == "Enter") summitButton.click();
        }
        
        setInterval(() => {
            const currentTime = startTime - performance.now();
            const consumeTime = startTime - currentTime;
            statusText.textContent = `${renderWords.length}개 남음 (${Math.round(consumeTime / 1000)}s)`;
        }, 1);
    }
});