const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    buildings: [],
    players: [
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 }
    ],
    currentPlayer: 0,
    wind: 0,
    projectile: null
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
    document.querySelectorAll('.gorilla').forEach(el => el.remove());
    gameState.players.forEach((player, index) => {
        const x = index === 0 ? gameState.buildings[0].x + 40 : gameState.buildings[4].x + 40;
        const y = canvas.height - gameState.buildings[index === 0 ? 0 : 4].height;
        
        const gorilla = document.createElement('div');
        gorilla.className = 'gorilla';
        gorilla.style.left = `${x - 20}px`;
        gorilla.style.bottom = `${y}px`;
        document.body.appendChild(gorilla);
        
        gameState.players[index] = { ...gameState.players[index], x, y };
    });
}

function generateWind() {
    gameState.wind = Math.floor(Math.random() * 21) - 10;
    document.getElementById('windSpeed').textContent = gameState.wind;
}

function switchPlayer() {
    gameState.currentPlayer = 1 - gameState.currentPlayer;
    document.getElementById('currentPlayer').textContent = gameState.currentPlayer + 1;
}

function throwProjectile(angle, power) {
    const player = gameState.players[gameState.currentPlayer];
    const projectile = document.createElement('div');
    projectile.id = 'projectile';
    projectile.style.left = `${player.x}px`;
    projectile.style.bottom = `${player.y + 20}px`;
    document.body.appendChild(projectile);

    let t = 0;
    const g = 9.81;
    const radians = angle * Math.PI / 180;

    function updateProjectile() {
        t += 0.1;
        const x = player.x + power * Math.cos(radians) * t + (gameState.wind * t);
        const y = player.y + 20 + (power * Math.sin(radians) * t) - (0.5 * g * t * t);

        projectile.style.left = `${x}px`;
        projectile.style.bottom = `${y}px`;

        if (y < 0 || x < 0 || x > canvas.width) {
            document.body.removeChild(projectile);
            switchPlayer();
        } else if (checkCollision(x, y)) {
            document.body.removeChild(projectile);
            handleHit();
        } else {
            requestAnimationFrame(updateProjectile);
        }
    }

    projectile.style.display = 'block';
    updateProjectile();
}

function checkCollision(x, y) {
    const enemyPlayer = gameState.players[1 - gameState.currentPlayer];
    const dx = x - enemyPlayer.x;
    const dy = y - enemyPlayer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 20; // Assuming the gorilla has a radius of 20px
}

function handleHit() {
    gameState.players[gameState.currentPlayer].score++;
    updateScoreDisplay();
    if (gameState.players[gameState.currentPlayer].score >= 3) {
        endGame();
    } else {
        switchPlayer();
    }
}

function updateScoreDisplay() {
    document.getElementById('score1').textContent = gameState.players[0].score;
    document.getElementById('score2').textContent = gameState.players[1].score;
}

function endGame() {
    const winner = gameState.currentPlayer + 1;
    document.getElementById('winner').textContent = `Player ${winner}`;
    document.getElementById('gameOverModal').style.display = 'block';
}

function updatePlayerInfo() {
    const angle = document.getElementById('angleSlider').value;
    const power = document.getElementById('powerSlider').value;
    document.getElementById(`angle${gameState.currentPlayer + 1}`).textContent = angle;
    document.getElementById(`power${gameState.currentPlayer + 1}`).textContent = power;
}

function initGame() {
    gameState.players.forEach(player => player.score = 0);
    updateScoreDisplay();
    resizeCanvas();
    generateBuildings();
    drawBuildings();
    drawPlayers();
    generateWind();
    switchPlayer();
    document.getElementById('gameOverModal').style.display = 'none';
}

window.addEventListener('resize', () => {
    resizeCanvas();
    drawBuildings();
    drawPlayers();
});

document.getElementById('newGameBtn').addEventListener('click', initGame);
document.getElementById('restartBtn').addEventListener('click', initGame);

document.getElementById('throwBtn').addEventListener('click', () => {
    const angle = parseInt(document.getElementById('angleSlider').value);
    const power = parseInt(document.getElementById('powerSlider').value);
    throwProjectile(angle, power);
});

document.getElementById('angleSlider').addEventListener('input', updatePlayerInfo);
document.getElementById('powerSlider').addEventListener('input', updatePlayerInfo);

initGame();
