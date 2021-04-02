// Generate Canvas Area on which to Draw the Game
const myGameArea = {
    canvas: document.createElement("canvas"),
    gridDimX: 0,
    gridDimY: 0,
    possibleMoves: {x:[], y:[]},
    start: function() {
        this.canvas.width = 1000;
        this.canvas.height = 1000;
        this.context = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas)
    }
}

const gamePieces = {} //Store Game Pieces Only

const deadPieces = { //Store Count of Dead Pieces Only
        pawnsW: 0,
        bishopsW:0,
        knightsW:0,
        rooksW:0,
        queensW:0,
        pawnsB: 0,
        bishopsB:0,
        knightsB:0,
        rooksB:0,
        queensB:0
} 

const gameState = {
    turn: 'white',
    move: 1,
    kingInCheck: {x:[], y:[]}
}

class Piece {
    constructor(gridPosX,gridPosY, color) {
        this.xSquare = gridPosX;
        this.ySquare = gridPosY;
        this.color = color
    }
}

class Pawn extends Piece {
    constructor (gridPosX,gridPosY, color) {
        super(gridPosX,gridPosY, color);
        this.enPassantVulnerable=false;
        this.enPassantSpot={x:-1,y:-1};
        this.enPassantMove=-1
    }
    
    draw () {
        this.imageElement = new Image(200,200)
        this.imageElement.onload = () => {
            myGameArea.context.drawImage(this.imageElement,this.xSquare*myGameArea.gridDimX,this.ySquare*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)
            this.loaded=true
        } 
        if (this.color === "white") {
            this.imageElement.src = "superChessImages/whitePawn.png"
        } else {
            this.imageElement.src = "superChessImages/blackPawn.png"
        }        
    }

    returnMoves() {
        const moveList = [[],[]]
        let startRow
        let yDir
        if (this.color==='white') {
            startRow=myGameArea.gridHeight-2
            yDir = -1
        } else {
            startRow=1
            yDir = 1           
        }

        if(this.ySquare===startRow && pieceOnSquare(this.xSquare,this.ySquare+1*yDir)===-1 && pieceOnSquare(this.xSquare,this.ySquare+2*yDir)===-1 && !(selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare,this.ySquare+1*yDir)) && !(selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare,this.ySquare+2*yDir))) {
            moveList[0]=[this.xSquare, this.xSquare]
            moveList[1]=[this.ySquare+1*yDir, this.ySquare+2*yDir]
        } else if (this.ySquare===startRow && pieceOnSquare(this.xSquare,this.ySquare+1*yDir)===-1 && pieceOnSquare(this.xSquare,this.ySquare+2*yDir)===-1 && !(selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare,this.ySquare+2*yDir))){
            moveList[0]=[this.xSquare]
            moveList[1]=[this.ySquare+2*yDir]
        } else if (pieceOnSquare(this.xSquare,this.ySquare+1*yDir)===-1 && !(selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare,this.ySquare+1*yDir))){
            moveList[0]=[this.xSquare]
            moveList[1]=[this.ySquare+1*yDir]
        }
        const diagonal1 = pieceOnSquare(this.xSquare+1,this.ySquare+1*yDir)
        const diagonal2 = pieceOnSquare(this.xSquare-1,this.ySquare+1*yDir)
        if (((diagonal1 != this.color && diagonal1 != -1) || enPassantCheck(this.xSquare+1,this.ySquare+1*yDir,this.color)) && !(selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare+1,this.ySquare+1*yDir))) {
            moveList[0].push(this.xSquare+1)
            moveList[1].push(this.ySquare+1*yDir)
        }
        if (((diagonal2 != this.color && diagonal2 != -1) || enPassantCheck(this.xSquare-1,this.ySquare+1*yDir,this.color)) && !(selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare-1,this.ySquare+1*yDir))) {
            moveList[0].push(this.xSquare-1)
            moveList[1].push(this.ySquare+1*yDir)
        }
        return {x:moveList[0], y:moveList[1]}
    }
}

class King extends Piece {
    constructor (gridPosX,gridPosY, color) {
        super(gridPosX,gridPosY, color);
        this.hasMoved= false
    }
    
