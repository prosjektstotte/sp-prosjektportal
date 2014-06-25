var GT = GT || {};
GT.Project = GT.Project || {};
GT.Project.Setup = GT.Project.Setup || {};
GT.Project.Setup.Model = GT.Project.Setup.Model || {}

GT.Project.Setup.Model.step = function (name, callback, properties) {
    var self = this;
    self.name = name;
    self.properties = properties;
    self.callback = callback;
    self.execute = function () {
        self.callback(properties);
    };
};

GT.Project.Setup.InheritNavigation = function () {
    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    clientContext.load(web);
    var navigation = web.get_navigation();
    navigation.set_useShared(true);
    clientContext.executeQueryAsync();
};


GT.Project.Setup.resolveProperties = function (properties) {
    var deferred = new $.Deferred();

    var context = SP.ClientContext.get_current();

    var web = context.get_web();
    var props = web.get_allProperties();
    context.load(props);

    context.executeQueryAsync(
		function () {
		    for (var property in properties) {
		        var spPropertyValue = props.get_fieldValues()[properties[property].key];
		        if (spPropertyValue != undefined) {
		            properties[property].value = spPropertyValue;
		        }

		    }
		    deferred.resolve(properties);
		    deferred.promise();
		}, function () {
		    deferred.fail();
		}
	);
    return deferred;
};

GT.Project.Setup.persistsProperties = function (properties) {
    var self = this;
    self.properties = properties;
    var deferred = new $.Deferred();
    var context = SP.ClientContext.get_current();
    var web = context.get_web();
    context.load(web);
    var props = web.get_allProperties();
    context.load(props);
    context.executeQueryAsync(
		function () {
		    for (var property in self.properties) {
		        props.set_item(properties[property].key, properties[property].value);
		    }
		    context.executeQueryAsync(function () {
		        deferred.promise();
		    }, function () {
		        deferred.fail();
		    });

		}, function () {
		    deferred.fail();
		}
	);
};


GT.Project.Setup.execute = function (properties, steps) {
    // 1. should i run configure? No - > stop
    // 2. All right i will run configure!
    // 3. spin over all the steps configured 
    // 4. set configured
    var self = this;
    self.steps = steps;
    $.when(GT.Project.Setup.resolveProperties(properties))
	.then(function (properties) {
	    var deferred = new $.Deferred();
	    if (properties.configured.value === "0") {
	        var version = properties.version.value;
	        var steps = self.steps[version];
	        if (!steps) return;
	        var currentStep = parseInt(properties.currentStep.value);
	        while (steps[currentStep] != undefined) {
	            steps[currentStep].execute();
	            currentStep++;
	        }
	        properties.currentStep.value = currentStep;
	        GT.Project.Setup.persistsProperties(properties);
	    }
	    else {
	        deferred.fail();
	    }
	    return deferred;
	});
}

GT.Project.Setup.showWaitMessage = function () {
    window.parent.eval("window.waitDialog = SP.UI.ModalDialog.showWaitScreenWithNoClose('<div style=\"text-align: left;display: inline-table;margin-top: 13px;\">Vent litt mens vi konfigurerer <br />prosjektområdet</div>', '', 140, 500);");
};

GT.Project.Setup.closeWaitMessage = function () {
    if (window.parent.waitDialog != null) {
        window.parent.waitDialog.close();
    }
};

GT.Project.Setup.copyFiles = function (properties) {

    if (properties === undefined) return;
    var srcWeb = properties.srcWeb;
    var srcLib = properties.srcLib;
    var dstWeb = properties.dstWeb;
    var dstLib = properties.dstLib;

    $.when(GT.Project.Setup.getFiles(srcWeb, srcLib))

	.then(function (files) {
	    for (var i = 0; i < files.length; i++) {
	        GT.Project.Setup.copyFile(files[i], srcWeb, dstWeb, dstLib);
	    }
	    var promise = new $.Deferred().promise();
	})

};

GT.Project.Setup.getFiles = function (srcWeb, lib) {
    var deferred = new $.Deferred();
    var srcFolderQuery = "_api/web/GetFolderByServerRelativeUrl('" + srcWeb + "/" + lib + "')/Files";
    var executor = new SP.RequestExecutor(srcWeb);
    var info = {
        url: srcFolderQuery,
        method: "GET",
        contentType: "application/json;odata=verbose",
        binaryStringResponseBody: true,
        headers: {
            "Accept": "application/json; odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        },
        success: function (data) {
            var result = JSON.parse(data.body).d.results;
            deferred.resolve(result);
            deferred.promise();

        },
        error: function (err) {

        }
    };
    executor.executeAsync(info);
    return deferred;
}

GT.Project.Setup.copyFile = function (file, srcWeb, dstWeb, dstLib) {
    var executor = new SP.RequestExecutor(srcWeb);
    var info = {
        url: file.__metadata.uri + "/$value",
        method: "GET",
        binaryStringResponseBody: true,
        success: function (data) {
            var executor2 = new SP.RequestExecutor(dstWeb)
            //binary data available in data.body
            var result = data.body;
            var digest = $("#__REQUESTDIGEST").val();
            var info2 = {
                url: "_api/web/GetFolderByServerRelativeUrl('" + dstWeb + "/" + dstLib + "')/Files/Add(url='" + file.Name + "', overwrite=true)",
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                },
                contentType: "application/json;odata=verbose",
                binaryStringRequestBody: true,
                body: result,
                success: function (data2) {
                    console.log("Success! Your file was uploaded to SharePoint.");
                },
                error: function (err2) {
                    console.log("Oooooops... it looks like something went wrong uploading your file.");
                }
            }
            executor2.executeAsync(info2)
        },
        error: function (err) {
            alert(JSON.stringify(err));
        }
    };
    executor.executeAsync(info);


};

