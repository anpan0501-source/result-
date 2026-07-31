let teams = JSON.parse(localStorage.getItem("teams")) || [];


// ======================
// 順位ポイント
// ======================

function getPlacement(rank){

    if(rank === 1) return 12;
    if(rank === 2) return 9;
    if(rank === 3) return 7;
    if(rank === 4) return 5;
    if(rank === 5) return 4;
    if(rank <= 7) return 3;
    if(rank <= 10) return 2;
    if(rank <= 15) return 1;

    return 0;
}



// ======================
// 20チーム入力表作成
// ======================

function createTable(){

    const body =
    document.getElementById("tableBody");


    body.innerHTML = "";


    for(let i = 1; i <= 20; i++){

        body.innerHTML += `

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




// ======================
// 一括集計（加算版）
// ======================

function calculateAll(){


    for(let i = 1; i <= 20; i++){


        const name =
        document.getElementById(`team${i}`).value.trim();



        if(name === "") continue;



        const rank =
        Number(document.getElementById(`rank${i}`).value);



        const kills =
        Number(document.getElementById(`kill${i}`).value);



        if(rank < 1 || rank > 20){
            continue;
        }



        const placement =
        getPlacement(rank);



        const point =
        placement + kills;



        const index =
        teams.findIndex(
            team => team.name === name
        );



        if(index >= 0){


            // 既存チームへ追加

            teams[index].kills += kills;

            teams[index].placement += placement;

            teams[index].point += point;

            teams[index].rank = rank;



        }else{


            // 新規チーム

            teams.push({

                name:name,

                rank:rank,

                kills:kills,

                placement:placement,

                point:point

            });


        }


    }



    teams.sort(
        (a,b)=>b.point-a.point
    );



    saveData();


    displayRanking();



    alert("試合結果を追加しました");

}





// ======================
// ランキング表示
// ======================

function displayRanking(){


    let html = "";


    let tableHtml = `

    <tr>
    <th>順位</th>
    <th>チーム名</th>
    <th>キル</th>
    <th>ポイント</th>
    </tr>

    `;



    teams.forEach((team,index)=>{


        let medal="";


        if(index===0) medal="🥇";
        if(index===1) medal="🥈";
        if(index===2) medal="🥉";



        html += `

        <div class="team">

        <div class="rank">

        ${medal}
        ${index+1}位 ${team.name}

        </div>


        <div>

        キル:${team.kills}<br>

        合計:${team.point}pt

        </div>


        </div>

        `;



        tableHtml += `

        <tr>

        <td>${index+1}</td>

        <td>${team.name}</td>

        <td>${team.kills}</td>

        <td>${team.point}pt</td>

        </tr>

        `;


    });



    document.getElementById("ranking").innerHTML =
    html || "まだ結果がありません";



    document.getElementById("rankingTable").innerHTML =
    tableHtml;


}




// ======================
// 保存
// ======================

function saveData(){

    localStorage.setItem(
        "teams",
        JSON.stringify(teams)
    );

}





// ======================
// CSV出力
// ======================

function exportCSV(){


    if(teams.length === 0){

        alert("データがありません");

        return;

    }



    let csv =
    "順位,チーム名,順位ポイント,キル数,合計ポイント\n";



    teams.forEach((team,index)=>{


        csv +=

        `${index+1},${team.name},${team.placement},${team.kills},${team.point}\n`;


    });



    const blob =
    new Blob(
        [csv],
        {type:"text/csv;charset=utf-8;"}
    );



    const link =
    document.createElement("a");



    link.href =
    URL.createObjectURL(blob);



    link.download =
    "result-esports-ranking.csv";



    link.click();


}





// ======================
// PDF
// ======================

async function exportPDF(){


    const {jsPDF} =
    window.jspdf;



    const pdf =
    new jsPDF();



    pdf.text(
        "result e-Sports APEX Result",
        20,
        20
    );



    let y = 40;



    teams.forEach((team,index)=>{


        pdf.text(

        `${index+1}位 ${team.name} ${team.kills}kill ${team.point}pt`,

        20,

        y

        );


        y += 10;


    });



    pdf.save(
        "result-esports-result.pdf"
    );


}





// ======================
// PNG画像生成
// ======================

function createImage(){


    const target =
    document.getElementById("resultImage");



    html2canvas(target).then(canvas=>{


        const link =
        document.createElement("a");



        link.download =
        "result-esports-result.png";



        link.href =
        canvas.toDataURL();



        link.click();


    });


}





// 初期表示

displayRanking();
