let teams = JSON.parse(localStorage.getItem("teams")) || [];


function calculatePoint() {

    const name = document.querySelector("#team").value;
    const rank = Number(document.querySelector("#rank").value);
    const kills = Number(document.querySelector("#kills").value);


    let placement = 0;


    if(rank === 1) placement = 12;
    else if(rank === 2) placement = 9;
    else if(rank === 3) placement = 7;
    else if(rank === 4) placement = 5;
    else if(rank === 5) placement = 4;
    else if(rank >= 6 && rank <= 7) placement = 3;
    else if(rank >= 8 && rank <= 10) placement = 2;
    else if(rank >= 11 && rank <= 15) placement = 1;


    const total = placement + kills;


    teams.push({
        name:name,
        point:total
    });


    localStorage.setItem(
        "teams",
        JSON.stringify(teams)
    );


    displayRanking();

}



function displayRanking(){

    teams.sort(
        (a,b)=>b.point-a.point
    );


    let html="";


    teams.forEach((team,index)=>{

        html +=
        (index+1)
        +"位 "
        +team.name
        +" "
        +team.point
        +"pt<br>";

    });


    document.querySelector("#ranking")
    .innerHTML = html;

}
