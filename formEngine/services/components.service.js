(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('componentsService', componentsService);

    var FIELD_TEMPLATE = '<div class="label ${highlight}">${label}</div><div class="value">${value}</div>',
        FIELD_WITHOUT_LABEL_TEMPLATE = '${value}',
        UNKNOWN_FIELD_TEMPLATE = '<span style="color: red;">Unknown component: ${type} [${ref}]</span>';

    /**@ngInject*/
    function componentsService($injector, GenerationMode) {
        var service = {},
            generationMethods = {};

        // Public methods
        service.isRegistered = isRegistered;
        service.generateComponentTemplate = generateComponentTemplate;

        // Constructor
        activate();

        return service;

        // Private methods
        function activate() {
            _.set(generationMethods, GenerationMode.READ, 'Read');
            _.set(generationMethods, GenerationMode.WRITE, 'Write');
        }

        function getTemplateProviderName(component) {
            return component.type.toLowerCase() + 'TemplateProvider'
        }

        function isRegistered(component) {
            return $injector.has(getTemplateProviderName(component));
        }

        function getTemplateProvider(component) {
            return $injector.get(getTemplateProviderName(component));
        }

        function generateComponentTemplate(component, mode) {
            var tpl,
                templateProvider = isRegistered(component) ? getTemplateProvider(component) : null,
                includeLabel = _.get(templateProvider, 'includeLabel', true);
            if(mode === GenerationMode.WRITE || !includeLabel) {
                tpl = FIELD_WITHOUT_LABEL_TEMPLATE;
            } else {
                tpl = FIELD_TEMPLATE;
            }
            return tpl.replacePlaceholders({
                value: evaluateTemplate(component, mode, templateProvider),
                label: _.get(component, 'labels.title', 'Missing label'),
                highlight: component.highlight ? 'texthighlight' : ''
            });

            function evaluateTemplate(component, mode, templateProvider) {
                if (templateProvider) {
                    return getTemplate(component, mode, templateProvider);
                } else {
                    return UNKNOWN_FIELD_TEMPLATE.replacePlaceholders({
                        type: component.type,
                        ref: component.ref
                    });
                }
            }

            function getTemplate(component, mode, templateProvider) {
                var templateProviderMethod = 'get{0}Template'.format(generationMethods[mode || GenerationMode.READ]);
                // Invokes getReadTemplate or getWriteTemplate
                return templateProvider[templateProviderMethod](component);
            }
        }

    }

}());
