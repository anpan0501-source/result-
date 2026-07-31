"use strict";


// =====================================
// 保存データの読み込み
// =====================================

let teams = loadTeams();

let roundCount =
    Number(localStorage.getItem("roundCount")) || 0;


/**
 * LocalStorageからチームデータを読み込む
 */
function loadTeams() {

    try {

        const saved =
            JSON.parse(localStorage.getItem("teams"));

        return Array.isArray(saved) ? saved : [];

    } catch (error) {

        console.error(
            "保存データの読み込みに失敗しました。",
            error
        );

        return [];
    }
}


// =====================================
// 順位ポイント
// =====================================

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


// =====================================
// 入力表を作成
// =====================================

function createTable() {

    const tableBody =
        document.getElementById("tableBody");

    if (!tableBody) {
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

    tableBody.innerHTML = html;

    restoreTeamNames();
}


// =====================================
// チーム名を入力表へ復元
// =====================================

function restoreTeamNames() {

    teams.forEach((team, index) => {

        if (index >= 20) {
            return;
        }

        const input =
            document.getElementById(`team${index + 1}`);

        if (input) {
            input.value = team.name;
        }
    });
}


// =====================================
// 一括集計
// =====================================

function calculateAll() {

    let addedTeamCount = 0;

    const enteredNames = new Set();

    for (let i = 1; i <= 20; i++) {

        const teamInput =
            document.getElementById(`team${i}`);

        const rankInput =
            document.getElementById(`rank${i}`);

        const killInput =
            document.getElementById(`kill${i}`);

        if (!teamInput || !rankInput || !killInput) {
            continue;
        }

        const name = teamInput.value.trim();

        const rank = Number(rankInput.value);

        const kills = Number(killInput.value);

        // チーム名が空の行は無視
        if (name === "") {
            continue;
        }

        // 同じ試合内の重複チーム名を防止
        const normalizedName =
            name.toLocaleLowerCase("ja");

        if (enteredNames.has(normalizedName)) {

            alert(
                `同じチーム名が複数入力されています。\nチーム名：${name}`
            );

            return;
        }

        enteredNames.add(normalizedName);

        // 順位チェック
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

        // キル数チェック
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

        const totalPoint =
            placement + kills;

        const teamIndex =
            teams.findIndex(
                team =>
                    team.name.toLocaleLowerCase("ja") ===
                    normalizedName
            );

        if (teamIndex >= 0) {

            // 同じチームなら累計へ加算
            teams[teamIndex].kills += kills;

            teams[teamIndex].placement += placement;

            teams[teamIndex].point += totalPoint;

            teams[teamIndex].lastRank = rank;

            teams[teamIndex].matches =
                Number(teams[teamIndex].matches || 0) + 1;

        } else {

            // 初めて入力されたチーム
            teams.push({
                name: name,
                kills: kills,
                placement: placement,
                point: totalPoint,
                lastRank: rank,
                matches: 1
            });
        }

        addedTeamCount++;
    }

    if (addedTeamCount === 0) {

        alert(
            "集計するデータがありません。\nチーム名・順位・キル数を入力してください。"
        );

        return;
    }

    roundCount++;

    sortTeams();

    saveData();

    displayRanking();

    clearRoundScores();

    alert(
        `第${roundCount}試合の結果を追加しました。`
    );
}


// =====================================
// ランキング並び替え
// =====================================

function sortTeams() {

    teams.sort((a, b) => {

        // 合計ポイント
        if (b.point !== a.point) {
            return b.point - a.point;
        }

        // 同点ならキル数
        if (b.kills !== a.kills) {
            return b.kills - a.kills;
        }

        // さらに同点ならチーム名
        return a.name.localeCompare(
            b.name,
            "ja"
        );
    });
}


// =====================================
// ランキング表示
// =====================================

function displayRanking() {

    sortTeams();

    const ranking =
        document.getElementById("ranking");

    const rankingTableBody =
        document.getElementById("rankingTableBody");

    const roundCountElement =
        document.getElementById("roundCount");

    const resultRoundText =
        document.getElementById("resultRoundText");

    if (roundCountElement) {
        roundCountElement.textContent =
            String(roundCount);
    }

    if (resultRoundText) {
        resultRoundText.textContent =
            `集計試合数：${roundCount}試合`;
    }

    if (teams.length === 0) {

        if (ranking) {
            ranking.textContent =
                "まだ結果がありません";
        }

        if (rankingTableBody) {

            rankingTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="4">
                        まだ結果がありません
                    </td>
                </tr>
            `;
        }

        return;
    }

    let rankingHtml = "";

    let tableHtml = "";

    teams.forEach((team, index) => {

        let medal = "";

        if (index === 0) {
            medal = "🥇";
        } else if (index === 1) {
            medal = "🥈";
        } else if (index === 2) {
            medal = "🥉";
        }

        rankingHtml += `
            <div class="team">

                <div class="team-position">
                    ${medal} ${index + 1}位
                </div>

                <div class="team-name">
                    ${escapeHtml(team.name)}
                </div>

                <div class="team-points">
                    キル：${team.kills}<br>
                    順位pt：${team.placement}<br>
                    合計：${team.point}pt
                </div>

            </div>
        `;

        tableHtml += `
            <tr>
                <td>${index + 1}位</td>
                <td>${escapeHtml(team.name)}</td>
                <td>${team.kills}</td>
                <td>${team.point}pt</td>
            </tr>
        `;
    });

    if (ranking) {
        ranking.innerHTML = rankingHtml;
    }

    if (rankingTableBody) {
        rankingTableBody.innerHTML = tableHtml;
    }
}


// =====================================
// HTML特殊文字対策
// =====================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================
// 保存
// =====================================

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


// =====================================
// 順位・キル入力だけクリア
// チーム名は残す
// =====================================

function clearRoundScores() {

    for (let i = 1; i <= 20; i++) {

        const rankInput =
            document.getElementById(`rank${i}`);

        const killInput =
            document.getElementById(`kill${i}`);

        if (rankInput) {
            rankInput.value = "";
        }

        if (killInput) {
            killInput.value = "0";
        }
    }
}


// =====================================
// 入力欄をすべてクリア
// =====================================

function clearRoundInputs() {

    const confirmed =
        confirm(
            "現在の入力欄をクリアしますか？\n集計済みデータは消えません。"
        );

    if (!confirmed) {
        return;
    }

    for (let i = 1; i <= 20; i++) {

        const teamInput =
            document.getElementById(`team${i}`);

        const rankInput =
            document.getElementById(`rank${i}`);

        const killInput =
            document.getElementById(`kill${i}`);

        if (teamInput) {
            teamInput.value = "";
        }

        if (rankInput) {
            rankInput.value = "";
        }

        if (killInput) {
            killInput.value = "0";
        }
    }
}


// =====================================
// 大会データ全リセット
// =====================================

function resetTournament() {

    const confirmed =
        confirm(
            "集計済みの大会結果をすべて削除します。\n本当にリセットしますか？"
        );

    if (!confirmed) {
        return;
    }

    teams = [];

    roundCount = 0;

    localStorage.removeItem("teams");

    localStorage.removeItem("roundCount");

    clearRoundInputsWithoutConfirm();

    displayRanking();

    alert("大会データをリセットしました。");
}


function clearRoundInputsWithoutConfirm() {

    for (let i = 1; i <= 20; i++) {

        const teamInput =
            document.getElementById(`team${i}`);

        const rankInput =
            document.getElementById(`rank${i}`);

        const killInput =
            document.getElementById(`kill${i}`);

        if (teamInput) {
            teamInput.value = "";
        }

        if (rankInput) {
            rankInput.value = "";
        }

        if (killInput) {
            killInput.value = "0";
        }
    }
}


// =====================================
// CSV出力
// =====================================

function exportCSV() {

    if (teams.length === 0) {

        alert("出力するデータがありません。");

        return;
    }

    sortTeams();

    let csv =
        "順位,チーム名,順位ポイント,キル数,合計ポイント,試合数\n";

    teams.forEach((team, index) => {

        csv += [
            index + 1,
            csvEscape(team.name),
            team.placement,
            team.kills,
            team.point,
            team.matches || 0
        ].join(",");

        csv += "\n";
    });

    // Excel文字化け防止
    const bom = "\uFEFF";

    const blob = new Blob(
        [bom + csv],
        {
            type: "text/csv;charset=utf-8;"
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

    const text = String(value);

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}


// =====================================
// PNG画像生成
// =====================================

async function createImage() {

    if (teams.length === 0) {

        alert(
            "集計データがありません。\n先に一括集計を押してください。"
        );

        return;
    }

    displayRanking();

    const target =
        document.getElementById("resultImage");

    if (!target) {

        alert(
            "結果画像の表示場所が見つかりません。"
        );

        return;
    }

    try {

        const canvas =
            await createResultCanvas(target);

        downloadCanvas(
            canvas,
            "result-esports-result.png"
        );

    } catch (error) {

        console.error(
            "画像生成エラー",
            error
        );

        alert(
            "結果画像の作成に失敗しました。"
        );
    }
}


// =====================================
// PDF出力
// PNG化してからPDFへ貼り付けるため
// 日本語チーム名も表示できる
// =====================================

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
        document.getElementById("resultImage");

    if (!target) {

        alert(
            "結果表が見つかりません。"
        );

        return;
    }

    try {

        const canvas =
            await createResultCanvas(target);

        const imageData =
            canvas.toDataURL(
                "image/png",
                1.0
            );

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

        const pageWidth =
            pdf.internal.pageSize.getWidth();

        const pageHeight =
            pdf.internal.pageSize.getHeight();

        const margin = 10;

        const maxWidth =
            pageWidth - margin * 2;

        const maxHeight =
            pageHeight - margin * 2;

        const imageRatio =
            canvas.width / canvas.height;

        let imageWidth = maxWidth;

        let imageHeight =
            imageWidth / imageRatio;

        if (imageHeight > maxHeight) {

            imageHeight = maxHeight;

            imageWidth =
                imageHeight * imageRatio;
        }

        const x =
            (pageWidth - imageWidth) / 2;

        const y = margin;

        pdf.addImage(
            imageData,
            "PNG",
            x,
            y,
            imageWidth,
            imageHeight
        );

        pdf.save(
            "result-esports-result.pdf"
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


// =====================================
// html2canvas共通処理
// =====================================

async function createResultCanvas(target) {

    if (typeof html2canvas !== "function") {

        throw new Error(
            "html2canvasが読み込まれていません。"
        );
    }

    // DOMの更新を待つ
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });

    return html2canvas(target, {
        scale: 2,
        backgroundColor: "#05070c",
        useCORS: true,
        logging: false,
        width: target.scrollWidth,
        height: target.scrollHeight,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight
    });
}


// =====================================
// CanvasをPNG保存
// =====================================

function downloadCanvas(
    canvas,
    fileName
) {

    const link =
        document.createElement("a");

    link.download = fileName;

    link.href =
        canvas.toDataURL(
            "image/png",
            1.0
        );

    document.body.appendChild(link);

    link.click();

    link.remove();
}


// =====================================
// ページ開始時
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createTable();

        sortTeams();

        displayRanking();
    }
);
