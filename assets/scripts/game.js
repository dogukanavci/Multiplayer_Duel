var screenWidth = window.innerWidth;//1425
//var screenHeight = window.innerHeight*0.8;//655
var screenRatio = screenWidth / 1425;
var screenHeight = screenRatio * 655;
var arrowLimit = 20;
var gameOver = 0;
var config = {
  type: Phaser.CANVAS,
  parent: 'phaser-example',
  width: screenWidth,
  height: screenHeight,
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
//soundbible.com/tags-gun.html
//https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Impact.ImpactSprite.html
//https://www.kisspng.com/png-sprite-2d-computer-graphics-orb-sphere-ball-orb-738727/
//https://superdark.itch.io/enchanted-forest-characters
//https://alexs-assets.itch.io/16x16-outdoors-tileset/download/eyJleHBpcmVzIjoxNTU1NTQyMTQzLCJpZCI6MzI3MTE4fQ%3d%3d.awBEMOkXj%2bp0HWxzqWxnpmS%2f2CA%3d
function preload() {
  this.load.image('otherPlayer1', '/doublesword.png');
  this.load.image('otherPlayer2', '/orc.png');
  this.load.image('otherPlayer3', '/goldenknight.png');
  this.load.image('otherPlayer4', '/shroomman.png');
  this.load.image('character', '/robinhood.png');
  this.load.image('map', '/green.png');
  this.load.image('blue', '/blue.png');
  this.load.image('flowers1', '/flowers1.png');
  this.load.image('flowers2', '/flowers2.png');
  this.load.image('rock1', '/rock1.png');
  this.load.image('rock2', '/rock2.png');
  this.load.image('wood', '/wood.png');
  this.load.image('arrow1', '/arrow1.png');
  this.load.image('arrow2', '/arrow2.png');
  this.load.image('arrow3', '/arrow3.png');
}
window.addEventListener('resize', function(event){
  console.log("resized");
});

function create() {
  var self = this;
  console.log(this);
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.arrows = this.physics.add.group();
  addMap(self);
  this.socket.on('currentPlayers', function (players,map) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        if (players[id].map == map) {
            addOtherPlayers(self, players[id]);
        }
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    playerInfo.rat = screenRatio;
    if (playerInfo.map == self.character.map) {
      addOtherPlayers(self, playerInfo);
    }
  });
  this.socket.on('loadMap', function (playerInfo) {
    switch (playerInfo.map) {
      case 1:
 addMap(self);
        break;
      case 2:
addMap2(self);
        break;
      default:
  addMap(self);
        break;
    }
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
        otherPlayer.healthbar.destroy();
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        var betweenRatio = (screenRatio / playerInfo.rat);
        otherPlayer.setPosition(playerInfo.x * betweenRatio, playerInfo.y * betweenRatio);
        otherPlayer.setDisplaySize(playerInfo.w*screenRatio,50*screenRatio);
        otherPlayer.rat = playerInfo.rat;
        otherPlayer.healthbar.x = otherPlayer.x - 20;
        otherPlayer.healthbar.y = otherPlayer.y - 20;
        otherPlayer.shield.visible = playerInfo.shield;
        otherPlayer.shield.x = otherPlayer.x;
        otherPlayer.shield.y = otherPlayer.y;
        if (playerInfo.health == 0) {
          otherPlayer.healthbar.destroy();
          otherPlayer.destroy();
        }
        else{
          otherPlayer.healthbar.setText(otherPlayer.username + playerInfo.health);
        }
      }
    });
  });
  this.socket.on('playerLostHealth', function (info) {
    if (self.socket.id == info.playerId) {
      console.log("You got shot");
      var random = Math.floor(Math.random() * 7) + 1 ;
      var audio = new Audio('/wound'+ random +'.mp3');
      if (self.character.health != 1) {
        audio.play();
      }
      self.character.health--;
      if (self.character.health === 0) {
        gameOver=1;
        random = Math.floor(Math.random() * (4) + 1);
        console.log("Random is "+random);
        audio = new Audio('/dead'+ random +'.mp3');
        audio.play();
      }
    }
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      //console.log(info.playerId + " vs "+ otherPlayer.playerId);
      if (info.playerId == otherPlayer.playerId) {
        console.log("PLAYER GOT HIT");
        otherPlayer.health--;
      }
    });
  });
  this.socket.on('shoot', function (playerInfo) {
    console.log("shooting at " + playerInfo.map);
    console.log(self.character.map);
    if (playerInfo.map == self.character.map) {
      shoot(self,playerInfo);
    }
  });
  this.socket.on('discardArrow', function (id) {
        self.arrows.getChildren().forEach(function (arrow) {
          if (arrow.id == id.id) {
            console.log("Arrow to discard found");
            arrow.destroy();
          }
        });
  });
}
function shoot(self,info){
  var betweenRatio = (screenRatio / info.rat);
  var arrow = self.physics.add.sprite(info.x * betweenRatio, info.y * betweenRatio, 'arrow2').setOrigin(0.5, 0.5).setDisplaySize(20*screenRatio, 20*screenRatio);
  arrow.id = info.id;
  self.arrows.add(arrow);
  arrow.setVelocity(120 * betweenRatio * (info.w / 60),0);
}

