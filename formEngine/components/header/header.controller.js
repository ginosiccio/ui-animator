(function () {
    'use strict';

    angular
        .module('app.layout')
        .controller('HeaderCtrl', HeaderController);

    /**@ngInject*/
    function HeaderController($stateParams, $controller, $scope, $state, messageService, menuService, toolsService,
                              fundUrlParams, sidenavService, infoService, userService, navigationService) {
        var vm = this,
            assetClassesStrategy = {
                'main.realEstate': 'RE',
                'main.privateEquity': 'PE'
            };
        // Properties
        vm.backTo = {};
        navigationService.onChangeRoute(function(routeDesc) {
            vm.backTo = {displayName: routeDesc};
        });
        navigationService.updateDisplayName();
        vm.previousState = navigationService.previousState;
        vm.$state = $state;

        $scope.$watch('headerCtrl.$state.current.name', function(newVal){
            vm.actionVisible = newVal === 'application.block' ? true : false;
        });

        // Methods
        vm.toggleReview = toggleReview;
        vm.goToThirdParties = goToThirdParties;
        vm.goToMainView = goToMainView;
        vm.toggleMenu = toggleMenu;
        vm.selectReview = selectReview;
        vm.createReview = createReview;
        vm.createCrmEvent = createCrmEvent;
        vm.openInfoModal = openInfoModal;

        $scope.closeInfoModal  = closeInfoModal;

        infoService.getInfo().then(function(info){
            $scope.info = info;
        });

        userService.getUserInfo().then(function (userInfo) {
            $scope.userInfo = userInfo;
        });

        $scope.modalTitle = 'Info';


        // Private methods
        function createCrmEvent(fundId, assetClass) {
            if (toolsService.isUndefined(fundId)) {
                fundId = $state.params.fundId;
            }
            if (toolsService.isDefined(fundId)) {
                $state.go('main.createCrmEvent', {
                    fundId: fundId,
                    assetClass: assetClass || $stateParams.assetClass,
                    block: $stateParams.block,
                    summaryView: fundUrlParams.viewToParamName(vm.view),
                    reviewId: $stateParams.reviewId
                });
            }
        }

        function toggleReview() {
            if (vm.view === 'REVIEW') {
                vm.view = 'DUE_DILIGENCE';
            } else {
                vm.view = 'REVIEW';
            }
            $stateParams.summaryView = fundUrlParams.viewToParamName(vm.view);
            $state.transitionTo($state.current, $stateParams, {notify: false});
        }

        function goToThirdParties(fundId, assetClass) {
            if (toolsService.isUndefined(fundId)) {
                fundId = $state.params.fundId;
            }
            if (!assetClass) {
                assetClass = assetClassesStrategy[$state.current.name] || 'HF';
            }
            if (toolsService.isDefined(fundId)) {
                $state.go('main.thirdParties', {
                    fundId: fundId,
                    assetClass: assetClass,
                    block: $stateParams.block,
                    summaryView: fundUrlParams.viewToParamName(vm.view),
                    reviewId: $stateParams.reviewId
                });
            } else {
                messageService.showError('Please select a fund first');
            }
        }

        function resolveAssetClass() {
            if (!vm.assetClass && $state.params.assetClass) {
                vm.assetClass = $state.params.assetClass;
            }
            if (vm.assetClass === 'RE') {
                vm.assetClass = 'PE';
            }
        }

        function goToMainView(reviewId) {
            if ((!vm.fundId && !$state.params.fundId)) {
                return;
            }
            resolveAssetClass();
            if (!vm.assetClass) {
                return;
            }
            $state.go('main.fundGlobal', {
                fundId: vm.fundId || $state.params.fundId,
                assetClass: vm.assetClass,
                summaryView: fundUrlParams.viewToParamName(vm.view),
                reviewId: reviewId || $state.params.reviewId
            });
        }

        function toggleMenu($event) {
            $event.stopImmediatePropagation();
            $event.preventDefault();
            menuService.toggle();
        }

        function selectReview(selectedReviewId) {
            vm.view = 'REVIEW';
            $stateParams.summaryView = fundUrlParams.viewToParamName(vm.view);
            goToMainView(selectedReviewId);
        }

        function createReview() {
            var reviewCreationCtrl = $scope.$new(true);
            $controller('ReviewCreationCtrl', {
                $scope: reviewCreationCtrl,
                fundData: {
                    fundId: vm.fundId
                }
            });
            reviewCreationCtrl.create();
        }

        function openInfoModal(){
            doCallSideNavAction(true);
        }

        function closeInfoModal(){
            doCallSideNavAction(false);
        }

        function doCallSideNavAction(openSideNav){
            var sideNav = 'sideNavRight';
            if(openSideNav) {
                sidenavService.compileAndOpenSideNav('directives/infoModal/infoModal.html', sideNav, $scope);
            } else {
                sidenavService.closeSideNav(sideNav);
            }
        }
    }
}());
