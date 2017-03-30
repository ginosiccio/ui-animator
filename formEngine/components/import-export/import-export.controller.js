(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('ImportExportFileComponentCtrl', ImportExportFileComponentController);

    /**@ngInject*/
    function ImportExportFileComponentController($scope, messageService, dueDiligenceService, navigationService, trackRecordImportExportService, aumImportExportService) {
        var vm = this;

        //Public constants
        var AUM = "AUM";
        var TRACK_RECORD = "TRACK_RECORD";

        // Public properties
        vm.fieldName = vm.ref.replace(/\./g, '_');
        vm.exportFile = {name: null, file: null};
        vm.isUploading = false;
        vm.isDownloading = false;

        // Public methods
        vm.hasValue = hasValue;
        vm.uploadFile = uploadFile;
        vm.downloadFile = downloadFile;
        vm.successUploadCallback = successUploadCallback;
        vm.successDownloadCallback = successDownloadCallback;

        // Constructor
        activate();

        // Private methods
        function activate() {
            if (vm.api) {
                // Register component
                vm.api.components.register(vm.id, vm);
                // Prepare to unregister component when component is destroyed
                $scope.$on('$destroy', angular.bind(vm.api, vm.api.components.unregister, vm.id));
            }
        }

        /**
         * Used by engine to check whether the component has a value.
         *
         * @returns {boolean} true, if component has value; false, otherwise.
         */
        function hasValue() {
            return true;
        }

        function uploadFile(param) {
            vm.isUploading = true;
            if (vm.params.name === TRACK_RECORD) {
                trackRecordImportExportService.upload(vm.fundId, param).then(function () {
                    vm.isUploading = false;
                    vm.exportFile.file = null;
                    angular.isFunction(vm.successUploadCallback) ? vm.successUploadCallback() : null;
                }, function (error) {
                    vm.isUploading = false;
                    vm.exportFile.file = null;
                    messageService.showRawError(error);
                });
            } else if (vm.params.name === AUM) {
                aumImportExportService.upload(vm.fundId, param).then(function () {
                    vm.isUploading = false;
                    vm.exportFile.file = null;
                    angular.isFunction(vm.successUploadCallback) ? vm.successUploadCallback() : null;
                }, function (error) {
                    vm.isUploading = false;
                    vm.exportFile.file = null;
                    messageService.showRawError(error);
                });
            }

        }

        function downloadFile() {
            vm.isDownloading = true;
            if (vm.params.name === TRACK_RECORD) {
                trackRecordImportExportService.download(vm.fundId).then(function () {
                    vm.isDownloading = false;
                    angular.isFunction(vm.successDownloadCallback) ? vm.successDownloadCallback() : null;
                }, function (error) {
                    vm.isDownloading = false;
                    vm.exportFile.file = null;
                    messageService.showRawError(error);
                });
            } else if (vm.params.name === AUM) {
                aumImportExportService.download(vm.fundId).then(function () {
                    vm.isDownloading = false;
                    angular.isFunction(vm.successDownloadCallback) ? vm.successDownloadCallback() : null;
                }, function (error) {
                    vm.isDownloading = false;
                    vm.exportFile.file = null;
                    messageService.showRawError(error);
                });
            }
        }


        function successDownloadCallback() {
        }

        function successUploadCallback() {
            dueDiligenceService.clearStoredDueDiligence();
            navigationService.previousState();
        }


    }
}());
