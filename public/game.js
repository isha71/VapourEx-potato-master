const socket = io();

const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const countdownScreen = document.getElementById('countdown-screen');
const gameScreen = document.getElementById('game-screen');
const battleScreen = document.getElementById('battle-screen');
const resultScreen = document.getElementById('result-screen');

const playBtn = document.getElementById('play-btn');
const countdownElement = document.getElementById('countdown');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const potatoElement = document.getElementById('potato');
const playerPotatoElement = document.getElementById('player-potato');
const opponentPotatoElement = document.getElementById('opponent-potato');
const playerHealthElement = document.getElementById('player-health');
const opponentHealthElement = document.getElementById('opponent-health');
const resultMessageElement = document.getElementById('result-message');
const playAgainBtn = document.getElementById('play-again-btn');

let gameId;
let score = 0;

playBtn.addEventListener('click', () => {
    mainScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
    socket.emit('play');
});

playAgainBtn.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
    socket.emit('play');
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && gameScreen.classList.contains('hidden') === false) {
        socket.emit('tap', gameId);
        score++;
        updateScore();
        growPotato();
    }
});

socket.on('gameStart', (data) => {
    gameId = data.gameId;
    lobbyScreen.classList.add('hidden');
    countdownScreen.classList.remove('hidden');
    startCountdown(5);
});

socket.on('tappingStart', () => {
    countdownScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    startGameTimer(15);
});

socket.on('updateScores', (scores) => {
    score = scores[0]; // Assuming this client is always player 1 for simplicity
    updateScore();
});

socket.on('battleStart', (finalScores) => {
    gameScreen.classList.add('hidden');
    battleScreen.classList.remove('hidden');
    playerPotatoElement.style.transform = `scale(${1 + finalScores[0] / 100})`;
    opponentPotatoElement.style.transform = `scale(${1 + finalScores[1] / 100})`;
});

socket.on('updateHealth', (health) => {
    playerHealthElement.style.width = `${health[0]}%`;
    opponentHealthElement.style.width = `${health[1]}%`;
});

socket.on('gameEnd', (data) => {
    battleScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    resultMessageElement.textContent = data.winner === 0 ? 'You Win!' : 'You Lose!';
});

function startCountdown(seconds) {
    countdownElement.textContent = seconds;
    const countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function startGameTimer(seconds) {
    timerElement.textContent = seconds;
    const timerInterval = setInterval(() => {
        seconds--;
        timerElement.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

function growPotato() {
    const currentSize = parseInt(window.getComputedStyle(potatoElement).width);
    potatoElement.style.width = `${currentSize + 2}px`;
    potatoElement.style.height = `${currentSize + 2}px`;
}

// Add potato collision sound
const collisionSound = new Audio('assets/collision.mp3');

function playCollisionSound() {
    collisionSound.currentTime = 0;
    collisionSound.play();
}

// Call this function when potatoes collide in the battle phase