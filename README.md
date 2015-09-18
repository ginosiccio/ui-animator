'use strict';

/*
* ui.animator is a lib which expose different components in order to animate html element with different animation from libs/frameworks
* and works with angularJS.
*
* The rule is the following :
*
* The components will interact on the element where it has been declared and on their children, it will change some css properties, so you
* must use css class to decorate your components and children but never use directly the style attribute as it could be overridden.
*
* Don't do this : <button style="height:32px"></button>
*   But do this : <button class="h32"></button>
*
* You can include ui.animator which include all their sub animator components like this : angular.module('myApp', ['ui.animator'])
* OR
* You can include sub animator components by type like this :  angular.module('myApp', ['ui.animator.spinner'])
* OR
* You can include one by one animator component like this :  angular.module('myApp', ['ui.animator.spinner.spinButtonOn'])
*
* */

angular.module('ui.animator', ['ui.animator.spinner']);

/*
* ui.animator.spinner
*
* This module exposes different spinner components regarding the spin.js lib.
*
* */
angular.module('ui.animator.spinner',['ui.animator.spinner.spinButtonOn']);


/*
 * ui.animator.spinner.spinButtonOn
 *
 * This module exposes a spinner which works on button.
 *
 * */
angular.module('ui.animator.spinner.spinButtonOn',[])
    /*
    *
    * This directive is used with the html <button> tag and works especially with bootstrap and glyphicon icons.
    *
    * The idea is when the button is clicked and an action is pending, we replace the target element (ex:icon) inside the button with a spinner.
    * when the action has finished.
    *
    * options :
    *   {
    *       state: false,                       (boolean) : it drives when the spinner appears and disappears.
    *       targetId: "myDivId"                 (String)  : this is the html element id which be replaced by the spinner.
    *       targetClass: "myClass"              (String)  : this is the html element class which be replaced by the spinner.
    *       defaultOpts: 's'                    (String)  : (s/m) this is the default options of the spinner (see spin.js docs)
    *       spinnerOptions: {color:black,...}   (Object)  : this is the overriding options object for the spinner (see spin.js docs)
    *
    *   };
    *
    * */
    .directive('spinButtonOn', function() {
        return {
            scope:{
                options:'=spinButtonOn'
            },
            controller: function($scope){
                var defaultColor = '#333333';
                var defaultButtonOptions = {off:false, style:"color:"+defaultColor};
                var sOpts = {lines:15,length:0,width:3,radius:5,corners:1.0,rotate:2,trail:47,speed:1.1,direction:1,color:defaultColor};
                var mOpts = {lines:17,length:0,width:3,radius:13,corners:0.3,rotate:44,direction:1,speed:1,trail:64,color:defaultColor};
                $scope.options.spinnerOptions = $scope.options.spinnerOptions ? angular.extend(sOpts, $scope.options.spinnerOptions) : $scope.options.defaultOpts && $scope.options.defaultOpts == 'm' ? mOpts : sOpts
                $scope.options.buttonOptions = $scope.options.buttonOptions ? angular.extend(defaultButtonOptions, $scope.options.buttonOptions) : defaultButtonOptions;
                $scope.options.uuid = JsTools.uuid.create();
                $scope.container = document.createElement("span");
                $scope.container.setAttribute("id", $scope.options.uuid);
            },
            link : function(scope, element) {
                scope.element = element[0];
                scope.target = scope.options.targetClass ? scope.element.querySelector("."+scope.options.targetClass+"") : scope.element.querySelector("[id='"+scope.options.targetId+"']");
                scope.parent = scope.target.parentNode;

                if(!scope.element.querySelector("[id='"+scope.options.uuid+"']")){
                    scope.parent.insertBefore(scope.container, scope.target);
                }
                scope.$watch('options.state', function(state){
                    if(state){
                        scope.spinner  = scope.spinner ? scope.spinner.spin(scope.container) : new Spinner(scope.options.spinnerOptions).spin(scope.container);
                        if(!scope.options.buttonOptions.off){
                            scope.element.setAttribute("style", scope.options.buttonOptions.style);
                        }
                        scope.container.setAttribute("style", "display:inline-block;position:relative;line-height:1;height:"+scope.target.offsetHeight+"px;width:"+ scope.target.offsetWidth+"px");
                        scope.target.style.display = 'none';
                    } else {
                        scope.container.style.display = 'none';
                        scope.target.style.display = 'inline-block';
                        if(!scope.options.buttonOptions.off){
                            scope.element.setAttribute("style", "");
                        }
                        scope.spinner ? scope.spinner.stop() : null;
                    }
                });
                element.on('$destroy', function() {
                    scope.spinner.stop();
                    delete scope.spinner;
                });
            }
        };
});

(function(){
    var _JsTools = function(){};
    _JsTools.prototype.uuid = {
        create: function(){
              var s = [];
              var hexDigits = "0123456789abcdef";
              for (var i = 0; i < 36; i++) {s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);}
              s[14] = "4";
              s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
              s[8] = s[13] = s[18] = s[23] = "-";
              return s.join("");
        }
    };

    window.JsTools = new _JsTools();
})();
