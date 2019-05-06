var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shootinggame-513ff.firebaseio.com/"
});

var db = admin.database();
var ref = db.ref("Users");
function addUser(username,pass){
  ref.update({
    [username]: {
      password: pass,
      score:  0
    }
  });
}
function updateScore(usr,sc){
  console.log(usr.trim() + " with score "+sc);
  db.ref("Users/"+ usr.trim()).update({ score: sc });
}
var ejs = require('ejs');
var bodyParser = require('body-parser');
const request=require('request');

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

var players = {};
var arrows = {};

//app.use(express.static(__dirname));
app.use(express.static('assets'));

app.get('/', function (req, res) {
  res.render('index.ejs',{signupmsg:null, loginmsg:null});
});

app.get('/login', function (req, res) {
	res.render('index.ejs',{signupmsg:null, loginmsg:null});
})
var currentUser;
var score;

app.post('/login', function (req, res) {
	let username = req.body.usr;
	let password = req.body.psw;
  ref.once("value",function(snapshot){
    var database = snapshot.val();
    if (typeof database[username] == "undefined") {
      res.render('index.ejs',{signupmsg:null, loginmsg: "Username does not exist"});
      return;
    }
    else if(database[username].password != password){
      res.render('index.ejs',{signupmsg:null, loginmsg: "Password or username is incorrect"});
      return;
    }
    else if(database[username].password == password){
      currentUser = username;
      score = database[username].score;
      res.redirect('/game');
    }
  })
})

app.post('/', function (req, res) {
	let username = req.body.usr;
	let password = req.body.psw;
  let repeatedPassword = req.body.psw2;
  if (password !== repeatedPassword) {
    res.render('index.ejs',{signupmsg:"Passwords do not match", loginmsg: null});
    return;
  }
  ref.once("value",function(snapshot){
    var database = snapshot.val();
    console.log("DATABASE IS");
    console.log(database);
    if (database != null && typeof database[username] != 'undefined') {
      res.render('index.ejs',{signupmsg:"Username exists", loginmsg: null});
      return;
    }
    else{
      addUser(username,password);
      res.render('index.ejs',{signupmsg:"Account succesfully created. Please Login", loginmsg: null});
    }
  })
})

app.get('/game*', function (req, res) {
  if (typeof(currentUser) == undefined || currentUser == null) {
    res.render('index.ejs',{signupmsg:null, loginmsg:"Please login first"});
  }
  else{
    res.render('game.ejs',{user:currentUser,score: score});
  }
});

io.on('connection', function (socket) {
  console.log('a user connected');
  // create a new player and add it to our players object
  arrows[socket.id] = {
    x: 0,
    y: 0,
    w: 60,
    id: socket.id
  };

  players[socket.id] = {
    w: 60,
    x: Math.floor(Math.random() * 400) + 150,
    y: Math.floor(Math.random() * 300) + 150,
    playerId: socket.id,
    username: currentUser,
    health: 3,
    map: 1
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players,players[socket.id].map);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  socket.on('reborn', function () {
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });
  socket.on('reward', function (score) {
    updateScore(players[socket.id].username,score);
  });
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
    arrows[socket.id].rat = movementData.rat;
    arrows[socket.id].id = movementData.id;
    arrows[socket.id].map = movementData.map;
    socket.broadcast.emit('shoot', arrows[socket.id]);
  });
  socket.on('destroyArrow', function (id) {
    socket.broadcast.emit('discardArrow', id);
  });
  socket.on('playerHit', function (info) {
    socket.broadcast.emit('playerLostHealth', info);
  });
  socket.on('changeMap', function (info) {
    io.emit('disconnect', socket.id);
    console.log("CHANGING MAP");
    players[socket.id] = {
      w: 60,
      x: Math.floor(Math.random() * 400) + 150,
      y: Math.floor(Math.random() * 300) + 150,
      playerId: socket.id,
      username: players[socket.id].username,
      health: 3,
      map: info.map
    };
    socket.emit('loadMap',players[socket.id]);
    socket.emit('currentPlayers', players,players[socket.id].map);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });
  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].w = movementData.width;
    players[socket.id].rat = movementData.rat;
    players[socket.id].health = movementData.health;
    players[socket.id].username = movementData.username;
    players[socket.id].shield = movementData.shield;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
});

server.listen(8000, function () {
  console.log(`Listening on ${server.address().port}`);
});
