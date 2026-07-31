"use strict";


// ================================
// 初期データ
// ================================

let teams = loadTeams();

let roundCount =
    Number(
        localStorage.getItem("roundCount")
    ) || 0;


// ================================
// 保存済みチームデータを読み込む
// ================================

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


// ================================
// 順位ポイント
// ================================

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


// ================================
// 20チーム入力欄作成
// ================================

function createTable() {

    const body =
        document.getElementById("tableBody");

    if (!body) {

        console.error(
            "tableBodyが見つかりません。"
        );

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


// ================================
// 保存済みチーム名を入力欄へ戻す
// ================================

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


// ================================
// 一括集計
// ================================

function calculateAll() {

    let inputCount = 0;

    const enteredNames =
        new Set();

    for (let i = 1; i <= 20; i++) {

        const teamInput =
            document.getElementById(
                `team${i}`
            );

        const rankInput =
            document.getElementById(
                `rank${i}`
            );

        const killInput =
            document.getElementById(
                `kill${i}`
            );

        if (
            !teamInput ||
            !rankInput ||
            !killInput
        ) {
            continue;
        }

        const name =
            teamInput.value.trim();

        // チーム名が空なら無視
        if (name === "") {
            continue;
        }

        const rank =
            Number(rankInput.value);

        const kills =
            Number(killInput.value);

        const normalizedName =
            name.toLocaleLowerCase("ja");

        // 同じ試合内で同名チームを防止
        if (
            enteredNames.has(normalizedName)
        ) {

            alert(
                `同じチーム名が複数入力されています。\n${name}`
            );

            return;
        }

        enteredNames.add(normalizedName);

        // 順位確認
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

        // キル数確認
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

        const teamIndex =
            teams.findIndex(
                team =>
                    String(team.name)
                        .toLocaleLowerCase("ja") ===
                    normalizedName
            );

        if (teamIndex >= 0) {

            // 既存チームへ加算
            teams[teamIndex].kills =
                Number(
                    teams[teamIndex].kills || 0
                ) + kills;

            teams[teamIndex].placement =
                Number(
                    teams[teamIndex].placement || 0
                ) + placement;

            teams[teamIndex].point =
                Number(
                    teams[teamIndex].point || 0
                ) + total;

            teams[teamIndex].matches =
                Number(
                    teams[teamIndex].matches || 0
                ) + 1;

            teams[teamIndex].lastRank =
                rank;

        } else {

            // 新規チーム追加
            teams.push({

                name: name,

                kills: kills,

                placement: placement,

                point: total,

                matches: 1,

                lastRank: rank

            });
        }

        inputCount++;
    }

    if (inputCount === 0) {

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
        `第${roundCount}試合の結果を追加しました。`
    );
}


// ================================
// ランキング並び替え
// ================================

function sortTeams() {

    teams.sort((a, b) => {

        const pointA =
            Number(a.point || 0);

        const pointB =
            Number(b.point || 0);

        if (pointB !== pointA) {
            return pointB - pointA;
        }

        const killsA =
            Number(a.kills || 0);

        const killsB =
            Number(b.kills || 0);

        if (killsB !== killsA) {
            return killsB - killsA;
        }

        return String(a.name).localeCompare(
            String(b.name),
            "ja"
        );
    });
}


// ================================
// ランキング表示
// ================================

function displayRanking() {

    sortTeams();

    const ranking =
        document.getElementById(
            "ranking"
        );

    const rankingLeft =
        document.getElementById(
            "rankingLeft"
        );

    const rankingRight =
        document.getElementById(
            "rankingRight"
        );

    const roundElement =
        document.getElementById(
            "roundCount"
        );

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


    // 通常ランキング
    if (teams.length === 0) {

        if (ranking) {

            ranking.textContent =
                "まだ結果がありません";
        }

    } else {

        let rankingHtml = "";

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
                <div class="ranking-team">

                    <div class="ranking-position">
                        ${medal} ${index + 1}位
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
            `;
        });

        if (ranking) {
            ranking.innerHTML =
                rankingHtml;
        }
    }


    // 画像用ランキング
    let leftHtml = "";

    let rightHtml = "";

    teams.slice(0, 20).forEach(
        (team, index) => {

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
                        ${Number(team.kills || 0)}
                    </td>

                    <td>
                        ${Number(team.placement || 0)}
                    </td>

                    <td>
                        ${Number(team.point || 0)}
                    </td>

                </tr>
            `;

            if (index < 10) {
                leftHtml += row;
            } else {
                rightHtml += row;
            }
        }
    );


    // 1〜10位を空行で埋める
    for (
        let i = Math.min(teams.length, 10);
        i < 10;
        i++
    ) {

        leftHtml += createEmptyRow(
            i + 1
        );
    }


    // 11〜20位を空行で埋める
    const rightTeamCount =
        Math.max(
            0,
            Math.min(teams.length, 20) - 10
        );

    for (
        let i = rightTeamCount;
        i < 10;
        i++
    ) {

        rightHtml += createEmptyRow(
            11 + i
        );
    }

    if (rankingLeft) {
        rankingLeft.innerHTML =
            leftHtml;
    }

    if (rankingRight) {
        rankingRight.innerHTML =
            rightHtml;
    }
}


// 空順位行

function createEmptyRow(position) {

    return `
        <tr>

            <td>
                ${position}
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


// ================================
// HTML特殊文字対策
// ================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ================================
// 保存
// ================================

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


// ================================
// 次の試合用クリア
// チーム名は残す
// ================================

function clearRoundScores() {

    for (let i = 1; i <= 20; i++) {

        const rankInput =
            document.getElementById(
                `rank${i}`
            );

        const killInput =
            document.getElementById(
                `kill${i}`
            );

        if (rankInput) {
            rankInput.value = "";
        }

        if (killInput) {
            killInput.value = "0";
        }
    }
}


// ================================
// 入力欄すべてクリア
// ================================

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

        const teamInput =
            document.getElementById(
                `team${i}`
            );

        const rankInput =
            document.getElementById(
                `rank${i}`
            );

        const killInput =
            document.getElementById(
                `kill${i}`
            );

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


// ================================
// 大会データ全リセット
// ================================

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


// ================================
// CSV出力
// ================================

function exportCSV() {

    teams = loadTeams();

    if (teams.length === 0) {

        alert(
            "出力する集計結果がありません。"
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
            Number(team.kills || 0),
            Number(team.placement || 0),
            Number(team.point || 0),
            Number(team.matches || 0)
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


// CSV特殊文字対策

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


// ================================
// PNG画像生成
// ================================

async function createImage() {

    // 保存データを読み直す
    teams = loadTeams();

    roundCount =
        Number(
            localStorage.getItem(
                "roundCount"
            )
        ) || 0;

    if (teams.length === 0) {

        alert(
            "集計結果がありません。\n先に「一括集計」を押してください。"
        );

        return;
    }

    sortTeams();

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
            await createResultCanvas(
                target
            );

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
            "画像生成エラー",
            error
        );

        alert(
            "結果画像の作成に失敗しました。"
        );
    }
}


// ================================
// PDF出力
// ================================

async function exportPDF() {

    // 保存データを読み直す
    teams = loadTeams();

    roundCount =
        Number(
            localStorage.getItem(
                "roundCount"
            )
        ) || 0;

    if (teams.length === 0) {

        alert(
            "集計結果がありません。\n先に「一括集計」を押してください。"
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

    sortTeams();

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
            await createResultCanvas(
                target
            );

        const imageData =
            canvas.toDataURL(
                "image/png",
                1
            );

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF({

                orientation:
                    "landscape",

                unit:
                    "px",

                format:
                    [1920, 1080],

                hotfixes:
                    ["px_scaling"]

            });

        const pageWidth =
            pdf.internal.pageSize.getWidth();

        const pageHeight =
            pdf.internal.pageSize.getHeight();

        pdf.addImage(
            imageData,
            "PNG",
            0,
            0,
            pageWidth,
            pageHeight
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


// ================================
// html2canvas共通処理
// ================================

async function createResultCanvas(
    target
) {

    if (
        typeof html2canvas !==
        "function"
    ) {

        throw new Error(
            "html2canvasが読み込まれていません。"
        );
    }

    await waitForBackgroundImage();

    // 表の書き換えを待つ
    await new Promise(resolve => {

        requestAnimationFrame(() => {

            requestAnimationFrame(
                resolve
            );

        });

    });

    return html2canvas(
        target,
        {
            scale: 1,

            width: 1920,

            height: 1080,

            windowWidth: 1920,

            windowHeight: 1080,

            backgroundColor:
                "#050914",

            useCORS: true,

            allowTaint: false,

            logging: false,

            scrollX: 0,

            scrollY: 0
        }
    );
}


// ================================
// 背景画像読み込み待機
// ================================

function waitForBackgroundImage() {

    return new Promise(resolve => {

        const image =
            new Image();

        image.onload = () => {
            resolve();
        };

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


// ================================
// ページ読み込み時
// ================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        teams = loadTeams();

        roundCount =
            Number(
                localStorage.getItem(
                    "roundCount"
                )
            ) || 0;

        createTable();

        sortTeams();

        displayRanking();
    }
);
