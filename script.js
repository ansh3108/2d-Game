let state = {};

let dragging = false;
let startX, startY;

let lastTimestamp;
let animFrameID, timeoutID;

let simMode = false;
let simImpact = {};

const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const settings = {
  players: 1,
  mode: darkModeQuery.matches ? "dark" : "light",
};

const blastRadius = 18;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
const ctx = canvas.getContext("2d");

const windmillElem = document.getElementById("windmill");
const windmillHeadElem = document.getElementById("windmill-head");
const windElem = document.getElementById("wind-info");
const windSpeedElem = document.getElementById("wind-speed");
const infoLeftElem = document.getElementById("info-left");
const nameLeftElem = document.querySelector("#info-left .name");
const angleLeftElem = document.querySelector("#info-left .angle");
const velocityLeftElem = document.querySelector("#info-left .velocity");

const infoRightElem = document.getElementById("info-right");
const nameRightElem = document.querySelector("#info-right .name");
const angleRightElem = document.querySelector("#info-right .angle");
const velocityRightElem = document.querySelector("#info-right .velocity");

const instructionsElem = document.getElementById("instructions");
const gameModeElem = document.getElementById("game-mode");

const bombAreaElem = document.getElementById("bomb-grab-area");

const congratsElem = document.getElementById("congratulations");
const winnerElem = document.getElementById("winner");

const settingsElem = document.getElementById("settings");
const singlePlayerButtons = document.querySelectorAll(".single-player");
const twoPlayerButtons = document.querySelectorAll(".two-players");
const autoPlayButtons = document.querySelectorAll(".auto-play");
const colorModeButton = document.getElementById("color-mode");

colorModeButton.addEventListener("click", () => {
  settings.mode = settings.mode === "dark" ? "light" : "dark";
  colorModeButton.innerText = settings.mode === "dark" ? "Light Mode" : "Dark Mode";
  render();
});

darkModeQuery.addEventListener("change", (e) => {
  settings.mode = e.matches ? "dark" : "light";
  colorModeButton.innerText = settings.mode === "dark" ? "Light Mode" : "Dark Mode";
  render();
});

startNewGame();

function startNewGame() {
  state = {
    phase: "aiming",
    player: 1,
    round: 1,
    wind: getRandomWindSpeed(),
    bomb: {
      x: undefined,
      y: undefined,
      rotation: 0,
      velocity: { x: 0, y: 0 },
      highlight: true,
    },
    bgBuildings: [],
    buildings: [],
    holes: [],
    stars: [],
    scale: 1,
    shift: 0,
  };

  for (let i = 0; i < (window.innerWidth * window.innerHeight) / 12000; i++) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    state.stars.push({ x, y });
  }

  for (let i = 0; i < 17; i++) {
    createBgBuilding(i);
  }

  for (let i = 0; i < 8; i++) {
    createBuilding(i);
  }

  setScaleAndShift();
  setupBombPosition();
  setupWindmillPosition();
  rotateWindmill();

  cancelAnimationFrame(animFrameID);
  clearTimeout(timeoutID);

  if (settings.players > 0) {
    showInstructions();
  } else {
    hideInstructions();
  }
  hideCongrats();
  angleLeftElem.innerText = 0;
  velocityLeftElem.innerText = 0;
  angleRightElem.innerText = 0;
  velocityRightElem.innerText = 0;

  simMode = false;
  simImpact = {};

  render();

  if (settings.players === 0) {
    autoThrow();
  }
}

function showInstructions() {
  singlePlayerButtons[0].checked = true;
  instructionsElem.style.opacity = 1;
  instructionsElem.style.visibility = "visible";
}

function hideInstructions() {
  state.bomb.highlight = false;
  instructionsElem.style.opacity = 0;
  instructionsElem.style.visibility = "hidden";
}

function showCongrats() {
  congratsElem.style.opacity = 1;
  congratsElem.style.visibility = "visible";
}

function hideCongrats() {
  congratsElem.style.opacity = 0;
  congratsElem.style.visibility = "hidden";
}

function createBgBuilding(index) {
  const prevBuilding = state.bgBuildings[index - 1];

  const x = prevBuilding
    ? prevBuilding.x + prevBuilding.width + 4
    : -300;

  const minWidth = 60;
  const maxWidth = 110;
  const width = minWidth + Math.random() * (maxWidth - minWidth);

  const small = index < 4 || index >= 13;

  const minHeight = 80;
  const maxHeight = 350;
  const smallMinHeight = 20;
  const smallMaxHeight = 150;
  const height = small
    ? smallMinHeight + Math.random() * (smallMaxHeight - smallMinHeight)
    : minHeight + Math.random() * (maxHeight - minHeight);

  state.bgBuildings.push({ x, width, height });
}

