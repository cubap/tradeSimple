trade.service('MapService',function(Map,Tile,ENTITIES){
	var self=this;
	var mapCanvas = document.getElementsByTagName('canvas')[0];
	var container = document.getElementsByClassName('container')[0];
	var cxt = mapCanvas.getContext('2d');
	var self=this;
	var hex_to_pixel = function(x,y,z){
		// convert cubic to cartesian on canvas
		// http://www.redblobgames.com/grids/hexagons/#basics
		var c = Map.center;
		var X=mapCanvas.width/2;
		var Y=mapCanvas.height/2;
		X+=Map.zoom*3/2*-(c.x-x);
		Y+=Map.zoom*(Math.sqrt(3)*((c.y-y)+(c.x-x)/2));
		return {"x":X,"y":Y};
	};
	var pixel_to_hex = function(x, y){
		var c = self.center;
    var q = x * (2/3) / Map.zoom
    var r = (-x / 3 + Math.sqrt(3)/3 * y) / Map.zoom
    return Tile.getByPosition(parseInt(q),parseInt(-q-r),parseInt(r));
};
	mapCanvas.width = Map.width = container.offsetWidth-30;
	mapCanvas.height = Map.height = container.offsetWidth/2;
	this.update = function(){
		cxt.clearRect(0, 0, Map.width, Map.height);
		cxt.beginPath();
		cxt.moveTo(0,(0.5+mapCanvas.height/2)|0);
		cxt.lineTo((0.5+mapCanvas.width)|0,(0.5+mapCanvas.height/2)|0);
		cxt.moveTo((0.5+mapCanvas.width/2)|0,0);
		cxt.lineTo((0.5+mapCanvas.width/2)|0,(0.5+mapCanvas.height)|0);
		cxt.strokeStyle = '#22F';
		cxt.stroke();
		cxt.beginPath();
		angular.forEach(Map.tiles,function(tile){
			// cxt.beginPath();
			// cxt.arc(hexCenter.x,hexCenter.y,Map.zoom*Math.sqrt(3)/2,0,2*Math.PI,false);
			// cxt.fillStyle = 'rgba(255,255,255,.5)';
			// cxt.strokeStyle = 'rgba(125,20,125,.5)';
			// cxt.fill();
			// cxt.stroke();
			if(Map.zoom>19){
				// cxt.fillStyle='blue';
				// cxt.fillText(tile.id,hexCenter.x-Map.zoom*.75,hexCenter.y);
			}
			if(tile.cover.grass){
				var hexCenter = hex_to_pixel(tile.position.x,tile.position.y,tile.position.z);
				var e = ENTITIES.list[tile.cover.grass];
				cxt.moveTo (hexCenter.x +  Map.zoom*e.coverage/100 * Math.cos(0), hexCenter.y +  Map.zoom *  Math.sin(0)*e.coverage/100);
				for (var i = 1; i <= 6;i += 1) {
				    cxt.lineTo (hexCenter.x + Map.zoom*e.coverage/100 * Math.cos(i * 2 * Math.PI / 6), hexCenter.y + Map.zoom*e.coverage/100 * Math.sin(i * 2 * Math.PI / 6));
				}
			}
		});
		cxt.fillStyle = 'rgba(20,125,20,.5)';
		cxt.fill();
		cxt.beginPath();
		var rads = 2*Math.PI/7;
		angular.forEach(ENTITIES.list, function(ent){
			var entpos = idToPos(ent.loc);
			var base;
			base = hex_to_pixel(entpos.x,entpos.y,entpos.z);
			ent.draw && ent.draw(cxt,Map.zoom,base);
		});
		cxt.stroke();
	};
	var idToLoc = function(loc){
		var iy = loc.indexOf("y");
		var iz = loc.indexOf("z");
		return {
			x:loc.substring(1,iy),
			y:loc.substring(iy+1,iz),
			z:loc.substring(iz+1)
		};
	};
    var idToPos = function(loc){
	    var iy = loc.indexOf("y");
	    var iz = loc.indexOf("z");
	    return {
	        x:parseFloat(loc.substring(1,iy)),
	        y:parseFloat(loc.substring(iy+1,iz)),
	        z:parseFloat(loc.substring(iz+1))
	    };
	};

    this.getById = function(id,array){
		for(var i=0;i<array.length;i++){
		          if(array[i].id === id) {
		              return array[i];
		          }
      }
      throw Error("No item with ID:"+id);
    };
});

trade.controller('mapController', ['$scope','MapService', function($scope,MapService){
		MapService.update();
}]);