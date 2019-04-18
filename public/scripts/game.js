var config = {
  type: Phaser.CANVAS,
  parent: 'phaser-example',
  width: 1425,
  height: 655,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var game = new Phaser.Game(config);

//https://www.kisspng.com/png-sprite-2d-computer-graphics-orb-sphere-ball-orb-738727/
//https://superdark.itch.io/enchanted-forest-characters
//https://alexs-assets.itch.io/16x16-outdoors-tileset/download/eyJleHBpcmVzIjoxNTU1NTQyMTQzLCJpZCI6MzI3MTE4fQ%3d%3d.awBEMOkXj%2bp0HWxzqWxnpmS%2f2CA%3d
function preload() {
  this.load.image('otherPlayer1', 'assets/doublesword.png');
  this.load.image('otherPlayer2', 'assets/cloakedguy.png');
  this.load.image('otherPlayer3', 'assets/goldenknight.png');
  this.load.image('otherPlayer4', 'assets/shroomman.png');
  this.load.image('character', 'assets/robinhood.png');
  this.load.image('map', 'assets/green.png');
  this.load.image('flowers1', 'assets/flowers1.png');
  this.load.image('flowers2', 'assets/flowers2.png');
  this.load.image('rock1', 'assets/rock1.png');
  this.load.image('rock2', 'assets/rock2.png');
  this.load.image('wood', 'assets/wood.png');
  this.load.image('arrow', 'assets/arrow.png');
}

function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  addMap(self);
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        otherPlayer.setDisplaySize(playerInfo.w,50);
      }
    });
  });
  this.socket.on('shoot', function (playerInfo) {
        shoot(self,playerInfo);
  });
}

function shoot(self,info){
  const arrow = self.physics.add.sprite(info.x, info.y, 'arrow').setOrigin(0.5, 0.5).setDisplaySize(20, 20);
  if (info.w == -60) {
    arrow.setVelocity(-80,0);
  }
  else{
    arrow.setVelocity(80,0);
  }
  arrow.playerId = playerInfo.playerId;
  self.arrows.add(arrow);
}

function update() {
    var velocityX = 3;
    var velocityY = 3;
  if (this.character) {
    var width = this.character.w;
    if (this.cursors.left.isDown) {
      this.character.x = this.character.x - velocityX;
      width = -60;
      this.character.setDisplaySize(-60, 50);
    } else if (this.cursors.right.isDown) {
      this.character.x = this.character.x + velocityX;
      this.character.setDisplaySize(60, 50);
      width = 60;
    } else if (this.cursors.up.isDown) {
      this.character.y = this.character.y - velocityY;
    }
    else if (this.cursors.down.isDown) {
      this.character.y = this.character.y + velocityY;
    }
    else if (this.cursors.space.isDown) {
      //FIRE
      this.arrow = this.physics.add.sprite(this.character.x, this.character.y, 'arrow').setOrigin(0.5, 0.5).setDisplaySize(20, 20);
      if (width == -60) {
        this.arrow.setVelocity(-80,0);
      } else {
        this.arrow.setVelocity(80,0);
      }
      this.socket.emit('arrowShot', { x: this.character.x, y: this.character.y, width: this.character.oldPosition.width });
    }
    this.physics.world.wrap(this.character, 20);
    // emit player movement
    var x = this.character.x;
    var y = this.character.y;
  if (this.character.oldPosition && (x !== this.character.oldPosition.x || y !== this.character.oldPosition.y || width !== this.character.oldPosition.width)) {
    this.character.w = width;
    this.socket.emit('playerMovement', { x: this.character.x, y: this.character.y, width: width });
  }

// save old position data
  this.character.oldPosition = {
    x: this.character.x,
    y: this.character.y,
    width: this.character.w
  };
  }
}

function addMap(self){
  self.background1 = self.physics.add.image(0, 0, 'map').setOrigin(0, 0).setDisplaySize(1425, 655);
  for (var i = 0; i < 20; i++) {
    self.background1 = self.physics.add.image((Math.floor(Math.random() * 1425)), (Math.floor(Math.random() * 655)), 'flowers1').setOrigin(0, 0).setDisplaySize(30, 30);
    self.background2 = self.physics.add.image((Math.floor(Math.random() * 1425)), (Math.floor(Math.random() * 655)), 'flowers2').setOrigin(0, 0).setDisplaySize(30, 30);
    self.background3 = self.physics.add.image((Math.floor(Math.random() * 1425)), (Math.floor(Math.random() * 655)), 'rock1').setOrigin(0, 0).setDisplaySize(20, 20);
    self.background4 = self.physics.add.image((Math.floor(Math.random() * 1425)), (Math.floor(Math.random() * 655)), 'rock2').setOrigin(0, 0).setDisplaySize(20, 20);
    self.background5 = self.physics.add.image((Math.floor(Math.random() * 1425)), (Math.floor(Math.random() * 655)), 'wood').setOrigin(0, 0).setDisplaySize(30, 30);
  }
}

function addPlayer(self, playerInfo) {
  self.character = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'character').setOrigin(0.5, 0.5).setDisplaySize(60, 50);
}

function addOtherPlayers(self, playerInfo) {
  var img = 'otherPlayer' + (Math.floor(Math.random() * 4) + 1);
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, img).setOrigin(0.5, 0.5).setDisplaySize(60, 50);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}
