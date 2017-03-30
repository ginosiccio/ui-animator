/** Hypothesis:
 *
 *  Json Format :
 *
 *  dataInstructions : {
 *      variables : {
 *              variableName1:  endpoint1
 *              variableName2:  endpoint2
 *              ...
 *
 *      },
 *      constants : {
 *          constantName1 : constantValue1,
 *          constantName2 : constantValue2
 *      }
 *  }
 *
 *  application:  {
 *      dataInstructions : ...
 *      books : {
 *          id: {
 *              valueId: ...
 *          },
 *          dataInstructions : ...
 *          blocks : {
 *              dataInstructions : ...
 *              sections : {
 *                  dataInstructions : ...
 *                  chapters : {
 *                      dataInstructions : ...
 *                  }
 *              }
 *          }
 *      }
 *  }
 *
 * **/

(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('storeService', StoreService);

    /**@ngInject*/
    function StoreService(dataService, $q) {
        var service = {};

        var appStore = {};
        var booksStore = {};
        var blocksStore = {};
        var appDataInstructions = {};
        var bookDataInstructions = {};
        var fetchingPromises = {};

        service.retrieveDataForApplication = retrieveDataForApplication;
        service.retrieveDataForBook = retrieveDataForBook;
        service.retrieveDataForBlock = retrieveDataForBlock;
        service.getData = getData;
        service.saveData = saveData;
        service.clearData = clearData;

        function getData(bookId, blockId) {
            var store = {};
            Object.merge(store, appStore);
            if (bookId) {
                Object.merge(store, booksStore[bookId]);
            }
            if (blockId) {
                Object.merge(store, blocksStore[blockId]);
            }
            return store;
        }

        function saveData(bookId, blockId, sectionId, chapterId, blockInstructions, data) {
            var defer = $q.defer();
            var sectionInstructions = _.find(blockInstructions.sections, _.matchesProperty('id.valueId', sectionId));
            if (!sectionInstructions) {
                defer.reject('Section instructions not found for sectionId \'' + sectionId + '\'');
                return defer.promise;
            }

            var chapterInstructions = _.find(sectionInstructions.chapters, _.matchesProperty('id.valueId', chapterId));
            if (!chapterInstructions) {
                defer.reject('Chapter instructions not found for chapterId \'' + chapterId + '\'');
                return defer.promise;
            }

            var previousData = getData(bookId, blockId);
            var variablesModified = {};

            // Find all modified data
            chapterInstructions.components.forEach(function (component) {
                var currentValue = _.get(data, component.ref);
                var previousValue = _.get(previousData, component.ref);

                if (currentValue !== previousValue) {
                    variablesModified[component.ref.split('.')[0]] = true;
                }
            });

            // Get all instructions (from chapter to application)
            var allInstructions = [chapterInstructions.dataInstructions, sectionInstructions.dataInstructions,
                blockInstructions.dataInstructions, bookDataInstructions[bookId], appDataInstructions];
            var notFoundEndpointForData;
            _.forOwn(variablesModified, function (value, variableName) {

                var dataEndpoint;
                _.forEach(allInstructions, function (dataInstructions) {
                    dataEndpoint = getEndpoint(dataInstructions, variableName);
                    // Found, stop iteration
                    if (dataEndpoint) {
                        variablesModified[variableName] = dataEndpoint;
                        return false;
                    }
                });

                if (!dataEndpoint) {
                    notFoundEndpointForData = variableName;
                }
            });

            if (notFoundEndpointForData) {
                defer.reject('Endpoint not found for variable \'' + notFoundEndpointForData + '\'');
                return defer.promise;
            }

            if (_.isNil(data.rootId) && data.createMasterEntity) {
                // Process master entity before any other
                var masterEntityVariable = _.pick(variablesModified, [data.createMasterEntity]);
                _.unset(variablesModified, data.createMasterEntity);
                // Save master entity, then other modified variables
                dataService.putData(masterEntityVariable, data).then(creationSucceeded, creationFailed);
            } else {
                updateVariablesModified();
            }

            return defer.promise;

            function creationSucceeded(store) {
                // Store new id in store
                data.rootId = store[data.createMasterEntity].valueId;
                // And save other modified variables
                updateVariablesModified(creationFailed);
            }

            function creationFailed(error) {
                // Clear new id in store if an error occurred
                data.rootId = null;
                defer.reject(error);
            }

            function updateVariablesModified(failureCallback) {
                dataService.putData(variablesModified, data).then(function () {
                    updateData(variablesModified, data, booksStore[bookId], blocksStore[blockId]);
                    defer.resolve(data.rootId);
                }, function (error) {
                    if (failureCallback) {
                        failureCallback(error);
                    }
                    defer.reject(error);
                });
            }

            function getEndpoint(dataInstructions, variableName) {
                if (dataInstructions && dataInstructions.variables) {
                    return dataInstructions.variables[variableName];
                }
                return null;
            }

            function updateData(variablesModified, data, bookStore, blockStore) {
                _.forOwn(variablesModified, function (value, variableName) {
                    var dataCopy = angular.copy(data[variableName]);
                    if (appStore.hasOwnProperty(variableName)) {
                        appStore[variableName] = dataCopy;
                    } else if (bookStore && bookStore.hasOwnProperty(variableName)) {
                        bookStore[variableName] = dataCopy;
                    } else if (blockStore && blockStore.hasOwnProperty(variableName)) {
                        blockStore[variableName] = dataCopy;
                    }
                });
            }
        }

        function clearData() {
            appStore = {};
            booksStore = {};
            blocksStore = {};
            bookDataInstructions = {};
            fetchingPromises = {}
        }

        function retrieveDataForApplication(rootId, applicationDescription, forceReload, resolveAliasOnly, resolveAliasForConstants) {
            var defer = $q.defer(),
                currentAppStore = getData();

            if (forceReload || !hasBeenLoaded(rootId, currentAppStore)) {
                appStore = {};
                appDataInstructions = applicationDescription.dataInstructions;
                retrieveData(applicationDescription.dataInstructions, {rootId: rootId}, resolveAliasOnly, resolveAliasForConstants)
                    .then(
                        function (store) {
                            store.rootId = rootId;
                            appStore = store;
                            defer.resolve();
                        },
                        function (error) {
                            defer.reject(error);
                        }
                    );
            } else {
                defer.resolve();
            }

            return defer.promise;
        }

        function retrieveDataForBook(rootId, bookDescription, forceReload, resolveAliasOnly, resolveAliasForConstants) {
            var bookId = bookDescription.id.valueId,
                defer = $q.defer(),
                currentAppStore = getData(),
                currentBookStore = getData(bookId),
                appAndBookStore;

            if (forceReload || !hasBeenLoaded(rootId, currentBookStore, currentAppStore)) {
                bookDataInstructions[bookId] = bookDescription.dataInstructions;
                appAndBookStore = getData(null, null);
                appAndBookStore.rootId = rootId;
                booksStore = {};
                blocksStore = {};
                retrieveData(bookDescription.dataInstructions, appAndBookStore, resolveAliasOnly, resolveAliasForConstants)
                    .then(
                        function (store) {
                            store.rootId = rootId;
                            booksStore[bookId] = store;
                            defer.resolve();
                        },
                        function (error) {
                            defer.reject(error);
                        }
                    );
            } else {
                defer.resolve();
            }
            return defer.promise;
        }

        function retrieveDataForBlock(rootId, bookId, blockInstructions, forceReload, resolveAliasOnly, resolveAliasForConstants, filterByPlaceholder, dstStore) {
            var blockId = blockInstructions.id.valueId;

            if (!dstStore) {
                var currentBookStore = getData(bookId),
                    currentBlockStore = getData(bookId, blockId);
                if (!forceReload && hasBeenLoaded(rootId, currentBlockStore, currentBookStore)) {
                    return $q.when();
                }
            }

            // Aggregation is done by variable name
            var variablesAggregated = {};
            var constantsAggregated = {};
            var fetchInstructions = {variables: variablesAggregated, constants: constantsAggregated};
            var appAndBookDataInstructions = angular.copy(appDataInstructions);
            var appAndBookStore = dstStore;
            if (!appAndBookStore) {
                appAndBookStore = getData(bookId, null);
                appAndBookStore.rootId = rootId;
                appAndBookStore.blockId = blockId;
            }
            Object.merge(appAndBookDataInstructions, bookDataInstructions[bookId]);
            if (!dstStore) {
                blocksStore[blockId] = {};
            }

            var defer = $q.defer();

            try {
                mergeInstructions(variablesAggregated, constantsAggregated, blockInstructions, appAndBookDataInstructions, filterByPlaceholder);

                blockInstructions.sections.forEach(function (sectionInstructions) {
                    mergeInstructions(variablesAggregated, constantsAggregated, sectionInstructions, appAndBookDataInstructions, filterByPlaceholder);
                    sectionInstructions.chapters.forEach(function (chapterInstructions) {
                        mergeInstructions(variablesAggregated, constantsAggregated, chapterInstructions, appAndBookDataInstructions, filterByPlaceholder);
                    });
                });

                // clean store before retrieving data
                _.forOwn(variablesAggregated, function(endpoint, variableName) {
                    delete appAndBookStore[variableName];
                });

                retrieveData(fetchInstructions, appAndBookStore, resolveAliasOnly, resolveAliasForConstants).then(function (store) {
                    store.rootId = rootId;
                    if (dstStore) {
                        Object.merge(dstStore, store);
                    } else {
                        blocksStore[blockId] = store;
                    }
                    defer.resolve();
                }, function (error) {
                    defer.reject(error);
                });

            } catch (error) {
                defer.reject(error);
            }


            function mergeInstructions(variablesAggregated, constantsAggregated, instructions, appAndBookDataInstructions, filterByPlaceholder) {
                if (instructions.dataInstructions && instructions.dataInstructions.variables) {
                    var variablesToAdd = instructions.dataInstructions.variables;
                    mergeInstructionInner(variablesAggregated, variablesToAdd, appAndBookDataInstructions.variables, filterByPlaceholder);
                }

                if (instructions.dataInstructions && instructions.dataInstructions.constants) {
                    var constantsToAdd = instructions.dataInstructions.constants;
                    mergeInstructionInner(constantsAggregated, constantsToAdd, appAndBookDataInstructions.constants, filterByPlaceholder);
                }
            }

            function mergeInstructionInner(variablesAggregated, variablesToAdd, appAndBookDataInstructions, filterByPlaceholder) {
                _.forOwn(variablesToAdd, function (endpointToAdd, variableNameToAdd) {

                    if (filterByPlaceholder && !_.includes(endpointToAdd, filterByPlaceholder)) {
                        return;
                    }

                    var endpoint = variablesAggregated[variableNameToAdd];
                    if (!endpoint) {
                        var bookEndpoint = appAndBookDataInstructions[variableNameToAdd];
                        if (!bookEndpoint) {
                            variablesAggregated[variableNameToAdd] = endpointToAdd;
                        } else if (endpointToAdd !== bookEndpoint) {
                            throw "Endpoint '" + endpointToAdd + "' for variable '" + variableNameToAdd +
                            "' is different from the one used to fetch data in book/app : '" + bookEndpoint + "'";
                        }
                    } else if (endpointToAdd !== endpoint) {
                        throw "Two variables with same name '" + variableNameToAdd + "' and different endpoints '" + endpointToAdd +
                        " and '" + endpoint + "' exist.";
                    }
                });
            }

            return defer.promise;
        }

        function hasBeenLoaded(rootId, store, parentStore) {
            var storeOwnValues;
            if (rootId !== store.rootId) {
                return false;
            }
            storeOwnValues = _.omit(store, _.keys(parentStore));
            return !_.isEmpty(storeOwnValues);
        }

        function retrieveData(fetchInstructions, appAndBookStore, resolveAliasOnly, resolveAliasForConstants) {
            var defer = $q.defer();
            var currentFetchingPromises = [];
            var newToFetch = {};
            _.forOwn(fetchInstructions.variables, function (endpoint, variableName) {
                if (!fetchingPromises.hasOwnProperty(variableName)) {
                    fetchingPromises[variableName] = defer.promise;
                    newToFetch[variableName] = endpoint;
                } else {
                    currentFetchingPromises.push(fetchingPromises[variableName]);
                }
            });
            currentFetchingPromises.push(dataService.fetchData(newToFetch, appAndBookStore, resolveAliasOnly));
            var allPromises = $q.all(currentFetchingPromises);
            allPromises.then(
                function (stores) {
                    removeCompletedPromises();
                    var store = {};
                    stores.forEach(function (s) {
                        Object.extend(store, s);
                    });
                    enrichWithConstants(store, fetchInstructions.constants, resolveAliasForConstants);
                    defer.resolve(store);
                },
                function (error) {
                    removeCompletedPromises();
                    defer.reject(error);
                }
            );
            return defer.promise;

            function removeCompletedPromises() {
                // Remove all fetching promises completed
                fetchingPromises = _.pickBy(fetchingPromises, function (promise, variableName) {
                    return !fetchInstructions.variables.hasOwnProperty(variableName);
                });
            }
        }

        function enrichWithConstants(store, constants, resolveAlias) {
            if (constants) {
                Object.merge(store, constants);
                if (resolveAlias) {
                    _.forOwn(constants, function (value, constantName) {
                        var placeholders = dataService.detectPlaceholdersInEndpoint(value);
                        if (placeholders.length == 1 && placeholders[0].placeholder === value) {
                            Object.defineAlias(store, constantName, placeholders[0].source);
                        }
                    });
                }
            }
        }

        return service;
    }

})();
