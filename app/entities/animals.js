var Animals = angular.module('tgAnimals', ['tgElements']);

Animals.service('Action',function(){
    return {
        override:function(){
            return null;
        }
    }
});
Animals.service('Measure',function(){});
Animals.service('Search',function(){
    this.cover=function(){return {};};
    this.find=function(){return {};};
    this.predator=function(){return {};};
});
Animals.service('Animal', function($filter,Tile,Action,Measure,Search) {
    var idToPos = function(loc){
        var iy = loc.indexOf("y");
        var iz = loc.indexOf("z");
        return {
            x:parseFloat(loc.substring(1,iy)),
            y:parseFloat(loc.substring(iy+1,iz)),
            z:parseFloat(loc.substring(iz+1))
        };
    };

    // Animal actions, full turn
    var act = this;
    var eat = function(critter, detection) {
        var deferred = $q.defer();
        Search.find('food', critter.loc, detection).then(function(food) {
            if (food.length) {
                food = Measure.risk(food, critter, detection);
                // TODO: move to and eat nearest low risk food
                deferred.resolve(critter);
            } else {
                deferred.reject("No food");
            }
        },function(err){
            deferred.reject("Failed to eat:" + err);
        });
        return deferred.promise;
    };
    var drink = function(critter, detection) {
        var deferred = $q.defer();
        Search.find('water', critter.loc, detection).then(function(water) {
            if (water.length) {
                water = Measure.risk(water, critter, detection);
                deferred.resolve(critter);
            } else {
                deferred.reject("No water");
            }
        });
        return deferred.promise;
    };
    var indexNotMoreThan = function(array, val) {
        for (var i = 0; i < array.length; i++) {
            if (val > array[i]) {
                continue;
            }
            return i;
        }
    };
    var updatePriorities = function(critter, config) {
        // check for hunger, thirst, sex, security, health, endurance
        var queue = critter.queue = [];
        // hunger
        var hungerIndex = indexNotMoreThan(critter.tolerates.hunger.thresholds, critter.drives.hunger);
        critter.queue.push({
            priority: critter.tolerates.hunger.priority[hungerIndex],
            action: critter.tolerates.hunger.action
        });
        // thirst
        var thirstIndex = indexNotMoreThan(critter.tolerates.thirst.thresholds, critter.drives.thirst);
        critter.queue.push({
            priority: critter.tolerates.thirst.priority[thirstIndex],
            action: critter.tolerates.thirst.action
        });
        // rest
        var restIndex = indexNotMoreThan(critter.tolerates.rest.thresholds, critter.drives.rest);
        critter.queue.push({
            priority: critter.tolerates.rest.priority[restIndex],
            action: critter.tolerates.rest.action
        });
        // sex
        var sexIndex = indexNotMoreThan(critter.tolerates.sex.thresholds, critter.drives.sex);
        critter.queue.push({
            priority: critter.tolerates.sex.priority[sexIndex],
            action: critter.tolerates.sex.action
        });
        // security
        var securityIndex = indexNotMoreThan(critter.tolerates.security.thresholds, critter.drives.security);
        critter.queue.push({
            priority: critter.tolerates.security.priority[securityIndex],
            action: critter.tolerates.security.action
        });
        // health
        var healthIndex = indexNotMoreThan(critter.tolerates.health.thresholds, critter.trait.health / critter.trait.healthMax);
        critter.queue.push({
            priority: critter.tolerates.health.priority[healthIndex],
            action: critter.tolerates.health.action
        });
        // endurance
        var enduranceIndex = indexNotMoreThan(critter.tolerates.endurance.thresholds, critter.trait.endurance / critter.trait.enduranceMax);
        critter.queue.push({
            priority: critter.tolerates.endurance.priority[enduranceIndex],
            action: critter.tolerates.endurance.action
        });
    };
    this.nextAction = function(critter,ticks) {
        if (critter.queue.length) {
            critter.queue = $filter('orderBy')(critter.queue.sort, 'priority');
        } else {
            critter.queue = [{
                priority: 20,
                action: act.idle
            }];
        }
        var doing = critter.queue.pop();
        return doing.action(critter,ticks,doing.config);
    };
    this.forage = function(critter,ticks, config) {
        var deferred = $q.defer();
        // careful movement
        // speed is 70%, detection is high, notices food 
        // and drink and predators spiral search and consume until full
        var speed = config && config.speed || .7;
        var detection = config && config.speed || 1;
        // if food, drink, pursue
        // movement or action
        var f = (critter.drive.hunger > critter.drive.thirst)
                ? [eat, drink] : [drink, eat];
        f[0](critter, detection).then(function() {
            },function(rejected){
                console.log(rejected);
            f[1](critter, detection);
        }).then(function() {
            // Pursued food, finish action
                Action.tick(critter);
            },function(err){
            // No food or drink, move on
            console.lot(err);
            // Movement to new Tile (consider predator, trail, speed)
        }).finally(function() {
            // update priorities
            updatePriorites(critter)
        });

        // once moved, update priorities
        if (Search.predator().distance(critter.loc) < 2 * critter.movement) {
            // raise priority
            critter.drive.security += 100;
        }
        if (critter.drive.hunger + critter.drive.thirst === 0) {
            // sated, go idle
        }
        return deferred.promise;
    };
    this.idle = function(critter,ticks,config) {
        // no movement
        var m = critter.trait.movement/1000; // m/ms
        // priority is 20, so hunger, injury or encroachment will cause
        // response as hideHeal is 40, idle time will always seek cover 
        if (Action.override(critter.queue)) {
            // check for other priorities
            critter.queue[0].action(); // do new priority
        }
        if (Search.cover().distance < 2 * m / (100 - critter.drive.security)) {
            // move to cover
        }
       
       // test move to another tile 
        var neighbors = Tile.getNeighbors(critter.loc);
        var n = neighbors[(0.5+Math.random()*neighbors.length)|0];
        if(n){
            critter.tweenTo = critter.tweenTo || idToPos(n.id);
            var a = idToPos(critter.loc);
            var b = critter.tweenTo;
            var m = critter.trait.movement/1000; // m/ms
            a.x=a.x<b.x?a.x+m*ticks : a.x-m*ticks;
            a.y=a.y<b.y?a.y+m*ticks : a.y-m*ticks;
            a.z=a.z<b.z?a.z+m*ticks : a.z-m*ticks;
            var dist = Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.z-b.z));
            var pos = a;
            if(dist < .05) {
                // finish animation and remove tween
                pos=b;
                critter.tweenTo = null;
            }
            critter.loc = "x"+pos.x+"y"+pos.y+"z"+pos.z;
        }
            // pass time
    };
    this.wander = function(critter,ticks,config) {
//                    intentional movement
//		speed is 100%, detection is medium, notices cover, food, and predators
//	radial search from last shelter, stay within 200m
//	explore more when finding regions between 2 and 20 peers
//	priority 80 until completely explored within two days
    };
    this.shelter = function(critter,ticks,config) {
//move at regular speed until arriving, then idle
//		speed is 100%, detection is medium, notices cover, food, and predators
//	priority begins at 40, but grows quickly
//	cycle through memory list of cover from best to worst
//	reevaluate each for suitability upon arriving
//		check cover value		// 1:exposed - 100:completely hidden
//		check max population		// 8 squirrels in a tree, 3 in a bush
//		check environment		// nearby predators will deter, food/water improves
//		check memory		// a previous shelter will be more well liked
    };
    this.sleep = function(critter,ticks,config) {
//	no movement, but must be sheltered
//	detection is very low, predators and attacks only
//	wakes on a schedule or on event
//	time from last sleep can cause problems
    };
});

