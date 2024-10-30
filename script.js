document.addEventListener("DOMContentLoaded", () => {
    const gameBoard = document.getElementById("game-board");
    const mineCounter = document.getElementById("mine-counter");
    const timerDisplay = document.getElementById("timer");
    const resetButton = document.getElementById("reset-button");

    let rows = 10;
    let cols = 10;
    let numMines = 10;
    let minePositions = [];
    let revealedCells = 0;
    let remainingFlags = numMines;
    let timer = 0;
    let timerInterval;
    let gameStarted = false;
    let gameOver = false;

    // Configuracion de dificultades
    const difficulties = {
        facil: { rows: 5, cols: 5, mines: 5 },
        medio: { rows: 8, cols: 8, mines: 15 },
        dificil: { rows: 10, cols: 10, mines: 25 },
        muyDificil: { rows: 12, cols: 12, mines: 35 },
        hardcore: { rows: 15, cols: 15, mines: 50 },
        leyenda: { rows: 20, cols: 20, mines: 100 }
    };


    window.startGame = function(difficulty) {
        const config = difficulties[difficulty];
        if (!config) return; 

        initializeBoard(config.rows, config.cols, config.mines);
        document.getElementById("start-screen").style.display = "none";
    };

    
    window.startCustomGame = function() {
        rows = parseInt(document.getElementById("rows-input").value);
        cols = parseInt(document.getElementById("cols-input").value);
        numMines = parseInt(document.getElementById("mines-input").value);

        
        if (rows < 5 || cols < 5) {
            alert("El tamaño mínimo del tablero es 5x5.");
            return;
        }
        if (numMines < 1 || numMines >= rows * cols) {
            alert("El número de minas debe ser al menos 1 y menor que el total de celdas.");
            return;
        }

        initializeBoard(rows, cols, numMines);
        document.getElementById("start-screen").style.display = "none";
    };

    // Función para reiniciar el juego
    window.restartGame = function() {
        const gameOverMessage = document.getElementById("game-over-message");
        gameOverMessage.style.display = "none"; 
        clearInterval(timerInterval);
        document.getElementById("start-screen").style.display = "flex"; 
        initializeBoard(rows, cols, numMines); 
    };

    // Función para inicializar el tablero
    function initializeBoard(boardRows, boardCols, mines, firstClickRow = null, firstClickCol = null) {
        rows = boardRows;
        cols = boardCols;
        numMines = mines;

        gameBoard.innerHTML = ""; 
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 40px)`; 
        gameBoard.style.gridTemplateRows = `repeat(${rows}, 40px)`; 

        mineCounter.textContent = `Minas: ${numMines}`;
        timerDisplay.textContent = `Tiempo: 0`;

        remainingFlags = numMines;
        revealedCells = 0;
        gameStarted = false;
        gameOver = false;
        minePositions = [];

        clearInterval(timerInterval);
        timer = 0;

        placeMines(firstClickRow, firstClickCol); 
        createCells();
    }

    // Función para crear las celdas en el tablero
    function createCells() {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (minePositions.some(pos => pos.row === row && pos.col === col)) {
                    cell.dataset.mine = "true";
                } else {
                    cell.dataset.mine = "false";
                }

                cell.addEventListener("click", (e) => handleCellClick(e, cell));
                cell.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    toggleFlag(cell);
                });

                gameBoard.appendChild(cell);
            }
        }
    }

    function placeMines(initialRow = null, initialCol = null) {
        minePositions = [];
        let minesPlaced = 0;

        while (minesPlaced < numMines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);


            if ((row === initialRow && col === initialCol) || minePositions.some(pos => pos.row === row && pos.col === col)) {
                continue;
            }

            minePositions.push({ row, col });
            minesPlaced++;
        }
    }

    // Función para manejar el clic en una celda
    function handleCellClick(event, cell) {
        if (gameOver || cell.classList.contains("revealed") || cell.textContent === "🚩") return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

       
        if (!gameStarted) {
            startTimer();
            gameStarted = true;

            
            if (cell.dataset.mine === "true") {
                initializeBoard(rows, cols, numMines, row, col); 
                return; 
            }
        }

        // Si la celda contiene una mina, termina el juego
        if (cell.dataset.mine === "true") {
            cell.textContent = "💣";
            cell.classList.add("revealed");
            endGame("lose");
        } else {
            const minesAround = countMinesAround(cell);
            cell.classList.add("revealed");
            cell.textContent = minesAround > 0 ? minesAround : ""; 
            cell.dataset.mines = minesAround; 
            revealedCells++;

            if (revealedCells === rows * cols - numMines) {
                endGame("win");
            }

            if (minesAround === 0) {
                revealAdjacentCells(cell);
            }
        }
    }
    
    function countMinesAround(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        let count = 0;
    
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
    
                const neighbor = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + j}"]`);
                if (neighbor && neighbor.dataset.mine === "true") {
                    count++;
                }
            }
        }
        return count;
    }
    
    // Función para colocar las minas en el tablero
    function placeMines(firstClickRow = null, firstClickCol = null) {
        minePositions = [];
        while (minePositions.length < numMines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
    
            // Si es el primer clic, evitamos colocar una mina en esa posición
            if ((row !== firstClickRow || col !== firstClickCol) &&
                !minePositions.some(pos => pos.row === row && pos.col === col)) {
                minePositions.push({ row, col });
            }
        }
    }

    
    // Función para revelar las celdas adyacentes
    function revealAdjacentCells(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const neighbor = document.querySelector(`.cell[data-row="${row + i}"][data-col="${col + j}"]`);
                if (neighbor && !neighbor.classList.contains("revealed") && neighbor.dataset.mine === "false") {
                    handleCellClick(null, neighbor);
                }
            }
        }
    }

    // Función para iniciar el temporizador
    function startTimer() {
        timerInterval = setInterval(() => {
            timer++;
            timerDisplay.textContent = `Tiempo: ${timer}`;
        }, 1000);
    }

    // Función para terminar el juego
    function endGame(result) {
        clearInterval(timerInterval);
        revealAllMines();
        gameOver = true;
    
        const gameOverMessage = document.getElementById("game-over-message");
        const gameOverText = document.getElementById("game-over-text");
    
        if (result === "win") {
            gameOverText.textContent = "¡Felicidades! Has ganado el juego.";
        } else {
            gameOverText.textContent = "¡Boom! Has pisado una mina. Juego terminado.";
        }
    
        gameOverMessage.style.display = "block"; 
    }
    

    // Función para reiniciar el juego
    resetButton.addEventListener("click", () => {
        clearInterval(timerInterval);
        document.getElementById("start-screen").style.display = "flex"; 
        initializeBoard(rows, cols, numMines); 
    });
    

    // Función para colocar o quitar una bandera
    function toggleFlag(cell) {
        if (gameOver || cell.classList.contains("revealed")) return;

        if (cell.textContent === "🚩") {
            cell.textContent = "";
            remainingFlags++;
        } else if (remainingFlags > 0) {
            cell.textContent = "🚩";
            remainingFlags--;
        }
        mineCounter.textContent = `Minas: ${remainingFlags}`;
    }

    // Función para revelar todas las minas en caso de perder
    function revealAllMines() {
        document.querySelectorAll(".cell").forEach(cell => {
            if (cell.dataset.mine === "true") {
                cell.textContent = "💣";
                cell.classList.add("revealed");
            }
        });
    }
});
