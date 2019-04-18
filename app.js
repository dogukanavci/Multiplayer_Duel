var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};
var arrows = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  // create a new player and add it to our players object
  arrows[socket.id] = {
    x: 0,
    y: 0,
    w: 60,
    playerId: socket.id
  };

  players[socket.id] = {
    w: 60,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });
  socket.on('arrowShot', function (movementData) {
    arrows[socket.id].x = movementData.x;
    arrows[socket.id].y = movementData.y;
    arrows[socket.id].w = movementData.width;
    socket.broadcast.emit('shoot', arrows[socket.id]);
  });
  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].w = movementData.width;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
