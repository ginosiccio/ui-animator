(function () {
    'use strict';

    angular
        .module('app.core')
        .controller('ChartsComponentCtrl', ChartsComponentController);

    /**@ngInject*/
    function ChartsComponentController($rootScope, $scope, $timeout, $filter, rulesService, timeseriesService, errors, GenerationMode) {
        var vm = this;

        // Public methods
        vm.hasValue = hasValue;

        if (vm.api) {
            // Register component
            vm.api.components.register(vm.id, vm);
            // Prepare to unregister component when component is destroyed
            $scope.$on('$destroy', angular.bind(vm.api, vm.api.components.unregister, vm.id));
        }

        /**
         * Used by engine to check whether the component has a value.
         *
         * @returns {boolean} true, if component has value; false, otherwise.
         */
        function hasValue() {
            return !_.isEmpty(vm.fieldValue);
        }

        vm.timeseriesParams = [];
        _.map(vm.params, function(v, p){
            var tsp = 'timeseriesParams.';
            if(p.indexOf(tsp)>-1) {
                var s = p.replace(tsp,'');
                var read = GenerationMode.READ.toLowerCase()+'.';
                var write = GenerationMode.WRITE.toLowerCase()+'.';
                if(vm.params.mode === GenerationMode.READ && s.indexOf(read)>-1){
                    s = s.substring(read.length, s.length);
                    var i = s.substring(0, s.indexOf('.'));
                    if(!isNaN(i)) {
                        addTimeserieParam(tsp+read, i);
                    }
                } else if(vm.params.mode === GenerationMode.WRITE && s.indexOf(write)>-1){
                    s = s.substring(write.length, s.length);
                    var i = s.substring(0, s.indexOf('.'));
                    if(!isNaN(i)) {
                        addTimeserieParam(tsp + write, i);
                    }
                } else {
                    var i = s.substring(0, s.indexOf('.'));
                    if(!isNaN(i)) {
                        addTimeserieParam(tsp, i);
                    }
                }
            }
        });

        function addTimeserieParam(tsp, index){
            vm.timeseriesParams[parseInt(index)] = {
                name:vm.params[tsp+index+'.name'],
                color:vm.params[tsp+index+'.color'],
                layout:vm.params[tsp+index+'.layout'],
                type:vm.params[tsp+index+'.type']
            };
        }

        vm.chartConfig = {
            options: {
                chart: {
                    type: 'spline',
                    backgroundColor: 'none'
                },
                title: {
                    text: null
                },
                credits: {
                    enabled: false
                },
                xAxis: [{
                    type: 'datetime',
                    title: {
                        text: null
                    }
                }],
                yAxis: {
                    type: 'number',
                    title: {
                        text: ''
                    }
                },
                rangeSelector: {
                    allButtonsEnabled: true,
                    enabled: true,
                    buttons: [{
                        type: 'ytd',
                        text: 'YTD'
                    }, {
                        type: 'year',
                        count: 1,
                        text: '1y'
                    }, {
                        type: 'all',
                        text: 'All'
                    }],
                    buttonTheme: {
                        width: 60
                    },
                    selected: 2
                },
                navigator: {
                    enabled: true,
                    adaptToUpdatedData: true
                },
                tooltip: {
                    followPointer: false,
                    followTouchMove: false,
                    shared:vm.params ? vm.params.startOfMonth : false,
                    useHTML: true,
                    hideDelay: 500,
                    formatter: function() {
                        if(vm.params.startOfMonth){
                            var header = '', seriesValues = '';
                            angular.forEach(this.points, function(point){
                                header = '<span style="font-size:10px">' + Highcharts.dateFormat('%A, %b %e, %Y', new Date(point.point.realDate)) + '</span>';
                                seriesValues += '<ul style="padding-left:20px;margin:0;"><li style="color:'+point.series.color+';font-size:16px;"><div style="margin-left:-5px;font-size:12px;color:rgb(51,51,51)"><span style="vertical-align:2px;">' + point.series.name + ': </span><span style="vertical-align:2px;"><b> ' + point.y + '</b></span></div></li></ul>';
                            })
                        } else {
                            header = '<span style="font-size:10px">' + Highcharts.dateFormat('%A, %b %e, %Y', new Date(this.x)) + '</span>';
                            seriesValues = '<ul style="padding-left:20px;margin:0;"><li style="color:'+this.series.color+';font-size:16px;"><div style="margin-left:-5px;font-size:12px;color:rgb(51,51,51)"><span style="vertical-align:2px;">' + this.series.name + ': </span><span style="vertical-align:2px;"><b> ' + this.y + '</b></span></div></li></ul>';
                        }
                        return header + seriesValues;
                    }
                }
            },
            series: []
        };

        if(vm.params.mode===GenerationMode.WRITE){
            $timeout(function(){$rootScope.$broadcast('onOverrideSaveEventStart', updateTimeSeries);}, 1000);
        }

        function updateTimeSeries(){
            timeseriesService.updateTimeseries(vm.params.writeRef, vm.timeseries).then(function(){
                $rootScope.$broadcast('onOverrideSaveEventEnd');
            }, function(e){
                errors.showDialog('Error while updating time series data : [' + e.status + ']', e);
            });
        }

        timeseriesService.getTimeseries(vm.params.mode === GenerationMode.WRITE ? vm.params.writeRef : vm.params.readRef).then(function(timeseries){
            vm.timeseries = timeseries;
            createSeries();
        }, function(e){
            errors.showDialog('Error while fetching time series data : [' + e.status + ']', e);
        });

        function createSeries() {
            var chartConfig = {series: [], yAxis:{title:{text:''}}}, hasData = false;
            if(vm.timeseriesParams.length>0){
                var currency = getCurrency();
                chartConfig.yAxis.title.text = currency ? currency : chartConfig.yAxis.title.text;
                chartConfig.dateMinNavigator = new Date(3000, 31, 12).getTime();
                chartConfig.dateMaxNavigator = 0;
                angular.forEach(vm.timeseriesParams, function (param, idxParam) {
                    var data = [];
                    hasData = vm.timeseries && vm.timeseries[idxParam];
                    if (hasData) {
                        angular.forEach(vm.timeseries[idxParam].points, function (point) {
                            var date = new Date(point.date);
                            var dateTime = vm.params.startOfMonth ? Date.UTC(date.getFullYear(), date.getUTCMonth(), 1) : date.getTime();
                            data.push({
                                x: dateTime,
                                y: point.value,
                                realDate: date.getTime()
                            });
                            /* get min et max date for navigator panel */
                            if (date.getTime() < chartConfig.dateMinNavigator) {
                                chartConfig.dateMinNavigator = dateTime;
                            }
                            if (date.getTime() > chartConfig.dateMaxNavigator) {
                                chartConfig.dateMaxNavigator = dateTime;
                            }
                        });
                    }
                    data.sort(function (a, b) {return a.x - b.x;});
                    chartConfig.series.push({
                        name: currency ? param.name : vm.timeseries[idxParam].currency ? param.name + ' ('+vm.timeseries[idxParam].currency.valueCode +')' : param.name,
                        data: data,
                        color: param.color,
                        fillOpacity: 0,
                        draggableY: false,
                        dragMinY: 0,
                        type: param.layout ? param.layout : 'column'
                    });
                });
            }

            vm.chartConfig.series = null;
            angular.merge(vm.chartConfig, chartConfig);

            $timeout(function renderChart() {
                var chart = vm.chartConfig.getHighcharts && vm.chartConfig.getHighcharts();
                if (chart) {
                    /* upgrade datas in navigator panel */
                    chart.get('highcharts-navigator-series').setData([].concat(chart.series[1].options.data));
                    /* force unlock refresh */
                    chart.yAxis[0].isDirty = true;
                    /* set new extreme data of the panel */
                    chart.xAxis[0].setExtremes(vm.chartConfig.dateMinNavigator, vm.chartConfig.dateMaxNavigator);
                    chart.redraw();
                }
                vm.renderChart = true;
            }, 0);

        }

        function computeSameCurrency (timeseries, currency) {
            return _.every(timeseries, function(t) { return t.currency && currency && t.currency.valueCode===currency.valueCode; });
        }

        function getCurrency(){
            var sameCurrency = true;
            var currency;

            for(var i=0;i<vm.timeseries.length;i++){
                if (sameCurrency===false) {
                    break;
                }
                currency = vm.timeseries[i].currency;
                sameCurrency = computeSameCurrency(vm.timeseries, currency);
            }
            return sameCurrency ? currency.valueCode : null;
        }

        vm.showForm = false;

        vm.add = function () {
            vm.showForm = true;
        };

        vm.numberValues = function(arr) {
            return (arr||[]).filter(function(el) { return !isNaN(parseInt(el))}).length;
        };

        function getAlreadyValue(index, k) {
            var returnValue = null;
            if (vm.timeseries[index]) {
                angular.forEach(vm.timeseries[index].points, function (point) {
                    if (point.date === $filter('date')(lastDayOfMonth(vm.year.value, k), 'yyyy-MM-dd')) {
                        returnValue = point.value;
                    }
                });
            }
            return returnValue;
        }

        vm.updateAddForm = function () {
            if (vm.year.value) {
                vm.newTimeseries = [];
                angular.forEach(vm.timeseriesParams, function (param, idxParam) {
                    vm.newTimeseries[idxParam] = [];
                    angular.forEach(vm.months, function (month, idxMonth) {
                        vm.newTimeseries[idxParam][idxMonth] = getAlreadyValue(idxParam, idxMonth);
                    });
                    initCurrency(idxParam);
                });
            }
        };

        function initCurrency(idxParam) {
            if (vm.timeseries && vm.timeseries[idxParam] && vm.timeseries[idxParam].currency) {
                vm.newTimeseries[idxParam].currency = vm.timeseries[idxParam].currency;
            }
        }

        vm.months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        vm.year = [];
        vm.currencyLabel = 'Currency';
        vm.currencyLookup = {lookupName:'currency'};

        vm.cancel = function () {
            vm.showForm = false;
            vm.newTimeseries = [];
            vm.year.value = null;
        };

        function isValidChart(idxParam) {
            var isValid = true,
                hasData = false;

            if (vm.params.currencyLookup) {
                angular.forEach(vm.months, function (month, idxMonth) {
                    if (!hasData && vm.newTimeseries[idxParam][idxMonth]) {
                        hasData = true;
                    }
                });
                if (hasData) {
                    isValid = !!(vm.newTimeseries[idxParam].currency && vm.newTimeseries[idxParam].currency.code);
                }
            }

            return isValid;
        }

        function lastDayOfMonth(Year, Month) {
            return new Date(Year, Month + 1, 0);
        }

        vm.save = function () {
            var date,
                dateFormatted,
                point,
                errorId,
                errorDiv,
                isValid = true,
                currentTimeseries;
            angular.forEach(vm.timeseries, function(ts){
                var pointsCleaned = [];
                angular.forEach(ts.points, function(point){
                    if(point.value != null && point.value != undefined){
                        pointsCleaned.push(point);
                    }
                });
                ts.points = pointsCleaned;
            });
            angular.forEach(vm.timeseriesParams, function (param, idxParam) {
                if (!isValidChart(idxParam)) {
                    errorId = rulesService.getErrorId('newTimeseries.' + idxParam + '.currency');
                    errorDiv = $('#error_' + errorId);
                    errorDiv.html($filter('translate')('validation.error.requiredField'));
                    errorDiv.attr('errortype', rulesService.ErrorType.REQUIRED);
                    if (isValid) {
                        isValid = false;
                    }
                } else {
                    currentTimeseries = vm.newTimeseries[idxParam];
                    if (currentTimeseries) {
                        angular.forEach(vm.months, function (month, idxMonth) {
                            date = lastDayOfMonth(vm.year.value, idxMonth);
                            dateFormatted = $filter('date')(date, 'yyyy-MM-dd');
                            point = {'date': dateFormatted, 'value': vm.newTimeseries[idxParam][idxMonth]};
                            if (!vm.fieldValue) {
                                vm.fieldValue = {timeseries: []};
                            }
                            if (!vm.timeseries[idxParam]) {
                                vm.timeseries[idxParam] = {'points': []};
                            }
                            if (!vm.timeseries[idxParam].points) {
                                vm.timeseries[idxParam].points = [];
                            }
                            angular.forEach(vm.timeseries[idxParam].points, function (p, idxPoint) {
                                if (p.date === point.date) {
                                    vm.timeseries[idxParam].points.splice(idxPoint, 1);
                                }
                            });
                            vm.timeseries[idxParam].points.push(point);
                            vm.timeseries[idxParam].currency = vm.newTimeseries[idxParam].currency;
                        });
                    }
                }
            });

            if (isValid) {
                createSeries();
                vm.cancel();
            }
        };
    }
}());
