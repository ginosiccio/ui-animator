(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('formLazyLoader', formLazyLoaderDirective);

    /**@ngInject*/
    function formLazyLoaderDirective($compile, formEngine, GenerationMode, formEngineApi, applicationService) {
        return {
            restrict: 'E',
            scope: {
                formId: '=',
                item: '=',
                mode: '@'
            },
            link: function postLink(scope, element) {
                scope.formEngineApi = formEngineApi;
                scope.data = {item: scope.item};
                var formById = applicationService.getFormById(scope.formId);
                var form = angular.copy(formById);
                form.components = form.components.map(function (component) {
                    component.ref = 'item.'+ component.ref;
                    return component;
                });
                var template = formEngine.getFormTemplate(form, GenerationMode[scope.mode]||GenerationMode.WRITE);

                $compile(element.html(template).contents())(scope);
            }
        };
    }

}());
