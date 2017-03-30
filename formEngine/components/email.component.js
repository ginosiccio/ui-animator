(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('emailComponent', emailComponentDirective);

    /**@ngInject*/
    function emailComponentDirective() {

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/core/form-engine/components/email/email.component.template.html',
            controller: "EmailComponentCtrl",
            controllerAs: 'emailComponentCtrl',
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
