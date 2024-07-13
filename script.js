const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    buildings: [],
    players: [
        { x: 0, y: 0 },
        { x: 0, y: 0 }
    ],
    currentPlayer: 0
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function generateBuildings() {
    gameState.buildings = [];
    for (let i = 0; i < 5; i++) {
        gameState.buildings.push({
            x: i * (canvas.width / 5),
            width: 80,
            height: Math.random() * 200 + 100
        });
    }
}

function drawBuildings() {
    ctx.fillStyle = 'gray';
    gameState.buildings.forEach(building => {
        ctx.fillRect(building.x, canvas.height - building.height, building.width, building.height);
    });
}

function drawPlayers() {
    ctx.fillStyle = 'brown';
    gameState.players.forEach((player, index) => {
        const x = index === 0 ? 50 : canvas.width - 50;
        const y = canvas.height - gameState.buildings[index === 0 ? 0 : 4].height;
        ctx.fillRect(x - 15, y - 30, 30, 30);
        gameState.players[index] = { x, y };
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBuildings();
    drawPlayers();
}

function initGame() {
    resizeCanvas();
    generateBuildings();
    draw();
}

window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
});

document.getElementById('newGameBtn').addEventListener('click', initGame);

initGame();
