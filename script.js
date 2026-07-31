"use strict";


let teams = loadTeams();

let roundCount =
    Number(localStorage.getItem("roundCount")) || 0;


// 保存データ読み込み

function loadTeams() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem("teams")
            );

        return Array.isArray(saved)
            ? saved
            : [];

    } catch (error) {

        console.error(
            "保存データの読み込みに失敗しました。",
            error
        );

        return [];
    }
}


// 順位ポイント

function getPlacementPoint(rank) {

    if (rank === 1) return 12;
    if (rank === 2) return 9;
    if (rank === 3) return 7;
    if (rank === 4) return 5;
    if (rank === 5) return 4;

    if (rank >= 6 && rank <= 7) {
        return 3;
    }

    if (rank >= 8 && rank <= 10) {
        return 2;
    }

    if (rank >= 11 && rank <= 15) {
        return 1;
    }

    return 0;
}


// 20チーム入力表

function createTable() {

    const body =
        document.getElementById("tableBody");

    if (!body) {
        console.error("tableBodyが見つかりません。");
        return;
    }

    let html = "";

    for (let i = 1; i <= 20; i++) {

        html += `
            <tr>

                <td>
                    <input
                        id="rank${i}"
                        type="number"
                        min="1"
                        max="20"
                        inputmode="numeric"
                        aria-label="${i}行目の順位"
                    >
                </td>

                <td>
                    <input
                        id="team${i}"
                        type="text"
                        placeholder="チーム名"
                        autocomplete="off"
                        aria-label="${i}行目のチーム名"
                    >
                </td>

                <td>
                    <input
                        id="kill${i}"
                        type="number"
                        min="0"
                        value="0"
                        inputmode="numeric"
                        aria-label="${i}行目のキル数"
                    >
                </td>

            </tr>
        `;
    }

    body.innerHTML = html;

    restoreTeamNames();
}


// 保存チーム名を入力欄へ復元

function restoreTeamNames() {

    teams.forEach((team, index) => {

        if (index >= 20) {
            return;
        }

        const input =
            document.getElementById(
                `team${index + 1}`
            );

        if (input) {
            input.value = team.name;
        }
    });
}


// 一括集計

function calculateAll() {

    let count = 0;

    const enteredNames =
        new Set();

    for (let i = 1; i <= 20; i++) {

        const teamInput =
            document.getElementById(`team${i}`);

        const rankInput =
            document.getElementById(`rank${i}`);

        const killInput =
            document.getElementById(`kill${i}`);

        if (
            !teamInput ||
            !rankInput ||
            !killInput
        ) {
            continue;
        }

        const name =
            teamInput.value.trim();

        if (name === "") {
            continue;
        }

        const rank =
            Number(rankInput.value);

        const kills =
            Number(killInput.value);

        const normalizedName =
            name.toLocaleLowerCase("ja");

        if (
            enteredNames.has(normalizedName)
        ) {

            alert(
                `同じチーム名が複数あります。\n${name}`
            );

            return;
        }

        enteredNames.add(normalizedName);

        if (
            !Number.isInteger(rank) ||
            rank < 1 ||
            rank > 20
        ) {

            alert(
                `${name}の順位を1～20で入力してください。`
            );

            return;
        }

        if (
            !Number.isFinite(kills) ||
            kills < 0
        ) {

            alert(
                `${name}のキル数を0以上で入力してください。`
            );

            return;
        }

        const placement =
            getPlacementPoint(rank);

        const total =
            placement + kills;

        const index =
            teams.findIndex(
                team =>
                    team.name
                        .toLocaleLowerCase("ja") ===
                    normalizedName
            );

        if (index >= 0) {

            teams[index].kills += kills;

            teams[index].placement += placement;

            teams[index].point += total;

            teams[index].lastRank = rank;

            teams[index].matches =
                Number(
                    teams[index].matches || 0
                ) + 1;

        } else {

            teams.push({
                name: name,
                kills: kills,
                placement: placement,
                point: total,
                lastRank: rank,
                matches: 1
            });
        }

        count++;
    }

    if (count === 0) {

        alert(
            "チーム名・順位・キル数を入力してください。"
        );

        return;
    }

    roundCount++;

    sortTeams();

    saveData();

    displayRanking();

    clearRoundScores();

    alert(
        `第${roundCount}試合を追加しました。`
    );
}


// ランキング並び替え

