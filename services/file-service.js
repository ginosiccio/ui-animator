(function () {
    'use strict';

    /**
     * Service to load and persist file, image ...
     */
    
    angular
        .module('app.air')
        .factory('fileService', fileService);

    /**@ngInject*/
    function fileService($http, $log, ENV, toolsService, $q) {
        var service = {};
        service.getImageByFileId = getImageByFileId;
        service.getImageByImageId = getImageByImageId;
        service.addImage = addImage;
        service.deleteFile = deleteFile;
        service.uploadFiles = uploadFiles;
        service.downloadExcelFile = toolsService.fileUtils().downloadExcelFile;

        function getImageByImageId(imageId) {
            $log.debug('fileService - getImageByImageId:' + imageId);
            var defer = $q.defer();
            $http.get(ENV.apiEndPoint + '/file/image/' + imageId).then(function(response){
                defer.resolve(response.data);
            }, function(error){
                defer.reject(error.data);
            });
            return defer.promise;
        }

        function getImageByFileId(fileId) {
            $log.debug('fileService - getImageByFileId:' + fileId);
            var defer = $q.defer();
            $http.get(ENV.apiEndPoint + '/file/' + fileId, {responseType: "arraybuffer"}).then(function(response){
                defer.resolve('data:image/jpeg;base64,'+_arrayBufferToBase64(response.data));
            }, function(error){
                defer.reject(error.data);
            });
            return defer.promise;
        }

        function addImage(image) {
            $log.debug('fileService - addImage');
            var defer = $q.defer();
            $http.post(ENV.apiEndPoint + '/file/image', image).then(function(response){
                defer.resolve(response.data);
            }, function(error){
                defer.reject(error.data);
            });
            return defer.promise;
        }

        function deleteFile(fileId) {
            $log.debug('fileService - deleteFile:' + fileId);
            return $http.delete(ENV.apiEndPoint + '/file/' + fileId);
        }

        function uploadFiles(params){
            return $http({
                url:  params.url,
                method: 'POST',
                headers: { "Content-Type": undefined },
                transformRequest: function(data){
                    var formData = new FormData();
                    angular.forEach(params.files, function(file){
                        formData.append(file.name, file.file);
                    });
                    return formData;
                }
            })
        }

        function _arrayBufferToBase64(buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        }

        return service;
    }

}());
