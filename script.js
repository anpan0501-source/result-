let teams = JSON.parse(localStorage.getItem("teams")) || [];

function calculatePoint(){

const name=document.getElementById("team").value;
const rank=Number(document.getElementById("rank").value);
const kills=Number(document.getElementById("kills").value);

let placement=0;

if(rank==1)placement=12;
else if(rank==2)placement=9;
else if(rank==3)placement=7;
else if(rank==4)placement=5;
else if(rank==5)placement=4;
else if(rank<=7)placement=3;
else if(rank<=10)placement=2;
else if(rank<=15)placement=1;

const total=placement+kills;

const index=teams.findIndex(t=>t.name===name);

if(index>=0){
teams[index].point+=total;
}else{
teams.push({
    name:name,
    rank:rank,
    kills:kills,
    placement:placement,
    point:total
});
}

teams.sort((a,b)=>b.point-a.point);

localStorage.setItem("teams",JSON.stringify(teams));

displayRanking();

document.getElementById("team").value="";
document.getElementById("rank").value="";
document.getElementById("kills").value="";
}

function displayRanking(){

let html="";

teams.forEach((team,index)=>{

let medal="";

if(index===0)medal="🥇";
else if(index===1)medal="🥈";
else if(index===2)medal="🥉";

html+=`
<div class="team">
<div class="rank">${medal} ${index+1}位 ${team.name}</div>
<div class="point">${team.point}pt</div>
</div>
`;

});

document.getElementById("ranking").innerHTML=html;

}

displayRanking();
function exportCSV() {

    if (teams.length === 0) {
        alert("出力するデータがありません。");
        return;
    }

    function exportCSV(){

let csv="順位,チーム名,順位ポイント,キル数,合計ポイント\n";

teams.forEach((team,index)=>{

csv+=`${index+1},${team.name},${team.placement},${team.kills},${team.point}\n`;

});

const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});

const url=URL.createObjectURL(blob);

const link=document.createElement("a");

link.href=url;

link.download="result-esports-ranking.csv";

link.click();

URL.revokeObjectURL(url);

}

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const today = new Date();
    const fileName =
        `result-esports-ranking-${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.csv`;

    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
