trade.value("GAME",{
	is_running:false,
	// previous_tick:0,
	// tick:0,
	pauseAt:0,
	speed:30,
	log:[]
});

trade.controller('gameController',function($scope,Grass,Map,ENTITIES,Tile,GAME,GameService){
	$scope.game = GAME;
	$scope.map = Map;
	$scope.entities=ENTITIES.list;
	$scope.playpause=function(){
		GAME.is_running = !GAME.is_running;
	};
$scope.init = GameService.init;

	$scope.$watch('game.is_running', function(newValue, oldValue, scope) {
		if(newValue){
			if(GAME.pauseAt){
				GAME.previous_tick += Date.now()-GAME.pauseAt;
				GAME.pauseAt = undefined;
			}
		} else {
			GAME.pauseAt = Date.now();
		}
	});
});

trade.service('GameService',function(GAME,TimerService,$interval,MapService,Map,Tile,ENTITIES,Grass,Tree,Prey){

ENTITIES.dummies = [
		Grass.new,
		Grass.new,
		Grass.new,
		Grass.new,
		Tree.new,
		Tree.new,
		Tree.new,
		Prey.new,
		Prey.new,
		Prey.new,
		Prey.new,
		Prey.new,
		Prey.new
]


	var self=this;
	var ticks;
	this.init=function(){
		// build map


// Dummy Data
	Map.tiles.length=0;
		// dummy map load
		var x,y,position,endY;
		Map.BLOCK_RADIUS =parseInt(Map.BLOCK_RADIUS);
		for(x=-Map.BLOCK_RADIUS;x<Map.BLOCK_RADIUS+1;x++){
			y = x>0 ? Map.BLOCK_RADIUS-x : Map.BLOCK_RADIUS;
			endY = x<0 ? -Map.BLOCK_RADIUS-x : -Map.BLOCK_RADIUS;
			for(y;y>endY-1;y--){
				position = {
					"x":x,
					"y":y,
					"z":-x-y
				};
				Map.tiles.push(Tile.new({"position":position}));
				var tile = Map.tiles[Map.tiles.length-1];
				var fertile = Math.random()-.5;
				if(Math.abs(fertile)>.35){
					tile.base.quality+=fertile;
				}
			}
		}

		// initialize timers
		TimerService.startTime()
		// initialize entity population

	// Dummy Data
		ENTITIES.list={};
		angular.forEach(ENTITIES.dummies, function(d){
			var tileIndex = Map.tiles.length*Math.random()|0;
			d(Map.tiles[tileIndex].id);
		});

		// initialize entity state
		self.update();
	};
	this.update=function(){
		if(GAME.pauseAt){
			return;
		}
		var ticks = TimerService.getTickCount();
		// advance game data by ticks for new render
		GAME.elapsed += ticks;
		GAME.previous_tick += ticks;
		GAME.tick = Date.now();
		// check for user input status

		// amend entities
		angular.forEach(ENTITIES.list,function(e){
			if(e.grows){
				e.grows(e,ticks);
			}
			if(e.nextAction){
				e.nextAction(e,ticks);
			}
		});
		
		// entity action with collision
		};
		var timer = $interval(function(){
		self.update();
		MapService.update();
	},(1000/GAME.speed),0);
	this.init();
});

trade.service('TimerService',function(GAME,$filter){
	var self=this;
	this.startTime = function(){
		var startAt = Date.now();
		GAME.log.push("Game started at "+$filter('date')(startAt,'medium'));
		GAME.elapsed = 0;
		GAME.is_running = true;
		return GAME.previous_tick=startAt;
	};
	this.getTickCount = function(){
		return Date.now() - GAME.previous_tick;
	};
});
