(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('refRuleService', RefRuleService);

    /**@ngInject*/
    function RefRuleService($rootScope) {
        var service = {};

        var impactedRefsByRef = {};
        var refRules = {};

        var STATUSES_BY_PRIORITY_ORDER = {
                'HIDDEN': 4,
                'READONLY': 3,
                'REQUIRED': 2,
                'TARGET': 1.5,
                'RECOMMENDED': 1,
                'OPTIONAL': 0,
                'INCLUDED': -1
            },
            STATUS_BY_FILTER_PRIORITY = {
                // Any other should never be visible
                'READONLY': 3,
                // REQUIRED & TARGET = Mandatory
                'REQUIRED': 2,
                'TARGET': 2,
                // RECOMMENDED = Next Steps
                'RECOMMENDED': 1,
                // OPTIONAL = All
                'OPTIONAL': 0
            };

        // Public properties
        service.currentFilterValue = 'OPTIONAL';

        // Public methods
        service.computeRefStatus = computeRefStatus;
        service.computeComponentStatus = computeComponentStatus;
        service.registerRefRules = registerRefRules;
        service.isStatusVisible = isStatusVisible;
        service.isVisible = isVisible;
        service.isOptional = _.partial(isStatus, _, _, 'OPTIONAL');
        service.isRequired = _.partial(isStatus, _, _, 'REQUIRED');
        service.isTarget = _.partial(isStatus, _, _, 'TARGET');
        service.isRecommended = _.partial(isStatus, _, _, 'RECOMMENDED');
        service.isReadOnly = _.partial(isStatus, _, _, 'READONLY');

        return service;

        // Private methods
        function isVisible(ref, store) {
            var status = computeRefStatus(ref, store);
            return isStatusVisible(status);
        }

        function isStatusVisible(status) {
            return status !== 'HIDDEN' &&
                STATUS_BY_FILTER_PRIORITY[service.currentFilterValue] <= STATUS_BY_FILTER_PRIORITY[status];
        }

        function isStatus(ref, store, status) {
            return computeRefStatus(ref, store) === status;
        }

        function registerRefRules(entityFieldRefs) {
            _.each(entityFieldRefs, processEntityFieldRef);

            $rootScope.$on('onRefValueChange', function (event, data) {
                onChangeValueEvent(data.ref, data.store);
            });

            function processEntityFieldRef(entityFieldRef) {
                refRules[entityFieldRef.ref] = entityFieldRef;
                _.each(entityFieldRef.rules, _.partial(computeDependencies, entityFieldRef));
            }

            function computeDependencies(entityFieldRef, rule) {
                var refDependencies = impactedRefsByRef[rule.ref];
                if (!refDependencies) {
                    refDependencies = [];
                    impactedRefsByRef[rule.ref] = refDependencies;
                }
                refDependencies.push(entityFieldRef.ref);
            }
        }

        function onChangeValueEvent(ref, store) {
            var impactedRefs = impactedRefsByRef[ref];
            if (impactedRefs) {
                impactedRefs.forEach(function (impactedRef) {
                    var newStatus = computeRefStatus(impactedRef, store);
                    broadcastNewStatusForRef(impactedRef, newStatus);
                });
            }
        }

        function computeRefStatus(ref, store) {
            var entityFieldRef = refRules[ref];
            if (_.get(entityFieldRef, 'readOnly', false)) {
                return 'READONLY';
            } else if (_.get(entityFieldRef, 'required', false)) {
                return 'REQUIRED';
            }

            var rules = _.get(entityFieldRef, 'rules'),
                computedStatus;

            computedStatus = _.reduce(rules, function(status, rule) {
                var value = _.get(store, rule.ref, null);
                value = _.get(value, 'valueCode', value);

                var valid = (rule.values.length === 0 && value) || _.indexOf(rule.values, value) !== -1;
                if (!valid) {
                    if (rule.type === 'INCLUDED') {
                        return 'HIDDEN';
                    }
                } else if (STATUSES_BY_PRIORITY_ORDER[rule.type] > STATUSES_BY_PRIORITY_ORDER[status]) {
                    return rule.type;
                }
                return status;
            }, 'OPTIONAL');

            return computedStatus;
        }

        function broadcastNewStatusForRef(ref, newStatus) {
            $rootScope.$emit('onRefStatusChange', {ref: ref, newStatus: newStatus});
        }

        function computeComponentStatus(component, store) {
            if (_.get(component, 'disabled', false)) {
                return 'HIDDEN';
            } else if (_.get(component, 'readOnly', false)) {
                return 'READONLY';
            } else if (_.get(component, 'required', false)) {
                return 'REQUIRED';
            } else {
                return computeRefStatus(component.ref, store);
            }
        }
    }
})();

