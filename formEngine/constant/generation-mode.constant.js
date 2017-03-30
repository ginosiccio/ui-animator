(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('GenerationMode', {
            READ: 'READ',
            WRITE: 'WRITE'
        });

}());
