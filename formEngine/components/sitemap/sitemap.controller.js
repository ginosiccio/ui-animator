(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('SiteMapComponentCtrl', SiteMapComponentController);

    /**@ngInject*/
    function SiteMapComponentController($state, applicationService, $stateParams, $mdDialog, fundUrlParams) {
        var vm = this;
        vm.openSiteMap = openSiteMap;

        function openSiteMap(){
            var isOldEngine = false; //TODO: remove this hack when old engine will be deleted
            var book = null;
            if($stateParams.blockId){
                book = applicationService.getBookByBlockId($stateParams.blockId);
            } else {
                var bookId = $stateParams.assetClass + fundUrlParams.viewShortName($stateParams.summaryView ? {summaryView:$stateParams.summaryView} : {summaryView:'DUE_DILIGENCE'});
                book = applicationService.getBookById(bookId);
                isOldEngine = true;
            }
            $mdDialog.show({
                controller: openSiteMapModalController,
                locals: {
                    blocks: book.blocks,
                    isOldEngine: isOldEngine
                },
                templateUrl: 'app/core/components/sitemap/sitemap.component.template.html'
            });
        }

        /**@ngInject*/
        function openSiteMapModalController(scope, blocks, isOldEngine) {
            scope.close = function(){$mdDialog.hide();};
            scope.blocks = JSON.parse(JSON.stringify(blocks));
            angular.forEach(scope.blocks, function(b){
                angular.forEach(b.sections, function(s){
                    angular.forEach(s.chapters, function(c){
                        c.highlight = _.find(c.components, {highlight:true}) ? true : false;
                    });
                });
            });
            scope.blocksFiltered = JSON.parse(JSON.stringify(scope.blocks));
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
                            if(s.title.toLowerCase().indexOf(shortcutFilterModel.toLowerCase())>-1){
                                angular.forEach(s.chapters, function(c){
                                    section.chapters.push(c);
                                });
                                block.sections.push(section);
                            } else {
                                angular.forEach(s.chapters, function(c){
                                    if(c.title.toLowerCase().indexOf(shortcutFilterModel.toLowerCase())>-1){
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
                    scope.blocksFiltered = JSON.parse(JSON.stringify(scope.blocks));
                }
            };

            function goTo(block, section, chapter){
                $state.go('application.block', {
                    rootId: isOldEngine ? $stateParams.fundId : $stateParams.rootId,
                    blockId: block ? block.id.valueId : null,
                    sectionId: chapter ? null : section ? section.id.valueId : null,
                    chapterId: chapter ? chapter.id.valueId : null
                });
                scope.close();
            }
        }
    }
}());