    draw () {
        this.imageElement = new Image(200,200)
        this.imageElement.onload = () => {myGameArea.context.drawImage(this.imageElement,this.xSquare*myGameArea.gridDimX,this.ySquare*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)} 
        if (this.color === "white") {
            this.imageElement.src = "superChessImages/whiteKing.png"
        } else {
            this.imageElement.src = "superChessImages/blackKing.png"
        }
    }

    returnMoves() {
        const moveList = [[],[]]
        for (let xmove=-1; xmove<2;xmove++) {
            for (let ymove=-1; ymove<2;ymove++) {
                if (!(xmove===0 && ymove===0) && pieceOnSquare(this.xSquare+xmove,this.ySquare+ymove)!=this.color && !inCheck(this.color,{x:this.xSquare+xmove, y:this.ySquare+ymove})) {
                    moveList[0].push(this.xSquare+xmove)
                    moveList[1].push(this.ySquare+ymove)
                }
            }
        }
        const castleDir = castleCheck(this.color)
        if (castleDir.length<1){
            return {x:moveList[0], y:moveList[1]}
        } else {
            for (let castleM=0;castleM<castleDir.length;castleM++){
                if (!inCheck(this.color,{x:this.xSquare+2*castleDir[castleM], y:this.ySquare})){
                    moveList[0].push(this.xSquare+2*castleDir[castleM])
                    moveList[1].push(this.ySquare)
                }
            }
            return {x:moveList[0], y:moveList[1]}
        }
    }
}

class Queen extends Piece {
    constructor (gridPosX,gridPosY, color) {
        super(gridPosX,gridPosY, color);
    }
    
    draw () {
        this.imageElement = new Image(200,200)
        this.imageElement.onload = () => {myGameArea.context.drawImage(this.imageElement,this.xSquare*myGameArea.gridDimX,this.ySquare*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)} 
        if (this.color === "white") {
            this.imageElement.src = "superChessImages/whiteQueen.png"
        } else {
            this.imageElement.src = "superChessImages/blackQueen.png"
        }
    }

    returnMoves() {
        const dirList = [[1,1,-1,-1,0,-1,0,1],[1,0,-1,0,1,1,-1,-1]]
        const moveList = [[],[]]
        let occupiedBy
        for (let j=0; j<dirList[0].length;j++) {
            for (let i=0; i<Math.max(myGameArea.gridWidth,myGameArea.gridHeight);i++) {
                occupiedBy = pieceOnSquare(this.xSquare+dirList[0][j]*(i+1),this.ySquare+dirList[1][j]*(i+1))
                if (occupiedBy===this.color) {
                    break;
                }
                if (!selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare+dirList[0][j]*(i+1),this.ySquare+dirList[1][j]*(i+1))) {
                    moveList[0].push(this.xSquare+dirList[0][j]*(i+1))
                    moveList[1].push(this.ySquare+dirList[1][j]*(i+1))
                }
                if (occupiedBy!=this.color &&occupiedBy!=-1){
                    break;
                }
            }
        }
        return {x:moveList[0], y:moveList[1]}
    }
}

class Bishop extends Piece {
    constructor (gridPosX,gridPosY, color) {
        super(gridPosX,gridPosY, color);
    }
    
    draw () {
        this.imageElement = new Image(200,200)
        this.imageElement.onload = () => {myGameArea.context.drawImage(this.imageElement,this.xSquare*myGameArea.gridDimX,this.ySquare*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)} 
        if (this.color === "white") {
            this.imageElement.src = "superChessImages/whiteBishop.png"
        } else {
            this.imageElement.src = "superChessImages/blackBishop.png"
        }
    }

    returnMoves() {
        const dirList = [[1,1,-1,-1],[1,-1,1,-1]]
        const moveList = [[],[]]
        let occupiedBy
        for (let j=0; j<dirList[0].length;j++) {
            for (let i=0; i<Math.max(myGameArea.gridWidth,myGameArea.gridHeight);i++) {
                occupiedBy = pieceOnSquare(this.xSquare+dirList[0][j]*(i+1),this.ySquare+dirList[1][j]*(i+1))
                if (occupiedBy===this.color) {
                    break;
                }
                if (!selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare+dirList[0][j]*(i+1),this.ySquare+dirList[1][j]*(i+1))) {
                    moveList[0].push(this.xSquare+dirList[0][j]*(i+1))
                    moveList[1].push(this.ySquare+dirList[1][j]*(i+1))
                }
                if (occupiedBy!=this.color &&occupiedBy!=-1){
                    break;
                }
            }
        }
        return {x:moveList[0], y:moveList[1]}
    }

}

