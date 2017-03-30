(function () {
    'use strict';

    angular
        .module('app.air')
        .factory('toolsService', toolsService);

    /**
     * Container with misc useful methods.
     * @param {$log} $log AngularJS logger
     * @returns {{}}
     * @ngInject
     */
    function toolsService($log, messageService, $http, $q) {

        var service = {};
        service.fileUtils = fileUtils;
        service.navigatorUtils = navigatorUtils;
        service.securityUtils = securityUtils;
        service.numberUtils = numberUtils;
        service.isUndefined = isUndefined;
        service.isDefined = isDefined;
        service.setFieldPathValue = setFieldPathValue;
        service.setFieldPathValueInObject = setFieldPathValueInObject;
        service.getFieldValue = getFieldValue;
        service.stringIsNumber = stringIsNumber;
        service.union = union;
        service.getChapterInfo = getChapterInfo;
        service.formatDate = formatDate;
        service.isAlreadyInCardList = isAlreadyInCardList;
        service.periodicityColor = periodicityColor;

        return service;

        /**
         * Check if given object is null or undefined
         * @param {object} objToCheck the object to check
         * @returns {boolean|*}
         */
        function isUndefined(objToCheck) {
            return objToCheck === null || angular.isUndefined(objToCheck);
        }

        /**
         * Check if given object is not null and not undefined
         * @param {object} objToCheck the object to check
         * @returns {boolean|*}
         */
        function isDefined(objToCheck) {
            return !isUndefined(objToCheck);
        }

        /**
         * Check if input string is a number
         * @param {string} strNum the string to check
         * @returns {boolean|*}
         */
        function stringIsNumber(strNum) {
            return (!isNaN(strNum) && angular.isNumber(+strNum));
        }

        /**
         * Set value for given fieldPath in objToUpdate
         * If objToUpdate is null or undefined, trying to set value in
         * scope or in scope parent
         * depending where is defined fieldPath
         * @param {object} objToUpdate
         * @param {object} scope
         * @param {string} fieldPath
         * @param {any} value
         */
        function setFieldPathValueInObject(objToUpdate, scope, fieldPath, value) {
            if (fieldPath) {
                var fieldObj = objToUpdate,
                    lastIndex = fieldPath.split('.').length - 1,
                    lastPath = null;

                angular.forEach(fieldPath.split('.'), function (subpath, index) {
                    if (index < lastIndex) {
                        fieldObj = findValidRoot(fieldObj, scope, subpath);
                    } else {
                        lastPath = subpath;
                        if (isUndefined(fieldObj)) {
                            if (isUndefined(scope[subpath])) {
                                fieldObj = scope.$parent;
                            } else {
                                fieldObj = scope;
                            }
                        }
                    }
                });
                if (fieldObj) {
                    fieldObj[lastPath] = value;
                }
            }
        }

        function findValidRoot(fieldObj, scope, fieldPath) {
            var root = fieldObj || scope;

            if (root) {
                if (isUndefined(root[fieldPath])) {
                    root = findValidRoot(null, scope.$parent, fieldPath);
                } else {
                    root = root[fieldPath];
                }
            }

            return root;
        }

        /**
         * Set value for given fieldPath in scope or in scope parent
         * depending where is defined fieldPath
         * @param {object} scope
         * @param {string} fieldPath
         * @param {any} value
         */

        function setFieldPathValue(scope, fieldPath, value) {
            setFieldPathValueInObject(null, scope, fieldPath, value);
        }

        /**
         * Return value of fieldName from given dataObject
         * If given object is not defined, return null
         * @param {object} dataObject the object to search into
         * @param {string} fieldName
         * @returns {*}
         */
        function getFieldValue(dataObject, fieldName) {
            try {
                var fieldValue = null,
                    paths;
                if (isDefined(dataObject)) {
                    if (fieldName.indexOf('.') !== -1) {
                        paths = fieldName.split('.');
                        fieldValue = dataObject;
                        angular.forEach(paths, function (path) {
                            fieldValue = fieldValue[path];
                        });
                    } else {
                        fieldValue = dataObject[fieldName];
                    }
                    if (angular.isString(fieldValue)) {
                        fieldValue = fieldValue.trim();
                    }
                }
                return fieldValue;
            } catch (e) {
                $log.debug('Error when trying to check field ' + fieldName);
                return null;
            }
        }

        /**
         *
         * @param {array} mergeIntoFirstArray : boolean telling if we have to merge union into 1st array provided,
         *      or if we return a new array
         * @param {...array} arguments unlimited arrays on which union will be done
         * @returns {array} the union
         */
        function union(mergeIntoFirstArray) {
            var unionArray = [],
                args = Array.prototype.slice.call(arguments);

            unionArray = (mergeIntoFirstArray && args && args.length > 1) ? args[1] : unionArray;
            angular.forEach(args, function (array) {
                angular.forEach(array, function (item) {
                    if (unionArray.indexOf(item) === -1) {
                        unionArray.push(item);
                    }
                });
            });
        }

        function formatDate(date){
            if(date && date.indexOf("/")>-1){
                var arr = date.split('/');
                return arr.reverse().join('-');
            } else {
                return date;
            }
        }

        function isAlreadyInCardList(personId, companyId, alreadyBoundIds){
            var type = personId ? 'person' : 'company';
            if(alreadyBoundIds.indexOf(type + '.' + (personId ? personId : companyId)) > -1){
                messageService.showError('This ' + type + ' is already in the list.');
                return true;
            }
            return false;
        }

        function getChapterInfo(elt){
            var p = angular.element(elt).parent();
            var allParents = [];
            while (p.length > 0) {
                allParents.push(p[0]);
                p = p.parent();
                if(p.hasClass("chapter")){
                    return {
                        chapterId:  p.attr("id"),
                        chapterTitle: angular.element(p[0].getElementsByClassName("label-criterion")).attr("text")
                    };
                }
            }
            return {};
        }

        function fileUtils() {
            return {
                type:{
                    XLS: "application/vnd.ms-excel",
                    XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                },
                /**
                 * @name : downloadExcelFile
                 * @description : Triggers download of a binary file.
                 * @param :
                 * configParam : (Object){
                 *      url : the url to get or to post (required),
                 *      fileName : the file name (default: excel-file.xlsx),
                 *      method : the method [POST or GET] (default: GET),
                 *      data : the data to post,
                 *      type :
                 *   }
                 */
                downloadExcelFile: function(configParam){
                    var deferred = $q.defer();
                    var config = {
                        fileName: 'excel-file.xlsx',
                        method: 'GET',
                        responseType: "arraybuffer",
                        type: 'XLSX'
                    };
                    config = angular.extend(config, configParam);
                    if(config.method==='POST'){
                        config.headers = {'Content-Type': 'application/json'};
                    }
                    $http(config).success(function(data) {
                        deferred.resolve(data);
                        service.fileUtils().downloadFile(window.document, config.fileName, data, service.fileUtils().type[config.type]);
                    }).error(function(e){deferred.reject(e);});
                    return deferred.promise;
                },

                /**
                 * @name downloadFile
                 * @description Triggers download of a binary file.
                 * @param {document} pDocument the document html element
                 * @param {string} fileName the filename we'd like our file to be given
                 * @param {string} data the arraybuffer content that we'd like to download as a file
                 * @param {boolean} strMimeType the excel file type
                 */
                downloadFile: function (pDocument, fileName, data, strMimeType) {
                    var D = pDocument;
                    var a = D.createElement('a');
                    var rawFile;

                    if (service.navigatorUtils().isOldIE()) {
                        var frame = D.createElement('iframe');
                        D.body.appendChild(frame);
                        frame.contentWindow.document.open(strMimeType, "replace");
                        frame.contentWindow.document.charset = "utf-8";
                        frame.contentWindow.document.write(data);
                        frame.contentWindow.document.close();
                        frame.contentWindow.focus();
                        frame.contentWindow.document.execCommand('SaveAs', true, fileName);
                        D.body.removeChild(frame);
                        return true;
                    }

                    // IE10+
                    if (navigator.msSaveBlob) {
                        return navigator.msSaveOrOpenBlob(
                            new Blob(
                                [ data],
                                { type: strMimeType } ),
                            fileName
                        );
                    }

                    //html5 A[download]
                    if ('download' in a) {
                        var blob = new Blob(
                            [ data],
                            { type: strMimeType }
                        );
                        rawFile = URL.createObjectURL(blob);
                        a.setAttribute('download', fileName);
                    } else {
                        rawFile = 'data:' + strMimeType + ',' + encodeURIComponent(data);
                        a.setAttribute('target', '_blank');
                    }

                    a.href = rawFile;
                    a.setAttribute('style', 'display:none;');
                    D.body.appendChild(a);
                    setTimeout(function() {
                        if (a.click) {
                            a.click();
                            // Workaround for Safari 5
                        } else if (D.createEvent) {
                            var eventObj = D.createEvent('MouseEvents');
                            eventObj.initEvent('click', true, true);
                            a.dispatchEvent(eventObj);
                        }
                        D.body.removeChild(a);
                    }, 100);
                }
            };
        }

        function numberUtils(){
            return  {
                isNumber : function(v){
                    return !this.isNaN(parseFloat(v));
                },
                isNaN : function(v){
                    return typeof v === "number" && isNaN(v);
                }
            }
        }

        function securityUtils(){
            return {
                createUUID: function() {
                    var s = [];
                    var hexDigits = "0123456789abcdef";
                    for (var i = 0; i < 36; i++) {
                        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
                    }
                    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
                    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  //NOSONAR
                    // bits 6-7 of the clock_seq_hi_and_reserved to 01
                    s[8] = s[13] = s[18] = s[23] = "-";
                    return s.join("");
                }
            }
        }

        function navigatorUtils(){
            return {
                isMobile : function(){
                    return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4));
                },
                /**
                 * @name isOldIE
                 * @description Checks whether current browser is an old IE (<10) and returns it's version if it is
                 */
                isOldIE: function () {
                    var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
                    var ieVersion = match ? parseInt(match[1]) : false;
                    return ieVersion && ieVersion < 10;
                }
            }
        }

        function colors(threshold1, threshold2) {
            return function(nbDays) {
                if (nbDays < threshold1) {return 'green'}
                else if (nbDays < threshold2) {return 'orange'}
                else {return 'red'}
            }
        }

        function periodicityColor(period, days) {
            var MONTHLY = 30, QUARTERLY = 90;
            var MONTHLY_T1 = 35, MONTHLY_T2 = 55;
            var QUARTERLY_T1 = 125, QUARTERLY_T2 = 180;
            var YEARLY_T1 = 380, YEARLY_T2 = 500;

            if (period === MONTHLY) { return colors(MONTHLY_T1, MONTHLY_T2)(days)}
            else if (period === QUARTERLY) { return colors(QUARTERLY_T1, QUARTERLY_T2)(days)}
            else {return colors(YEARLY_T1, YEARLY_T2)(days)}
        }
    }
}());
