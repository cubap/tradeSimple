var TG=TG||{};
TG.Pet = function(game,x,y,options) {
    Phaser.Sprite.call(this,game,x,y,'pet');
    this._waypoints = [];
    waypoints = game.add.group();
    this.scale.x = this.scale.y = 2;
    // this.worldPosition = { x: x, y: y };
    this.anchor = { x: .5, y: 1 };
    game.physics.arcade.enable(this);
}
TG.Pet.prototype = Object.create(Phaser.Sprite.prototype);
TG.Pet.prototype.constructor = TG.Pet;

TG.Pet.prototype.update = function(){
        if (!this.isMoving && this._waypoints.length === 0) {
        this.body.velocity = { x: 0, y: 0 };
        if (cursors.up.isDown) {
            this.body.velocity.y = -300;
        } else if (cursors.down.isDown) {
            this.body.velocity.y = 300; // 10px/m so 30m/s
        }

        if (cursors.left.isDown) {
            this.body.velocity.x = -300;
        } else if (cursors.right.isDown) {
            this.body.velocity.x = 300;
        }
    } else {
        // move through waypoints
        if (this._waypoints.length) {
            var headedTo = this._waypoints[0];
            // active waypoint
            var dist = game.physics.arcade.distanceToXY(this, headedTo.x, headedTo.y);
            if (dist <= 4) {
                // arrived, move on
                this._waypoints.shift().wp.destroy();
                // pick a new waypoint and go there
                headedTo = this._waypoints[0];
                waypoints.callAll('updateWaypoint');
                if (headedTo) {
                    this.isMoving = game.physics.arcade.moveToXY(this, headedTo.x, headedTo.y, 150);
                    // TODO: move on curves between waypoints
                } else {
                    // stop moving on next update
                }
            } else {
                // just keep moving unless...
                if (!this.isMoving) {
                    this.isMoving = game.physics.arcade.moveToXY(this, headedTo.x, headedTo.y, 150);
                }
            }
        } else {
            this.isMoving = false;
            this.body.stopMovement(true);
        }
    }
}

var act = { // placeholder
    forage:null,
    reproduce:null,
    shelter:null,
    hideHeal:null
};

var profile = {
        type: "ANIMAL",
        home: null, // home tile for animal, must be sought out
        growthRate: 0, // TODO: include growth and life stages for animals
        loc: null, // this tile id, new animals always start somewhere
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
        }
};