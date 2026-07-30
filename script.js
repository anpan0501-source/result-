function calculatePoint() {

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


    document.querySelector("#result").innerHTML =
    "獲得ポイント：" + total + "pt";

}