function removeOutArrows(self){
  self.arrows.getChildren().forEach(function (arrow) {
    if (arrow.x > screenWidth || arrow.x < 0) {
      console.log("OUT OF ARROW");
      arrow.destroy();
      self.socket.emit('destroyArrow',{id: arrow.id});
    }
  });
}
function rangeCmp(a,b,range){
  if(a + range > b && a - range < b){
    return true;
  }
  else {
    return false;
  }
}
function checkHits(self){
  self.arrows.getChildren().forEach(function (arrow) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (rangeCmp(arrow.x,otherPlayer.x,10) && rangeCmp(arrow.y,otherPlayer.y,10) &&  !arrow.id.includes(otherPlayer.playerId) && otherPlayer.shield.visible==false) {
        arrow.destroy();
        self.socket.emit('destroyArrow',{id: arrow.id});
        self.socket.emit('playerHit',{playerId: otherPlayer.playerId});
        if (arrow.id.includes(self.socket.id)) {
          score++;
          self.socket.emit('reward',score);
        }
      }
    });
  });
}

var arrowId = 0;
var shieldTimer = 300;
function update() {
    var velocityX = 3 * screenRatio;
    var velocityY = 3 * screenRatio;
    removeOutArrows(this);
    checkHits(this);
    arrowLimit--;
  if (this.character) {
    var width = this.character.w;
    if (this.cursors.left.isDown) {
      this.character.x = Math.abs( (this.character.x - velocityX)%screenWidth );
      width = -60;
      this.character.setDisplaySize(-60*screenRatio, 50*screenRatio);
    } else if (this.cursors.right.isDown) {
      this.character.x = Math.min (this.character.x + velocityX ,screenWidth - 5);
      this.character.setDisplaySize(60*screenRatio, 50*screenRatio);
      width = 60;
    } else if (this.cursors.up.isDown) {
      this.character.y = Math.abs( (this.character.y - velocityY)%screenHeight );
    }
    else if (this.cursors.down.isDown) {
      this.character.y = Math.min( (this.character.y + velocityY), screenHeight - 5);
    }
    if (this.cursors.shift.isUp) {
      this.shield.visible = false;
      shieldTimer = Math.min(shieldTimer + 1,300);
    }
    if (this.cursors.shift.isDown) {
      if (shieldTimer == 0) {
        var audio = new Audio('/shieldbreak.mp3');
        audio.play();
      }
      if (shieldTimer < 0) {
        this.shield.visible = false;
      }
      else{
        shieldTimer--;
        this.shield.visible = true;
      }
    }
    else if (this.cursors.space.isDown) {
      //FIRE
      if (arrowLimit < 0) {
          console.log("FIRE");
          this.arrow = this.physics.add.sprite(this.character.x, this.character.y, 'arrow1').setOrigin(0.5, 0.5).setDisplaySize(20*screenRatio, 20*screenRatio);
          this.arrow.id = this.socket.id + arrowId;
          arrowId++;
          this.arrows.add(this.arrow);
          this.arrow.setVelocity(100 * (width / 60),0);
          var audio = new Audio('/shot.mp3');
          audio.play();
          arrowLimit = 20;
          this.socket.emit('arrowShot', { x: this.character.x, y: this.character.y, width: this.character.oldPosition.width,rat:screenRatio,id: this.arrow.id,map: this.character.map });
      }
    }
    this.physics.world.wrap(this.character, 20);
    // emit player movement
    var x = this.character.x;
    var y = this.character.y;
    this.healthbar.x = x - 20;
    this.healthbar.y = y - 20;
    this.healthbar.setText(currentUser + this.character.health);
    this.shield.x = x;
    this.shield.y = y;
    if (rangeCmp(this.gate.x,x,20) && rangeCmp(this.gate.y,y,20)) {
      console.log("WANNA GO TO OTHER MAP");
      this.character.destroy();
      this.healthbar.destroy();
      this.background1.destroy();
      for (var i = 0; i < 20; i++) {
      this.background2[i].destroy();
      this.background3[i].destroy();
      this.background4[i].destroy();
      this.background5[i].destroy();
      this.background6[i].destroy();
      }
      this.otherPlayers.getChildren().forEach(function (otherPlayer) {
        otherPlayer.destroy();
      });
      this.socket.emit('changeMap', { map: this.gate.destination});
    }
  if (this.character.oldPosition && (x !== this.character.oldPosition.x || y !== this.character.oldPosition.y || width !== this.character.oldPosition.width || this.character.health !==this.character.oldPosition.health || this.shield.visible !== this.character.oldPosition.shield)) {
    this.character.w = width;
    this.socket.emit('playerMovement', { x: this.character.x, y: this.character.y, width: width,rat:screenRatio,health:this.character.health,username: currentUser,shield:this.shield.visible });
    if (gameOver) {
      this.character.destroy();
      this.healthbar.destroy();
      if (confirm("Would you like to reborn and continue?")) {
          reborn(this);
        } else {
          window.location.href = "http://localhost:8000";
        }
    }
  }

function reborn(self){
  self.character = self.physics.add.sprite(60, 80, 'character').setOrigin(0.5, 0.5).setDisplaySize(60*screenRatio, 50*screenRatio);
  self.healthbar = self.add.text(300, 10, currentUser, { fontSize: '12px', fill: '#FF0000' });
  self.shield = self.physics.add.sprite(4000, 10, 'arrow3').setOrigin(0.5, 0.5).setDisplaySize(80*screenRatio, 80*screenRatio);
  self.character.health = 3;
  self.character.username = currentUser;
  self.character.setPosition(Math.floor(Math.random() * 300) + 150,Math.floor(Math.random() * 300) + 150);
  self.socket.emit('playerMovement', { x: self.character.x, y: self.character.y, width: width,rat:screenRatio,health:self.character.health,username: currentUser,shield:self.shield.visible });
  gameOver = 0;
  self.socket.emit('reborn');
}
// save old position data
  this.character.oldPosition = {
    x: this.character.x,
    y: this.character.y,
    width: this.character.w,
    health: this.character.health,
    shield: this.shield.visible
  };
  }
}

