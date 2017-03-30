(function () {
    'use strict';

    angular
        .module('app.air')
        .controller('airHeaderCtrl', AirHeaderController);

    /**@ngInject*/
    function AirHeaderController($stateParams, $controller, $scope, $state, messageService, menuService, toolsService,
                                 breadcrumb, fundUrlParams, sidenavService, infoService, userService, formService,
                                 $mdDialog, appConfig) {
        var vm = this,
            assetClassesStrategy = {
                'main.realEstate': 'RE',
                'main.privateEquity': 'PE'
            };
        // Properties
        vm.previousState = breadcrumb.previousState;
        vm.appConfig = appConfig;

        // Methods
        vm.toggleReview = toggleReview;
        vm.goToThirdParties = goToThirdParties;
        vm.goToMainView = goToMainView;
        vm.toggleMenu = toggleMenu;
        vm.selectReview = selectReview;
        vm.createReview = createReview;
        vm.createCrmEvent = createCrmEvent;
        vm.openInfoModal = openInfoModal;
        vm.openAirShortcuts = openAirShortcuts;
        vm.displayNewSiteMap = displayNewSiteMap;

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

        function displayNewSiteMap(){
            return vm.appConfig.useNewEngine && vm.view === 'DUE_DILIGENCE' && vm.assetClass !== 'PE' && vm.assetClass !== 'RE';
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

        function openAirShortcuts(){
            resolveAssetClass();
            var mode = fundUrlParams.viewShortName({summaryView:fundUrlParams.viewToParamName(vm.view)});
            var assetClass = vm.assetClass;
            var blocks = formService.getAirShortcuts(vm.view, mode, assetClass);
            $mdDialog.show({
                controller: openAirShortcutsModalController,
                locals: {
                    mode: mode,
                    assetClass: assetClass,
                    blocks: blocks
                },
                templateUrl: 'directives/shortcuts/air-shortcuts.html'
            });
        }

        /**@ngInject*/
        function openAirShortcutsModalController(scope, mode, assetClass, blocks) {
            scope.close = function(){$mdDialog.hide();};
            scope.mode = mode;
            scope.assetClass = assetClass;
            scope.blocks = blocks;
            scope.blocksFiltered = JSON.parse(JSON.stringify(blocks));
            scope.goToBlock = function(block){goTo(block);};
            scope.goToSection = function(block, section){goTo(block, section);};
            scope.goToChapter = function(block, section, chapter){goTo(block, section, chapter);};

            scope.filterAirShortcuts = function(shortcutFilterModel){
                if(shortcutFilterModel && shortcutFilterModel.length>0){
                    scope.blocksFiltered = [];
                    angular.forEach(scope.blocks, function(b){
                        var block = JSON.parse(JSON.stringify(b));
                        block.sections = [];
                        angular.forEach(b.sections, function(s){
                            var section = JSON.parse(JSON.stringify(s));
                            section.chapters = [];
                            if(s.name.toLowerCase().indexOf(shortcutFilterModel)>-1){
                                angular.forEach(s.chapters, function(c){
                                    section.chapters.push(c);
                                });
                                block.sections.push(section);
                            } else {
                                angular.forEach(s.chapters, function(c){
                                    if(c.name.toLowerCase().indexOf(shortcutFilterModel)>-1){
                                        section.chapters.push(c);
                                    }
                                });
                                if(section.chapters.length>0){
                                    block.sections.push(section);
                                }
                            }
                        });
                        if(block.sections.length>0){
                            scope.blocksFiltered.push(block);
                        }
                    });
                } else {
                    scope.blocksFiltered = JSON.parse(JSON.stringify(blocks));
                }
            };

            function goTo(block, section, chapter){
                $state.go('main.fund', {
                    fundId: vm.fundId || $state.params.fundId,
                    assetClass: vm.assetClass,
                    summaryView: fundUrlParams.viewToParamName(vm.view),
                    reviewId: $state.params.reviewId,
                    block: block ? block.id : null,
                    sectionId: chapter ? null : section ? section.id : null,
                    chapterId: chapter ? chapter.id : null
                });
                scope.close();
            }
        }
    }
}());
