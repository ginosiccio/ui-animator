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
     *      - picUploadClass (Function - Optional) : callback you need to call in order to set a class to the component (useful for validation style)
     *      - disable (Boolean - Optional) : condition to disable the component
     *      - placeholder (String - Optional) : place holder
     */

    angular.module('app.air').directive('picUpload', picUpload);

    /**@ngInject*/
    function picUpload($compile) {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: {
                model: '=',
                uploadCallback: '&',
                picUploadClass: '&',
                disable: '=',
                placeholder: '@',
                isPicUploading: '=',
                picWidth: '@'
            },
            controller: picUploadController,
            compile: function (element, attrs) {
                attrs.placeholder = attrs.placeholder ? attrs.placeholder : 'Select a file';
                attrs.picWidth = attrs.picWidth ? attrs.picWidth.indexOf('px')>-1 ? attrs.picWidth : attrs.picWidth + 'px' : '150px';
                return function link(scope, element) {
                    element.css('position', 'relative');

                    var containerStart = '<div class="custom-file-upload" style="position: relative; width:'+scope.picWidth+'">';
                    var inputFile = '<input type="file" ng-model="model.file" file-on-change="picUploadCallback" ng-style="getPicUploadStyle()" ng-disabled="disable" style="position:absolute;top:0;left:-147px;margin:0;padding:0;cursor:pointer;opacity:0;filter:alpha(opacity=0);z-index:2;height:21px;width: calc(100% -- 116px) !important;">';
                    var inputText = '<input type="text" ng-model="model.name" placeholder="{{placeholder}}" ng-class="picUploadClass()" ng-disabled="true" style="width: calc(100% - 31px) !important;padding-right:35px;background-color:transparent;border: 0 solid #cccccc;border-bottom-width:1px;padding-left:5px;">';
                    var icon = '<div style="position:absolute;right:31px;top:-2px;width:27px;height:27px;"><div spinner-button ng-if="isPicUploading" class="ui-anim-fade"></div><i class="material-icons ui-anim-fade" style="position: absolute;top:2px;right:0;color: #3e505e;" ng-if="!isPicUploading">file_upload</i></div>';
                    var containerEnd = '</div>';

                    element.html(containerStart +inputFile +inputText +icon +containerEnd);

                    $compile(element.contents())(scope);

                    scope.$watch('model.file', function (newVal, oldVal) {
                        if(newVal !== oldVal && newVal == null ){
                            var input = element.find("input")[0];
                            if(input){
                                input.value = null; //Reset value
                            }
                        }
                    });

                };
            }
        };
        return directive;
    }

    /**@ngInject*/
    function picUploadController($scope) {
        $scope.getPicUploadStyle = function(){
            var enableStyle = {cursor: 'pointer'};
            var disableStyle = {cursor: 'inherit'};
            return angular.isDefined($scope.disable) && $scope.disable === true ? disableStyle : enableStyle;
        };
        $scope.picUploadCallback = function(){
            if(!$scope.disable && event.target.files[0]){
                $scope.model.name = event.target.files[0].name;
                $scope.model.file = event.target.files[0];
                if($scope.uploadCallback && angular.isFunction($scope.uploadCallback())){
                    $scope.uploadCallback()($scope.model);
                } else {
                    $scope.$digest();
                }
            }
        };
    }


    angular.module('app.air').directive('fileOnChange', fileOnChange);

    /**@ngInject*/
    function fileOnChange() {
        var directive = {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeFunc = scope.$eval(attrs.fileOnChange);
                element.bind('change', onChangeFunc);
            }
        };
        return directive;
    }


})();
