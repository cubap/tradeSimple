var Plants = angular.module('tgVegetation', ['tgElements']);

Plants.service('Grass', function(Tile,ENTITIES) {
    // Grass on dirt is one per meter with a coverage count instead of individual
    var id=0;
    var self=this;
    this.new = function(tid) {
        id++;
        var grass = {
            id:"grass"+ id,
            type:"GRASS",
            coverage: 0, // 1-100
            grows:self.grows,
            growthRate: 5, // constant for number randomly increased each growth;
            growing: 0, // debug
            footprint: 0, // though it covers the ground, it doesn't prohibit other growth
            loc: tid // this tile id, grass always exists somewhere
        };
        ENTITIES.list[grass.id] = grass;
        Tile.getById(grass.loc).cover.grass = grass.id;
        return grass;
    };
    // TODO: add grass variants like flowers and grains
    this.grows = function(grass,ticks) {
        grass.growing+=ticks;
        while(grass.growing>1000){
        var hex = Tile.getById(grass.loc);

//debug
// var check = function(space, expect){
//     var vacant = 100;
//     angular.forEach(space, function(ss){
//         var s=ENTITIES.list[ss];
//         if(s.footprint)vacant-=s.footprint;
//     });
//     return vacant === expect;
// }
// console.log(check(hex.contains,hex.vacant));

        if(hex.vacant>grass.coverage){
        var newGrowth = (.05+(Math.random() * hex.base.quality * grass.growthRate))|0;
        grass.coverage += newGrowth;
        if (grass.coverage > 40) {
            // overcrowded and spreads
            if(grass.coverage>hex.vacant){
                grass.coverage = hex.vacant;
            }
            var spread = Math.min(grass.coverage-40,newGrowth);
            var neighbors = Tile.getNeighbors(grass.loc);
            for (var i = neighbors.length; i > 0; i--) {
                // seed out even if it does not land
                var seed = Math.floor(Math.random()*spread);
                spread -= seed;
                var n = neighbors.splice(parseInt(Math.random() * i), 1)[0];
                var coverage = !n.cover.grass || ENTITIES.list[n.cover.grass].coverage;
                if (n.base.type===0
                    && spread && n.vacant > 40
                    && n.vacant > coverage) {
                    // spread here
                    self.propogate(n,seed);
                }
            }
        }
    } else if(hex.vacant>grass.coverage+grass.growthRate){ // stabilize at some point
        grass.coverage-=2;
    }
        grass.growing-=100;
        }
    return grass;
    };
    var getById = function(id,array){
        if(!array || !array[0] || !id){
            return null;
        }
        for(var j = 0;j<array.length;j++){
            if(array[j].id===id){
                return array[j];
            }
        }
    };
    this.propogate = function(tile, s) {
        var seed = Math.round(Math.random()*tile.base.quality*s);
        var grass = !tile.cover.grass || ENTITIES.list[tile.cover.grass];
        if(!seed){
            return;
        }
        if(grass.coverage!==undefined){
            grass.coverage = Math.min(tile.vacant,grass.coverage+seed);
        } else {
            grass = self.new(tile.id);
            grass.coverage = seed;
            tile.cover.grass = grass.id;
        }
        return grass;
    };
    this.isTread = function(grass, tread) {
        // wear out when different things pass over
        // low for animals, more for people, severe for vehicles
        grass.coverage -= tread;
        if(grass.coverage < 1){
            this.dies(grass);
        }
    };
    this.dies = function(grass) {
        if (grass.coverage < 1) {
            Tile.remove(grass);
            return true;
        }
        return false;
    };
});