GT.Project.Setup.PatchRequestExecutor = function () {
    return $.getScript(_spPageContextInfo.webAbsoluteUrl + "/_layouts/15/SP.RequestExecutor.js", function () {
        SP.RequestExecutorInternalSharedUtility.BinaryDecode = function SP_RequestExecutorInternalSharedUtility$BinaryDecode(data) {
            var ret = '';

            if (data) {
                var byteArray = new Uint8Array(data);

                for (var i = 0; i < data.byteLength; i++) {
                    ret = ret + String.fromCharCode(byteArray[i]);
                }
            }
            ;
            return ret;
        };

        SP.RequestExecutorUtility.IsDefined = function SP_RequestExecutorUtility$$1(data) {
            var nullValue = null;

            return data === nullValue || typeof data === 'undefined' || !data.length;
        };

        SP.RequestExecutor.ParseHeaders = function SP_RequestExecutor$ParseHeaders(headers) {
            if (SP.RequestExecutorUtility.IsDefined(headers)) {
                return null;
            }
            var result = {};
            var reSplit = new RegExp('\r?\n');
            var headerArray = headers.split(reSplit);

            for (var i = 0; i < headerArray.length; i++) {
                var currentHeader = headerArray[i];

                if (!SP.RequestExecutorUtility.IsDefined(currentHeader)) {
                    var splitPos = currentHeader.indexOf(':');

                    if (splitPos > 0) {
                        var key = currentHeader.substr(0, splitPos);
                        var value = currentHeader.substr(splitPos + 1);

                        key = SP.RequestExecutorNative.trim(key);
                        value = SP.RequestExecutorNative.trim(value);
                        result[key.toUpperCase()] = value;
                    }
                }
            }
            return result;
        };

        SP.RequestExecutor.internalProcessXMLHttpRequestOnreadystatechange = function SP_RequestExecutor$internalProcessXMLHttpRequestOnreadystatechange(xhr, requestInfo, timeoutId) {
            if (xhr.readyState === 4) {
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
                xhr.onreadystatechange = SP.RequestExecutorNative.emptyCallback;
                var responseInfo = new SP.ResponseInfo();

                responseInfo.state = requestInfo.state;
                responseInfo.responseAvailable = true;
                if (requestInfo.binaryStringResponseBody) {
                    responseInfo.body = SP.RequestExecutorInternalSharedUtility.BinaryDecode(xhr.response);
                }
                else {
                    responseInfo.body = xhr.responseText;
                }
                responseInfo.statusCode = xhr.status;
                responseInfo.statusText = xhr.statusText;
                responseInfo.contentType = xhr.getResponseHeader('content-type');
                responseInfo.allResponseHeaders = xhr.getAllResponseHeaders();
                responseInfo.headers = SP.RequestExecutor.ParseHeaders(responseInfo.allResponseHeaders);
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 1223) {
                    if (requestInfo.success) {
                        requestInfo.success(responseInfo);
                    }
                }
                else {
                    var error = SP.RequestExecutorErrors.httpError;
                    var statusText = xhr.statusText;

                    if (requestInfo.error) {
                        requestInfo.error(responseInfo, error, statusText);
                    }
                }
            }
        };
    });
};

jQuery(document).ready(function () {

    $.when(GT.Project.Setup.PatchRequestExecutor())
	.done(function () {
	    var latestVersion = '1.0.0.0';

	    var properties = {
	        currentStep: {
	            'key': 'glittertind_currentsetupstep',
	            'value': '0'
	        },
	        configured: {
	            'key': 'glittertind_configured',
	            'value': '0'
	        },
	        version: {
	            'key': 'glittertind_version',
	            'value': latestVersion
	        },
	        webTemplate: {
	            'key': 'glittertind_webtemplateid',
	            'value': 'ProjectWebTemplate'
	        }
	    };

	    var steps = {
	        '1.0.0.0': {
	            0: new GT.Project.Setup.Model.step("Kopier dokumenter", GT.Project.Setup.copyFiles, { srcWeb: _spPageContextInfo.webServerRelativeUrl + "/..", srcLib: "Standarddokumenter", dstWeb: _spPageContextInfo.webServerRelativeUrl, dstLib: "Dokumenter" }),
	            1: new GT.Project.Setup.Model.step("Sett arving av navigasjon", GT.Project.Setup.InheritNavigation, {})

	        }
	    };

	    ExecuteOrDelayUntilScriptLoaded(function () { GT.Project.Setup.execute(properties, steps); }, "sp.js");

	});
});