function createBuilding(index) {
  const prevBuilding = state.buildings[index - 1];

  const x = prevBuilding
    ? prevBuilding.x + prevBuilding.width + 4
    : 0;

  const minWidth = 80;
  const maxWidth = 130;
  const width = minWidth + Math.random() * (maxWidth - minWidth);

  const small = index <= 1 || index >= 6;

  const minHeight = 40;
  const maxHeight = 300;
  const minHeightGorilla = 30;
  const maxHeightGorilla = 150;

  const height = small
    ? minHeightGorilla + Math.random() * (maxHeightGorilla - minHeightGorilla)
    : minHeight + Math.random() * (maxHeight - minHeight);

  const lights = [];
  for (let i = 0; i < 50; i++) {
    const light = Math.random() <= 0.33;
    lights.push(light);
  }

  state.buildings.push({ x, width, height, lights });
}

function setScaleAndShift() {
  const lastBuilding = state.buildings.at(-1);
  const cityWidth = lastBuilding.x + lastBuilding.width;

  const horizScale = window.innerWidth / cityWidth;
  const vertScale = window.innerHeight / 500;

  state.scale = Math.min(horizScale, vertScale);

  const shiftRequired = horizScale > vertScale;

  state.shift = shiftRequired
    ? (window.innerWidth - cityWidth * state.scale) / 2
    : 0;
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  setScaleAndShift();
  setupBombPosition();
  setupWindmillPosition();
  render();
});

function setupBombPosition() {
  const building = state.player === 1 ? state.buildings[1] : state.buildings.at(-2);

  const gorillaX = building.x + building.width / 2;
  const gorillaY = building.height;

  const handOffsetX = state.player === 1 ? -28 : 28;
  const handOffsetY = 107;

  state.bomb.x = gorillaX + handOffsetX;
  state.bomb.y = gorillaY + handOffsetY;
  state.bomb.velocity.x = 0;
  state.bomb.velocity.y = 0;
  state.bomb.rotation = 0;

  const areaRadius = 15;
  const left = state.bomb.x * state.scale + state.shift - areaRadius;
  const bottom = state.bomb.y * state.scale - areaRadius;

  bombAreaElem.style.left = `${left}px`;
  bombAreaElem.style.bottom = `${bottom}px`;
}

function setupWindmillPosition() {
  const lastBuilding = state.buildings.at(-1);
  let rooftopY = lastBuilding.height * state.scale;
  let rooftopX =
    (lastBuilding.x + lastBuilding.width / 2) * state.scale + state.shift;

  windmillElem.style.bottom = `${rooftopY}px`;
  windmillElem.style.left = `${rooftopX - 100}px`;

  windmillElem.style.scale = state.scale;

  windElem.style.bottom = `${rooftopY}px`;
  windElem.style.left = `${rooftopX - 50}px`;
}

