(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('CarouselReadComponentCtrl', CarouselReadComponentController);

    /**@ngInject*/
    function CarouselReadComponentController($mdDialog) {
        var vm = this;

        // Public properties
        vm.fieldName = vm.ref ? vm.ref.replace(/\./g, '_') : 'carousel_no_ref';
        vm.images = vm.fieldValue;
        vm.togglable = true;
        vm.display = "inline";

        // Public methods
        vm.hasValue = hasValue;
        vm.toggle = toggle;
        vm.openCarouselModal = openCarouselModal;

        /**
         * Used by engine to check whether the component has a value.
         *
         * @returns {boolean} true, if component has value; false, otherwise.
         */
        function hasValue() {
            return !!vm.fieldValue;
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
