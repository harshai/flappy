// Initialize Phaser, and create a 400x490px game
var game = new Phaser.Game(400, 490, Phaser.AUTO, 'game-div');

// Create 'main' state that will contain the game
var mainState = {
  
  // This function will be executed in the beginning.
  // It's where we load the game's assets.
  preload: function() {
    // Change the background color of the game
    game.stage.backgroundColor = '#71c5cf';

    // Load the bird sprite
    game.load.image('bird', 'assets/bird.png');

    // Load the pipe sprite
    game.load.image('pipe', 'assets/pipe.png');
  },

  // This function is called after the 'preload' function.
  // Here we set up the game, display sprites, etc.
  create: function() {
    // Set up the physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Display the bird on the screen
    this.bird = this.game.add.sprite(100, 245, 'bird');

    // Add gravity to the bird to make it fall
    game.physics.arcade.enable(this.bird);
    this.bird.body.gravity.y = 1000;

    // Change the center of rotation of the bird, called "anchor"
    // (from upper-left to center-and-little-more-to-the-left)
    this.bird.anchor.setTo(-0.2, 0.5);

    // Call the 'jump' function when the space key is hit
    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.add(this.jump, this);

    // Create a group of pipes
    this.pipes = game.add.group(); // Create a group
    this.pipes.enableBody = true; // Add physics to the group
    this.pipes.createMultiple(20, 'pipe'); // Create 20 pipes

    // Call the 'addRowOfPipes' function every 1.5 seconds
    this.timer = game.time.events.loop(1500, this.addRowOfPipes, this);

    // Display a score label in the top left
    this.score = 0;
    this.labelScore = game.add.text(20, 20, '0', {font: '30px Arial', fill: '#ffffff'});
  },

  // This function is called 60 times per second.
  // It contains the game's logic.
  update: function() {
    // Slowly rotate the bird downward, up to a certain point
    if (this.bird.angle < 20) {
      this.bird.angle += 1;
    }

    // If the bird is out of the world, call the 'restartGame' function
    if (this.bird.inWorld === false) {
      this.restartGame();
    }

    // Call 'restartGame' each time the bird collides with a pipe
    game.physics.arcade.overlap(this.bird, this.pipes, this.restartGame, null, this);
  },

  // Make the bird jump
  jump: function() {
    // Add a vertical velocity to the bird
    this.bird.body.velocity.y = -350;

    // Create an animation on the bird
    var animation = game.add.tween(this.bird);

    // Set the animation to change the angle of the sprite to -20 degrees in 100 ms
    animation.to({angle: -20}, 100);

    // Start it
    animation.start();
  },

  // Restart the game
  restartGame: function() {
    // Start the 'main' state, which restarts the game
    game.state.start('main');
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

    // Add the six pipes
    for (var i = 0; i < 8; i++) {
      if (i != hole && i != hole + 1) {
        this.addOnePipe(400, i * 60 + 10);
      }
    }

    // Increase the score by 1 each time new pipes are created
    this.score += 1;
    this.labelScore.text = this.score;
  }

};

// Add and start 'main' state to start the game
game.state.add('main', mainState);
game.state.start('main');
