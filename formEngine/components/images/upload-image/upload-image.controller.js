(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('UploadImageComponentCtrl', UploadImageComponentCtrl);

    /**@ngInject*/
    function UploadImageComponentCtrl($scope, ENV, GenerationMode, fileService, $mdDialog, $detection, messageService) {
        var vm = this;

        // Public properties
        vm.fieldName = vm.ref.replace(/\./g, '_');

        // Public methods
        vm.hasValue = hasValue;

        vm.isDesktop = $detection.isDesktop();
        vm.loading = false;
        vm.GM = GenerationMode;
        vm.baseImageUrl = ENV.apiEndPoint + '/image/';
        vm.extension = '.jpeg'; // Files can be requested by .png,.jpg,.jpeg

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
            return !_.isEmpty(vm.fieldValue) && !_.isNil(vm.fieldValue) && !_.isNil(vm.fieldValue.valueId);
        }

        vm.getUrlImage = function(_imageType){
            if(_.isNil(vm.image) && !vm.loading && vm.fieldValue){
                vm.loading = true;
                fileService.getImageByImageId(vm.fieldValue.valueId).then(function(image){
                    vm.image = image;
                    vm.loading = false;
                }, function(error){
                    vm.loading = false;
                });
            }
            var imageType = _imageType ?  _imageType : vm.params && vm.params.imageType ? vm.params.imageType : 'thumbnail';
            return vm.baseImageUrl + vm.fieldValue.valueId + '/' + imageType + '.jpeg';
        }

        vm.uploadNewFile = function (file) {
            var  reader = new FileReader();
            var image = null;
            vm.loading = true;
            reader.onload = function (loadEvent) {
                $scope.$apply(function () {
                    image.newContent.content = loadEvent.target.result;
                    fileService.addImage(image).then(function(data){
                        vm.loading = false;
                        vm.image = data;
                        vm.fieldValue = data.id;
                    }, function(error){
                        vm.loading = false;
                        messageService.showError("An error occured on uploading the file. " +(error.error ? error.error : error.message));
                    });
                });
            };
            if (file) {
                image = {'newContent': {}};
                if (file.type.match('image.*')) {
                    var size = file.size/1024/1024;
                    if(size<=1){
                        image.newContent.size = file.size;
                        image.newContent.name = file.name;
                        image.newContent.type = file.type;
                        reader.readAsDataURL(file);
                    } else {
                        messageService.showError("The file must not exceed 1MB and the size is " + size + "MB");
                    }
                } else {
                    messageService.showError("Only image file is accepted.");
                }
            }
        };

        vm.remove = function(){
            vm.fieldValue.valueId = null;
        };

        vm.openImage = function (event) {
            event.preventDefault();
            $mdDialog.show({
                controller: openUploadImageModalController,
                locals: {
                    imageTitle : vm.image.name,
                    imageUrl: vm.getUrlImage($detection.isMobile() ? 'mobile' : 'desktop')
                },
                template: '<md-dialog aria-label="imageTitle" class="show-image-modal">'+
                '<md-dialog-content><img no-cache-src="{{imageUrl}}" title="{{imageTitle}}"></md-dialog-content>'+
                '</md-dialog>',
                clickOutsideToClose: true
            });
        };

        /**@ngInject*/
        function openUploadImageModalController(scope, imageTitle, imageUrl) {
            scope.close = function () {$mdDialog.hide();};
            scope.imageTitle = imageTitle;
            scope.imageUrl = imageUrl;
        }

    }

}());