class Knight extends Piece {
    constructor (gridPosX,gridPosY, color) {
        super(gridPosX,gridPosY, color);
    }
    
    draw () {
        this.imageElement = new Image(200,200)
        this.imageElement.onload = () => {myGameArea.context.drawImage(this.imageElement,this.xSquare*myGameArea.gridDimX,this.ySquare*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)} 
        if (this.color === "white") {
            this.imageElement.src = "superChessImages/whiteKnight.png"
        } else {
            this.imageElement.src = "superChessImages/blackKnight.png"
        }
    }

    returnMoves() {
        const moveList = [[],[]]
        for (let xmove=-2; xmove<3;xmove++) {
            for (let ymove=-2; ymove<3;ymove++) {
                if (!(xmove===0 || ymove===0) && Math.abs(xmove)!=Math.abs(ymove) && pieceOnSquare(this.xSquare+xmove,this.ySquare+ymove)!=this.color) {
                    if (!selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare+xmove,this.ySquare+ymove)) {
                        moveList[0].push(this.xSquare+xmove)
                        moveList[1].push(this.ySquare+ymove)
                    }
                }
            }
        }
        return {x:moveList[0], y:moveList[1]}
    }

}

class Rook extends Piece {
    constructor (gridPosX,gridPosY, color) {
        super(gridPosX,gridPosY, color);
        this.hasMoved= false
    }
    
    draw () {
        this.imageElement = new Image(200,200)
        this.imageElement.onload = () => {myGameArea.context.drawImage(this.imageElement,this.xSquare*myGameArea.gridDimX,this.ySquare*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)} 
        if (this.color === "white") {
            this.imageElement.src = "superChessImages/whiteRook.png"
        } else {
            this.imageElement.src = "superChessImages/blackRook.png"
        }
    }

    returnMoves() {
        const dirList = [[0,1,0,-1],[1,0,-1,0]]
        const moveList = [[],[]]
        let occupiedBy
        for (let j=0; j<dirList[0].length;j++) {
            for (let i=0; i<Math.max(myGameArea.gridWidth,myGameArea.gridHeight);i++) {
                occupiedBy = pieceOnSquare(this.xSquare+dirList[0][j]*(i+1),this.ySquare+dirList[1][j]*(i+1))
                if (occupiedBy===this.color) {
                    break;
                }
                if (!selfInCheck(this.color,this.xSquare,this.ySquare,this.xSquare+dirList[0][j]*(i+1),this.ySquare+dirList[1][j]*(i+1))) {
                    moveList[0].push(this.xSquare+dirList[0][j]*(i+1))
                    moveList[1].push(this.ySquare+dirList[1][j]*(i+1))
                }
                if (occupiedBy!=this.color &&occupiedBy!=-1){
                    break;
                }
            }
        }
        return {x:moveList[0], y:moveList[1]}
    }    

}

// Initializes the Chess Board and the piece on page load
function startGame() {
    myGameArea.start();
    myGameArea.gridWidth = prompt("Please enter a grid width", 8)
    myGameArea.gridHeight = prompt("Please enter a grid height", myGameArea.gridWidth)
    drawGrid();
    layPieces();
    myGameArea.canvas.onclick = drawMoveOptions
}

// Draws the Chess Board based on gridsize
function drawGrid() {
    const numOfSpaces = {
        x: myGameArea.gridWidth,
        y: myGameArea.gridHeight
    }
    
    myGameArea.gridDimY = myGameArea.canvas.height / numOfSpaces.y
    myGameArea.gridDimX = myGameArea.canvas.width / numOfSpaces.x
    if (!myGameArea.thisClick) {
        myGameArea.thisClick = {x: numOfSpaces.x, y: numOfSpaces.y}
    }
    for (let row=0; row<numOfSpaces.y; row++) {
        for (let col=0; col<numOfSpaces.x; col++) {
            if (col===myGameArea.thisClick.x && row===myGameArea.thisClick.y){
                myGameArea.context.fillStyle = "#00ff99";
                myGameArea.context.fillRect(col*myGameArea.gridDimX,row*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)
            } else if (checkGridMatch(gameState.kingInCheck,col,row)){
                myGameArea.context.fillStyle = "#ff0000";
                myGameArea.context.fillRect(col*myGameArea.gridDimX,row*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)
            } else if (checkGridMatch(myGameArea.possibleMoves,col,row)){
                if ((row+col)%2!=0) {
                    myGameArea.context.fillStyle = "#bd8533";
                } else {
                    myGameArea.context.fillStyle = "#f5ad42";    
                }
                myGameArea.context.fillRect(col*myGameArea.gridDimX,row*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)
            }else if ((row+col)%2!=0){
                myGameArea.context.fillStyle = "#000000";
                myGameArea.context.fillRect(col*myGameArea.gridDimX,row*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)
            } else {
                myGameArea.context.fillStyle = "#ffffff";
                myGameArea.context.fillRect(col*myGameArea.gridDimX,row*myGameArea.gridDimY,myGameArea.gridDimX,myGameArea.gridDimY)
            }
        }
    }
}

