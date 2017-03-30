(function () {
    'use strict';

    angular.module('app.air').directive('lazyImage', lazyImageDirective);

    /**@ngInject*/
    function lazyImageDirective() {
        return {
            restrict: 'AEC',
            controller: lazyImageDirectiveController,
            controllerAs: 'vm',
            bindToController: {
                lazyImage: '=',
                lazyImageType: '=',
                lazyImageClass: '@',
                lazyImageCrop: '=',
                lazyImageClick: '&'
            },
            scope: {},
            transclude: true,
            templateUrl: 'directives/image/lazy-image.html'
        };
    }

    /**@ngInject*/
    function lazyImageDirectiveController($scope, fileService, $timeout) {
        var vm = this;
        vm.src = null;
        vm.loading = true;
        vm.loaded = false;
        vm.error = false;

        $scope.$watch('vm.lazyImage', function(newImg, oldImg){
            if(newImg && vm.loading || (oldImg != null && newImg[vm.lazyImageType].valueId !== oldImg[vm.lazyImageType].valueId)){
                vm.error = false;
                vm.loading = true;
                vm.loaded = false;
                vm.src=null;
                fileService.getImageByFileId(vm.lazyImage[vm.lazyImageType].valueId).then(function(data){
                    vm.src = data;
                    $timeout(function(){vm.loading = false;vm.loaded=true},200);
                }, function(){
                    vm.src = null;
                    vm.loading = false;
                    vm.loaded = false;
                    vm.error = true;
                });
            }
        });

        vm.clickCallback = function(){
            if(!vm.error){
                vm.lazyImageClick.call();
            }
        }
    }

}());
