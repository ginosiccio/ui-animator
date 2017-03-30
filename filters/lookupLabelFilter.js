(function () {
    'use strict';

    angular
        .module('app.air')
        .filter('lookupLabel', lookupLabelFilter);

    /**@ngInject*/
    function lookupLabelFilter(lookupService) {

        searchInList.$stateful = true;//In order to load the elastic object lookup name asynchronously

        return searchInList;

        /**
         * Returns the lookup label (name field) searching in lookupName by code.
         * @param {string} code the code to look for in lookup value list.
         * @param {string} lookupName lookup name.
         * @returns {string} the name of the found value; or an empty string otherwise.
         */
        function searchInList(code, lookupName) {
            return lookupName === null ? code : lookupService.getLookupValue(lookupName, code);
        }
    }

}());