function sortTeams() {

    teams.sort((a, b) => {

        if (b.point !== a.point) {
            return b.point - a.point;
        }

        if (b.kills !== a.kills) {
            return b.kills - a.kills;
        }

        return a.name.localeCompare(
            b.name,
            "ja"
        );
    });
}


// ランキング表示

function displayRanking() {

    sortTeams();

    const ranking =
        document.getElementById("ranking");

    const left =
        document.getElementById("rankingLeft");

    const right =
        document.getElementById("rankingRight");

    const roundElement =
        document.getElementById("roundCount");

    const roundText =
        document.getElementById(
            "resultRoundText"
        );

    if (roundElement) {
        roundElement.textContent =
            String(roundCount);
    }

    if (roundText) {
        roundText.textContent =
            `${roundCount} MATCHES`;
    }

    if (teams.length === 0) {

        if (ranking) {
            ranking.textContent =
                "まだ結果がありません";
        }

        const empty = `
            <tr class="empty-result">
                <td colspan="5">
                    NO RESULT
                </td>
            </tr>
        `;

        if (left) {
            left.innerHTML = empty;
        }

        if (right) {
            right.innerHTML = empty;
        }

        return;
    }

    let normalHtml = "";

    let leftHtml = "";

    let rightHtml = "";

    teams.forEach((team, index) => {

        let medal = "";

        if (index === 0) {
            medal = "🥇";
        } else if (index === 1) {
            medal = "🥈";
        } else if (index === 2) {
            medal = "🥉";
        }

        normalHtml += `
            <div class="ranking-team">

                <div class="ranking-position">
                    ${medal} ${index + 1}位
                </div>

                <div class="ranking-name">
                    ${escapeHtml(team.name)}
                </div>

                <div class="ranking-points">
                    KILL：${team.kills}<br>
                    RANK：${team.placement}<br>
                    TOTAL：${team.point}pt
                </div>

            </div>
        `;

        let rowClass = "";

        if (index === 0) {
            rowClass = "top-one";
        } else if (index === 1) {
            rowClass = "top-two";
        } else if (index === 2) {
            rowClass = "top-three";
        }

        const row = `
            <tr class="${rowClass}">

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(team.name)}
                </td>

                <td>
                    ${team.kills}
                </td>

                <td>
                    ${team.placement}
                </td>

                <td>
                    ${team.point}
                </td>

            </tr>
        `;

        if (index < 10) {
            leftHtml += row;
        } else {
            rightHtml += row;
        }
    });

    if (ranking) {
        ranking.innerHTML =
            normalHtml;
    }

    if (left) {

        left.innerHTML =
            fillResultRows(
                leftHtml,
                Math.min(teams.length, 10),
                10,
                1
            );
    }

    if (right) {

        const rightCount =
            Math.max(
                0,
                teams.length - 10
            );

        right.innerHTML =
            fillResultRows(
                rightHtml,
                rightCount,
                10,
                11
            );
    }
}


// 空いている順位を空行で埋める

function fillResultRows(
    html,
    currentCount,
    targetCount,
    startNumber
) {

    let result = html;

    for (
        let i = currentCount;
        i < targetCount;
        i++
    ) {

        result += `
            <tr>

                <td>
                    ${startNumber + i}
                </td>

                <td>
                    -
                </td>

                <td>
                    0
                </td>

                <td>
                    0
                </td>

                <td>
                    0
                </td>

            </tr>
        `;
    }

    return result;
}


// HTML安全化

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// データ保存

function saveData() {

    localStorage.setItem(
        "teams",
        JSON.stringify(teams)
    );

    localStorage.setItem(
        "roundCount",
        String(roundCount)
    );
}


// 次の試合用に順位とキルだけクリア

function clearRoundScores() {

    for (let i = 1; i <= 20; i++) {

        const rank =
            document.getElementById(`rank${i}`);

        const kill =
            document.getElementById(`kill${i}`);

        if (rank) {
            rank.value = "";
        }

        if (kill) {
            kill.value = "0";
        }
    }
}


// 入力欄すべてクリア

function clearRoundInputs() {

    const confirmed =
        confirm(
            "入力欄をクリアしますか？\n集計済み結果は消えません。"
        );

    if (!confirmed) {
        return;
    }

    clearInputsWithoutConfirm();
}


