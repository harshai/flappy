// Initialize Phaser, and create a 400x490px game
var game = new Phaser.Game(400, 600, Phaser.AUTO, 'game-div'),
    playerDetails = {
      highScore: 0,
      name: "Rambo",
      eta: 180
    },
    fontSettings = {
      font: '30px Enriqueta',
      fill: '#ffffff'
    }
// Create 'main' state that will contain the game
var mainState = {

  // This function will be executed in the beginning.
  // It's where we load the game's assets.
  preload: function() {
    // Change the background color of the game
    game.stage.backgroundColor = '#71C5CF';
    // Load the bird sprite
    game.load.image('bird', 'assets/bird.png');
    game.load.image('background', 'assets/background.png');
    game.load.image('ground', 'assets/ground.png');

    // game.load.image('plane', 'assets/plane.png');

    // Load the pipe sprite
    game.load.image('pipe', 'assets/pipe.png');

    // Load the jump sound
    game.load.audio('jump', 'assets/jump.wav');
    game.load.audio('die', 'assets/die.wav');
    game.load.audio('hit', 'assets/hit.wav');
    game.load.audio('gameplay', 'assets/David_Whittaker_Lazy_Jones.wav');
  },

  // This function is called after the 'preload' function.
  // Here we set up the game, display sprites, etc.
  create: function() {
    // Set up the physics system
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

      // Display the bird on the screen
      this.bird = this.game.add.sprite(100, 245, 'bird');
      this.bird.scale.setTo(0.66, 0.66);
      // this.plane = this.game.add.sprite(200, 145, 'plane');
      this.gameStarted = false;
      // Call the 'jump' function when the space key is hit
      var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

      spaceKey.onDown.add(this.jump, this);
      game.input.onDown.add(this.jump, this);
      // Display a score label in the top left
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
    this.pipes = game.add.group(); // Create a group
    this.pipes.enableBody = true; // Add physics to the group
    this.pipes.createMultiple(20, 'pipe'); // Create 20 pipes
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

    // If the bird is out of the world, call the 'restartGame' function
    if (this.bird.inWorld === false) {
      if (this.bird.alive) {
        this.gameplay.stop();
        this.dieSound.play();
      }
      this.restartGame();
    }


    // Call 'hitPipe' each time the bird collides with a pipe
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
    // Start the 'main' state, which restarts the game
    localStorage.highScore = Math.max(this.score, parseInt(localStorage.highScore, 10));
    this.prevScore = this.score;
    game.state.start('main');
    this.gameStarted = false;
  },

  // Add one pipe
  addOnePipe: function(x, y) {
    // Get the first dead pipe of the group
    var pipe = this.pipes.getFirstDead();

    // Set new position of the pipe
    pipe.reset(x, y);

    // Add velocity to the pipe to make it move left
    pipe.body.velocity.x = -200;

    // Kill the pipe when it's no longer visible
    pipe.checkWorldBounds = true;
    pipe.outOfBoundsKill = true;
  },

  // Add six pipes in a row with a hole in the middle
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

    // Increase the score by 1 each time new pipes are created
    this.score += 1;
    this.labelScore.text = this.score;
  },

  hitPipe: function() {
    // If the bird has already hit a pipe, we have nothing to do.
    if (!this.bird.alive) {
      return;
    }

    // Set the alive property of the bird to false
    this.bird.alive = false;

    this.gameplay.stop();
    this.hitSound.play();
    this.dieSound.play();
    // Prevent new pipes from appearing
    game.time.events.remove(this.timer);

    // Go through all pipes, and stop their movement
    this.pipes.forEachAlive(function(p) {
      p.body.velocity.x = 0;
    }, this);
  },

  gameOver: function() {
    var fontLocal = {};
    fontLocal.fill =  "#FF9289";
    fontLocal.font =  "42px Enriqueta";
    this.labelETA = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER', fontLocal);
    this.labelETA.anchor.setTo(0.5);
    this.dieSound ? this.dieSound.play() : null;
    this.gameplay ? this.gameplay.stop() : null;
    this.bird.alive = false;
    return;
  }

};

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