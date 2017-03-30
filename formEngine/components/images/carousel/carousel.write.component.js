(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('carouselWriteComponent', carouselWriteComponentDirective);

    /**@ngInject*/
    function carouselWriteComponentDirective() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/core/form-engine/components/carousel/carousel.write.component.template.html',
            controller: 'CarouselWriteComponentCtrl',
            controllerAs: 'carouselWriteCtrl',
            bindToController: {
                id: '@',
                label: '@',
                ref: '@',
                fieldValue: '=',
                params: '=',
                readOnly: '=',
                valueRequired: '=',
                api: '='
            },
            scope: true
        };

    }

}());
