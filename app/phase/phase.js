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
    pet = game.add.sprite(game.world.centerX, game.world.centerY, 'prey');
    // TODO: factory these
    pet._waypoints = [];
    waypoints = game.add.group();
    pet.scale.x = pet.scale.y = 2;
    pet.anchor = { x: .5, y: 1 };
    game.physics.arcade.enable(pet);
    pet.body.onMoveComplete.add(function (deets) {
        console.log(deets);
        pet.body.velocity.x = 0;
        pet.body.velocity.y = 0;
    });

    cursors = game.input.keyboard.createCursorKeys();

    game.camera.focusOn(pet);
    //  0.1 is the amount of linear interpolation to use.
    //  The smaller the value, the smooth the camera (and the longer it takes to catch up)
    game.camera.follow(pet, Phaser.Camera.FOLLOW_LOCKON, 0.05, 0.05);

    game.input.onTap.add(command.setWaypoint, this);
};

function update() {
    if (!pet.isMoving && pet._waypoints.length === 0) {
        pet.body.velocity = { x: 0, y: 0 };
        if (cursors.up.isDown) {
            pet.body.velocity.y = -300;
        } else if (cursors.down.isDown) {
            pet.body.velocity.y = 300; // 10px/m so 30m/s
        }

        if (cursors.left.isDown) {
            pet.body.velocity.x = -300;
        } else if (cursors.right.isDown) {
            pet.body.velocity.x = 300;
        }
    } else {
        // move through waypoints
        if (pet._waypoints.length) {
            var headedTo = pet._waypoints[0];
            // active waypoint
            var dist = game.physics.arcade.distanceToXY(pet, headedTo.x, headedTo.y);
            if (dist <= 4) {
                // arrived, move on
                pet._waypoints.shift().wp.destroy();
                // pick a new waypoint and go there
                headedTo = pet._waypoints[0];
                waypoints.callAll('updateWaypoint');
                if (headedTo) {
                    pet.isMoving = game.physics.arcade.moveToXY(pet, headedTo.x, headedTo.y, 150);
                    // TODO: move on curves between waypoints
                } else {
                    // stop moving on next update
                }
            } else {
                // just keep moving unless...
                if (!pet.isMoving) {
                    pet.isMoving = game.physics.arcade.moveToXY(pet, headedTo.x, headedTo.y, 150);
                }
            }
        } else {
            pet.isMoving = false;
            pet.body.stopMovement(true);
        }
    }
};

function render() { };

command.setWaypoint = function (pointer) {
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
    wp.updateWaypoint = function () {
        var label = this.getChildAt(0);
        label.setText((--this.index));
    }
    pet._waypoints.push({ x: pointer.worldX, y: pointer.worldY, wp: wp });
    // pet.isMoving = true;
};