// Place Pieces on Board Based on GridSize
function layPieces() {
    
    let xDim = myGameArea.gridWidth
    let yDim = myGameArea.gridHeight
    
    // Place the pawns
    gamePieces.pawnsB = []
    gamePieces.pawnsW = []
    for (let i=0; i<xDim; i++) {
        gamePieces.pawnsB.push(new Pawn(i, 1, "black")) 
        gamePieces.pawnsW.push(new Pawn(i, yDim-2, "white")) 
        gamePieces.pawnsB[i].draw()
        gamePieces.pawnsW[i].draw()
    }

    // Place the kings
    gamePieces.kingB = [new King (Math.floor(xDim/2), 0, "black")]
    gamePieces.kingW = [new King (Math.floor(xDim/2), yDim-1, "white")]
    gamePieces.kingB[0].draw()
    gamePieces.kingW[0].draw()

    //Place the Queen(s)

    if (xDim%2===0) {
        gamePieces.queensB=[]
        gamePieces.queensW=[]
        gamePieces.queensB.push(new Queen (Math.floor(xDim/2)-1,0,'black'))
        gamePieces.queensW.push(new Queen (Math.floor(xDim/2)-1,yDim-1,'white'))
        gamePieces.queensB[0].draw();
        gamePieces.queensW[0].draw();
    } else {
        gamePieces.queensB = [new Queen (Math.floor(xDim/2)-1,0,'black'), new Queen(Math.floor(xDim/2)+1,0,'black')]
        gamePieces.queensW = [new Queen (Math.floor(xDim/2)-1,yDim-1,'white'), new Queen(Math.floor(xDim/2)+1,yDim-1,'white')]
        gamePieces.queensB[0].draw();
        gamePieces.queensB[1].draw();
        gamePieces.queensW[0].draw();
        gamePieces.queensW[1].draw();
    }

    //Count Non-Royal Pieces
    const numOfNonRoyalSpots = (Math.floor(xDim/2)-1)*2
    const numOfBishops = Math.ceil(numOfNonRoyalSpots/2/3)*2
    const numOfKnights = Math.ceil((numOfNonRoyalSpots - numOfBishops)/2/2)*2
    const numOfRooks = Math.ceil(numOfNonRoyalSpots - numOfBishops - numOfKnights)

    //Place the Bishops
    gamePieces.bishopsB = []
    gamePieces.bishopsW = []
    for (let bishop = 0; bishop<numOfBishops/2; bishop++) {
        gamePieces.bishopsB.push(new Bishop(Math.floor(xDim/2)+bishop*3+gamePieces.queensB.length,0,'black'))
        gamePieces.bishopsB.push(new Bishop(Math.floor(xDim/2)-bishop*3-2,0,'black'))
        gamePieces.bishopsW.push(new Bishop(Math.floor(xDim/2)+bishop*3+gamePieces.queensW.length,yDim-1,'white'))
        gamePieces.bishopsW.push(new Bishop(Math.floor(xDim/2)-bishop*3-2,yDim-1,'white'))
        gamePieces.bishopsB[bishop*2].draw()
        gamePieces.bishopsB[bishop*2+1].draw()
        gamePieces.bishopsW[bishop*2].draw()
        gamePieces.bishopsW[bishop*2+1].draw()
    }

    //Place the Knights
    gamePieces.knightsB=[]
    gamePieces.knightsW=[]
    for (let knight = 0; knight<numOfKnights/2; knight++) {
        gamePieces.knightsB.push(new Knight(Math.floor(xDim/2)+knight*3+gamePieces.queensB.length+1,0,'black'))
        gamePieces.knightsB.push(new Knight(Math.floor(xDim/2)-knight*3-3,0,'black'))
        gamePieces.knightsW.push(new Knight(Math.floor(xDim/2)+knight*3+gamePieces.queensW.length+1,yDim-1,'white'))
        gamePieces.knightsW.push(new Knight(Math.floor(xDim/2)-knight*3-3,yDim-1,'white'))
        gamePieces.knightsB[knight*2].draw()
        gamePieces.knightsB[knight*2+1].draw()
        gamePieces.knightsW[knight*2].draw()
        gamePieces.knightsW[knight*2+1].draw()
    }

    gamePieces.rooksB=[]
    gamePieces.rooksW=[]
    for (let rook = 0; rook<numOfRooks/2; rook++) {
        gamePieces.rooksB.push(new Rook(Math.floor(xDim/2)+rook*3+gamePieces.queensB.length+2,0,'black'))
        gamePieces.rooksB.push(new Rook(Math.floor(xDim/2)-rook*3-4,0,'black'))
        gamePieces.rooksW.push(new Rook(Math.floor(xDim/2)+rook*3+gamePieces.queensW.length+2,yDim-1,'white'))
        gamePieces.rooksW.push(new Rook(Math.floor(xDim/2)-rook*3-4,yDim-1,'white'))
        gamePieces.rooksB[rook*2].draw()
        gamePieces.rooksB[rook*2+1].draw()
        gamePieces.rooksW[rook*2].draw()
        gamePieces.rooksW[rook*2+1].draw()
    }
}