Plants.service('Bush', function() {
    // medium sized plants that grow in patches near treelines
    this.new = function(init) {
        var bush = {
            type: 0, // 2:berry, 1:bramble, 0:bush for growth
            footprint: 5, // of 100 space taken up in a tile
            stage: 0, // 0:seed, 1:sprout, 2:adult
            age: 0, // age for growth checks
            growthRate: 1, // ratio for aging
            holds: [] // stored items for drops
        };
        angular.extend(init);
        return bush;
    };
    this.newBerry = function() {
        return this.new({type: 2});
    };
    this.newBramble = function() {
        return this.new({type: 1});
    };
    var toSprout = function(bush) {
        // TODO: change attributes to make a sprout
        // add .branches
        return bush;
    };
    var toAdult = function(bush) {
        // TODO: change attributes to make a adult
        // define maxsize
        return bush;
    };
    var checkEnvironment = function(bush) {
        switch (bush.stage) {
            case 0: // seeds can sprout if there are less than 5 sprouts      
                if (Tile.numOfType(bush.tile, 'BUSH', 1) > 4) {
                    return false;
                }
                break;
            case 1: // sprout to bush
                // only 3 bushes allowed per m
                if (Tile.numOfType(bush.tile, 'BUSH', 2) > 2) { // tile to check, type of entity, stage
                    return  false;
                }
                ;
                // 3-10 trees in 10m radius
                var tiles = [bush.tile].push(Tile.getNeighbors(bush.tile, 9));
                var numOfTrees = 0;
                for (var i = 0; i < tiles.length; i++) {
                    numOfTrees += Tile.numOfType(tiles[i], 'TREE', 3);
                    if (numOfTrees > 10) {
                        return false;
                    }
                }
                ;
                if (numOfTrees < 3) {
                    return false;
                }
                break;
            case 2: // adult is always good, once grown
        }
        // looks good
        return true;
    };
    var thrive = function(bush) {
        switch (bush.type) {
            case 0: // just a bush
                if (maxsize === bush.branches) {
                    // cannot grow more
                } else if (History.now() - History.recentEvent(bush.history.growth).time < 8 * bush.growthRate) {
                    // recently grew a stick
                } else {
                    var newStick = Materials.new('STICK', bush);
                    bush.holds.push(newStick);
                    bush.history.growth(History.log(newStick));
                    bush.branches++;
                }
                break;
            case 1: // bush is a bramble
                if (maxsize === bush.branches) {
                    // cannot grow more
                } else if (History.now() - History.recentEvent(bush.history.growth).time < 12 * bush.growthRate) {
                    // recently grew a stick
                    break;
                } else {
                    var newStick = Materials.new('STICK', bush);
                    bush.holds.push(newStick);
                    bush.history.growth(History.log(newStick));
                    bush.branches++;
                }
            case 2: // bush is a berry
                if (maxsize === bush.branches) {
                    // cannot grow more
                } else if (History.now() - History.recentEvent(bush.history.growth).time < 12 * bush.growthRate) {
                    // recently grew a stick
                    break;
                } else {
                    var newStick = Materials.new('STICK', bush);
                    bush.holds.push(newStick);
                    bush.history.growth(History.log(newStick));
                    bush.branches++;
                }
                // check for last berry growth
                if (History.now() - History.recentEvent(bush.history.fruit).time > 30) {
                    // old (or no) fruit, drop and start over
                    this.drop(bush, 'BERRY', -1); // -1 for all of them
                    var newBerries = Food.new('BERRIES', bush, bush.branches * 30);
                    bush.holds.concat(newBerries);
                    bush.history.growth(History.log(newBerries));
                } else {
                    // modify all the berries on the bush
                    angular.forEach(bush.holds, function(item) {
                        if (item.is === 'BERRY' &&
                                item.age++ > 7 &&
                                item.stage === 0) {
                            // attempt to ripen
                            if (Math.random() * 14 + age > 16) {
                                item.stage++;
                            }
                        }
                        // TODO: possibly add premature spoilage as well
                    });
                }
                break;
        }
        return bush;
    };
    this.grows = function(bush) {
        bush.age += bush.growthRate;
        if (age > 6 && stage === 0) { // age in days for now
            // try to sprout or die
            if (checkEnvironment(bush)) {
                toSprout(bush);
            } else if (bush.age > 60) {
                this.dies(bush);
            }
        } else if (age > 8 && stage === 1) {
            // try to adult or die
            if (checkEnvironment(bush)) {
                toAdult(bush);
            } else if (bush.age > 120) {
                this.dies(bush);
            }
        } else if (age > 21 && stage === 2) {
            // adult gains based on type
            thrive(bush);
        }
        return bush;
    };
    this.drops = function(bush) {
        // TODO: bush drop
        // remove item from holds:[]
        // add to tile debris
    };
    this.dies = function(bush) {
        // TODO: bush dies
        // test for death (age, crowding)
        // remove if true
    };
});

