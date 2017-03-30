(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('formEngineApi', formEngineApi);

    /**@ngInject*/
    function formEngineApi($injector, applicationService) {
        var service = {},
            registeredComponents = {};

        // Constructor
        activate();

        return service;

        // Private methods
        function activate() {
            setupRules();
            setupLookups();
            setupComponents();
            setupEntities();
        }

        function setupRules() {
            var refRuleService = $injector.get('refRuleService');
            service.rules = _.extend({}, refRuleService, new ExtendedRulesApi());

            function ExtendedRulesApi() {
                this.isFormVisible = function() { return true};
                this.isChapterVisible = isChapterVisible;
                this.isSectionVisible = isSectionVisible;
                this.isBlockVisible = isBlockVisible;

                function isChapterVisible(chapter, store) {
                    var chapterObj = _.isString(chapter) ? applicationService.getChapterById(chapter) : chapter;
                    return _.some(_.get(chapterObj, 'components'), function(component) {
                        return refRuleService.isStatusVisible(refRuleService.computeComponentStatus(component, store));
                    });
                }

                function isSectionVisible(section, store) {
                    var sectionObj = _.isString(section) ? applicationService.getSectionById(section) : section;
                    return _.some(_.get(sectionObj, 'chapters'), function (chapter) {
                        return isChapterVisible(chapter, store);
                    })
                }

                function isBlockVisible(block, store) {
                    var blockObj = _.isString(block) ? applicationService.getBlockById(block) : block;
                    return _.some(_.get(blockObj, 'sections'), function (section) {
                        return isSectionVisible(section, store);
                    });
                }
            }
        }

        function setupLookups() {
            var lookupService = $injector.get('lookupsService');
            service.lookups = {
                getValues: lookupService.getValues,
                getValueForCode: lookupService.getValueForCode,
                searchRemoteLookup: lookupService.searchRemoteLookup
            };
            service.lists = $injector.get('listService');
        }

        function setupComponents() {
            service.components = {
                hasValue: hasValue,
                getClasses: getClasses,
                get: getComponent,
                register: registerComponent,
                unregister: unregisterComponent,
                unregisterAll: unregisterAllComponents
            };

            function hasValue(id) {
                return _.result(getComponent(id), 'hasValue');
            }

            function getClasses(id, data) {
                var classes = '',
                    component = getComponent(id);
                if (component) {
                    classes = service.rules.isRequired(component.ref, data) ? ' status-required' : '';
                    classes += service.rules.isTarget(component.ref, data) ? ' status-target' : '';
                    classes += service.components.hasValue(component.id, data) ? ' component-has-value' : '';
                }
                return classes
            }

            function getComponent(id) {
                return _.get(registeredComponents, id);
            }

            function registerComponent(id, component) {
                _.set(registeredComponents, id, component);
            }

            function unregisterComponent(id) {
                _.unset(registeredComponents, id);
            }

            function unregisterAllComponents() {
                _.each(_.keys(registeredComponents), unregisterComponent);
            }
        }

        function setupEntities() {
            service.entities = $injector.get('entityService');
            service.classTerms = $injector.get('classTermsService');
        }
    }

}());
