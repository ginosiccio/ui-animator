(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('EmailComponentCtrl', EmailComponentController);

    /**@ngInject*/
    function EmailComponentController($scope) {
        var vm = this;

        // Public properties
        vm.fieldName = vm.ref.replace(/\./g, '_');

        // Public methods
        vm.hasValue = hasValue;

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
            return !_.isEmpty(vm.fieldValue);
        }

    }

}());