function drawPieces() {
    //draw all pieces
    for (const type in gamePieces) {
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            gamePieces[type][piece].draw()
        }
    }
}

function drawMoveOptions(event) {
    const rect = this.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const gridClickX = Math.floor(x/myGameArea.gridDimX)
    const gridClickY = Math.floor(y/myGameArea.gridDimY)
    myGameArea.lastClick = {x:myGameArea.thisClick.x, y:myGameArea.thisClick.y}
    myGameArea.thisClick = {x: gridClickX, y: gridClickY}
    
    if (checkGridMatch(myGameArea.possibleMoves,myGameArea.thisClick.x,myGameArea.thisClick.y)) {
        movePiece()
    }

    //clear possible moves
    myGameArea.possibleMoves = {x:[], y:[]}

    myGameArea.possibleMoves=getPossibleMoveList();
    drawGrid()
    drawPieces()

    function getPossibleMoveList() { // Fetch move list from pieces
        for (const type in gamePieces) {
            for (let piece=0; piece<gamePieces[type].length;piece++) {
                if (gamePieces[type][piece].xSquare === myGameArea.thisClick.x && gamePieces[type][piece].ySquare === myGameArea.thisClick.y && gamePieces[type][piece].color===gameState.turn) {
                    return gamePieces[type][piece].returnMoves();
                }
            }
        }
        return {x:[], y:[]}    
    }
    function movePiece() {
        let pieceThatMoved
        let pawnPromotion = false
        //Find Piece that is moving and move it
        for (const type in gamePieces) {
            for (let piece=0; piece<gamePieces[type].length; piece++) {
                if (gamePieces[type][piece].xSquare === myGameArea.lastClick.x && gamePieces[type][piece].ySquare === myGameArea.lastClick.y && gamePieces[type][piece].color===gameState.turn) {
                    if (type==='pawnsB' || type==='pawnsW') {
                        if (Math.abs(gamePieces[type][piece].ySquare-myGameArea.thisClick.y)===2){ // Tags Pawn as En Passant Vulnerable
                            gamePieces[type][piece].enPassantVulnerable = true
                            gamePieces[type][piece].enPassantSpot = {x:gamePieces[type][piece].xSquare, y:(gamePieces[type][piece].ySquare+myGameArea.thisClick.y)/2}
                            gamePieces[type][piece].enPassantMove = gameState.move
                        } else if ((gamePieces[type][piece].color==='white' && myGameArea.thisClick.y===0)||(gamePieces[type][piece].color==='black' && myGameArea.thisClick.y===myGameArea.gridHeight-1)) {
                            let newPiece= prompt("Pawn Promotion! Enter First Letter of New Piece Type: [Q]ueen, [B]ishop, [K]night, [R]ook","Q")
                            let newType
                            switch (newPiece) {
                                case 'B':
                                case 'b':
                                    newType = 'bishops'+type[type.length-1]
                                    gamePieces[newType].push(new Bishop(gamePieces[type][piece].xSquare,gamePieces[type][piece].ySquare,gamePieces[type][piece].color))
                                    gamePieces[newType][gamePieces[newType].length-1].hasMoved = true
                                    break;
                                case 'K':
                                case 'k':
                                    newType = 'knights'+type[type.length-1]
                                    gamePieces[newType].push(new Knight(gamePieces[type][piece].xSquare,gamePieces[type][piece].ySquare,gamePieces[type][piece].color))
                                    gamePieces[newType][gamePieces[newType].length-1].hasMoved = true
                                    break;
                                case 'R':
                                case 'r':
                                    newType = 'rooks'+type[type.length-1]
                                    gamePieces[newType].push(new Rook(gamePieces[type][piece].xSquare,gamePieces[type][piece].ySquare,gamePieces[type][piece].color))
                                    gamePieces[newType][gamePieces[newType].length-1].hasMoved = true
                                    break;
                                default:
                                    newType = 'queens'+type[type.length-1]
                                    gamePieces[newType].push(new Queen(gamePieces[type][piece].xSquare,gamePieces[type][piece].ySquare,gamePieces[type][piece].color))
                                    gamePieces[newType][gamePieces[newType].length-1].hasMoved = true
                            }
                            gamePieces[newType][gamePieces[newType].length-1].xSquare = myGameArea.thisClick.x
                            gamePieces[newType][gamePieces[newType].length-1].ySquare = myGameArea.thisClick.y
                            gamePieces[newType][gamePieces[newType].length-1].hasMoved = true
                            gamePieces[type].splice(piece,1)
                            pawnPromotion=true
                        }
                    } else if ((type==='kingB' || type==='kingW') && Math.abs(gamePieces[type][piece].xSquare-myGameArea.thisClick.x)===2){
                        // Moves the rook participating in a castle
                        let rookSign, kingSign
                        for (let rook=0; rook<gamePieces['rooks'+type[type.length-1]].length; rook++) {
                            rookSign = Math.sign(gamePieces['rooks'+type[type.length-1]][rook].xSquare-gamePieces[type][piece].xSquare)
                            kingSign = Math.sign(myGameArea.thisClick.x-gamePieces[type][piece].xSquare)
                            if (gamePieces['rooks'+type[type.length-1]][rook].canCastle===true && rookSign===kingSign) {
                                gamePieces['rooks'+type[type.length-1]][rook].xSquare = (gamePieces[type][piece].xSquare+myGameArea.thisClick.x)/2
                                gamePieces['rooks'+type[type.length-1]][rook].hasMoved = true
                            }
                        }
                    }
                    if (!pawnPromotion) {
                        gamePieces[type][piece].xSquare=myGameArea.thisClick.x;
                        gamePieces[type][piece].ySquare=myGameArea.thisClick.y;
                        gamePieces[type][piece].hasMoved=true;
                    }
                    pieceThatMoved = type
                }
            }
        }
        //Destroy Piece it is landing on
        for (const type in gamePieces) {
            for (let piece=0; piece<gamePieces[type].length; piece++) {
                if ((pieceThatMoved==='pawnsB' || pieceThatMoved=== 'pawnsW') && (type==='pawnsB' || type=== 'pawnsW') && (gamePieces[type][piece].enPassantSpot.x === myGameArea.thisClick.x && gamePieces[type][piece].enPassantSpot.y === myGameArea.thisClick.y && gamePieces[type][piece].enPassantMove===gameState.move-1) && gamePieces[type][piece].color!=gameState.turn) {
                    deadPieces[type]++
                    gamePieces[type].splice(piece,1)                    
                }else if ((gamePieces[type][piece].xSquare === myGameArea.thisClick.x && gamePieces[type][piece].ySquare === myGameArea.thisClick.y) && gamePieces[type][piece].color!=gameState.turn) {
                    deadPieces[type]++
                    gamePieces[type].splice(piece,1)
                }
            }
        } 
        
        //Change Turn and check if in Check
        if (gameState.turn === 'white') {
            gameState.turn = 'black'
            if (inCheck('black')) {
                if (moveCount('black')===0) {
                    prompt('White Wins!')
                    gameState.turn='white'
                    gameState.move=1
                    startGame()
                } else {
                    gameState.kingInCheck = {x:[gamePieces.kingB[0].xSquare],y:[gamePieces.kingB[0].ySquare]}
                }
            } else {
                if (moveCount('black')===0) {
                    prompt("It's a Tie!")
                    gameState.turn='white'
                    gameState.move=1
                    startGame()
                } else {
                    gameState.kingInCheck = {x:[],y:[]}
                }
            }
        } else {
            gameState.turn = 'white'
            if (inCheck('white')) {
                if (moveCount('white')===0) {
                    prompt('Black Wins!')
                    gameState.turn='white'
                    gameState.move=1
                    startGame()
                } else {
                    gameState.kingInCheck = {x:[gamePieces.kingW[0].xSquare],y:[gamePieces.kingW[0].ySquare]}
                }
            } else {
                if (moveCount('white')===0) {
                    prompt("It's a Tie!")
                    gameState.turn='white'
                    gameState.move=1
                    startGame()
                } else {
                    gameState.kingInCheck = {x:[],y:[]}
                }
            }
        }
        gameState.move++        
    }
}

