"use strict";

// ==============================
// 初期データ
// ==============================

let teams = loadTeams();
let roundCount = loadRoundCount();

// ==============================
// 保存データ読み込み
// ==============================

function loadTeams() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("teams")
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("保存データの読み込みに失敗しました。", error);
        return [];
    }
}

function loadRoundCount() {
    const count = Number(
        localStorage.getItem("roundCount")
    );

    return Number.isInteger(count) && count >= 0
        ? count
        : 0;
}

// ==============================
// チーム名比較用
// ==============================

function normalizeTeamName(name) {
    return String(name)
        .trim()
        .toLocaleLowerCase("ja");
}

// ==============================
// 順位ポイント
// ==============================

function getPlacementPoint(rank) {
    if (rank === 1) return 12;
    if (rank === 2) return 9;
    if (rank === 3) return 7;
    if (rank === 4) return 5;
    if (rank === 5) return 4;
    if (rank >= 6 && rank <= 7) return 3;
    if (rank >= 8 && rank <= 10) return 2;
    if (rank >= 11 && rank <= 15) return 1;
    return 0;
}

// ==============================
// 入力表作成
// ==============================

function createTable() {
    const body = document.getElementById("tableBody");

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
                        step="1"
                        inputmode="numeric"
                        placeholder="${i}"
                    >
                </td>
                <td>
                    <input
                        id="team${i}"
                        type="text"
                        placeholder="チーム名"
                        autocomplete="off"
                    >
                </td>
                <td>
                    <input
                        id="kill${i}"
                        type="number"
                        min="0"
                        step="1"
                        value="0"
                        inputmode="numeric"
                    >
                </td>
            </tr>
        `;
    }

    body.innerHTML = html;
    restoreTeamNames();
}

function restoreTeamNames() {
    teams.slice(0, 20).forEach((team, index) => {
        const input = document.getElementById(
            `team${index + 1}`
        );

        if (input) {
            input.value = team.name;
        }
    });
}

// ==============================
// 一括集計
// 全行を確認してから加算
// ==============================

function calculateAll() {
    const entries = [];
    const enteredNames = new Set();
    const enteredRanks = new Set();

    for (let i = 1; i <= 20; i++) {
        const teamInput = document.getElementById(`team${i}`);
        const rankInput = document.getElementById(`rank${i}`);
        const killInput = document.getElementById(`kill${i}`);

        if (!teamInput || !rankInput || !killInput) {
            alert("入力欄が見つかりません。ページを再読み込みしてください。");
            return;
        }

        const name = teamInput.value.trim();
        const rankText = rankInput.value.trim();
        const killText = killInput.value.trim();

        if (name === "") {
            if (
                rankText !== "" ||
                (killText !== "" && Number(killText) !== 0)
            ) {
                alert(`${i}行目のチーム名を入力してください。`);
                return;
            }

            continue;
        }

        const rank = Number(rankText);
        const kills = Number(killText);
        const normalizedName = normalizeTeamName(name);

        if (enteredNames.has(normalizedName)) {
            alert(`同じチーム名が複数入力されています。\n${name}`);
            return;
        }

        if (
            rankText === "" ||
            !Number.isInteger(rank) ||
            rank < 1 ||
            rank > 20
        ) {
            alert(`${name}の順位を1〜20で入力してください。`);
            return;
        }

        if (enteredRanks.has(rank)) {
            alert(`${rank}位が重複しています。順位を確認してください。`);
            return;
        }

        if (
            killText === "" ||
            !Number.isInteger(kills) ||
            kills < 0
        ) {
            alert(`${name}のキル数を0以上の整数で入力してください。`);
            return;
        }

        enteredNames.add(normalizedName);
        enteredRanks.add(rank);

        entries.push({
            name,
            normalizedName,
            rank,
            kills,
            placement: getPlacementPoint(rank)
        });
    }

    if (entries.length === 0) {
        alert("チーム名・順位・キル数を入力してください。");
        return;
    }

    const allNames = new Set(
        teams.map(team => normalizeTeamName(team.name))
    );

    entries.forEach(entry => {
        allNames.add(entry.normalizedName);
    });

    if (allNames.size > 20) {
        alert(
            "登録チーム数が20チームを超えます。\n" +
            "チーム名の表記違いがないか確認してください。"
        );
        return;
    }

    // 検証がすべて終わってから新しい集計データを作成
    const nextTeams = teams.map(team => ({ ...team }));

    entries.forEach(entry => {
        const total = entry.placement + entry.kills;

        const team = nextTeams.find(item =>
            normalizeTeamName(item.name) === entry.normalizedName
        );

        if (team) {
            team.kills = Number(team.kills || 0) + entry.kills;
            team.placement =
                Number(team.placement || 0) + entry.placement;
            team.point = Number(team.point || 0) + total;
            team.matches = Number(team.matches || 0) + 1;
            team.lastRank = entry.rank;
        } else {
            nextTeams.push({
                name: entry.name,
                kills: entry.kills,
                placement: entry.placement,
                point: total,
                matches: 1,
                lastRank: entry.rank
            });
        }
    });

    const previousTeams = teams;
    const previousRoundCount = roundCount;

    teams = nextTeams;
    roundCount++;

    sortTeams();

    try {
        saveData();
    } catch (error) {
        teams = previousTeams;
        roundCount = previousRoundCount;

        console.error("保存エラー", error);
        alert(
            "集計結果を保存できませんでした。\n" +
            "入力欄は残しています。"
        );
        return;
    }

    displayRanking();
    clearRoundScores();

    alert(`第${roundCount}試合の結果を追加しました。`);
}

// ==============================
// ランキング並び替え
// 合計ポイント → キル数 → 名前順
// ==============================

function sortTeams() {
    teams.sort((a, b) => {
        const pointDifference =
            Number(b.point || 0) - Number(a.point || 0);

        if (pointDifference !== 0) {
            return pointDifference;
        }

        const killDifference =
            Number(b.kills || 0) - Number(a.kills || 0);

        if (killDifference !== 0) {
            return killDifference;
        }

        return String(a.name).localeCompare(
            String(b.name),
            "ja"
        );
    });
}

// ==============================
// ランキング表示
// ==============================

function displayRanking() {
    sortTeams();

    const ranking = document.getElementById("ranking");
    const rankingLeft = document.getElementById("rankingLeft");
    const rankingRight = document.getElementById("rankingRight");
    const roundElement = document.getElementById("roundCount");
    const roundText = document.getElementById("resultRoundText");

    if (roundElement) {
        roundElement.textContent = String(roundCount);
    }

    if (roundText) {
        roundText.textContent = `${roundCount} MATCHES`;
    }

    // 以前の優勝表示を解除
    ["winnerNotice", "resultWinnerText"].forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.hidden = true;
            element.textContent = "";
        }
    });

    if (ranking) {
        if (teams.length === 0) {
            ranking.textContent = "まだ結果がありません";
        } else {
            const medals = ["🥇", "🥈", "🥉"];

            ranking.innerHTML = teams.map((team, index) => `
                <div class="ranking-team">
                    <div class="ranking-position">
                        ${medals[index] || ""} ${index + 1}位
                    </div>

                    <div class="ranking-name">
                        ${escapeHtml(team.name)}
                    </div>

                    <div class="ranking-points">
                        KILL：${Number(team.kills || 0)}<br>
                        RANK：${Number(team.placement || 0)}<br>
                        TOTAL：${Number(team.point || 0)}pt
                    </div>
                </div>
            `).join("");
        }
    }

    const rows = [];

    for (let index = 0; index < 20; index++) {
        const team = teams[index];

        if (!team) {
            rows.push(createEmptyRow(index + 1));
            continue;
        }

        const rowClass =
            ["top-one", "top-two", "top-three"][index] || "";

        rows.push(`
            <tr class="${rowClass}">
                <td>${index + 1}</td>
                <td>${escapeHtml(team.name)}</td>
                <td>${Number(team.kills || 0)}</td>
                <td>${Number(team.placement || 0)}</td>
                <td>${Number(team.point || 0)}</td>
            </tr>
        `);
    }

    if (rankingLeft) {
        rankingLeft.innerHTML = rows.slice(0, 10).join("");
    }

    if (rankingRight) {
        rankingRight.innerHTML = rows.slice(10, 20).join("");
    }
}

// ==============================
// 空行
// ==============================

function createEmptyRow(position) {
    return `
        <tr>
            <td>${position}</td>
            <td>-</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
        </tr>
    `;
}

// ==============================
// HTML安全化
// ==============================

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ==============================
// データ保存
// ==============================

function saveData() {
    localStorage.setItem("teams", JSON.stringify(teams));
    localStorage.setItem("roundCount", String(roundCount));
}

// ==============================
// 順位・キルだけクリア
// ==============================

function clearRoundScores() {
    for (let i = 1; i <= 20; i++) {
        const rankInput = document.getElementById(`rank${i}`);
        const killInput = document.getElementById(`kill${i}`);

        if (rankInput) rankInput.value = "";
        if (killInput) killInput.value = "0";
    }
}

// ==============================
// 入力欄すべてクリア
// ==============================

function clearRoundInputs() {
    if (!confirm("入力欄をクリアしますか？\n集計済み結果は消えません。")) {
        return;
    }

    clearInputsWithoutConfirm();
}

function clearInputsWithoutConfirm() {
    for (let i = 1; i <= 20; i++) {
        const teamInput = document.getElementById(`team${i}`);
        const rankInput = document.getElementById(`rank${i}`);
        const killInput = document.getElementById(`kill${i}`);

        if (teamInput) teamInput.value = "";
        if (rankInput) rankInput.value = "";
        if (killInput) killInput.value = "0";
    }
}

// ==============================
// 全データリセット
// ==============================

function resetTournament() {
    if (!confirm("大会結果をすべて削除します。\n本当にリセットしますか？")) {
        return;
    }

    localStorage.removeItem("teams");
    localStorage.removeItem("roundCount");
    localStorage.removeItem("tournamentWinner");

    teams = [];
    roundCount = 0;

    clearInputsWithoutConfirm();
    displayRanking();

    alert("大会結果をリセットしました。");
}

// ==============================
// CSV出力
// ==============================

function exportCSV() {
    reloadSavedData();

    if (teams.length === 0) {
        alert("出力する集計結果がありません。");
        return;
    }

    sortTeams();

    const lines = [
        "順位,チーム名,キル数,順位ポイント,合計ポイント,試合数"
    ];

    teams.forEach((team, index) => {
        lines.push([
            index + 1,
            csvEscape(team.name),
            Number(team.kills || 0),
            Number(team.placement || 0),
            Number(team.point || 0),
            Number(team.matches || 0)
        ].join(","));
    });

    const blob = new Blob(
        ["\uFEFF" + lines.join("\r\n")],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "result-esports-ranking.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value) {
    let text = String(value);

    // 表計算ソフトで数式として扱われる文字を保護
    if (/^\s*[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    return `"${text.replaceAll('"', '""')}"`;
}