Plants.service('Tree', function(Tile,ENTITIES) {
    // large sized plants that grow in groves
    var img_tree = new Image();
    img_tree.src="assets/tree.png";
    var id=0;
    var self=this;
    this.new = function(tid,init) {
        id++;
        // random placement
        var xyz = {
            x:parseInt(tid.split("x")[1]),
            y:parseInt(tid.split("y")[1]),
            z:parseInt(tid.split("z")[1])
        };
        angular.forEach(xyz,function(n,k){
            if(n>0){
                xyz[k]--;
            }
            xyz[k] += Math.random();
        });
        var loc = "x"+xyz.x+"y"+xyz.y+"z"+xyz.z;
        var tree = {
            id:"tree"+id,
            type:"TREE",
            variant: 0, // 2:nuts, 1:fruit, 0:lumber for growth
            footprint: 0, // of 100 space taken up in a tile
            stage: 0, // 0:seed, 1:seedling, 2:sapling, 3:adult
            age: 0, // age for growth checks
            growthRate: 1, // ratio for aging
            grows: self.grows,
            // sleep: {t:50,reset:50}, // ticks between growth for less figuring
            sleep: {t:0,reset:0}, // debug short time
            loc: loc, 
            draw: draw.seed,
            holds: [] // stored items for drops
        };
        if(init){angular.extend(tree,init);}
        ENTITIES.list[tree.id]=tree;
        Tile.getById(tree.loc).contains.push(tree.id);

        return tree;
    };
    this.newNut = function() {
        return this.new({variant: 2});
    };
    this.newFruit = function() {
        return this.new({variant: 1});
    };
    var toSeedling = function(tree) {
        angular.extend(tree,{
            stage:1,
            footprint:2,
            draw: function(context,zoom,base){
                draw.seedling(context,zoom,base);
            }
        });
        Tile.getById(tree.loc).vacant-=2;
        // TODO: change attributes to make a seedling
        // add .branches
        return tree;
    };
    var toSapling = function(tree) {
        angular.extend(tree,{
            stage:2,
            footprint:15,
            draw: function(context,zoom,base){
                draw.sapling(context,zoom,base);
            }
        });
        Tile.getById(tree.loc).vacant-=13;
        // TODO: change attributes to make a sapling
        return tree;
    };
    var toAdult = function(tree) {
        angular.extend(tree,{
            stage:3,
            footprint:30,
            grows:self.seeds,
            draw: function(context,zoom,base){
                draw.adult(context,zoom,base);
            }
        });
        Tile.getById(tree.loc).vacant-=15;
        // TODO: change attributes to make a adult
        // define maxsize
        return tree;
    };
    var checkEnvironment = function(tree) {
        switch (tree.stage) {
            case 0: // seeds can grow if there are less than 3 seedlings      
                if (Tile.numOfType(tree.loc, 'TREE', 1) > 2) {
                    return false;
                }
                break;
            case 1: // seedling to sapling
                // only one allowed per m
                if (Tile.numOfType(tree.loc, 'TREE', 2) > 0) { // tile to check, type of entity, stage
                    return  false;
                }
                return Math.random()>.71; // good chance to spread
                break;
            case 2: // sapling to adult
                // only 3 allowed per 1m radius
                var tiles = [tree.loc].concat(Tile.getNeighbors(tree.loc));
                var hit = 0;
                for (var i = 0; i < tiles.length; i++) {
                    hit+= Tile.numOfType(tiles[i], 'TREE', 3);
                }
                return hit < 3;
                break;
            case 3: // adult is always good, once grown
        }
        // looks good
        return true;
    };
        // TODO: finish trees 
        this.grows = function(tree){
            tree.age+=tree.growthRate;
            if(tree.age > 7 && tree.stage===0){
                // grow to seedling
                if(checkEnvironment(tree)) {
                    tree = toSeedling(tree);
                } else if (tree.age > 180) {
                    self.dies(tree);
                }
            } else if (tree.age > 30 && tree.stage===1){
                // grow to sapling
                if(checkEnvironment(tree)) {
                    tree = toSapling(tree);
                } else if (tree.age > 730) {
                    self.dies(tree);
                } else {
                    // add a few branches
                }
            } else if (tree.age > 60 && tree.stage===2){
                // grow to adult
                if(checkEnvironment(tree)) {
                    tree = toAdult(tree);
                } else if (tree.age > 7300) {
                    self.dies(tree);
                } else {
                   // add a few branches
                }
            } 
        };
        this.seeds=function(tree){
            if (tree.age > 7300) {
                    self.dies(tree);
                } else {
                   // add a few branches
                }
            // placeholder for better logic, perhaps with puncuated drops 
            // like seasonal growth based on simple age of tree or ticks for synchro
            if((Math.random()*tree.age/100)>.5){                           // more likely with age
            var tile = Tile.getById(tree.loc);
            var nloc = {                                              // random neighbor, radius 3
                x:tile.position.x+parseInt(6*Math.random()-3),
                y:tile.position.y+parseInt(6*Math.random()-3),
                z:tile.position.z+parseInt(6*Math.random()-3),
            }
            var n = Tile.getById("x"+nloc.x+"y"+nloc.y+"z"+nloc.z);
            if(n){
                var seed = self.new(n.id,{variant:tree.variant});
            }
            return seed;
        }
            return tree;
        };
    this.drops = function(tree) {
        // TODO: tree drop
        // remove item from holds:[]
        // add to tile debris
    };
    this.dies = function(tree) {
        var tile = Tile.getById(tree.loc);
        tile.vacant+=tree.footprint;
        tile.contains.splice(tile.contains.indexOf(tree.id),1);
        // console.log("Burned "+tree.id);
        delete ENTITIES.list[tree.id];
        // TODO: tree dies
        // test for death (age, crowding)
        // remove if true
    };
    var draw = {
        seed: function(context,zoom,base){
            // context.moveTo(base.x,base.y);
            // context.lineWidth = Math.ceil(zoom/40);
            // if(zoom>60){
            //     context.arc(base.x,base.y,zoom*.01,0,2*Math.PI,false);
            // }
        },
        seedling: function(context,zoom,base){
            if(zoom>40)
            context.drawImage(img_tree,4,4,8,10,base.x-.0625*zoom,base.y-.2*zoom,0.05*zoom,0.2*zoom);
        },
        sapling: function(context,zoom,base){
            if(zoom>20)
            context.drawImage(img_tree,4,4,8,12,base.x-.125*zoom,base.y-.25*zoom,0.125*zoom,0.25*zoom);
        },
        adult: function(context,zoom,base){
            context.drawImage(img_tree,base.x,base.y,0.5*zoom,0.5*zoom);
            },

    };
});