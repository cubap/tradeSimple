var pet, cursors, game, tween, waypoints;

var act = { // placeholder
    forage: null,
    reproduce: null,
    shelter: null,
    hideHeal: null
};

var ANIMAL = {
    type: "ANIMAL",
    home: null, // home tile for animal, must be sought out
    growthRate: 0, // TODO: include growth and life stages for animals
    loc: "tid", // this tile id, new animals always start somewhere
    holds: [], // stored items for drops
    queue: [], // actions to complete
    drive: { // behavior motivators
        hunger: 0, // food need
        thirst: 0, // water need
        rest: 0, // sleep need
        sex: 0, // reproduction need
        security: 0 // cover need
    },
    trait: { // action modifiers
        healthMax: 10, // alive hitpoints
        health: 10, // current
        enduranceMax: 10, // fatigue hitpoints
        endurance: 10, // current
        stealth: 15, // hideability modifier
        movement: .5 // speed m/s
    },
    tolerates: {
        // each priority-changing possibility with
        // thresholds - array of points of inflection (in 100%)
        // priorities - matched array of priority at thresholds
        // action - remedy sought when priority is high
        hunger: {
            thresholds: [0, 30, 60, 90, 100],
            priorities: [0, 15, 50, 80, 100],
            action: act.forage
        },
        thirst: {
            thresholds: [0, 30, 50, 80, 100],
            priorities: [0, 15, 50, 80, 100],
            action: act.forage
        },
        rest: {
            thresholds: [0, 75, 85, 95, 100],
            priorities: [0, 20, 40, 60, 100],
            action: act.sleep
        },
        sex: {
            thresholds: [0, 90, 100],
            priorities: [0, 60, 80],
            action: act.reproduce
        },
        security: {
            thresholds: [0, 30, 60, 100],
            priorities: [0, 50, 85, 100],
            action: act.shelter
        },
        health: { // of 100% current/max
            thresholds: [0, 30, 60, 100],
            priorities: [0, 50, 85, 100],
            action: act.hideHeal
        },
        endurance: { // of 100% current/max
            thresholds: [0, 30, 60, 100],
            priorities: [0, 50, 85, 100],
            action: act.hideHeal
        }
    },
    add: function(x, y, sprite) {
        Object.assign(this, game.add.sprite(x, y, sprite));
    }
};
var Pet = {}; //Object.create();
Object.assign(Pet, ANIMAL, {
    add: function(x, y) {
        Object.assign(Pet, ANIMAL.add(x, y, 'prey'));
    }
});

var command = {};

function gameInit() {
    game = new Phaser.Game("100%", "100%", Phaser.AUTO, "phaser", { preload: preload, create: create, update: update, render: render });
}

function preload() {
    game.load.image('pet', '../assets/tree.png');
    game.load.image('prey', '../assets/prey_sm.gif');
    game.load.image('bg', '../assets/world.jpg');
    game.load.image('waypoint', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAfCAYAAADnTu3OAAAA9klEQVRIS+2VSxaCMAxFUxeDAw9rsOy8e9CBsJl4ihZr86O1zGRI6SWflxcHyhPOI9JjBD/fnXSNPeBBFOHnG7n/9WIvKEeX0A3YAkvgHNoFGMEJugLl6GgDtEwiVARyBU8phuGC4E6kSytQ+qMG1LJigRZsi5TR6R/4aZxVR66ZqmxysZb60JRhCBsAEWBaXiYQhhFB8JloS1MStj4tmsHREvWZZQTw7yx+tq+y1scCW2opGqw2n1JbcgWkb47dKXVR8ttPXIfWjpFGswkYff76oCs0ZigCtY5rxlEN5Dqbq0AFclFatlYFtGBmDUsZdQXugcUAnsINpX87fO5FAAAAAElFTkSuQmCC');
};

function create() {
    game.world.setBounds(0, 0, 1610, 1610); // 100 times less for dev
    game.physics.startSystem(Phaser.Physics.ARCADE);
    var bg = game.add.tileSprite(0, 0, 161000, 161000, 'bg');
    bg.tileScale.y = bg.tileScale.x = 3 //100;
    pet = new TG.Pet(game, game.world.centerX, game.world.centerY);
    game.add.existing(pet);
    game.camera.focusOn(pet);
    //  0.1 is the amount of linear interpolation to use.
    //  The smaller the value, the smooth the camera (and the longer it takes to catch up)
    game.camera.follow(pet, Phaser.Camera.FOLLOW_LOCKON, 0.5, 0.5);

    cursors = game.input.keyboard.createCursorKeys();
    game.input.onTap.add(command.setWaypoint, this);
};

function update() {};

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