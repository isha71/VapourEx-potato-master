const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const waitingPlayers = [];
const activeGames = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('play', () => {
    waitingPlayers.push(socket);
    if (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers.shift();
      const player2 = waitingPlayers.shift();
      const gameId = Date.now().toString();
      
      const game = {
        id: gameId,
        players: [player1, player2],
        scores: [0, 0],
        health: [100, 100],
        state: 'countdown'
      };
      
      activeGames.set(gameId, game);
      
      player1.join(gameId);
      player2.join(gameId);
      
      io.to(gameId).emit('gameStart', { gameId });
      
      setTimeout(() => startTappingPhase(gameId), 5000);
    }
  });

  socket.on('tap', (gameId) => {
    const game = activeGames.get(gameId);
    if (game && game.state === 'tapping') {
      const playerIndex = game.players.indexOf(socket);
      if (playerIndex !== -1) {
        game.scores[playerIndex]++;
        io.to(gameId).emit('updateScores', game.scores);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
    }
    
    for (const [gameId, game] of activeGames) {
      const playerIndex = game.players.indexOf(socket);
      if (playerIndex !== -1) {
        endGame(gameId, 1 - playerIndex);
        break;
      }
    }
  });
});

function startTappingPhase(gameId) {
  const game = activeGames.get(gameId);
  if (game) {
    game.state = 'tapping';
    io.to(gameId).emit('tappingStart');
    setTimeout(() => startBattlePhase(gameId), 15000);
  }
}

function startBattlePhase(gameId) {
  const game = activeGames.get(gameId);
  if (game) {
    game.state = 'battle';
    io.to(gameId).emit('battleStart', game.scores);
    simulateBattle(gameId);
  }
}

function simulateBattle(gameId) {
  const game = activeGames.get(gameId);
  if (game) {
    const battleInterval = setInterval(() => {
      game.health[0] -= game.scores[1];
      game.health[1] -= game.scores[0];
      
      io.to(gameId).emit('updateHealth', game.health);
      
      if (game.health[0] <= 0 || game.health[1] <= 0) {
        clearInterval(battleInterval);
        const winner = game.health[0] > game.health[1] ? 0 : 1;
        endGame(gameId, winner);
      }
    }, 1000);
  }
}

function endGame(gameId, winner) {
  const game = activeGames.get(gameId);
  if (game) {
    io.to(gameId).emit('gameEnd', { winner });
    game.players.forEach(player => player.leave(gameId));
    activeGames.delete(gameId);
  }
}

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});