function checkGridMatch(moveList,col,row) { //Checks if location is on a list of moves
    for (let i=0; i<moveList.x.length;i++) {
        if (moveList.x[i]===col && moveList.y[i]===row) {
            return true
        } 
    }
    return false
}

function pieceOnSquare(xLoc,yLoc) { //Returns color of piece on location, or -1
    for (const type in gamePieces) {
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            if (gamePieces[type][piece].xSquare === xLoc && gamePieces[type][piece].ySquare === yLoc) {
                return gamePieces[type][piece].color;
            }
        }
    }
    return -1
}

function enPassantCheck(xLoc,yLoc,color) { //Check position for pawns that are vulnerable to en passant
    const types = ['pawnsB','pawnsW'];
    for (let typeIndex=0; typeIndex<types.length;typeIndex++) {
        type = types[typeIndex]
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            if (gamePieces[type][piece].enPassantVulnerable === true && gamePieces[type][piece].enPassantMove === gameState.move-1 && gamePieces[type][piece].enPassantSpot.x === xLoc && gamePieces[type][piece].enPassantSpot.y === yLoc && gamePieces[type][piece].color!=color) {
                return true;
            }
        }
    }
    return false    
}

function castleCheck(color) { // returns direction if possible (left if -1, right is 1), false if not possible, tags rooks that can 
    let kingType,rookType
    let castleDir =[]
    if (color==='white') {
        kingType='kingW'
        rookType='rooksW'
    } else {
        kingType='kingB'
        rookType='rooksB'
    }

    if (gamePieces[kingType][0].hasMoved===true) {
        return false
    }
    let possibleRooks = []
    for (let piece=0; piece<gamePieces[rookType].length;piece++) {
        if (gamePieces[rookType][piece].hasMoved===false) {
            possibleRooks.push(piece)
        } else {
            gamePieces[rookType][piece].canCastle=false
        }
    }
    if (possibleRooks.length<1) {
        return false
    } else {
        let spaces, spaceSign
        for (let rook=0; rook<possibleRooks.length; rook++) {
            spaces=Math.abs(gamePieces[rookType][possibleRooks[rook]].xSquare-gamePieces[kingType][0].xSquare)
            for (let space=1; space<spaces; space++) { // NOT ZERO INDEXED
                spaceSign = Math.sign(gamePieces[rookType][possibleRooks[rook]].xSquare-gamePieces[kingType][0].xSquare)
                if (pieceOnSquare(gamePieces[kingType][0].xSquare+space*spaceSign,gamePieces[kingType][0].ySquare)!=-1) {
                    gamePieces[rookType][possibleRooks[rook]].canCastle=false
                    break;
                } else if (space===spaces-1) {
                    gamePieces[rookType][possibleRooks[rook]].canCastle=true
                    castleDir.push(spaceSign)
                }
            }
        }
    }
    if (castleDir.length<1) {
        return false
    } else {
        return castleDir
    }
}

