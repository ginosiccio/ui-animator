(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('uploadImageComponent', uploadImageComponentDirective);

    /**@ngInject*/
    function uploadImageComponentDirective() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/core/form-engine/components/uploadImage/uploadImage.component.template.html',
            controller: 'UploadImageComponentCtrl',
            controllerAs: 'uploadImageComponentCtrl',
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
