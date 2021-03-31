let xDir = 0;   
let yDir = 0;   //keep track of x/y-direction
let gameWidth = 500;    
let gameHeight = 500;   //define canvas width/height
let numColors = 5;  //number of snake colors
let gameStart = false;     //boolean true when game starts
let gameEnd = false;    //boolean true when game ends
let teleport = false;   //true when game boundaries are removed
let highscoreScreen = false;    //boolean true when high score screen is displayed
let killstreak = false;     //boolean true when killstreak is active
let color1, color2, color4, color5 = false;     //boolean true when color selected
let color3 = true;      //default color green selected
let frenzyTime = 0;
let score = 0;      //current game score
let frameRate;      //snake speed
let snake = [{x: 140, y: 250}, {x: 140, y: 260}, {x: 140, y: 270}, {x: 140, y: 280}, {x: 140, y: 290}, {x: 140, y: 300}];   //snake array
let food = {x: Math.floor(Math.random()*50)*10, y: Math.floor(Math.random()*50)*10};    //food object
let wormhole = [{x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}, {x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}];    //wormhole array
const gameState = {light: "#5dff52", dark: "#076b00"};   //global object

const HIGH_SCORES = 'highscores';               //save key for local storage
const highScoreString = localStorage.getItem(HIGH_SCORES);              //string saved to local storage
const highscore = JSON.parse(highScoreString) || [];                //parse saved string to highscore array if there is saved data, else initiate empty array

/*
var ctx = new(window.AudioContext || window.webkitAudioContext)();              //declare both options for chrome(PC) and safari(MAC), respectively
let menuMusic;
fetch("menuMusic.mp3")
    .then(data => data.arrayBuffer())               //put into buffer to avoid latency when processing
    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
    .then(decodedAudio => {
        audio = decodedAudio;
    })
*/

