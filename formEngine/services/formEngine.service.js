(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('formEngine', formEngine);

    /**@ngInject*/
    function formEngine($cacheFactory, componentsService, aclsService, userService, GenerationMode) {
        // TODO Mutualiser le code commun entre generateChapter et generateForm
        var service = {},
            templateCache,
            SCOPE_DATA = 'data',
            FORM_ENGINE_API = "formEngineApi",
            TITLE_TEMPLATE = '<title-half-bold text="${text}" cls="${classes}" ${extra}></title-half-bold>',
            SECTION_TEMPLATE = '<div class="section shadow-bottom">${title}</div>${template}',
            CHAPTER_TEMPLATE = '<div class="chapter shadow-bottom ${extraClasses}" id="${chapterId}" ${visibility}>${template}</div>',
            FORM_TEMPLATE = '<div class="form ${extraClasses}" id="${chapterId}" ${visibility}>${template}</div>',
            CHAPTER_BODY_TEMPLATE = '<div class="chapterbody {1}">{0}</div>',
            FORM_BODY_TEMPLATE = '<div class="{1}">{0}</div>',
            FIELD_TEMPLATE = '<div ${visibility} ${classes} class="field">${template}</div>',
            CLICK_CHAPTER_TEMPLATE = 'role="button" ui-sref="application.chapter({chapterId: {0}, rootId: {1}, entity: {}})"',
            VISIBILITY_TEMPLATE = 'ng-if="${api}.rules.${method}(\'${ref}\', ${data})"',
            CLASSES_TEMPLATE = 'ng-class="${api}.components.getClasses(\'${id}\', ${data})"';

        // Public methods
        service.getSectionTemplate = getSectionTemplate;
        service.getChapterTemplate = getChapterTemplate;
        service.getFormTemplate = getFormTemplate;

        // Constructor
        activate();

        return service;

        // Private members
        function activate() {
            templateCache = $cacheFactory('formEngine.templateCache');
        }

        function getSectionTemplate(section) {
            var sectionKey = getSectionKey(section),
                template = templateCache.get(sectionKey);
            if (!template) {
                template = generateSectionTemplate(section);
                templateCache.put(sectionKey, template);
            }
            return template;

            function getSectionKey(section) {
                return 'section/{0}/template'.format(section.id.valueId);
            }

            function generateSectionTemplate(section) {
                return generateSectionHeader(
                    section,
                    _.map(section.chapters, _.partial(getChapterTemplate, _, GenerationMode.READ)).join('')
                );
            }

            function generateSectionTitle(section) {
                return TITLE_TEMPLATE.replacePlaceholders({
                    text: section.title,
                    classes: '',
                    extra: ''
                });
            }

            function generateSectionHeader(section, template) {
                return SECTION_TEMPLATE.replacePlaceholders({
                    template: template || '',
                    title: generateSectionTitle(section)
                });
            }
        }

        function isWriteMode(mode) {
            return mode === GenerationMode.WRITE;
        }

        function getChapterTemplate(chapter, mode) {
            var generationMode = mode || GenerationMode.READ,// defaults to read-only template
                components = filterComponentsByAcls(mode, chapter.components),
                groups = groupChapterComponents(components),
                template = resolveTemplate(),
                extraCls = isWriteMode(generationMode) ? 'editing-chapter new-engine' : '';

            return CHAPTER_TEMPLATE.replacePlaceholders({
                template: template,
                chapterId: chapter.id.valueId,
                extraClasses: extraCls,
                visibility: generateChapterVisibility()
            });

            function generateChapterVisibility() {
                return VISIBILITY_TEMPLATE.replacePlaceholders({
                    api: FORM_ENGINE_API,
                    ref: chapter.id.valueId,
                    data: SCOPE_DATA,
                    method: 'isChapterVisible'
                });
            }

            function resolveTemplate() {
                var template,
                    writeMode = isWriteMode(generationMode),
                    chapterCacheKey;
                if (writeMode) {
                    chapterCacheKey = getChapterKey(chapter);
                    template = templateCache.get(chapterCacheKey);
                }
                if (!template) {
                    template =
                        // Chapter title
                        generateChapterTitle(chapter) +
                        // Chapter groups
                        _.map(groups, generateGroupTemplate).join('');
                    if (writeMode) {
                        templateCache.put(chapterCacheKey, template);
                    }
                }
                return template;
            }

            function getChapterKey(chapter) {
                return 'chapter/{0}/template'.format(chapter.id.valueId);
            }

            function generateChapterTitle(chapter) {
                var click = generateClick(chapter, generationMode);
                return TITLE_TEMPLATE.replacePlaceholders({
                    text: chapter.title,
                    classes: 'chapterheader',
                    extra: click
                });
            }

            function generateClick(chapter, mode) {
                var click = '';
                if (!isWriteMode(mode) && filterComponentsByAcls(GenerationMode.WRITE, chapter.components).length > 0) {
                    click = CLICK_CHAPTER_TEMPLATE.format('\'' + chapter.id.valueId + '\'', 'data.rootId');
                }
                return click;
            }

            // Filtering components regarding Acls and user permission
            function filterComponentsByAcls(mode, components){
                var acls = aclsService.getAcls();
                return _.filter(components, function(component){
                    var acl = _.find(acls, _.matchesProperty('id.valueId', component.aclId.valueId)),
                        // read permissions field
                        perms = _.get(acl, mode.toLowerCase() + 'Permissions');
                    return userService.userHasPermissionFromArray(perms);
                });
            }

            function groupChapterComponents(components) {
                var groups = [],
                    currentGroup,
                    lastFullWidth;
                angular.forEach(components, function (component) {
                    var componentFullWidth = _.get(component, 'params.fullWidth', false),
                        componentOnNewLine = _.get(component, 'params.onNewLine', false) == 'true';
                    if (shouldOpenNewGroup(componentFullWidth, componentOnNewLine)) {
                        currentGroup = openNewGroup(componentFullWidth);
                        groups.push(currentGroup);
                    }
                    currentGroup.components.push(component);
                    lastFullWidth = componentFullWidth;
                });
                return groups;

                function shouldOpenNewGroup(fullWidth, onNewLine) {
                    return angular.isUndefined(lastFullWidth) || lastFullWidth !== fullWidth || onNewLine === true;
                }

                function openNewGroup(fullWidth) {
                    return {
                        fullWidth: fullWidth,
                        components: []
                    };
                }
            }

            function generateGroupTemplate(group) {
                var groupExtraClass = group.fullWidth ? '' : 'columns',
                    groupBody = _.map(group.components, generateComponentTemplate).join('');
                return CHAPTER_BODY_TEMPLATE.format(groupBody, groupExtraClass);
            }

            function generateComponentTemplate(component) {
                var configWithApi = _.extend({}, component, {apiRef: FORM_ENGINE_API});
                return FIELD_TEMPLATE.replacePlaceholders({
                    template: componentsService.generateComponentTemplate(configWithApi, generationMode),
                    visibility: generateComponentVisibility(configWithApi),
                    classes: generateComponentClasses(configWithApi)
                });
            }

            function generateComponentVisibility(component) {
                if (_.get(component, 'disabled', false)) {
                    // Component is disabled in configuration, meaning it won't appear in screen
                    return false;
                }
                // 'data' is a reference to store in context
                return VISIBILITY_TEMPLATE.replacePlaceholders({
                    api: FORM_ENGINE_API,
                    ref: component.ref,
                    data: SCOPE_DATA,
                    method: 'isVisible'
                });
            }

            function generateComponentClasses(component) {
                return CLASSES_TEMPLATE.replacePlaceholders({
                    id: component.id.valueId,
                    data: SCOPE_DATA,
                    api: FORM_ENGINE_API
                });
            }

        }




        // ----------------------------------------- FORM TEMPLATE
        function getFormTemplate(form, mode) {
            var generationMode = mode || GenerationMode.READ,// defaults to read-only template
                components = filterComponentsByAcls(mode, form.components),
                groups = groupFormComponents(components),
                template = resolveTemplate(),
                extraCls = isWriteMode(generationMode) ? 'editing-form new-engine' : 'read-form new-engine';

            return FORM_TEMPLATE.replacePlaceholders({
                template: template,
                formId: form.id.valueId,
                extraClasses: extraCls,
                visibility: generateChapterVisibility()
            });

            function generateChapterVisibility() {
                return VISIBILITY_TEMPLATE.replacePlaceholders({
                    api: FORM_ENGINE_API,
                    ref: form.id.valueId,
                    data: SCOPE_DATA,
                    method: 'isFormVisible'
                });
            }

            function resolveTemplate() {
                var template,
                    writeMode = isWriteMode(generationMode),
                    formCacheKey;
                if (writeMode) {
                    formCacheKey = getFormKey(form);
                    template = templateCache.get(formCacheKey);
                }
                if (!template) {
                    template =
                        // Chapter title
                        generateFormTitle(form) +
                        // Chapter groups
                        _.map(groups, generateGroupTemplate).join('');
                    if (writeMode) {
                        templateCache.put(formCacheKey, template);
                    }
                }
                return template;
            }

            function getFormKey(form) {
                return 'form/{0}/template'.format(form.id.valueId);
            }

            function generateFormTitle(form) {
                return '';
            }

            // Filtering components regarding Acls and user permission
            function filterComponentsByAcls(mode, components){
                var acls = aclsService.getAcls();
                return _.filter(components, function(component){
                    var acl = _.find(acls, function(acl){return acl.id.valueId === component.aclId.valueId;});
                    return userService.userHasPermissionFromArray(acl[mode.toLowerCase()+'Permissions']);
                });
            }

            function groupFormComponents(components) {
                var groups = [],
                    currentGroup,
                    lastFullWidth;
                angular.forEach(components, function (component) {
                    var componentFullWidth = _.get(component, 'params.fullWidth', false);
                    if (angular.isUndefined(lastFullWidth) || lastFullWidth !== componentFullWidth) {
                        currentGroup = {
                            fullWidth: componentFullWidth,
                            components: []
                        };
                        groups.push(currentGroup);
                    }
                    currentGroup.components.push(component);
                    lastFullWidth = componentFullWidth;
                });
                return groups;
            }

            function generateGroupTemplate(group) {
                var groupExtraClass = group.fullWidth ? '' : 'columns',
                    groupBody = _.map(group.components, generateComponentTemplate).join('');
                return FORM_BODY_TEMPLATE.format(groupBody, groupExtraClass);
            }

            function generateComponentTemplate(component) {
                var configWithApi = _.extend({}, component, {apiRef: FORM_ENGINE_API});
                return FIELD_TEMPLATE.replacePlaceholders({
                    template: componentsService.generateComponentTemplate(configWithApi, generationMode),
                    visibility: generateComponentVisibility(configWithApi),
                    classes: generateComponentClasses(configWithApi)
                });
            }

            function generateComponentVisibility(component) {
                if (_.get(component, 'disabled', false)) {
                    // Component is disabled in configuration, meaning it won't appear in screen
                    return false;
                }
                // 'data' is a reference to store in context
                return VISIBILITY_TEMPLATE.replacePlaceholders({
                    api: FORM_ENGINE_API,
                    ref: component.ref,
                    data: SCOPE_DATA,
                    method: 'isVisible'
                });
            }

            function generateComponentClasses(component) {
                return CLASSES_TEMPLATE.replacePlaceholders({
                    id: component.id.valueId,
                    data: SCOPE_DATA,
                    api: FORM_ENGINE_API
                });
            }

        }

    }
}());
