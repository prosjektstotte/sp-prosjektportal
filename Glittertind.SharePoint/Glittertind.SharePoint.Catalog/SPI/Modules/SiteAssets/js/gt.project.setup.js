var GT = GT || {};
GT.Project = GT.Project || {};
GT.Project.Setup = GT.Project.Setup || {};
GT.Project.Setup.Model = GT.Project.Setup.Model || {}
GT.Project.Setup.ContentTypes = GT.Project.Setup.ContentTypes || {}

GT.Project.Setup.Model.step = function (name, callback, properties) {
    var self = this;
    self.name = name;
    self.properties = properties;
    self.callback = callback;
    self.execute = function () {
        return self.callback(properties);
    };
};

GT.Project.Setup.InheritNavigation = function () {
    var deferred = $.Deferred();
    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    clientContext.load(web);
    var navigation = web.get_navigation();
    navigation.set_useShared(true);
    clientContext.executeQueryAsync(function () { deferred.resolve() }, function () { deferred.reject() });
    return deferred.promise();
};

// [start] utility methods

GT.Project.Setup.resolveProperties = function (properties) {
    var deferred = $.Deferred();

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
        }, function () {
            deferred.reject();
        }
    );
    return deferred.promise();
};

GT.Project.Setup.persistsProperties = function (properties) {

    var deferred = $.Deferred();
    var context = SP.ClientContext.get_current();
    var web = context.get_web();
    var propBag = web.get_allProperties();

    for (var property in properties) {
        var key = properties[property].key;
        var value = properties[property].value;
        propBag.set_item(key, value);
    }
    context.load(web);
    web.update();
    context.executeQueryAsync(
    function (sender, args) {
        console.log("saved properties!");
        deferred.resolve();
    },
    function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        deferred.reject();
    });

    return deferred.promise();
};

GT.Project.Setup.Utility = GT.Project.Setup.Utility || {};
GT.Project.Setup.Debug = GT.Project.Setup.Debug || {};

GT.Project.Setup.Debug.listAllProperties = function () {

    var context = SP.ClientContext.get_current();
    var props = context.get_web().get_allProperties();
    context.load(props);

    context.executeQueryAsync(
        function (sender, args) {
            console.log(props.get_fieldValues());
        }, function (sender, args) {
            console.log('Request failed: ' + args.get_message());
            console.log(args.get_stackTrace());
        }
    );
};

GT.Project.Setup.Debug.setProperty = function (key, value) {

    var context = SP.ClientContext.get_current();
    var web = context.get_web();
    var propBag = web.get_allProperties();
    propBag.set_item(key, value);
    context.load(web);
    web.update();
    context.executeQueryAsync();
};


GT.Project.Setup.showWaitMessage = function () {
    window.parent.eval("window.waitDialog = SP.UI.ModalDialog.showWaitScreenWithNoClose('<div style=\"text-align: left;display: inline-table;margin-top: 13px;\">Vent litt mens vi konfigurerer <br />prosjektområdet</div>', '', 140, 500);");
};

GT.Project.Setup.closeWaitMessage = function () {
    if (window.parent.waitDialog != null) {
        window.parent.waitDialog.close();
    }
};
// [end] utility methods

GT.Project.Setup.execute = function (properties, steps) {
    // 1. should i run configure? No - > stop
    // 2. All right i will run configure!
    // 3. spin over all the steps configured 
    // 4. set configured
    console.log("execute: firing");
    var self = this;
    self.steps = steps;

    $.when(GT.Project.Setup.resolveProperties(properties))
    .then(function (properties) {
        console.log("execute: using these settings :" + JSON.stringify(properties));
        var deferred = $.Deferred();
        console.log("execute: value of 'configured' :" + properties.configured.value);
        if (properties.configured.value === "0") {
            console.log("execute: not configured, showing long running ops message");
            GT.Project.Setup.showWaitMessage();
            var version = properties.version.value;
            var steps = self.steps[version];
            if (!steps) return;
            var currentStep = parseInt(properties.currentStep.value);
            console.log("execute: current step is " + currentStep);
            var promises = [];

            while (steps[currentStep] != undefined) {
                console.log("execute: running step '" + steps[currentStep].name + "'");
                promises.push(steps[currentStep].execute());
                currentStep++;
            }

            $.when.apply($, promises).always(function () {
                properties.currentStep.value = currentStep;
                properties.configured.value = "1";
                GT.Project.Setup.persistsProperties(properties);
                GT.Project.Setup.closeWaitMessage();
                console.log("execute: persisted properties and wrapping up");
                deferred.resolve();
            });


        }
        return deferred.promise();
    });
};

