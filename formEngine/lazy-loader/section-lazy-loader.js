(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('sectionLazyLoader', sectionLazyLoaderDirective);

    /**@ngInject*/
    function sectionLazyLoaderDirective($compile, formEngine, formEngineApi) {
        return {
            restrict: 'E',
            scope: {
                section: '=',
                data: '='
            },
            link: function postLink(scope, element) {
                scope.formEngineApi = formEngineApi;
                var template = formEngine.getSectionTemplate(scope.section);
                $compile(element.html(template).contents())(scope);
            }
        };
    }
    
}());