Animals.service('Prey', function(Animal, Search,ENTITIES) {
    var prey_sm = new Image();
    prey_sm.src = "assets/prey_sm.gif";
        var act = { // placeholder
            forage:null,
            reproduce:null,
            shelter:null,
            hideHeal:null
        };
    // Prey are mobile animals which gather food and avoid being hunted
        var id=0;
    this.new = function(tid) {
        var critter = this;
        return ENTITIES.list["ANIMAL"+(++id)]={
            type:"ANIMAL",
            home: null, // home tile for animal, must be sought out
            growthRate: 0, // TODO: include growth and life stages for animals
            loc: tid, // this tile id, new animals always start somewhere
            holds: [], // stored items for drops
            queue: [], // actions to complete
            drive: {// behavior motivators
                hunger: 0, // food need
                thirst: 0, // water need
                rest: 0, // sleep need
                sex: 0, // reproduction need
                security: 0 // cover need
            },
            trait: {// action modifiers
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
                health: {// of 100% current/max
                    thresholds: [0, 30, 60, 100],
                    priorities: [0, 50, 85, 100],
                    action: act.hideHeal
                },
                endurance: {// of 100% current/max
                    thresholds: [0, 30, 60, 100],
                    priorities: [0, 50, 85, 100],
                    action: act.hideHeal
                }
            },
            draw: function(context,zoom,base){
                if(zoom>35)
                context.drawImage(prey_sm,base.x,base.y,0.2*zoom,0.2*zoom);
            },
            nextAction:Animal.nextAction
        };
    };
});

Animals.service('Predator', function(Action, Search) {

});