GT.Project.Setup.copyFiles = function (properties) {
    var deferred = $.Deferred();

    var srcWeb = properties.srcWeb;
    var srcLib = properties.srcLib;
    var dstWeb = properties.dstWeb;
    var dstLib = properties.dstLib;

    $.when(GT.Project.Setup.getFiles(srcWeb, srcLib))

    .then(function (files) {
        var promises = [];
        for (var i = 0; i < files.length; i++) {
            promises.push(GT.Project.Setup.copyFile(files[i], srcWeb, dstWeb, dstLib));
        }
        $.when.apply($, promises)
        .always(function () {
            console.log("all done copying files"); deferred.resolve();
        });

    });
    return deferred.promise();
};
// [start] helper methods for copying files
GT.Project.Setup.getFiles = function (srcWeb, lib) {
    var deferred = $.Deferred();
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

        },
        error: function (err) {
            deferred.reject();
        }
    };
    executor.executeAsync(info);
    return deferred.promise();
};

GT.Project.Setup.copyFile = function (file, srcWeb, dstWeb, dstLib) {
    var deferred = $.Deferred();

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
                url: "_api/web/GetFolderByServerRelativeUrl('" + dstWeb + "/" + dstLib + "')/Files/Add(url='" + file.Name + "')",
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
                    deferred.resolve();
                },
                error: function (err2) {
                    var d = JSON.parse(err2.body);
                    console.log("Did not upload file due to: " + d.error.message.value);
                    deferred.reject();
                }
            }
            executor2.executeAsync(info2)
        },
        error: function (err) {
            console.error(JSON.stringify(err));
            deferred.reject();
        }
    };
    executor.executeAsync(info);
    return deferred.promise();
};

// [start] Default artifacts for Sjekkliste
GT.Project.Setup.copyDefaultItems = function () {
    var deferred = $.Deferred();
    var currentSiteColl = _spPageContextInfo.siteAbsoluteUrl;
    var url = currentSiteColl + "/SiteAssets/gt/data/checklist.defaultitems.json";
    console.log(url);
    $.when($.getJSON(url)).done(function(data) {

        var clientContext = SP.ClientContext.get_current();
        var oList = clientContext.get_web().get_lists().getByTitle('Sjekkliste');

        console.log(data.Data.Rows);
        var rows = data.Data.Rows
        var listItems = [];
        for (var i = 0; i < rows.length; i++) {

            var itemCreateInfo = new SP.ListItemCreationInformation();
            var oListItem = oList.addItem(itemCreateInfo);

            for (var y = 0; y < rows[i].Fields.length; y++) {
                var name = rows[i].Fields[y].Name;
                var value = rows[i].Fields[y].Value;
                oListItem.set_item(name, value);
            }
            oListItem.update();
            clientContext.load(oListItem);

        }
        clientContext.executeQueryAsync(function (sender, args) {
            deferred.resolve();
            console.log("Copied default items to Sjekkliste");
        }, function(sender, args) {
            deferred.reject();
            console.error('Request failed. ' + args.get_message());
        });
    });
    return deferred.promise();
};

// [end]Default artifacts for Sjekkliste


// [end] helper methods for copying files

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

GT.Project.Setup.CreateWebContentTypes = function () {
    var deferred = $.Deferred();
    var dependentPromises = $.when(
            GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Målgruppe", "GtCommunicationTarget", "Interessenter", "Title", "FALSE", "{d685f33f-51b5-4e9f-a314-4b3d9467a7e4}"),
            GT.Project.Setup.ContentTypes.CreateContentType("Kommunikasjonselement", "GtProjectCommunicationElement", "", "0x010088578e7470cc4aa68d5663464831070203")
        );

    dependentPromises.done(function () {
        $.when(GT.Project.Setup.ContentTypes.LinkFieldToContentType("Kommunikasjonselement", "GtCommunicationTarget"))
            .then(GT.Project.Setup.ContentTypes.UpdateListContentTypes("Kommunikasjonsplan", ["Kommunikasjonselement"]))
            .then(GT.Project.Setup.ContentTypes.UpdateListContentTypes("Interessenter", ["Interessent"]))
            .then(GT.Project.Setup.ContentTypes.UpdateListContentTypes("Usikkerhet", ["Risiko", "Mulighet"]))
            .then(GT.Project.Setup.ContentTypes.UpdateListContentTypes("Dokumenter", ["Prosjektdokument"]))
            .done(function () { deferred.resolve(); })
            .fail(function () { deferred.reject(); });
    });

    return deferred.promise();
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
                1: new GT.Project.Setup.Model.step("Sett arving av navigasjon", GT.Project.Setup.InheritNavigation, {}),
                2: new GT.Project.Setup.Model.step("Opprette områdenivå innholdstyper", GT.Project.Setup.CreateWebContentTypes, {}),
                3: new GT.Project.Setup.Model.step("Oppretter standardverdier i sjekkliste",GT.Project.Setup.copyDefaultItems, {})

            }
        };

        ExecuteOrDelayUntilScriptLoaded(function () { GT.Project.Setup.execute(properties, steps); }, "sp.js");
    });
});