// ==============================
// PNG画像
// ==============================

async function createImage() {
    reloadSavedData();

    if (teams.length === 0) {
        alert("集計結果がありません。\n先に一括集計を押してください。");
        return;
    }

    displayRanking();

    const target = document.getElementById("resultImage");

    if (!target) {
        alert("結果画像エリアが見つかりません。");
        return;
    }

    try {
        const canvas = await createResultCanvas(target);
        const link = document.createElement("a");

        link.download = "result-esports-total-result.png";
        link.href = canvas.toDataURL("image/png");

        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("画像生成エラー", error);
        alert("結果画像の作成に失敗しました。");
    }
}

// ==============================
// PDF
// ==============================

async function exportPDF() {
    reloadSavedData();

    if (teams.length === 0) {
        alert("集計結果がありません。\n先に一括集計を押してください。");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDFライブラリを読み込めませんでした。");
        return;
    }

    displayRanking();

    const target = document.getElementById("resultImage");

    if (!target) {
        alert("結果画像エリアが見つかりません。");
        return;
    }

    try {
        const canvas = await createResultCanvas(target);
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [1920, 1080],
            hotfixes: ["px_scaling"]
        });

        pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            0,
            0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight()
        );

        pdf.save("result-esports-total-result.pdf");
    } catch (error) {
        console.error("PDF生成エラー", error);
        alert("PDFの作成に失敗しました。");
    }
}

// ==============================
// データ再読み込み
// ==============================

function reloadSavedData() {
    teams = loadTeams();
    roundCount = loadRoundCount();
}

// ==============================
// Canvas生成
// ==============================

async function createResultCanvas(target) {
    if (typeof html2canvas !== "function") {
        throw new Error("html2canvasが読み込まれていません。");
    }

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
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
        logging: false,
        scrollX: 0,
        scrollY: 0
    });
}

// ==============================
// 背景読み込み待ち
// ==============================

function waitForBackgroundImage() {
    return new Promise(resolve => {
        const image = new Image();

        image.onload = resolve;

        image.onerror = () => {
            console.warn("IMG_2769.pngを読み込めませんでした。");
            resolve();
        };

        image.src = "IMG_2769.png?v=20";
    });
}

// ==============================
// 起動時
// ==============================

function initialize() {
    reloadSavedData();
    createTable();
    displayRanking();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}
