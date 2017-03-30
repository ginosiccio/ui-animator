(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('chartsComponent', chartsComponentDirective);

    /**@ngInject*/
    function chartsComponentDirective() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/core/form-engine/components/charts/charts.component.template.html',
            controller: 'ChartsComponentCtrl',
            controllerAs: 'chartsComponentCtrl',
            bindToController: {
                id: '@',
                label: '=',
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
