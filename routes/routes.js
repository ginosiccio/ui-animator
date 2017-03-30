(function () {
    'use strict';

    angular
        .module('app.air')
        .config(routesConfig);

    /**@ngInject*/
    function routesConfig($httpProvider, $stateProvider, $urlRouterProvider) {

        // Needed for the cross auth
        $httpProvider.defaults.withCredentials = true;

        /* Add New States Above */
        $urlRouterProvider.otherwise('/funds');
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'features/login/login.html',
                controller: 'LoginCtrl',
                resolve: {
                    waitBackend: ['pingBackendService', function (pingBackendService) {
                        return pingBackendService.waitForInit();
                    }]
                }
            })
            .state('main', {
                abstract: true,
                templateUrl: 'features/common/main/main.html',
                controller: 'MainCtrl',
                resolve: {
                    waitBackend: ['initStaticDataService', function (initStaticDataService) {
                        return initStaticDataService.waitForInit();
                    }]
                }
            })
            .state('main.searchFund', {
                url: '/funds',
                views: {
                    content: {
                        templateUrl: 'features/search/funds/searchFund.html',
                        controller: 'SearchFundCtrl'
                    }
                },
                data: {
                    displayName: 'searchFund.title',
                    clearNavigation: true, // clear the navigation stack
                    defaultBackTo: true // indicates where to back when no navigation history is found
                },
                onEnter: ['dueDiligenceService', function(dueDiligenceService) {
                    dueDiligenceService.clearStoredDueDiligence();
                }]
            })
            .state('main.fundGlobal', {
                url: '/funds/:assetClass/:fundId?:summaryView&:reviewId',
                views: {
                    content: {
                        templateUrl: 'features/fund/fundGlobal/fundGlobal.html',
                        controller: 'FundGlobalCtrl'
                    }
                },
                data: {
                    displayName: 'fund.global.title',
                    previous: 'main.searchFund'
                }
            })
            .state('main.newFund', {
                url: '/funds/create',
                views: {
                    content: {
                        templateUrl: 'features/fund/creation/fundCreation.html',
                        controller: 'FundCreationCtrl',
                        controllerAs: 'fundCreation'
                    }
                },
                data: {
                    displayName: 'fund.creation.title',
                    previous: 'main.searchFund'
                }
            })
            .state('main.fund', {
                url: '/funds/:assetClass/:fundId/:summaryView?:block&:reviewId&:sectionId&:chapterId',
                views: {
                    content: {
                        templateUrl: 'features/dueDiligence/dueDiligence.html',
                        controller: 'DueDiligenceCtrl as vm'
                    }
                },
                params: {
                    summaryView: {
                        value: 'DUE_DILIGENCE'
                    }
                },
                resolve: {
                    view: ['$stateParams', 'fundUrlParams', function ($stateParams, fundUrlParams) {
                        return fundUrlParams.paramToViewName($stateParams);
                    }]
                },
                data: {
                    displayName: '{{viewShortName}}.{{assetClass}}.{{block}}.title',
                    previous: 'main.fundGlobal'
                }
            })
            .state('main.thirdParties', {
                url: '/funds/:assetClass/:fundId/:summaryView/third-parties?:block&:reviewId&:entity',
                reloadOnSearch: false,
                views: {
                    content: {
                        templateUrl: 'features/fund/parties/parties.html',
                        controller: 'PartiesCtrl'
                    }
                },
                data: {
                    displayName: 'fund.parties.title',
                    previous: 'main.fund'
                }
            })
            .state('edit', {
                abstract: true,
                templateUrl: 'features/fund/edit/edit.template.html',
                controller: 'EditCtrl as editController',
                resolve: {
                    waitBackend: ['initStaticDataService', function (initStaticDataService) {
                        return initStaticDataService.waitForInit();
                    }]
                }
            })
            .state('edit.chapter', {
                url: '/edit-chapter',
                views: {
                    content: {
                        templateUrl: 'features/fund/edit/chapter/edit-chapter.template.html',
                        controller: 'EditChapterCtrl as vm'
                    }
                },
                params: {
                    // To force params resolution
                    fundId: null,
                    reviewId: null,
                    summaryView: null,
                    assetClass: null,
                    block: null,
                    sectionId: null,
                    chapterId: null
                },
                data: {
                    displayName: 'Fund - Edit Chapter',
                    previous: 'main.fund'
                }
            })
            .state('edit.parties', {
                url: '/funds/:assetClass/:fundId/:summaryView/third-parties/edit?:block&:reviewId&:entity',
                views: {
                    content: {
                        templateUrl: 'features/fund/parties/edit-parties.template.html',
                        controller: 'EditPartiesCtrl',
                        controllerAs: 'editPartiesCtrl'
                    }
                },
                data: {
                    displayName: 'Third-Parties - Edit'
                }
            })
            .state('main.createCrmEvent', {
                url: '/funds/:assetClass/:fundId/:summaryView/crm-event-create?:uuidContact&:uuidCompany&:block&:reviewId',
                views: {
                    content: {
                        templateUrl: 'features/crmevent/creation/crmEventCreation.html',
                        controller: 'CrmEventCreationCtrl'
                    }
                },
                data: {
                    displayName: 'fund.parties.title',
                    previous: 'main.fund'
                }
            })
            .state('main.relation', {
                url: '/:assetClass/:fundId/:context/:sourceId',
                views: {
                    'air-header@main' : {
                        templateUrl: 'features/relation/relation-header/header.html'
                    }
                }
            })
            .state('main.relation.list', {
                url: '/list',
                views: {
                    'content@main': {
                        templateUrl: 'features/relation/relation-list.html',
                        controller: 'relationCardsCtrl',
                        controllerAs: 'vm'
                    }
                }
            })
            // generic routing for relation edition/creation
            .state('main.relation.rel', {
                abstract: true
            })
            .state('main.relation.rel.create', {
                url: '/create',
                params: {context: null},
                views: {
                    'content@main': {
                        templateUrl: 'features/relation/relation-create.html',
                        controllerProvider: ['$stateParams', function($stateParams) {
                            return $stateParams.context + 'RelationCtrl';
                        }],
                        controllerAs: 'vm'
                    },
                    'party-detail@main.relation.rel.create': {
                        templateUrl: 'features/relation/party-detail.html'
                    },
                    'relation-detail@main.relation.rel.create': {
                        templateUrl: function($stateParams){
                            return 'features/relation/'+ $stateParams.context + '/' + $stateParams.context + '-detail.html';
                        }
                    }
                },
                resolve: {relationMode: function() {return 'CREATE';}}
            })
            .state('main.relation.rel.edit', {
                views: {
                    'content@main': {
                        templateUrl: 'features/relation/relation-edit.html',
                        controllerProvider: ['$stateParams', function($stateParams) {
                            return $stateParams.context + 'RelationCtrl';
                        }],
                        controllerAs: 'vm'
                    },
                    'party-detail@main.relation.rel.edit': {
                        templateUrl: 'features/relation/party-detail.html'
                    },
                    'relation-detail@main.relation.rel.edit': {
                        templateUrl: function($stateParams){
                            return 'features/relation/'+ $stateParams.context + '/' + $stateParams.context + '-detail.html';
                        }
                    }
                },
                resolve: {relationMode: function() {return 'EDIT';}}
            })
            .state('main.relation.rel.edit.company', {
                url: '/company/:companyId'
            })
            .state('main.relation.rel.edit.person', {
                url: '/person/:personId'
            });
    }

}());