function inCheck(color,move,xNew,yNew){ // return true if passes color is in Check, otherwise false
    if (gameState.turn!=color) {
        return false
    }
    let possibleMoveList
    let kingMoving= false    
    let kingType = 'king' + color[0].toUpperCase()
    let kingSpotX = gamePieces[kingType][0].xSquare
    let kingSpotY = gamePieces[kingType][0].ySquare
    if (!move) {
        move = {x:gamePieces[kingType][0].xSquare, y:gamePieces[kingType][0].ySquare}
    } else {
        kingMoving= true 
    }

    let deadPieceType
    let deadPieceIndex
    let deadPiece
    let deadPieceHappening=false

    // if a piece is killed in the move by the king, destroy it before checking if possible moves are in check
    // find the soon to be dead piece
    for (const type in gamePieces) { 
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            if ((gamePieces[type][piece].xSquare===move.x && gamePieces[type][piece].ySquare===move.y) && !(type==='kingW'||type==='kingB')) {
                deadPieceIndex = piece
                deadPieceType = type
                deadPieceHappening = true
            }
        }
    }
    
    if (deadPieceHappening){
        deadPiece = gamePieces[deadPieceType].splice(deadPieceIndex,1)
    }

    // Also Move the King Before Checking
    if (kingMoving) {
        gamePieces[kingType][0].xSquare = move.x
        gamePieces[kingType][0].ySquare = move.y
    }

    for (const type in gamePieces) { 
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            if (gamePieces[type][piece].color != color && !(gamePieces[type][piece].xSquare===xNew && gamePieces[type][piece].ySquare===yNew) && !(gamePieces[type][piece].xSquare===move.x && gamePieces[type][piece].ySquare===move.y)) {
                possibleMoveList = gamePieces[type][piece].returnMoves()
                if (checkGridMatch(possibleMoveList,move.x,move.y)) {
                    if (deadPieceHappening) {
                        //place deadPiece back
                        gamePieces[deadPieceType].splice(deadPieceIndex,0,deadPiece[0])
                    }
                    if (kingMoving) {
                        gamePieces[kingType][0].xSquare = kingSpotX
                        gamePieces[kingType][0].ySquare = kingSpotY
                    }
                    return true
                }
            }
        }
    }
    // place dead piece back
    if (deadPieceHappening) {
        gamePieces[deadPieceType].splice(deadPieceIndex,0,deadPiece[0])
    }

    //Move the king back as well
    if (kingMoving) {
        gamePieces[kingType][0].xSquare = kingSpotX
        gamePieces[kingType][0].ySquare = kingSpotY                        
    }
    return false
}

