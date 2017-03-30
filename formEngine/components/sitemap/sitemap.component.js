(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('siteMapComponent', SiteMapComponentDirective);

    /**@ngInject*/
    function SiteMapComponentDirective() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div><md-button aria-label="shortcutsForm" class="md-icon-button apps" ng-click="siteMapCtrl.openSiteMap()"><md-icon md-svg-src="assets/img/icons-md/air-shortcuts.svg"></md-icon></md-button></div>',
            controller: 'SiteMapComponentCtrl as siteMapCtrl',
            scope: true
        };
    }

}());