function render() {
  ctx.save();

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  drawSky();

  ctx.translate(0, window.innerHeight);
  ctx.scale(1, -1);

  ctx.translate(state.shift, 0);
  ctx.scale(state.scale, state.scale);

  drawStars();
  drawBackground();
  drawBuildings();
  drawHoles();

  drawGorillas();
  drawBomb();
  drawUI();

  ctx.restore();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);

  if (settings.mode === "dark") {
    gradient.addColorStop(0, "rgb(5,  5, 30)");
    gradient.addColorStop(1, "rgb(40, 5, 45)");
  } else {
    gradient.addColorStop(0, "rgb(5, 120, 210)");
    gradient.addColorStop(1, "rgb(40, 170, 225)");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawStars() {
  if (settings.mode === "dark") {
    state.stars.forEach((star) => {
      ctx.fillStyle = "white";
      ctx.fillRect(star.x, star.y, 1, 1);
    });
  }
}

function drawBackground() {
  state.bgBuildings.forEach((building) => {
    ctx.fillStyle =
      settings.mode === "dark"
        ? "rgb(120, 120, 120)"
        : "rgb(140, 140, 140)";
    ctx.fillRect(building.x, 0, building.width, building.height);
  });
}

function drawBuildings() {
  state.buildings.forEach((building) => {
    ctx.fillStyle =
      settings.mode === "dark" ? "rgb(50, 50, 50)" : "rgb(100, 100, 100)";
    ctx.fillRect(building.x, 0, building.width, building.height);

    ctx.fillStyle = "yellow";

    for (let i = 0; i < 50; i++) {
      if (building.lights[i]) {
        const x =
          building.x +
          4 +
          Math.floor(i % 5) * (building.width / 5);
        const y =
          8 +
          Math.floor(i / 5) * (building.height / 10);
        ctx.fillRect(x, y, 4, 4);
      }
    }
  });
}

function drawHoles() {
  state.holes.forEach((hole) => {
    ctx.strokeStyle =
      settings.mode === "dark"
        ? "rgba(100, 0, 150, 0.9)"
        : "rgba(255, 0, 0, 0.9)";
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawGorillas() {
  ctx.fillStyle = settings.mode === "dark" ? "red" : "red";
  ctx.fillRect(
    state.buildings[1].x + state.buildings[1].width / 2 - 30,
    state.buildings[1].height,
    30,
    100
  );

  if (settings.players === 2) {
    ctx.fillStyle = settings.mode === "dark" ? "blue" : "blue";
    ctx.fillRect(
      state.buildings[state.buildings.length - 2].x +
        state.buildings[state.buildings.length - 2].width / 2 -
        30,
      state.buildings[state.buildings.length - 2].height,
      30,
      100
    );
  }
}

function drawBomb() {
  ctx.fillStyle = state.bomb.highlight ? "red" : "black";
  ctx.beginPath();
  ctx.arc(
    state.bomb.x,
    state.bomb.y,
    10,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawUI() {
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillText(
    `Player: ${state.player} | Angle: ${Math.round(
      state.bomb.angle
    )} | Velocity: ${Math.round(state.bomb.velocity)}`,
    10,
    10
  );
}

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
});

canvas.addEventListener("mousemove", (e) => {
  if (dragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    state.bomb.velocity.x = dx;
    state.bomb.velocity.y = -dy;
  }
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
  state.phase = "firing";

  if (settings.players === 0) {
    simMode = true;
    simImpact = { x: state.bomb.x, y: state.bomb.y };
  }

  lastTimestamp = undefined;
  animFrameID = requestAnimationFrame(update);
});

function autoThrow() {
  state.bomb.velocity.x = Math.random() * 20 + 20;
  state.bomb.velocity.y = Math.random() * 20 + 20;

  lastTimestamp = undefined;
  animFrameID = requestAnimationFrame(update);
}

function update(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  state.bomb.velocity.y -= 10 * deltaTime;

  state.bomb.x += state.bomb.velocity.x * deltaTime;
  state.bomb.y += state.bomb.velocity.y * deltaTime;

  state.bomb.rotation += 2 * Math.PI * deltaTime;

  if (state.bomb.y <= 0) {
    createHole();
    nextTurn();
    return;
  }

  if (
    state.bomb.x < 0 ||
    state.bomb.x > window.innerWidth / state.scale
  ) {
    createHole();
    nextTurn();
    return;
  }

  animFrameID = requestAnimationFrame(update);
  render();
}

function createHole() {
  const holeX = state.bomb.x;
  const holeY = state.bomb.y;
  const holeRadius = blastRadius;

  state.holes.push({ x: holeX, y: holeY, radius: holeRadius });

  checkForWinner();
}

function nextTurn() {
  state.phase = "aiming";
  state.player = state.player === 1 ? 2 : 1;

  setupBombPosition();
  render();

  if (settings.players === 0) {
    autoThrow();
  }
}

function checkForWinner() {
  const leftGorilla = state.buildings[1];
  const rightGorilla = state.buildings[state.buildings.length - 2];

  const leftGorillaHit =
    state.bomb.x > leftGorilla.x &&
    state.bomb.x < leftGorilla.x + leftGorilla.width &&
    state.bomb.y < leftGorilla.height + 100;

  const rightGorillaHit =
    state.bomb.x > rightGorilla.x &&
    state.bomb.x < rightGorilla.x + rightGorilla.width &&
    state.bomb.y < rightGorilla.height + 100;

  if (leftGorillaHit || rightGorillaHit) {
    showCongrats();
    winnerElem.innerText = leftGorillaHit ? "Player 2 Wins!" : "Player 1 Wins!";
    return;
  }

  nextTurn();
}

function getRandomWindSpeed() {
  const windSpeed = (Math.random() - 0.5) * 10;
  windSpeedElem.innerText = windSpeed.toFixed(1);
  return windSpeed;
}

function rotateWindmill() {
  windmillHeadElem.style.transform = `rotate(${
    state.wind * 10
  }deg)`;

  setTimeout(rotateWindmill, 100);
}
