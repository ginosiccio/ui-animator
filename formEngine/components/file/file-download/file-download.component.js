(function(){
    'use strict';

    /**
     * PicUpload : Upload component
     *
     * Params :
     *
     *      - model  (Object - Required)  : Object model : {name: '', file: File}
     *
     *      - change (Function - Optional): callback you need to call after the change event on input file    ex : change="vm.setFile"
     *                           setFile function will have the model as object argument.
     *
     *      - picDownloadClass (Function - Optional) : callback you need to call in order to set a class to the component (useful for validation style)
     *      - disable (Boolean - Optional) : condition to disable the component
     *      - placeholder (String - Optional) : place holder
     */

    angular.module('app.air').directive('picDownload', picDownload);

    /**@ngInject*/
    function picDownload($compile) {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: {
                url: '@',
                downloadCallback: '&',
                picDownloadClass: '&',
                disable: '=',
                isPicDownloading: '=',
                placeholder: '@',
                picWidth: '@'
            },
            controller: picDownloadController,
            compile: function (element, attrs) {
                attrs.placeholder = attrs.placeholder ? attrs.placeholder : 'Download file';
                attrs.picWidth = attrs.picWidth ? attrs.picWidth.indexOf('px')>-1 ? attrs.picWidth : attrs.picWidth + 'px' : '150px';
                return function link(scope, element) {
                    element.css('position', 'relative');
                    var containerStart = '<div class="custom-file-download" style="position: relative; width:'+scope.picWidth+'">';
                    var inputButton = '<input type="button" ng-model="model.name" value="{{placeholder}}" ng-class="picDownloadClass()" ng-style="getPicDownloadStyle()" ng-disabled="disable" ng-click="download()" style="width:calc(100% - 31px) !important;padding-right:35px;background-color:transparent;border:0 solid #cccccc;border-bottom-width:1px;text-align:left;color:rgb(139, 139, 139)">';
                    var icon = '<div style="position:absolute;right:31px;top:-2px;width:27px;height:27px;"><div spinner-button ng-if="isPicDownloading" class="ui-anim-fade"></div><i class="material-icons ui-anim-fade" style="position:absolute;top:2px;right:0;color:#3e505e;" ng-if="!isPicDownloading">file_download</i></div>';
                    var containerEnd = '</div>';
                    element.html(containerStart +inputButton +icon +containerEnd);
                    $compile(element.contents())(scope);

                };
            }
        };
        return directive;
    }

    /**@ngInject*/
    function picDownloadController($scope) {
        $scope.getPicDownloadStyle = function(){
            var enableStyle = {cursor: 'pointer'};
            var disableStyle = {cursor: 'inherit'};
            return angular.isDefined($scope.disable) && $scope.disable === true ? disableStyle : enableStyle;
        };
        $scope.download = function(){
            if(!$scope.disable){
                $scope.downloadCallback()();
            }
        };
    }

})();
