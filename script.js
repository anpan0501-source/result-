let teams = JSON.parse(localStorage.getItem("teams")) || [];

function calculatePoint() {

    const name = document.getElementById("team").value.trim();
    const rank = Number(document.getElementById("rank").value);
    const kills = Number(document.getElementById("kills").value);

    if (!name || rank < 1 || rank > 20) {
        alert("チーム名と順位を正しく入力してください。");
        return;
    }

    let placement = 0;

    if (rank === 1) placement = 12;
    else if (rank === 2) placement = 9;
    else if (rank === 3) placement = 7;
    else if (rank === 4) placement = 5;
    else if (rank === 5) placement = 4;
    else if (rank <= 7) placement = 3;
    else if (rank <= 10) placement = 2;
    else if (rank <= 15) placement = 1;

    const total = placement + kills;

    const index = teams.findIndex(t => t.name === name);

    if (index >= 0) {

        teams[index].rank = rank;
        teams[index].kills += kills;
        teams[index].placement += placement;
        teams[index].point += total;

    } else {

        teams.push({
            name: name,
            rank: rank,
            kills: kills,
            placement: placement,
            point: total
        });

    }

    teams.sort((a, b) => b.point - a.point);

    localStorage.setItem("teams", JSON.stringify(teams));

    displayRanking();

    document.getElementById("team").value = "";
    document.getElementById("rank").value = "";
    document.getElementById("kills").value = "";

}

function displayRanking() {

    let html = "";

    teams.forEach((team, index) => {

        let medal = "";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";

        html += `
        <div class="team">
            <div class="rank">${medal} ${index + 1}位 ${team.name}</div>
            <div>
                キル:${team.kills}<br>
                合計:${team.point}pt
            </div>
        </div>`;
    });

    document.getElementById("ranking").innerHTML = html;
}

function exportCSV() {

    if (teams.length === 0) {
        alert("データがありません");
        return;
    }

    let csv = "順位,チーム名,順位ポイント,キル数,合計ポイント\n";

    teams.forEach((team, index) => {

        csv += `${index + 1},${team.name},${team.placement},${team.kills},${team.point}\n`;

    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "result-esports-ranking.csv";

    link.click();

    URL.revokeObjectURL(url);

}

async function exportPDF() {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("result e-Sports", 20, 20);

    pdf.setFontSize(14);
    pdf.text("APEX Tournament Result", 20, 32);

    let y = 50;

    teams.forEach((team, index) => {

        pdf.text(
            `${index + 1}位  ${team.name}
順位ポイント:${team.placement}
キル:${team.kills}
合計:${team.point}pt`,
            20,
            y
        );

        y += 22;

    });

    pdf.save("result-esports-result.pdf");

}

displayRanking();
function createTable(){

    const body=document.getElementById("tableBody");

    body.innerHTML="";

    for(let i=1;i<=20;i++){

        body.innerHTML+=`
        <tr>

        <td>
        <input id="rank${i}" type="number" min="1" max="20">
        </td>

        <td>
        <input id="team${i}" type="text">
        </td>

        <td>
        <input id="kill${i}" type="number" value="0">
        </td>

        </tr>
        `;

    }

}

createTable();