function clearInputsWithoutConfirm() {

    for (let i = 1; i <= 20; i++) {

        const team =
            document.getElementById(`team${i}`);

        const rank =
            document.getElementById(`rank${i}`);

        const kill =
            document.getElementById(`kill${i}`);

        if (team) {
            team.value = "";
        }

        if (rank) {
            rank.value = "";
        }

        if (kill) {
            kill.value = "0";
        }
    }
}


// 全データリセット

function resetTournament() {

    const confirmed =
        confirm(
            "大会結果をすべて削除します。\n本当にリセットしますか？"
        );

    if (!confirmed) {
        return;
    }

    teams = [];

    roundCount = 0;

    localStorage.removeItem("teams");

    localStorage.removeItem("roundCount");

    clearInputsWithoutConfirm();

    displayRanking();

    alert(
        "大会結果をリセットしました。"
    );
}


// CSV出力

function exportCSV() {

    if (teams.length === 0) {

        alert(
            "出力するデータがありません。"
        );

        return;
    }

    sortTeams();

    let csv =
        "順位,チーム名,キル数,順位ポイント,合計ポイント,試合数\n";

    teams.forEach((team, index) => {

        csv += [
            index + 1,
            csvEscape(team.name),
            team.kills,
            team.placement,
            team.point,
            team.matches || 0
        ].join(",");

        csv += "\n";
    });

    const blob =
        new Blob(
            ["\uFEFF" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "result-esports-ranking.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


function csvEscape(value) {

    const text =
        String(value);

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replaceAll(
            '"',
            '""'
        )}"`;
    }

    return text;
}


// PNG画像生成

async function createImage() {

    if (teams.length === 0) {

        alert(
            "先に大会結果を集計してください。"
        );

        return;
    }

    displayRanking();

    const target =
        document.getElementById(
            "resultImage"
        );

    if (!target) {

        alert(
            "結果画像エリアが見つかりません。"
        );

        return;
    }

    try {

        const canvas =
            await createResultCanvas(target);

        const link =
            document.createElement("a");

        link.download =
            "result-esports-total-result.png";

        link.href =
            canvas.toDataURL(
                "image/png",
                1
            );

        document.body.appendChild(link);

        link.click();

        link.remove();

    } catch (error) {

        console.error(
            "PNG生成エラー",
            error
        );

        alert(
            "結果画像の作成に失敗しました。"
        );
    }
}


// PDF出力

async function exportPDF() {

    if (teams.length === 0) {

        alert(
            "出力するデータがありません。"
        );

        return;
    }

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "PDFライブラリを読み込めませんでした。"
        );

        return;
    }

    displayRanking();

    const target =
        document.getElementById(
            "resultImage"
        );

    if (!target) {

        alert(
            "結果画像エリアが見つかりません。"
        );

        return;
    }

    try {

        const canvas =
            await createResultCanvas(target);

        const image =
            canvas.toDataURL(
                "image/png",
                1
            );

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF({
                orientation: "landscape",
                unit: "px",
                format: [1920, 1080]
            });

        pdf.addImage(
            image,
            "PNG",
            0,
            0,
            1920,
            1080
        );

        pdf.save(
            "result-esports-total-result.pdf"
        );

    } catch (error) {

        console.error(
            "PDF生成エラー",
            error
        );

        alert(
            "PDFの作成に失敗しました。"
        );
    }
}


// html2canvas共通処理

async function createResultCanvas(target) {

    if (
        typeof html2canvas !== "function"
    ) {

        throw new Error(
            "html2canvasが読み込まれていません。"
        );
    }

    await waitForBackgroundImage();

    await new Promise(resolve => {

        requestAnimationFrame(() => {

            requestAnimationFrame(resolve);

        });

    });

    return html2canvas(target, {
        scale: 1,
        width: 1920,
        height: 1080,
        windowWidth: 1920,
        windowHeight: 1080,
        backgroundColor: "#050914",
        useCORS: true,
        allowTaint: false,
        logging: false
    });
}


// IMG_2769.pngの読み込みを待つ

function waitForBackgroundImage() {

    return new Promise(resolve => {

        const image =
            new Image();

        image.onload = resolve;

        image.onerror = () => {

            console.warn(
                "IMG_2769.pngを読み込めませんでした。"
            );

            resolve();
        };

        image.src =
            `IMG_2769.png?v=${Date.now()}`;

    });
}


// ページ読み込み時

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createTable();

        sortTeams();

        displayRanking();
    }
);