function addMap(self){
  self.background1 = self.physics.add.image(0, 0, 'map').setOrigin(0, 0).setDisplaySize(screenWidth, screenHeight);
  self.gate = self.physics.add.image(screenWidth-50*screenRatio, 200*screenRatio, 'blue').setOrigin(0,0).setDisplaySize(50*screenRatio, 50*screenRatio);
  self.gate.destination = 2;
  self.background2 = new Array();
  self.background3 = new Array();
  self.background4 = new Array();
  self.background5 = new Array();
  self.background6 = new Array();
  for (var i = 0; i < 20; i++) {
    self.background2[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'flowers1').setOrigin(0, 0).setDisplaySize(30*screenRatio, 30*screenRatio);
    self.background3[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'flowers2').setOrigin(0, 0).setDisplaySize(30*screenRatio, 30*screenRatio);
    self.background4[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'rock1').setOrigin(0, 0).setDisplaySize(20*screenRatio, 20*screenRatio);
    self.background5[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'rock2').setOrigin(0, 0).setDisplaySize(20*screenRatio, 20*screenRatio);
    self.background6[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'wood').setOrigin(0, 0).setDisplaySize(30*screenRatio, 30*screenRatio);
  }
}

function addMap2(self){
  self.background1 = self.physics.add.image(0, 0, 'blue').setOrigin(0, 0).setDisplaySize(screenWidth, screenHeight);
  self.gate = self.physics.add.image(0, 200*screenRatio, 'map').setOrigin(0,0).setDisplaySize(50*screenRatio, 50*screenRatio);
  self.gate.destination = 1;
  self.background2 = new Array();
  self.background3 = new Array();
  self.background4 = new Array();
  self.background5 = new Array();
  self.background6 = new Array();
  for (var i = 0; i < 20; i++) {
    self.background2[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'flowers1').setOrigin(0, 0).setDisplaySize(30*screenRatio, 30*screenRatio);
    self.background3[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'flowers2').setOrigin(0, 0).setDisplaySize(30*screenRatio, 30*screenRatio);
    self.background4[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'rock1').setOrigin(0, 0).setDisplaySize(20*screenRatio, 20*screenRatio);
    self.background5[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'rock2').setOrigin(0, 0).setDisplaySize(20*screenRatio, 20*screenRatio);
    self.background6[i] = self.physics.add.image((Math.floor(Math.random() * screenWidth)), (Math.floor(Math.random() * screenHeight)), 'wood').setOrigin(0, 0).setDisplaySize(30*screenRatio, 30*screenRatio);
  }
}

function addPlayer(self, playerInfo) {
  self.character = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'character').setOrigin(0.5, 0.5).setDisplaySize(60*screenRatio, 50*screenRatio);
  self.character.health = playerInfo.health;
  self.character.username = currentUser;
  self.character.map = playerInfo.map;
  self.character.rat = screenRatio;
  self.healthbar = self.add.text(4000, 10, currentUser, { fontSize: '12px', fill: '#FF0000' });
  self.shield = self.physics.add.sprite(4000, 10, 'arrow3').setOrigin(0.5, 0.5).setDisplaySize(80*screenRatio, 80*screenRatio);
}

function addOtherPlayers(self, playerInfo) {
    var img = 'otherPlayer' + (Math.floor(Math.random() * 4) + 1);
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, img).setOrigin(0.5, 0.5).setDisplaySize(60*screenRatio, 50*screenRatio);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.healthbar = self.add.text(300, 10, '3', { fontSize: '14px', fill: '#f47a42' });
    otherPlayer.shield = self.physics.add.sprite(4000, 10, 'arrow3').setOrigin(0.5, 0.5).setDisplaySize(80*screenRatio, 80*screenRatio);
    otherPlayer.health = 3;
    otherPlayer.map = playerInfo.map;
    otherPlayer.rat = playerInfo.rat;
    otherPlayer.username = playerInfo.username;
    self.otherPlayers.add(otherPlayer);
}
