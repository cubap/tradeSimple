var pet, cursors, game, tween, waypoints;
var command = {};

function gameInit() {
    game = new Phaser.Game(800, 600, Phaser.AUTO, "phaser", { preload: preload, create: create, update: update, render: render });
}

function preload() {
    game.load.image('pet', '../assets/tree.png');
    game.load.image('prey', '../assets/prey_sm.gif');
    game.load.image('bg', '../assets/world.jpg');
    game.load.image('waypoint', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAfCAYAAADnTu3OAAAA9klEQVRIS+2VSxaCMAxFUxeDAw9rsOy8e9CBsJl4ihZr86O1zGRI6SWflxcHyhPOI9JjBD/fnXSNPeBBFOHnG7n/9WIvKEeX0A3YAkvgHNoFGMEJugLl6GgDtEwiVARyBU8phuGC4E6kSytQ+qMG1LJigRZsi5TR6R/4aZxVR66ZqmxysZb60JRhCBsAEWBaXiYQhhFB8JloS1MStj4tmsHREvWZZQTw7yx+tq+y1scCW2opGqw2n1JbcgWkb47dKXVR8ttPXIfWjpFGswkYff76oCs0ZigCtY5rxlEN5Dqbq0AFclFatlYFtGBmDUsZdQXugcUAnsINpX87fO5FAAAAAElFTkSuQmCC');
};

function create() {
    game.world.setBounds(0, 0, 161000, 161000);
    game.physics.startSystem(Phaser.Physics.ARCADE);
    var bg = game.add.tileSprite(0, 0, 161000, 161000, 'bg');
    bg.tileScale.y = bg.tileScale.x = 3 //100;
    pet = new TG.Pet(game,game.world.centerX, game.world.centerY);
    game.add.existing(pet);
    game.camera.focusOn(pet);
    //  0.1 is the amount of linear interpolation to use.
    //  The smaller the value, the smooth the camera (and the longer it takes to catch up)
    game.camera.follow(pet, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);

    cursors = game.input.keyboard.createCursorKeys();
    game.input.onTap.add(command.setWaypoint, this);
};

function update() {
};

function render() {};

command.setWaypoint = function(pointer) {
    // TODO: attach limit to amount of waypoints set by user based on pet attributes
    var wp = game.add.sprite(pointer.worldX, pointer.worldY, "waypoint");
    wp.anchor = { x: .5, y: 1 };
    var style = {
        font: "10px Arial",
        fill: "#220",
        align: "center",
        fontWeight: "bold"
    };
    waypoints.add(wp);
    wp.index = waypoints.countLiving();
    var count = game.add.text(0, 0, wp.index, style);
    count.anchor.set(.5, 1.5);
    wp.addChild(count);
    wp.updateWaypoint = function() {
        var label = this.getChildAt(0);
        label.setText((--this.index));
    }
    pet._waypoints.push({ x: pointer.worldX, y: pointer.worldY, wp: wp });
    // pet.isMoving = true;
};
