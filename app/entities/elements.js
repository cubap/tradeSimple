var Elements = angular.module('tgElements', []);
Elements.value('Map',{
    tiles: [],
    center: {
        x:0,
        y:0,
        z:0
    },
    NO_OF_BLOCKS : 1,
    BLOCK_RADIUS : 12,
    zoom : 10 // 1m = zoompx
});

Elements.service('Tile', function(Map,ENTITIES) {
    var self=this;
    // Each section of the map, let's start with hex of 1m
    this.new = function(config) {
        var init = config || {};
        return angular.extend({
            id:(init.position&&("x"+init.position.x+"y"+init.position.y+"z"+init.position.z)) || "x000y000z000", // unique
            position: {}, // hex coordinates {x,y,z}
            base: { // 0:dirt, 1:rock, 2:sand, 3:water
                type:0,
                quality:1 // suitability for things
            },
            history: [], // events on this space
            holds: [], // debris laying around
            cover: {}, // turf, gravel, etc. coverage
            contains: [], // discrete entities like structures and plants on tile
            vacant: 100 // percent of space not covered by structures or turf
                    // owner, signs, paths, makeup (fertility, danger, etc?)
        },init);
    };
    this.findInHold = function(tile,name,all){
        var hold = tile.holds.length;
        var items = [];
        for(var i=o;i<hold;i++){
            if(tile.holds[i].baseType === name){
                items.push(name);
                if(all){
                    continue;
                } else {
                  return items.join('');
                }
            }
        }
        return items;
    };
    this.getNeighbors = function(tid) {
        var tile = self.getById(tid);
        if(!tile) return [];
        var t=tile.position;
        var neighbors = [
            self.getByPosition(t.x + 1, t.y - 1, t.z),
            self.getByPosition(t.x, t.y + 1, t.z - 1),
            self.getByPosition(t.x - 1, t.y, t.z + 1),
            self.getByPosition(t.x - 1, t.y + 1, t.z),
            self.getByPosition(t.x, t.y - 1, t.z + 1),
            self.getByPosition(t.x + 1, t.y, t.z - 1)
        ];
        return neighbors.filter(function(n){ return n != undefined; });
    };
    this.getLocalNeighbors = function(tile, d) {
        var coordinates = [];
        var t = tile.position;
        for (var dx = -d; dx < d; dx++) {
        for (var dy = -d; dy < d; dy++) {
        for (var dz = -d; dz < d; dz++) {
               if(dx+dy+dz===0){
                   coordinates.push({
                    x: t.x + dx,
                    y: t.y + dy,
                    z: t.z + dz
                });
            }
        }
    }
        }
        // for each -N ≤ Δx ≤ N:
        //    for each max(-N, -Δx-N) ≤ Δy ≤ min(N, -Δx+N):
        //        Δz = -Δx-Δy
        //        results.append(H.add(Cube(Δx, Δy, Δz)))
        var tiles=[];
        angular.forEach(coordinates,function(c){
           tiles.push(Tile.getByPosition(c.x,c.y,c.z)); 
        });
    };
    this.getById = function(tid,noLoop){
        if(tid.id){return tid;}
        for(var i=0;i<Map.tiles.length;i++){
          if(Map.tiles[i].id === tid) {
              return Map.tiles[i];
          }
        }
        if(noLoop){
            return null;
        }
        var r = (function(loc){
            var iy = loc.indexOf("y");
            var iz = loc.indexOf("z");
            return {
                x:loc.substring(1,iy)|0,
                y:loc.substring(iy+1,iz)|0 //,
//                z:(.5+parseFloat(loc.substring(iz+1)))|0
            };
        })(tid);
      return self.getByPosition(r.x,r.y,-(r.x+r.y));
    };
    this.getByPosition = function(x,y,z){
      if(x+y+z !== 0){
          throw Error("Invalid Hex position");
      }
      return self.getById("x"+x+"y"+y+"z"+z,true);
      for(var h=0;h<Map.tiles.length;h++){
          if(Map.tiles[h].x === x &&
                  Map.tiles[h].y === y &&
                  Map.tiles[h].z === z) {
              return Map.tiles[h];
          }
      }
    };
    this.numOfType=function(tid, type, stage){
        var tile = self.getById(tid);
        var count=0;
        angular.forEach(tile.contains, function(eid){
            var ent = ENTITIES.list[eid];
            if(ent.type===type && ent.stage===stage){
                count++;
            }
        });
        return count;
    }
    // TODO:finish Tile
});

