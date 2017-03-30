(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('carouselReadComponent', carouselReadComponentDirective);

    /**@ngInject*/
    function carouselReadComponentDirective() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/core/form-engine/components/carousel/carousel.read.component.template.html',
            controller: 'CarouselReadComponentCtrl',
            controllerAs: 'carouselReadCtrl',
            bindToController: {
                id: '@',
                label: '@',
                ref: '@',
                fieldValue: '=',
                params: '=',
                readOnly: '=',
                api: '='
            },
            scope: true
        };

    }

}());
