(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('chapterLazyLoader', chapterLazyLoaderDirective);

    /**@ngInject*/
    function chapterLazyLoaderDirective($compile, formEngine, GenerationMode, formEngineApi) {
        return {
            restrict: 'E',
            scope: {
                chapter: '=',
                data: '=',
                formController: '='
            },
            link: function postLink(scope, element) {
                scope.formEngineApi = formEngineApi;
                var template = formEngine.getChapterTemplate(scope.chapter, GenerationMode.WRITE);
                $compile(element.html(template).contents())(scope);
            }
        };
    }

}());
