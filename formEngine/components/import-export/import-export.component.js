(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('importExportFileComponent', importExportFileComponentDirective);

    /**@ngInject*/
    function importExportFileComponentDirective() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/core/form-engine/components/importExportFile/importExportFile.component.template.html',
            controller: 'ImportExportFileComponentCtrl as vm',
            bindToController: {
                id: '@',
                fundId: '=',
                label: '@',
                importLabel: '@',
                downloadLabel: '@',
                ref: '@',
                fieldValue: '=',
                params: '=',
                readOnly: '=',
                mode: '@',
                type: '@',
                successUploadCallback: '&',
                successDownloadCallback: '&'
            },
            scope: true
        };

    }

}());
