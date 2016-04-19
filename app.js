// Initialize Phaser, and create a 400x490px game
var game = new Phaser.Game(400, 600, Phaser.AUTO, 'game-div'),
    playerDetails = {
      highScore: 0,
      name: "Rambo",
      eta: 10,
      id: getURLParameter('paxID');
    },
    fontSettings = {
      font: '30px Enriqueta',
      fill: '#ffffff'
    },
    SANDBOX_URL = 'sandbox.example.com' //append route
var mainState = {

  // This function will be executed in the beginning.
  // It's where we load the game's assets.
  preload: function() {
    game.stage.backgroundColor = '#71C5CF';
    game.load.image('bird', 'assets/bird.png');
    game.load.image('background', 'assets/background.png');
    game.load.image('ground', 'assets/ground.png');

    game.load.audio('jump', 'assets/jump.wav');
    game.load.audio('die', 'assets/die.wav');
    game.load.audio('hit', 'assets/hit.wav');
    game.load.audio('gameplay', 'assets/David_Whittaker_Lazy_Jones.wav');
  },

  // This function is called after the 'preload' function.
  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    this.eta = this.eta || playerDetails.eta;
    this.prevScore = this.prevScore || 0;
    game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');
    localStorage.highScore = parseInt(localStorage.highScore, 10) || playerDetails.highScore;
    this.labelHighScore = game.add.text(game.world.centerX, 465, 'High Score: ' + localStorage.highScore, fontSettings);
    this.labelHighScore.anchor.setTo(0.5);

    this.labelprevScore = game.add.text(game.world.centerX, 425, 'Your Score: ' + this.prevScore, fontSettings);
    this.labelprevScore.anchor.setTo(0.5);


    if(this.eta > 0) {
      var verb = this.prevScore ? 'restart' : 'start';
      this.labelInstructions = game.add.text(game.world.centerX, 350, 'Tap to ' + verb + ' game', fontSettings);

      this.labelInstructions.anchor.setTo(0.5);
      game.time.events.loop(Phaser.Timer.SECOND/2, function(i) {
        this.labelInstructions.visible = (this.eta % 2) ? true : false;
      }, this);

      this.labelETA = game.add.text(game.world.centerX, 35, 'ETA: '+ this.eta, fontSettings);
      this.labelETA.anchor.setTo(0.5);
      game.time.events.loop(Phaser.Timer.SECOND, function() {
        (this.eta > 0) ? this.labelETA.setText('ETA: '+ --this.eta) : null;
      }, this)

      this.bird = this.game.add.sprite(100, 245, 'bird');
      this.bird.scale.setTo(0.66, 0.66);
      this.gameStarted = false;
      var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

      spaceKey.onDown.add(this.jump, this);
      game.input.onDown.add(this.jump, this);
      this.score = 0;
    } else {
      this.gameOver();
      return;
    }

  },

  initGame: function() {
    game.physics.arcade.enable(this.bird);
    this.bird.body.gravity.y = (this.score >= 12) ? 1000: 1200;
    this.labelScore = game.add.text(20, 15, '0', fontSettings);
    this.labelHighScore.destroy();
    this.labelprevScore? this.labelprevScore.destroy(): null;
    this.labelInstructions.destroy();

    this.bird.anchor.setTo(-0.2, 0.5);
    // Add the sound
    this.jumpSound = game.add.audio('jump');
    this.hitSound = game.add.audio('hit');
    this.dieSound = game.add.audio('die');
    this.gameplay = game.add.audio('gameplay');

    // Create a group of pipes
    this.pipes = game.add.group();
    this.pipes.enableBody = true;
    this.pipes.createMultiple(20, 'pipe');
    this.gameplay.loop = true;
    this.gameplay.play();

    var frequency = (this.score <= 5) ? 1500 : 1200;
    this.timer = game.time.events.loop(frequency, this.addRowOfPipes, this);

    var labelGroup = game.add.group();

    labelGroup.add(this.labelETA);
    labelGroup.add(this.labelScore);
    game.world.bringToTop(labelGroup);
  },

  // This function is called 60 times per second.
  // It contains the game's logic.
  update: function() {
    // Slowly rotate the bird downward, up to a certain point
    if (this.gameStarted && this.bird.angle < 20) {
      this.bird.angle += 1;
    }

    if(this.eta <= 0) {
      this.gameOver();
      return;
    }

    if (this.bird.inWorld === false) {
      if (this.bird.alive) {
        this.gameplay.stop();
        this.dieSound.play();
      }
      this.restartGame();
    }

    game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);
  },

  // Make the bird jump
  jump: function() {
    // We don't want to be able to make the bird jump when the bird is dead.
    if (!this.bird.alive) {
      return;
    }

    if (!this.gameStarted) {
      this.gameStarted = true;
      this.initGame();
    }


    this.bird.body.velocity.y = (this.score <= 8) ? -400 : -350;

    // Create an animation on the bird
    var animation = game.add.tween(this.bird);

    // Set the animation to change the angle of the sprite to -20 degrees in 100 ms
    animation.to({angle: -20}, 100);

    // Start it
    animation.start();

    // Play the jump sound
    this.jumpSound.play();
  },

  // Restart the game
  restartGame: function() {
    localStorage.highScore = Math.max(this.score, parseInt(localStorage.highScore, 10));
    this.prevScore = this.score;
    game.state.start('main');
    this.gameStarted = false;
  },

  addOnePipe: function(x, y) {
    var pipe = this.pipes.getFirstDead();

    pipe.reset(x, y);

    pipe.body.velocity.x = -200;

    pipe.checkWorldBounds = true;
    pipe.outOfBoundsKill = true;
  },

  addRowOfPipes: function() {
    // Pick where the hole will be
    var hole = Math.floor(Math.random() * 5) + 1;

    if(this.score < 15) {
      for (var i = 0; i < 10; i++) {
        if (i != hole && i != hole + 1 && i != hole + 2  ) {
          this.addOnePipe(400, i * 60 + 10);
        }
      }
    } else {
      for (var i = 0; i < 10; i++) {
        if (i != hole && i != hole + 1) {
          this.addOnePipe(400, i * 60 + 10);
        }
      }
    }

    this.score += 1;
    this.labelScore.text = this.score;
  },

  hitPipe: function() {
    if (!this.bird.alive) {
      return;
    }

    this.bird.alive = false;

    this.gameplay.stop();
    this.hitSound.play();
    this.dieSound.play();
    game.time.events.remove(this.timer);

    this.pipes.forEachAlive(function(p) {
      p.body.velocity.x = 0;
    }, this);
  },

  gameOver: function() {
    if(!this.stupidEndFlag) {
      var fontLocal = {};
      this.stupidEndFlag = true;
      fontLocal.fill =  "#FF9289";
      fontLocal.font =  "42px Enriqueta";
      this.labelETA = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER', fontLocal);
      this.labelETA.anchor.setTo(0.5);
      this.dieSound ? this.dieSound.play() : null;
      this.gameplay ? this.gameplay.stop() : null;
      this.bird.alive = false;
      game.sound.mute;
      alert(playerDetails.id);
      makeRequest("POST", SANDBOX_URL, {
        highScore: this.highScore,
        userID: playerDetails.id
      }).then(function(data) {
        //window.navigator.href = "http://sandbox.example.com"
        // redirect to listing page?
      }).catch(function(error) {
        console.log('kill yourself, highscore not registered');
      });
      return;
    }
  }
};

function makeRequest(method, url, data) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.opem(method, url);
    xhr.onload = function() {
      if(this.status >200 && this.status< 300){
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        })
      }
    }
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      })
    }
    xhr.send();
  });
}

WebFont.load({
  active: function() { game.time.events.add(Phaser.Timer.SECOND, bootload); },
  google: {
    families: ['Enriqueta']
  }
});
// Add and start 'main' state to start the game
function bootload() {
  game.state.add('main', mainState);
  game.state.start('main');
}

function sayHi() {
  alert('Hello world');
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}