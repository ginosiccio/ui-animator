(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('uploadimageTemplateProvider', new UploadImageTemplateProvider());

    function UploadImageTemplateProvider() {
        var component = {},
            READ_TEMPLATE = '<upload-image-component id="${id}" label="\'${label}\'" ref="${ref}" field-value="${valueRef}"' +
                ' params="::${params}" read-only="${readOnly}" value-required="${required}" api="${apiRef}">' +
                '</upload-image-component>',
            WRITE_TEMPLATE = '<upload-image-component id="${id}" label="\'${label}\'" ref="${ref}" field-value="${valueRef}"' +
                ' params="::${params}" read-only="${readOnly}" value-required="${required}" api="${apiRef}">' +
                '</upload-image-component>';

        // Public methods
        component.getReadTemplate = getReadTemplate;
        component.getWriteTemplate = getWriteTemplate;

        return component;

        // Private methods
        /**
         * Generates the read template.
         * Read templates should contain (at least) a '{{data.<componentRef>}}' to display the field value.
         * @param config the component configuration
         * @returns {string} the read to render template
         */
        function getReadTemplate(config) {
            var params = _.get(config, 'params');
            params.mode = 'READ';
            return READ_TEMPLATE.replacePlaceholders({
                ref: config.ref,
                valueRef: (!config.ref || config.ref === 'undefined') ? '' : 'data.' + config.ref,
                params: angular.toJson(params).replace(/"/g, '\'')
            });
        }

        /**
         * Generates the edition template.
         * Generally, it contains the directive allowing to modify the field value.
         * @param config the component configuration
         * @returns {string} the read to render template
         */
        function getWriteTemplate(config) {
            var params = _.get(config, 'params'),
                apiRef = _.get(config, 'apiRef', '');
            params.mode = 'WRITE';
            return WRITE_TEMPLATE.replacePlaceholders({
                id: _.get(config, 'id.valueId'),
                label: _.get(config, 'labels.title', 'Missing label'),
                ref: config.ref,
                valueRef: (!config.ref || config.ref === 'undefined') ? '' : 'data.' + config.ref,
                params: angular.toJson(params).replace(/"/g, '\''),
                readOnly: config.readOnly || (apiRef + '.rules.isReadOnly(\'' + config.ref + '\', data)'),
                required: config.required || (apiRef + '.rules.isRequired(\'' + config.ref + '\', data)'),
                apiRef: apiRef
            });
        }
    }
}());