const myGameArea = {        //define the play area
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = gameWidth;
        this.canvas.height = gameHeight;
        this.context = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);
    },
    clear: function() {     //clear canvas 
        myGameArea.context.beginPath();
        myGameArea.context.fillStyle = "black";
        myGameArea.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function startGame() {      //functions called on start of game
    gameEnd = false;
    gameStart = false;
    frameRate = 55;
    killstreak = false;
    myGameArea.start();
    drawSnake();
    moveSnake();
    idle();
    drawFood();
    
}

function createSnake(snakeRect, index) {     //draw rectangle at each snake element/index

    let num = frenzyTime/200;
    if(index<(snake.length-2)){
        if(index===0){
            myGameArea.context.fillStyle = gameState.light;        //assign color of snake head 
        }else{
            myGameArea.context.fillStyle = gameState.dark;         //assign color of snake body
        }
        if(killstreak===true){
        
            if(index<(Math.floor(snake.length*num))+1){
                if(index===0){
                    myGameArea.context.fillStyle = "lightblue";        //assign color of snake head 
                }else{
                    myGameArea.context.fillStyle = "darkblue";          //assign color of snake body
                }
            }    
        }

    }else if(index===(snake.length-2)){        //draw 2 snake tail rectangles with decreasing transparency
        myGameArea.context.globalAlpha = 0.4;
    }else if(index===(snake.length-1)){    
        myGameArea.context.globalAlpha = 0.2;
    }

    myGameArea.context.beginPath();
    myGameArea.context.lineWidth = "1";
    myGameArea.context.strokeStyle = "black";
    myGameArea.context.fillRect(snakeRect.x, snakeRect.y, 10, 10);
    myGameArea.context.strokeRect(snakeRect.x, snakeRect.y, 10, 10); 
    myGameArea.context.globalAlpha = 1;
}

function drawSnake() {      //draw snake
    snake.forEach(function(element, index){
        createSnake(element, index);
    });
}

function drawFood() {       //draw food rectangle
    myGameArea.context.beginPath();
    myGameArea.context.lineWidth = "1";
    if(gameStart===true && killstreak===false){
        myGameArea.context.fillStyle = "red";
        myGameArea.context.strokeStyle = "black";
        myGameArea.context.fillRect(food.x, food.y, 10, 10);
        myGameArea.context.strokeRect(food.x, food.y, 10, 10);
    }
    if(gameStart===true && killstreak===true){
        myGameArea.context.fillStyle = "gold";
        myGameArea.context.strokeStyle = "lightblue";
        myGameArea.context.fillRect(food.x, food.y, 10, 10);
        myGameArea.context.strokeRect(food.x, food.y, 10, 10);
    }
    

}

function newFood() {        //assign new random coordinates to food rectangle
    food={x: Math.floor(Math.random()*50)*10, y: Math.floor(Math.random()*50)*10};
}

function drawTitleScreen() {      //draw title
    myGameArea.context.beginPath();
    myGameArea.context.font = "65px Lucida Bright";
    myGameArea.context.lineWidth = "1";
    myGameArea.context.strokeStyle = gameState.light//"lightgreen";
    myGameArea.context.fillStyle = gameState.dark//"darkgreen";
    myGameArea.context.textAlign = "center";
    myGameArea.context.fillText("Snake", gameWidth/2, gameHeight/2);
    myGameArea.context.strokeText("Snake", gameWidth/2, gameHeight/2);

}

function drawScore() {      //draw score
    myGameArea.context.beginPath();
    myGameArea.context.font = "15px Lucida Bright";
    myGameArea.context.fillStyle = gameState.light;
    myGameArea.context.textAlign = "center";
    myGameArea.context.fillText("Score:", gameWidth-55, gameHeight-5);
    myGameArea.context.fillStyle = "red";
    myGameArea.context.fillText(`${score}`, gameWidth-20, gameHeight-5);
}

function drawEndScreen() {      //draw end screen 
    myGameArea.context.beginPath();
    myGameArea.context.font = "75px Lucida Bright";     //draw game over
    myGameArea.context.textAlign = "center";
    
    myGameArea.context.strokeStyle = gameState.light;
    myGameArea.context.fillStyle = gameState.dark;
    myGameArea.context.fillText("Game Over!", gameWidth/2, gameHeight/2 - 80);
    myGameArea.context.strokeText("Game Over!", gameWidth/2, gameHeight/2 - 80);

    myGameArea.context.font = "20px Lucida Bright";     //draw points summary
    myGameArea.context.lineWidth = ".1";
    myGameArea.context.strokeStyle = "lightgreen";
    myGameArea.context.fillStyle = "red";
    myGameArea.context.fillText(`You scored ${score} points!`, gameWidth/2, gameHeight/2 - 20);
    myGameArea.context.strokeText(`You scored ${score} points!`, gameWidth/2, gameHeight/2 - 20);
    
    myGameArea.context.lineWidth = ".3";
    myGameArea.context.strokeStyle = "black";       //draw view highscores instruction
    myGameArea.context.fillStyle = "white";       
    myGameArea.context.fillText("Press 'Enter' To See High Scores", gameWidth/2, gameHeight/2 + 170);
    myGameArea.context.strokeText("Press 'Enter' To See High Scores", gameWidth/2, gameHeight/2 + 170);
}

function createHighscores(element, y) {             //create each highscore info line
    myGameArea.context.beginPath();             
    myGameArea.context.font = "25px Lucida Bright";
    myGameArea.context.lineWidth = ".3";
    myGameArea.context.strokeStyle = "gold";
    myGameArea.context.fillStyle = "white";
    myGameArea.context.textAlign = "right";
    myGameArea.context.fillText(`${element.name}:`, gameWidth/2 - 5, y);
    myGameArea.context.strokeText(`${element.name}:`, gameWidth/2 - 5, y);
    myGameArea.context.textAlign = "left";
    myGameArea.context.fillStyle = "red";
    myGameArea.context.fillText(`${element.score}`, gameWidth/2 + 5, y);
}

function drawHighscoreScreen() {                //draw highscore screen
    myGameArea.context.beginPath();             //draw highscores title
    myGameArea.context.font = "75px Lucida Bright";
    myGameArea.context.lineWidth = "1";
    myGameArea.context.strokeStyle = gameState.light;
    myGameArea.context.fillStyle = gameState.dark;
    myGameArea.context.textAlign = "center";
    myGameArea.context.fillText("Highscores", gameWidth/2, 75);
    myGameArea.context.strokeText("Highscores", gameWidth/2, 75);

    myGameArea.context.font = "20px Lucida Bright";
    myGameArea.context.lineWidth = ".3";
    myGameArea.context.strokeStyle = "black";       //draw play again instruction
    myGameArea.context.fillStyle = "white";       
    myGameArea.context.fillText("Press 'Enter' To Play Again", gameWidth/2, gameHeight/2 + 220);
    myGameArea.context.strokeText("Press 'Enter' To Play Again", gameWidth/2, gameHeight/2 + 220);

    highscore.forEach(function(currVal, currIndex){                //draw name and score for each highscore array element 
        createHighscores(currVal, currIndex*30 + 135);
    })
}

function drawColorPicker() {                //draw coloured circles to indicated snake colour choices
    for(let i=1; i<6; i++){
        let x = gameWidth/6*i
        let numeral;
        switch(i){
            case 1:
                if(color1===true){
                    gameState.highlightDark = "#ffb994";
                }else{
                    gameState.highlightDark= "#963a00";
                }
                gameState.highlighLight= "#ff9359";
                numeral = 'I';
                break;
            case 2:
                if(color2===true){
                    gameState.highlightDark= "#8afff5";
                }else{
                    gameState.highlightDark= "#00544f";
                }
                gameState.highlighLight= "#45ffef";
                numeral = 'II';
                break;
            case 3:
                if(color3===true){
                    gameState.highlightDark= "#9dff96";
                }else{
                    gameState.highlightDark= "#076b00";
                }
                gameState.highlighLight= "#5dff52";
                numeral = 'III';
                break;
            case 4:
                if(color4===true){
                    gameState.highlightDark= "#c587ff";
                }else{
                    gameState.highlightDark= "#3d0075";
                }
                gameState.highlighLight= "#a340ff";
                numeral = 'IV';
                break;
            case 5:
                if(color5===true){
                    gameState.highlightDark= "#ffa8f2";
                }
                else{
                    gameState.highlightDark= "#800053";
                }
                gameState.highlighLight= "#ff63e8";
                numeral = 'V';
                break;
        }
        
        myGameArea.context.beginPath();
        myGameArea.context.lineWidth = "6"
        myGameArea.context.fillStyle = gameState.highlighLight;
        myGameArea.context.strokeStyle = gameState.highlightDark;
        myGameArea.context.arc(x, 475, 14, 0, 2*Math.PI);
        myGameArea.context.stroke();
        myGameArea.context.fill();
        myGameArea.context.font = "15px Lucida Bright";
        myGameArea.context.lineWidth = "2";
        myGameArea.context.fillText(numeral, x, 455);
        myGameArea.context.strokeText(numeral, x, 455);

        function isSelected() {
            gameState.highlightLight = "white"
        }
    }
}

document.addEventListener('keydown', function(event) {      //check if arrow keys are pressed and assign functionality
    switch(event.key){
        case "1":                               //check if keys 1 through 5 are pressed and assign snake colour accordingly
            if(gameStart===false){
                color1= true;
                color2= false;
                color3= false;
                color4= false;
                color5= false;
                gameState.light= "#ff9359";
                gameState.dark= "#963a00";
                break;
            }
        case "2":
            if(gameStart===false){
                color1= false;
                color2= true;
                color3= false;
                color4= false;
                color5= false;
                gameState.light= "#45ffef";
                gameState.dark= "#00544f";
                break;
            }
        case "3":
            if(gameStart===false){
                color1= false;
                color2= false;
                color3= true;
                color4= false;
                color5= false;
                gameState.light= "#5dff52";
                gameState.dark= "#076b00";
                break;
            }
        case "4":
            if(gameStart===false){
                color1= false;
                color2= false;
                color3= false;
                color4= true;
                color5= false;
                gameState.light= "#a340ff";
                gameState.dark= "#3d0075";
                break;
            }
        case "5":
            if(gameStart===false){
                color1= false;
                color2= false;
                color3= false;
                color4= false;
                color5= true;
                gameState.light= "#ff63e8";
                gameState.dark= "#800053";
                break;
            }

        case "ArrowUp":    //up                 
            if(yDir!=1 && snake[0].y!=snake[1].y+10){
                gameStart= true;        //stop idle animation
                xDir = 0;
                yDir = -1;
            }
            break;
        case "ArrowDown":    //down
            if(yDir!=-1 && snake[0].y!=snake[1].y-10){
                gameStart= true;
                xDir = 0;
                yDir = 1;               
            }
            break;
        case "ArrowLeft":    //left
            if(xDir!=1 && snake[0].x!=snake[1].x+10){
                gameStart= true;
                xDir = -1;
                yDir = 0;               
            }
            break;
        case "ArrowRight":    //right
            if(xDir!=-1 && snake[0].x!=snake[1].x-10){
                gameStart= true;
                xDir = 1;
                yDir = 0;   
            }
            break;

        case " ":                                                              //PAUSE FUNCTION FOR EASE OF TESTING
            if(gameStart===false){
                frameRate-=15;
                if(frameRate===40){
                    frameRate+=30;
                }
            }else if(gameStart===true){
                xDir = 0;
                yDir = 0;
            }
            break;
        
        case "0":
            if(gameStart===false){
                teleport=true
            }    

        case "Enter":  
            if(gameEnd===true){             //change from Game Over screen to highscore screen
                gameEnd=false;
                if(highscore.length===0){               //push score to highscore array if it's empty
                    let name = prompt("New High Score! Please Enter Your Name:")                //prompt for highscore name
                    highscore.push({name, score});
                }else if(!(score<highscore[highscore.length-1].score && highscore.length===10)){
                    let name = prompt("New High Score! Please Enter Your Name:")                //prompt new highscore name only if greater than the last element of highscore array and there are less than 10 highscores
                    for(let i=0; i<highscore.length; i++){              
                        if(score>highscore[i].score){               //add score in correct location so highscore array is incrementing
                            highscore.splice(i, 0, {name, score});
                            break;
                        }else if(i===highscore.length-1){               //if highscore array < 10 and score is less than the last element, push score to end of the highscore array
                            highscore.push({name, score}); 
                            break;
                        }
                    }
                    if(highscore.length>10){               //delete last element of highscore array if more than 10 highscores
                        highscore.pop();
                    }
                    localStorage.setItem(HIGH_SCORES, JSON.stringify(highscore));               //convert highscore array to string to be saved to local storage to be saved permanently 
                }

                myGameArea.clear();
                drawHighscoreScreen();
                highscoreScreen=true;               //switch to highscore screen
                break;
            }
            if(highscoreScreen===true){             //restart the game if enter is pressed only once highscore screen is being displayed
                score = 0;
                xDir = 0;
                yDir = 0;
                snake = [{x: 140, y: 250}, {x: 140, y: 260}, {x: 140, y: 270}, {x: 140, y: 280}, {x: 140, y: 290}, {x: 140, y: 300}];
                wormhole = [{x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}, {x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}];
                highscoreScreen=false;
                startGame();
                break;
            }
    }
})

function idle() {       //set idle animation to have snake circle the title text until a key is pressed 
    yDir--;
    if(gameStart === false){ 
        let interval = setInterval(function(){    
            if(gameStart===true){
                clearInterval(interval);
            }
            if(gameStart === false && yDir===-1 && snake[0].y<=180){
                xDir=1;
                yDir=0;
            }else if(gameStart === false && xDir===1 && snake[0].x>=350){
                xDir=0;
                yDir=1;
            }else if(gameStart === false && yDir===1 && snake[0].y>=260){
                xDir=-1;
                yDir=0;
            }else if(gameStart === false && xDir===-1 && snake[0].x<=140){
                xDir=0;
                yDir=-1;
            }
            console.log(frameRate);
        }, frameRate)
    }
}

function moveSnake() {      //move the snake
    gameState.interval = setInterval(function(){
        if(xDir!=0 || yDir!=0){
            if(snake[0].x===food.x && snake[0].y===food.y){     //check if snake has eaten a food and extend array by 1 by not deleting last array element for 1 frame

                if(killstreak===false){         //increase score by 1 if no killstreak
                    killstreakTimer();      //start killstreak timer
                    score++;
                }
                if(killstreak===true){          //start 15s timer where score increases by 3
                    score+=3;
                }

                
                newFood();

            }else if(snake[0].x===wormhole[0].x && snake[0].y===wormhole[0].y){     //teleport snake if touches a wormhole then change wormhole location
                snake[0].x = wormhole[1].x + xDir*10;
                snake[0].y = wormhole[1].y + yDir*10;
                wormhole = [{x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}, {x: wormhole[1].x, y: wormhole[1].y}];
            }else if(snake[0].x===wormhole[1].x && snake[0].y===wormhole[1].y){
                snake[0].x = wormhole[0].x + xDir*10;
                snake[0].y = wormhole[0].y + yDir*10;
                wormhole = [{x: wormhole[0].x, y: wormhole[0].y}, {x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}];
            }else{      
                snake.pop();                //delete last element in array for each frame
            }

            snake.unshift({x: snake[0].x + (10*xDir), y: snake[0].y + (10*yDir)});              //add new element at beginning offset by 10*(x/y direction) each frame
            myGameArea.clear();
            drawSnake();                //move snake by redrawing the snake every frame after adding and/or deleting elements to the snake array
        }

        if(gameStart===true){                    //draw score, wormholes, and food when game starts
            drawScore();
            drawWormhole();
            drawFood();
        }
        if(gameStart===false){              //draw title screen with color picker while game has not started
            drawTitleScreen();
            drawColorPicker();
        }
        for(let i=1; i<snake.length-2; i++){      //end game if snake head collides with a snake body rectangle
            if(snake[0].x===snake[i].x && snake[0].y===snake[i].y && killstreak===false){
                gameEnd=true;
                drawEndScreen(); 
                clearInterval(gameState.interval);
                clearInterval(gameState.downTimer)
            }
        }
        if(teleport===true){
            if(snake[0].x>=gameWidth){
                snake[0].x-=gameWidth;
            }else if(snake[0].x<0){
                snake[0].x+=gameWidth;
            }else if(snake[0].y>=gameHeight){
                snake[0].y-=gameHeight;
            }else if(snake[0].y<0){
                snake[0].y+=gameHeight;
            }
        }else if(teleport===false){
            if(snake[0].x>=gameWidth || snake[0].x<0 || snake[0].y<0 || snake[0].y>=gameHeight){      //end game if snake is outside of game area
                gameEnd=true;
                drawEndScreen(); 
                clearInterval(gameState.interval);
                clearInterval(gameState.downTimer);
            }
        }

    }, frameRate)
}

function createWormhole(hole) {             //create each wormhole element 
    if(wormhole[0].x===food.x && wormhole[0].y===food.y || wormhole[1].x===food.x && wormhole[1].y===food.y){               //reshuffle location if on food 
        do{
            wormhole = [{x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}, {x: Math.floor(Math.random()*40)*10 + 40, y: Math.floor(Math.random()*40)*10 + 40}];
        }while((wormhole[0].x===food.x && wormhole[0].y===food.y) || (wormhole[1].x===food.x && wormhole[1].y===food.y));
    }
    myGameArea.context.beginPath();             //draw wormhole
    const gradient = myGameArea.context.createLinearGradient(hole.x-5, 0, hole.x+5, 0);
    gradient.addColorStop(0, "black");
    gradient.addColorStop(1, "grey");
    myGameArea.context.fillStyle = gradient;
    myGameArea.context.fillRect(hole.x, hole.y, 10, 10);
}

function drawWormhole() {               //draw each wormhome
    wormhole.forEach(function(element){
        createWormhole(element);
    })
}

function frenzyTimer() {            //create timer to reset frameRate when killstreak is finished
    frenzyTime = 200;
    gameState.downTimer = setInterval(function(){
        frenzyTime--;
        if(frenzyTime<0){
            killstreak = false;
            frameRate+=10;
            clearInterval(gameState.interval);
            clearInterval(gameState.downTimer);
            moveSnake();                //restart moveSnake function to update resetted frameRate
        }
    }, frameRate)
}

function killstreakTimer(){         //create timer when food is eaten. If 5 foods are eaten within timer then set killstreak = true
    var sec = 300;
    let count = 0
    var timer = setInterval(function(){
        sec--;
        if(killstreak===true || gameEnd===true){
            clearInterval(timer);
        }
        if(snake[0].x===food.x && snake[0].y===food.y){
            count++;
        }
        if(count===5){
            killstreak = true;
            count=0;
            frameRate-=10;           //change to faster frameRate during killstreak
            frenzyTimer();          //reset frameRate when finished
            clearInterval(gameState.interval);
            clearInterval(timer);
            moveSnake();            //restart moveSnake function to update resetted frameRate
        }
        if(sec < 0) {
            count=0;
            clearInterval(timer);
        }
    }, frameRate);
}


/*var level1 = document.createElement('button');
level1.innerText= "level1";
level1.style.background= "black";
level1.insertAdjacentText = "black";
level1.strokeStyle = "white";
document.body.appendChild(level1);
level1.onClick = function(){
    level = 1;
}*/

/*
function workProperly(now){
    this.work(now);
}
/*
function workProperly(now){
    this.work(now);
}
*/
