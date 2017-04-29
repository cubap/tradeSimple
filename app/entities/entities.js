var Entities = angular.module('tgEntities', [
    'tgElements', //all discrete passive elemental objects
    'tgVegetation', // all unmoving, automated objects
    'tgAnimals' // all active, automated objects
]);

Entities.service('ENTITIES', function(){this.list={};});
