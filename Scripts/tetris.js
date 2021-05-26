const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

// width = 500, height = 600
const width = canvas.width;
const height = canvas.height;
const scale = 25;
const arena_cols = width/scale;
const arena_rows = height/scale;

context.scale(scale, scale);

const arena = createMatrix(arena_cols, arena_rows);

const player = {
    position : {x : ((Math.floor(arena_cols/2)) - 1), y : 0},
    matrix : null,
    color: null,
    score : 0,
}

const colors = [
    "#E8E857",
    "#83FF91",
    "#00B6E8",
    "#FF00FB",
    "#FF0600",
    "#FA9623",
    "#047FD6",
]

const tetris_theme = new Audio("../tetris-theme.mp3");
window.onload = tetris_theme.play();

tetris_theme.addEventListener("ended", () => {
    tetris_theme.play();
})

function drawMatrix(Matrix, offset) {
    Matrix.forEach((row, j) => {
        row.forEach((value, i) => {
            context.fillStyle = colors[value-1];
            if (value !== 0)
                context.fillRect(i + offset.x, j + offset.y, 1, 1);
        });
    });
}

// Creates matrix with all terms initialized to zero
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case "T":
            return ([
                [0, 0, 0],
                [0, 1, 0],
                [1, 1, 1],
            ]);
        case "O":
            return ([
                [2, 2],
                [2, 2],
            ]);
        case "I":
            return ([
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 0],
            ]);
        case "S":
            return ([
                [0, 0, 0],
                [0, 4, 4],
                [4, 4, 0],
            ]);
        case "Z":
            return ([
                [0, 0, 0],
                [5, 5, 0],
                [0, 5, 5],
            ]);
        case "L":
            return ([
                [0, 6, 0],
                [0, 6, 0],
                [0, 6, 6],
            ]);
        case "J":
            return ([
                [0, 7, 0],
                [0, 7, 0],
                [7, 7, 0],
            ]);
    }
}

function didCollideXAxis(arena, player) {
    const mat = player.matrix;
    const offset = player.position;

    for (let row = 0; row < mat.length; ++row) {
        for (let col = 0; col < mat[row].length; ++col) {
            const value = mat[row][col];
            if (value !== 0) {
                // Check Left and Right Sides
                if ((col + offset.x < 0) || (col + offset.x > arena_cols-1))
                    return true;
                // Check if space is free in arena
                if (arena[row + offset.y][col + offset.x] !== 0)
                    return true;
            }
        }
    }
}

function didCollideYAxis(arena, player) {
    const mat = player.matrix;
    const offset = player.position;

    for (let row = 0; row < mat.length; ++row) {
        for (let col = 0; col < mat[row].length; ++col) {
            const value = mat[row][col];
            if (value !== 0) {
                // Check Bottom
                if (row + offset.y + 1 > arena_rows-1)
                    return true;
                // Check if space is free in arena
                if (arena[row + offset.y + 1][col + offset.x] !== 0)
                    return true;
            }
        }
    }

    return false;
}

// Merges the player into his position in arena
function merge(arena, player) {
    player.matrix.forEach((row, j) => {
        row.forEach((value, i) => {
            if (value !== 0)
                arena[j + player.position.y][i + player.position.x] = value;
        })
    })
}

function rotateMatrix(matrix) {
    // rotation = transpose + reverse
    // transpose
    for (let j = 0; j < matrix.length; ++j) {
        for (let i = 0; i < j; ++i) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
    }

    matrix.forEach(row => row.reverse());

    if (didCollideXAxis(arena, player)) {
        shiftMatrixRight(player);
        if (didCollideXAxis(arena, player)) {
            shiftMatrixLeft(player);
            shiftMatrixLeft(player);
        }
    }
}

let row_counter = 0;
let drop_interval = 500;
function arenaSweep() {
    for (let j = arena.length-1; j >= 0; --j) {
        const row = arena[j];
        for (let i = 0; i < row.length; ++i) {
            if (arena[j][i] === 0) {
                break;
            }
            if (i === arena[j].length-1) {
                row_counter++;
                arena.splice(j, 1);
                const row = new Array(i+1).fill(0);
                arena.unshift(row);
                j++;
                player.score += 10*Math.floor(row_counter/5 + 1);
                if (drop_interval !== 100)
                    drop_interval = 500-100*Math.floor(row_counter/5);
            }
        }
    }
}

function draw() {
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    drawMatrix(arena, {x: 0, y: 0})
    drawMatrix(player.matrix, player.position);
}

function dropMatrix(player) {
    if (!didCollideYAxis(arena, player))
        player.position.y++;
    else {
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
}

function playerReset() {
    const pieces = "TILJOSZ";
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.color = colors[Math.floor(Math.random() * colors.length)];
    player.position.y = 0;
    player.position.x = ((Math.floor(arena_cols/2)) - 1);
    // Player Lost
    if (didCollideYAxis(arena, player)) {
        player.score = 0;
        arena.forEach(row => row.fill(0));
    }
}

let last_time = 0;
let time_counter = 0;
function update(time = 0) {

    draw();

    const time_diff = time - last_time;
    last_time = time;

    if (time_counter > drop_interval) {
        dropMatrix(player)
        time_counter = 0;
        updateScore();
    }
    time_counter += time_diff;

    requestAnimationFrame(update);
}

function shiftMatrixLeft(player) {
    player.position.x--;
    if (didCollideXAxis(arena, player) || player.position.y === (arena_rows-player.matrix.length))
        player.position.x++;
}

function shiftMatrixRight(player) {
    player.position.x++;
    if (didCollideXAxis(arena, player) || player.position.y === (arena_rows-player.matrix.length))
        player.position.x--;
}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft")
        shiftMatrixLeft(player);
    if (event.key === "ArrowRight")
        shiftMatrixRight(player);
    if (event.key === "ArrowDown")
        dropMatrix(player);
    if (event.key === "Enter" || event.key === "ArrowUp")
        rotateMatrix(player.matrix);
})

function updateScore() {
    document.getElementById("score").innerText = player.score;
}

playerReset();
update();
updateScore();