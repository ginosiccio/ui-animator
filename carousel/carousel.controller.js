(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('CarouselWriteComponentCtrl', CarouselWriteComponentController);

    /**@ngInject*/
    function CarouselWriteComponentController($scope, messageService, fileService, $mdDialog) {
        var vm = this;

        // Public properties
        vm.fieldName = vm.ref.replace(/\./g, '_');
        vm.images = angular.isArray(vm.fieldValue) ? vm.fieldValue : vm.fieldValue = [];
        vm.togglable = true;

        // Public methods
        vm.hasValue = hasValue;
        vm.remove = remove;
        vm.toggle = toggle;
        vm.uploadNewFile = uploadNewFile;
        vm.openCarouselModal = openCarouselModal;

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
            return !!vm.fieldValue;
        }

        function uploadNewFile(file) {
            var  reader = new FileReader();
            var image = null;
            reader.onload = function (loadEvent) {
                $scope.$apply(function () {
                    image.newContent.content = loadEvent.target.result;
                    fileService.addImage(image).then(function(data){
                        vm.images.push(data);
                    }, function(error){
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
        }

        function remove(image){
            vm.images.splice(vm.images.indexOf(image),1);
        }

        function toggle() {
            vm.display = vm.display === 'inline' ? 'wrap' : 'inline';
        }

        function openCarouselModal(image, images) {
            $mdDialog.show({
                controller: openCarouselModalController,
                locals: {
                    lazyImageType: 'original',
                    image: image,
                    images: images
                },
                templateUrl: 'app/core/form-engine/components/carousel/carousel.modal.template.html'
            });
        };

        /**@ngInject*/
        function openCarouselModalController(scope, lazyImageType, image, images) {
            scope.close = function () {
                $mdDialog.hide();
            };
            scope.lazyImageType = lazyImageType;
            scope.image = image;
            scope.images = images;
            scope.back = function(){
                var index = scope.images.indexOf(scope.image)-1;
                index = index < 0 ? scope.images.length-1 : index;
                scope.image = scope.images[index];
            };
            scope.next = function(){
                var index = scope.images.indexOf(scope.image)+1;
                index = index > scope.images.length-1 ? 0 : index;
                scope.image = scope.images[index];
            };
        }
    }

}());
