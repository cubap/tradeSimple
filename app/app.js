var trade = angular.module('Trade', ['ui.router', 'tgEntities']);

trade.constant("TICKS_PER_SECOND", 25);
trade.constant("SKIP_TICKS", 1000 / 25);
trade.constant("MAX_FRAMESKIP", 10);

trade.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/game');
    $stateProvider
        .state('gameTest', {
            url: '/game',
            templateUrl: 'app/game/game.html',
            controller: 'gameController'
        })
        .state('phaseTest', {
            url: '/phase',
            templateUrl: 'app/phase/phase.html',
            controller: function() { gameInit(); }
        });
});