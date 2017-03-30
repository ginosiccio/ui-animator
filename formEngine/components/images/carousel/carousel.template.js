(function () {
    'use strict';

    angular
        .module('app.core')
        .constant('carouselTemplateProvider', new CarouselTemplateProvider());

    function CarouselTemplateProvider() {

        var READ_TEMPLATE  = '<carousel-read-component  id="${id}" ref="${ref}" field-value="${valueRef}" params="::${params}"></carousel-read-component>';
        var WRITE_TEMPLATE = '<carousel-write-component id="${id}" ref="${ref}" field-value="${valueRef}" params="::${params}" read-only="${readOnly}" value-required="${required}" api="${apiRef}" ></carousel-write-component>';

        // Public methods
        return {
            includeLabel: false,
            getReadTemplate: getReadTemplate,
            getWriteTemplate: getWriteTemplate
        };

        // Private methods
        /**
         * Generates the read template.
         * Read templates should contain (at least) a '{{data.<componentRef>}}' to display the field value.
         * @param config the component configuration
         * @returns {string} the read to render template
         */
        function getReadTemplate(config) {
            var params = _.get(config, 'params');
            return READ_TEMPLATE.replacePlaceholders({
                id: _.get(config, 'id.valueId'),
                ref: config.ref,
                valueRef: (!config.ref || config.ref === 'undefined') ? '' : 'data.' + config.ref,
                params: angular.toJson(params).replace(/"/g, '\''),
                filterRef: 'data.' + _.get(config, 'params.filterRef')
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
