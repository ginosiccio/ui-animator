(function () {
    'use strict';

    angular
        .module('app.air')
        .directive('onFileChange', onFileChangeDirective);

    /**@ngInject*/
    function onFileChangeDirective($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onFileChange = $parse(attrs.onFileChange)(scope);
                element.on('change', function () {
                    scope.$apply(function () {
                        onFileChange(element[0].files[0]);
                    });
                });
                scope.$on('$destroy', function () {
                    element.off('change');
                });
            }
        };
    }
})();