function selfInCheck(color,xLoc,yLoc,xNew,yNew) { // moves piece from location to move location and checks if that puts their own king in check
    // need to get piece reference, change its location to the move location then check if in check, then reassign the pieces location to its original location
    let typeCheck =''
    let pieceCheck = 0
    for (const type in gamePieces) { // gets the reference of the piece whose move we are checking
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            if (gamePieces[type][piece].xSquare === xLoc && gamePieces[type][piece].ySquare === yLoc) {
                typeCheck = type
                pieceCheck = piece
            }
        }
    }
    // move the pieces location to the new location
    gamePieces[typeCheck][pieceCheck].xSquare = xNew
    gamePieces[typeCheck][pieceCheck].ySquare = yNew
    
    // check if in check with new piece location
    let kingType = 'king' + color[0].toUpperCase()
    nowInCheck = inCheck(color, {x:gamePieces[kingType][0].xSquare, y:gamePieces[kingType][0].ySquare}, xNew, yNew)
    // replace gamePiece back to original location
    gamePieces[typeCheck][pieceCheck].xSquare = xLoc
    gamePieces[typeCheck][pieceCheck].ySquare = yLoc

    // return true if inCheck
    return nowInCheck
}

function moveCount(color) {
    // Fetch Total Moves and if there are none return true
    let possibleMoveList
    let moveCount=0
    for (const type in gamePieces) { 
        for (let piece=0; piece<gamePieces[type].length;piece++) {
            if (gamePieces[type][piece].color === color) {
                possibleMoveList = gamePieces[type][piece].returnMoves()
                for (let moveIndex=0; moveIndex<possibleMoveList.x.length; moveIndex++) {
                    if (possibleMoveList.x[moveIndex]>-1 && possibleMoveList.x[moveIndex]<myGameArea.gridWidth && possibleMoveList.y[moveIndex]>-1 && possibleMoveList.y[moveIndex]<myGameArea.gridHeight) {
                        moveCount++
                    }
                }
            }
        }
    }
    return moveCount
}