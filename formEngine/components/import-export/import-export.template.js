(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('importexportfileTemplateProvider', new ImportExportFileTemplateProvider());

    function ImportExportFileTemplateProvider() {
        var component = {},
            READ_TEMPLATE =
            '<div class="import-export-file-empty"></div>',
            WRITE_TEMPLATE = '<import-export-file-component id="${id}" fund-id="${fundId}" import-label="${importLabel}" download-label="${downloadLabel}"\
            label="${label}" ref="${ref}" field-value="${valueRef}"\
            params="::${params}" read-only="${readOnly}" post-label-value="${postLabelValue}">\
            </import-export-file-component>';

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
            return READ_TEMPLATE.replacePlaceholders({
                ref: config.ref,
                postLabel: _.get(config, 'labels.postLabel', '')
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
            return WRITE_TEMPLATE.replacePlaceholders({
                id: _.get(config, 'id.valueId'),
                fundId: 'data.fundId',
                label: _.get(config, 'labels.title', 'Missing label'),
                importLabel: _.get(config, 'labels.import','Missing label'),
                downloadLabel: _.get(config, 'labels.download','Missing label'),
                postLabelValue: _.get(config, 'labels.postLabel', ''),
                ref: config.ref,
                valueRef: (!config.ref || config.ref === 'undefined') ? '' : 'data.' + config.ref,
                params: angular.toJson(params).replace(/"/g, '\''),
                readOnly: config.readOnly || (apiRef + '.rules.isReadOnly(\'' + config.ref + '\', data)'),
                apiRef: apiRef
            });
        }
    }
}());
