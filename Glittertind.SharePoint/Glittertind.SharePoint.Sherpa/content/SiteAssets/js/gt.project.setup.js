var GT = GT || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);
GT.Project = GT.Project || {};
GT.Project.Setup = GT.Project.Setup || {};
GT.Project.Setup.Model = GT.Project.Setup.Model || {}
GT.Project.Setup.ContentTypes = GT.Project.Setup.ContentTypes || {}
GT.Project.Setup.CustomStep = GT.Project.Setup.CustomStep || {};

GT.Project.Setup.Model.step = function (name, stepNum, callback, properties) {
    var self = this;
    self.name = name;
    self.stepNumber = stepNum;
    self.properties = properties;
    self.callback = callback;
    self.execute = function () {
        return self.callback(properties);
    };
    self.execute = function (dependentPromise) {
        var deferred = GT.jQuery.Deferred();
        dependentPromise.done(function () {
            console.log('Executing step ' + self.stepNumber);
            return self.callback(properties).done(function () {
                var properties = { currentStep: { 'key': 'glittertind_currentsetupstep', 'value': self.stepNumber + 1 } };
                GT.Project.Setup.persistProperties(properties).done(function () { deferred.resolve(); });
            });
        });
        return deferred.promise();
    };
};

GT.Project.Setup.InheritNavigation = function () {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var navigation = web.get_navigation();
    navigation.set_useShared(true);

    clientContext.executeQueryAsync(function () {
        deferred.resolve();
    }, function () {
        deferred.reject();
    }
    );

    return deferred.promise();
};

GT.Project.Setup.ApplyTheme = function (properties) {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();

    var colorPaletteUrl = _spPageContextInfo.siteServerRelativeUrl + "/_catalogs/theme/15/" + properties.colorPaletteName;
    var fontSchemeUrl = _spPageContextInfo.siteServerRelativeUrl + "/_catalogs/theme/15/" + properties.fontSchemeName;

    // I am tired
    if (_spPageContextInfo.siteServerRelativeUrl === "/") {
        colorPaletteUrl = "/_catalogs/theme/15/" + properties.colorPaletteName;
        fontSchemeUrl = "/_catalogs/theme/15/" + properties.fontSchemeName;
    }
    web.applyTheme(colorPaletteUrl, fontSchemeUrl, properties.backgroundImageUrl, properties.shareGenerated);
    web.update();

    clientContext.executeQueryAsync(function () {
        console.log('Changed theme for web');
        deferred.resolve();
    }, function (jqXHR, textStatus, errorThrown) {
        console.log('Error ' + errorThrown);
        deferred.reject();
    });
    return deferred.promise();
};

GT.Project.Setup.ConfigureQuickLaunch = function () {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var quickLaunchNodeCollection = web.get_navigation().get_quickLaunch();

    clientContext.load(web);
    clientContext.load(quickLaunchNodeCollection);
    clientContext.executeQueryAsync(function () {
        GT.Project.Setup.getFiles(_spPageContextInfo.siteServerRelativeUrl, "SiteAssets", "gt/config/quicklaunch")
        .done(function (files) {
            for (var fileIndex = 0; fileIndex < files.length; fileIndex++) {
                GT.jQuery.getJSON(files[fileIndex].ServerRelativeUrl)
                .then(function (data) {
                    var temporaryQuickLaunch = [];
                    var index = quickLaunchNodeCollection.get_count() - 1;
                    while (index >= 0) {
                        var oldNode = quickLaunchNodeCollection.itemAt(index);
                        temporaryQuickLaunch.push(oldNode);
                        oldNode.deleteObject();
                        index--;
                    }
                    clientContext.executeQueryAsync(function () {
                        for (var i = 0; i < data.length; i++) {
                            var linkNode = data[i];
                            var nodeTitle = linkNode.Title;
                            var linkUrl = GT.Project.Setup.GetUrlWithoutTokens(linkNode.Url);
							var isExternal = linkNode.IsExternal == true;
                            var existingNode = null;

                            for (var k = 0; k < temporaryQuickLaunch.length; k++) {
                                if (temporaryQuickLaunch[k].get_title() === nodeTitle) {
                                    existingNode = temporaryQuickLaunch[k];
                                    break;
                                }
                            }
                            var newNode = new SP.NavigationNodeCreationInformation();
                            newNode.set_title(nodeTitle);
                            if (existingNode === null || existingNode === undefined) {
								newNode.set_isExternal(isExternal);
                                newNode.set_url(linkUrl);
                            } else {
								newNode.set_isExternal(existingNode.get_isExternal());
                                newNode.set_url(existingNode.get_url());
                            }
                            newNode.set_asLastNode(true);
                            quickLaunchNodeCollection.add(newNode);

                            console.log('Adding the link node ' + linkNode.Title + ' to the quicklaunch');
                        };
                        clientContext.executeQueryAsync(function () { deferred.resolve(); }, function () { });
                    }, function (jqXHR, textStatus, errorThrown) {
                        console.log('Error deleting objects ' + errorThrown);
                    });
                })
                .done(function () {

                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log('Error ' + errorThrown);
                    deferred.reject();
                });
            }
        })
        .fail(function () {
            deferred.reject();
        });
    }, function () {
        console.log("Couldnt load quicklaunchcollection");
    });
    return deferred.promise();
};

// See tokens here: http://msdn.microsoft.com/en-us/library/office/ms431831%28v=office.15%29.aspx
GT.Project.Setup.GetUrlWithoutTokens = function (url) {
    return url.replace('{Site}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{SiteUrl}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{SiteUrlEncoded}', encodeURIComponent(_spPageContextInfo.webAbsoluteUrl))
              .replace('{SiteCollection}', _spPageContextInfo.siteAbsoluteUrl)
              .replace('{SiteCollectionEncoded}', encodeURIComponent(_spPageContextInfo.siteAbsoluteUrl))
			  .replace('{site}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{siteurl}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{siteurlencoded}', encodeURIComponent(_spPageContextInfo.webAbsoluteUrl))
              .replace('{sitecollection}', _spPageContextInfo.siteAbsoluteUrl)
              .replace('{sitecollectionencoded}', encodeURIComponent(_spPageContextInfo.siteAbsoluteUrl))
              .replace('{sitecollectionrelative}', _spPageContextInfo.siteServerRelativeUrl)
              .replace('{SiteCollectionRelative}', _spPageContextInfo.siteServerRelativeUrl);
};

// [start] utility methods
GT.Project.Setup.resolveProperties = function (properties) {
    var deferred = GT.jQuery.Deferred();

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

GT.Project.Setup.persistProperties = function (properties) {

    var deferred = GT.jQuery.Deferred();
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
        console.log("persisted properties!");
        deferred.resolve();
    },
    function (sender, args) {
        console.log('Persisting properties failed: ' + args.get_message());
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
    context.executeQueryAsync(function () { console.log("successfully set property " + key); }, function () { });
};

GT.Project.Setup.Debug.resetConfig = function () {
    GT.Project.Setup.Debug.setProperty("glittertind_currentsetupstep", 1);
    GT.Project.Setup.Debug.setProperty("glittertind_configured", 0);
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

GT.Project.Setup.copyFiles = function (properties) {
    var _this = this;
    _this.deferred = GT.jQuery.Deferred();
    _this.promises = [];
    var srcWeb = properties.srcWeb;
    var srcLib = properties.srcLib;
    var dstWeb = properties.dstWeb;
    var dstLib = properties.dstLib;

    GT.jQuery.when(GT.Project.Setup.getFiles(srcWeb, srcLib))
    .then(function (files) {

        for (var i = 0; i < files.length; i++) {
            _this.promises.push(GT.Project.Setup.copyFile(files[i], srcWeb, dstWeb, dstLib));
        }
        GT.jQuery.when.apply(GT.jQuery, _this.promises)
        .always(function () {
            console.log("all done copying files");
            _this.deferred.resolve();
        });

    });
    return _this.deferred.promise();
};

GT.Project.Setup.getFiles = function (srcWeb, lib, folderPath) {
    var deferred = GT.jQuery.Deferred();

    if (GT.Common.IsNonHtml5Browser()) {
        console.log("Using IE<10, skipping getting files (non IE<10 compatible)");
        deferred.resolve();
        return deferred.promise();
    }
    if (folderPath == undefined) {
        var srcFolderQuery = "_api/web/GetFolderByServerRelativeUrl('" + srcWeb + "/" + lib + "')/Files";
    } else {
        var srcFolderQuery = "_api/web/GetFolderByServerRelativeUrl('" + srcWeb + "/" + lib + "/" + folderPath + "')/Files";
    }
    var executor = new SP.RequestExecutor(srcWeb);
    var info = {
        url: srcFolderQuery,
        method: "GET",
        contentType: "application/json;odata=verbose",
        binaryStringResponseBody: true,
        headers: {
            "Accept": "application/json; odata=verbose",
            "X-RequestDigest": GT.jQuery("#__REQUESTDIGEST").val()
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

GT.Project.Setup.copyFile = function (file, srcWeb, srcLibUrl, dstWeb, dstLib) {
    var deferred = GT.jQuery.Deferred();
    var dstLibUrl = dstWeb + "/" + dstLib;

    var executor = new SP.RequestExecutor(srcWeb);
    var srcFileUrl = String.format("{0}/_api/Web/GetFileByServerRelativeUrl('{1}')/$value", srcWeb, file.FileRef)
    var info = {
        url: srcFileUrl,
        method: "GET",
        binaryStringResponseBody: true,
        success: function (data) {
            var executor2 = new SP.RequestExecutor(dstWeb);
            //binary data available in data.body
            var result = data.body;
            var digest = GT.jQuery("#__REQUESTDIGEST").val();

            var dstFileServerRelativeUrl = file.FileDirRef.replace(srcLibUrl, dstLibUrl);
            var dstFileUrl = String.format("{0}/_api/web/GetFolderByServerRelativeUrl('{1}')/Files/Add(url='{2}')", dstWeb, dstFileServerRelativeUrl, file.LinkFilename)
            var info2 = {
                url: dstFileUrl,
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                },
                contentType: "application/json;odata=verbose",
                binaryStringRequestBody: true,
                body: result,
                success: function (data2) {
                    console.log("Success! " + file.LinkFilename + " was uploaded to SharePoint.");
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
GT.Project.Setup.createFolders = function () {
    var deferred = GT.jQuery.Deferred();
    GT.jQuery.ajax({
        url: _spPageContextInfo.siteServerRelativeUrl + "/SiteAssets/gt/config/defaultfolders/folders.txt"
    })
	.done(function (data) {
	    var folders = data.split("\n");
	    if (folders.length === 0) {
	        deferred.resolve();
	        return;
	    }
	    var ctx = SP.ClientContext.get_current();
	    var web = ctx.get_web();
	    var list = web.get_lists().getByTitle("Dokumenter");
	    var listUrl = _spPageContextInfo.webAbsoluteUrl + '/Dokumenter';
	    var root = list.get_rootFolder();

	    for (var i = 0; i < folders.length ; i++) {
	        root.get_folders().add(listUrl + folders[i]);
	    }

	    list.update();

	    ctx.executeQueryAsync(function (sender, args) {
	        console.log("Created folder structure");
	        deferred.resolve();
	    }, function (sender, args) {
	        console.error('Request failed. ' + args.get_message());
	    });
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
	    console.log("not able to create folder structure, " + textStatus);
	    deferred.resolve();
	});
    return deferred.promise();
};
GT.Project.Setup.CopyFilesAndFolders = function (properties) {
    var dstWeb = _spPageContextInfo.webServerRelativeUrl;
    var srcWeb = properties.SrcWeb;
    var srcLib = properties.SrcList;
    var dstLib = properties.DstList;
    var srcListUrl = srcWeb + "/" + srcLib;
    var dstListUrl = dstWeb + '/' + dstLib;

    var deferred = GT.jQuery.Deferred();
    var digest = GT.jQuery("#__REQUESTDIGEST").val();

    GT.jQuery.ajax({
        url: String.format("{0}/_api/web/Lists/GetByTitle('{1}')/Items?$expand=Folder&$select=Title,LinkFilename,FileRef,FileDirRef,Folder/ServerRelativeUrl&$top=500", srcWeb, srcLib),
        headers: {
            "Accept": "application/json; odata=verbose",
            "X-RequestDigest": digest
        },
        contentType: "application/json;odata=verbose",
    })
	.done(function (data) {
	    var ctx = SP.ClientContext.get_current();
	    var web = ctx.get_web();
	    var list = web.get_lists().getByTitle(dstLib);
	    var root = list.get_rootFolder();

	    var docItems = data.d.results;
	    var folders = [];
	    var files = [];

	    for (var j = 0; j < docItems.length; j++) {
	        if (docItems[j].Folder.__metadata && docItems[j].Folder.__metadata.type === "SP.Folder") {
	            folders.push(docItems[j]);
	        } else {
	            files.push(docItems[j]);
	        }
	    }
	    for (var i = 0; i < folders.length ; i++) {
	        var folderUrl = folders[i].Folder.ServerRelativeUrl.replace(srcListUrl, '');
	        root.get_folders().add(dstListUrl + folderUrl);
	    }

	    list.update();

	    ctx.executeQueryAsync(function (sender, args) {
	        console.log("Created folder structure");

	        var promises = [];
	        for (var i = 0; i < files.length; i++) {
	            promises.push(GT.Project.Setup.copyFile(files[i], srcWeb, srcListUrl, dstWeb, dstLib));
	        }
	        GT.jQuery.when.apply(GT.jQuery, promises)
            .always(function () {
                console.log("Copied files");
                deferred.resolve();
            });

	    }, function (sender, args) {
	        console.error('Request failed. ' + args.get_message());
	    });
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
	    console.log("not able to create folder structure, " + textStatus);
	    deferred.resolve();
	});
    return deferred.promise();
};

GT.Project.Setup.populateTaskList = function (listData) {

    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var oList = clientContext.get_web().get_lists().getByTitle(listData.Name);
    // private method
    var createListItem = function (row) {

        if (row.Fields) {
            var itemCreateInfo = new SP.ListItemCreationInformation();
            var listItem = oList.addItem(itemCreateInfo);

            for (var i = 0; i < row.Fields.length; i++) {
                var name = row.Fields[i].Name;
				var value = GT.Project.Setup.GetUrlWithoutTokens(row.Fields[i].Value);
				if (name === "Title" && value.length > 255) value = value.substr(0, 252) + "...";
                listItem.set_item(name, value);
            }

            row.ListItem = listItem;
            listItem.update();
            clientContext.load(listItem);
        }

        if (row.Rows) {
            for (var i = 0; i < row.Rows.length; i++) {
                createListItem(row.Rows[i]);
            }
        }
    }

    var updateParentIdReference = function (row) {
        if (row.ListItem) {
            var id = row.ListItem.get_item("ID");
        }
        for (var i = 0; i < row.Rows.length; i++) {
            if (id) {
                row.Rows[i].ListItem.set_item("ParentID", id);
                row.Rows[i].ListItem.update();
            }

            if (row.Rows[i].Rows) {
                updateParentIdReference(row.Rows[i]);
            }
        }
    }

    createListItem(listData.Data);

    clientContext.executeQueryAsync(function (sender, args) {

        console.log("Copied default items to " + listData.Name);
        updateParentIdReference(listData.Data);
        clientContext.executeQueryAsync(function (sender, args) {
            console.log("Updated parent task info " + listData.Name);
            deferred.resolve();
        }, function (sender, args) {
            console.error('Request failed. ' + args.get_message());
            deferred.reject();
        });

    }, function (sender, args) {
        console.error('Request failed. ' + args.get_message());
        deferred.reject();
    });
    return deferred.promise();
};

GT.Project.Setup.populateGenericList = function (listData) {

    var deferred = GT.jQuery.Deferred();
    var clientContext = SP.ClientContext.get_current();
    var oList = clientContext.get_web().get_lists().getByTitle(listData.Name);

    var rows = listData.Data.Rows;
    for (var i = 0; i < rows.length; i++) {
        var itemCreateInfo = new SP.ListItemCreationInformation();
        var oListItem = oList.addItem(itemCreateInfo);

        for (var y = 0; y < rows[i].Fields.length; y++) {
            var name = rows[i].Fields[y].Name;
            var value = rows[i].Fields[y].Value;
            if (value.length > 255) value = value.substr(0, 252) + "...";
            oListItem.set_item(name, value);
        }
        oListItem.update();
        clientContext.load(oListItem);
    }

    clientContext.executeQueryAsync(function (sender, args) {
        console.log("Copied default items to " + listData.Name);
        deferred.resolve();
    }, function (sender, args) {
        console.error('Request failed. ' + args.get_message());
        deferred.reject();
    });

    return deferred.promise();

};

GT.Project.Setup.copyDefaultItems = function () {
    var _this = this;
    _this.promises = [];
    _this.deferred = GT.jQuery.Deferred();

    GT.Project.Setup.getFiles(_spPageContextInfo.siteServerRelativeUrl, "SiteAssets", "gt/config/data")
    .done(function (files) {
        for (var i = 0; i < files.length; i++) {
            _this.promises.push(GT.jQuery.Deferred());

            (function (index) {
                GT.jQuery.getJSON(files[i].ServerRelativeUrl).done(function (data) {

                    if (!data.Type || data.Type != "Tasklist") {
                        GT.Project.Setup.populateGenericList(data).done(function () {
                            _this.promises[index].resolve();
                        });
                    } else {
                        GT.Project.Setup.populateTaskList(data).done(function () {
                            _this.promises[index].resolve();
                        });
                    }
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    console.log("Could not get file: " + textStatus + " " + errorThrown);
                });
            })(i);

        }

        GT.jQuery.when.apply(GT.jQuery, _this.promises).done(function () {
            _this.deferred.resolve();
        });

    })
    .fail(function () {
        console.log("Could not find path {site collection root}/SiteAssets/gt/config/data");
        _this.deferred.reject();
    });

    return _this.deferred.promise();
};

GT.Project.Setup.CopyListItems = function (properties) {
    var sourceListName = properties.SrcList;
    var sourceWebUrl = properties.SrcWeb;
    var destListName = properties.DstList;
    var listType = properties.ListType;
    var fieldsToSynch = properties.Fields;
    var fieldsJson = fieldsToSynch.join(",");

    var deferred = GT.jQuery.Deferred();
    var digest = GT.jQuery("#__REQUESTDIGEST").val();

    GT.jQuery.ajax({
        url: String.format("{0}/_api/web/Lists/GetByTitle('{1}')/Items?$top=500&$select={2}", sourceWebUrl, sourceListName, fieldsJson),
        headers: {
            "Accept": "application/json; odata=verbose",
            "X-RequestDigest": digest
        },
        contentType: "application/json;odata=verbose",
    })
	.done(function (data) {
	    var clientContext = SP.ClientContext.get_current();
	    var web = clientContext.get_web();
	    var list = web.get_lists().getByTitle(destListName);
	    var fields = list.get_fields();
	    GT.Project.Setup.ListItems = GT.Project.Setup.ListItems || {};
	    GT.Project.Setup.ListItems.srcItems = data.d.results;

	    clientContext.load(fields);
	    clientContext.load(list, "ItemCount");
	    clientContext.executeQueryAsync(function (sender, args) {
	        if (list.get_itemCount() === 0) {
	            for (var i = 0; i < GT.Project.Setup.ListItems.srcItems.length; i++) {
	                var srcItem = GT.Project.Setup.ListItems.srcItems[i];

	                try {
	                    var itemCreateInfo = new SP.ListItemCreationInformation();
	                    var newItem = list.addItem(itemCreateInfo);

	                    for (var j = 0; j < fieldsToSynch.length; j++) {
	                        var fieldName = fieldsToSynch[j];
	                        var fieldValue = srcItem[fieldName];

	                        if (fieldValue && fieldName.toUpperCase() !== "ID" && fieldName.toUpperCase() !== "PARENTIDID") {
	                            if (fieldName.indexOf("Title") === 0) {
	                                var value = GT.Project.Setup.GetUrlWithoutTokens(fieldValue);
	                                if (fieldName === "Title" && value.length > 255) value = value.substr(0, 252) + "...";
	                                newItem.set_item(fieldName, value);
	                            } else if (fieldValue.TermGuid) {
	                                newItem.set_item(fieldName, fieldValue.WssId);
	                            } else {
	                                newItem.set_item(fieldName, fieldValue);
	                            }
	                        }
	                    }

	                    srcItem.NewListItem = newItem;
	                    newItem.update();
	                    clientContext.load(newItem);
	                } catch(exception) {
	                    console.log("Error while creating data item " + srcItem.Title + " - not aborting...")
	                    console.log(exception);
	                }
	            }
	            clientContext.executeQueryAsync(function (sender, args) {
	                console.log("Copied default items to " + destListName);
	                if (listType === "TaskList") {
	                    GT.jQuery.when(
                            GT.Project.Setup.UpdateParentReferences(clientContext, GT.Project.Setup.ListItems.srcItems)
                        ).then(function () {
                            deferred.resolve();
                        });
	                } else {
	                    deferred.resolve();
	                }
	            }, function (sender, args) {
	                console.error('Request failed while copying list items. ' + args.get_message());
	                deferred.reject();
	            });
	        } else {
	            deferred.resolve();
	        }
	    }, function (sender, args) {
	        console.error('Request failed while retrieving list to synch. ' + args.get_message());
	        deferred.reject();
	    });
	});

    return deferred.promise();
}
GT.Project.Setup.UpdateParentReferences = function (clientContext, srcItems) {
    var deferred = GT.jQuery.Deferred();

    for (var x = 0; x < srcItems.length; x++) {
        var srcItem = srcItems[x];
        var newItem = srcItem.NewListItem;

        if (srcItem.ParentIDId) {
            var parentItem = GT.jQuery.grep(srcItems, function (n, i) {
                return n.ID === srcItem.ParentIDId;
            });
            if (parentItem) {
                var newParentId = parentItem[0].NewListItem.get_id();
                newItem.set_item("ParentID", newParentId);
                newItem.update();
                clientContext.load(newItem);
            }
        }
    }

    clientContext.executeQueryAsync(function (sender, args) {
        console.log("Updated parent references");
        deferred.resolve();
    }, function (sender, args) {
        console.error('Request failed while copying list items. ' + args.get_message());
        deferred.reject();
    });

    return deferred.promise();
}

GT.Project.Setup.ExecuteCustomSteps = function () {
    var deferred = GT.jQuery.Deferred();
    GT.jQuery.getScript(_spPageContextInfo.siteServerRelativeUrl + "/SiteAssets/gt/js/customsteps.js")
	.done(function (status) {
	    if (status) console.log(status);
	    deferred.resolve();
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
	    console.log(textStatus);
	    deferred.reject();
	});
    return deferred.promise();
};

// TODO; At some point refactor this to be configured in json-files
GT.Project.Setup.CreateWebContentTypes = function () {
    var deferred = GT.jQuery.Deferred();

    GT.jQuery.when(
        GT.Project.Setup.ContentTypes.CreateContentType("Kommunikasjonselement", "GtProjectCommunicationElement", "", "0x010088578e7470cc4aa68d5663464831070203"),
        GT.Project.Setup.ContentTypes.CreateContentType("Prosjektoppgave", "GtProjectTask", "", "0x010800233b015f95174c9a8eb505493841de8d"),
        GT.Project.Setup.ContentTypes.CreateContentType("Prosjektprodukt", "GtProjectProduct", "", "0x010088578e7470cc4aa68d5663464831070205"),
        GT.Project.Setup.ContentTypes.CreateContentType("Prosjektloggelement", "GtProjectLog", "", "0x010088578e7470cc4aa68d5663464831070206")
    ).then(function () {
        GT.jQuery.when(
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Kommunikasjonsplan", ["Kommunikasjonselement"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Prosjektprodukter", ["Prosjektprodukt"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Prosjektlogg", ["Prosjektloggelement"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Interessentregister", ["Interessent"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Informasjon", ["Infoelement"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Usikkerhet", ["Risiko", "Mulighet"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Oppgaver", ["Prosjektoppgave"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Møtekalender", ["Prosjekthendelse"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Fasesjekkliste", ["Sjekkpunkt"]),
            GT.Project.Setup.ContentTypes.UpdateListContentTypes("Dokumenter", ["Prosjektdokument"])
        ).then(function () {
            GT.jQuery.when(
                GT.Project.Setup.ContentTypes.AddFieldToListFromXml('Møtekalender', 'GtProjectEventDateAndTitle', '<Field ID="{7604dadc-d8e3-4f35-bc58-890d33d908b9}" Name="GtProjectEventDateAndTitle" DisplayName="Dato og tittel" Type="Calculated" Hidden="False" Group="Glittertind Områdekolonner" Description="" Required="FALSE" ResultType="Text" ReadOnly="TRUE" EnforceUniqueValues="FALSE" Indexed="FALSE" Percentage="FALSE"><Formula>=TEXT(Starttidspunkt,"yyyy-mm-dd")&amp;" "&amp;Tittel</Formula><FieldRefs><FieldRef Name="Tittel" /><FieldRef Name="Starttidspunkt" /></FieldRefs></Field>')
            ).then(function () {
                GT.jQuery.when(
                    GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Målgruppe", "GtCommunicationTarget", "Interessentregister", "Title", "{d685f33f-51b5-4e9f-a314-4b3d9467a7e4}", false, true, ""),
                    GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Interessent(er)", "GtProductInteressent", "Interessentregister", "Title", "{6d90e0b6-73e6-48fb-aa1e-b897b214f934}", false, true, ""),
                    GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Påvirker produkt", "GtProjectLogProductLookup", "Prosjektprodukter", "Title", "{022cc93f-13df-4420-bd47-55e4fdae5d18}", false, true, "Velg hvilke(t) prosjektprodukt som blir påvirket av dette."),
                    GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Til prosjektstyre", "GtProjectLogEventLookup", "Møtekalender", "GtProjectEventDateAndTitle", "{20731fb1-e98e-4fdc-b3d6-941b41b8fd6e}", false, false, "Dersom dette skal opp i prosjektstyret velger du dato for styringsgruppemøtet her."),
                    GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Relevant usikkerhet", "GtProjectTaskRisk", "Usikkerhet", "Title", "{920b385c-756f-49eb-98e7-4c3ebf15b7f4}", false, false, ""),
                    GT.Project.Setup.ContentTypes.CreateLookupSiteColumn("Relevant kommunikasjonselement", "GtProjectTaskComElement", "Kommunikasjonsplan", "Title", "{087dae25-b007-4e58-91b4-347dde464840}", false, false, "")
                ).then(function () {
                    GT.jQuery.when(
                        GT.Project.Setup.ContentTypes.LinkFieldsToContentType("Prosjektoppgave", ["GtProjectTaskRisk", "GtProjectTaskComElement"]),
                        GT.Project.Setup.ContentTypes.LinkFieldsToContentType("Kommunikasjonselement", ["GtCommunicationTarget"]),
                        GT.Project.Setup.ContentTypes.LinkFieldsToContentType("Prosjektprodukt", ["GtProductInteressent"])
                    ).then(function () {
                        GT.jQuery.when(
                            GT.Project.Setup.ContentTypes.LinkFieldsToContentType("Prosjektloggelement", ["GtProjectLogEventLookup"])
                        ).then(function () {
                            GT.jQuery.when(
                                GT.Project.Setup.ContentTypes.LinkFieldsToContentType("Prosjektloggelement", ["GtProjectLogProductLookup"])
                            ).then(function () {
                                GT.jQuery.when(
                                    GT.Project.Setup.ContentTypes.SetFieldDescriptionsOfList("Interessentregister", [{ "key": "Title", "value": "Navnet på interessenten" }])
                                ).done(function () {
                                    deferred.resolve();
                                }).fail(function () {
                                    deferred.reject();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    return deferred.promise();
};

GT.Project.Setup.GetCopyDataFromSourceListsSteps = function (settings, startIndex) {
    var steps = [];
    for (var i = 0; i < settings.DataSources.Lists.length; i++) {
        var listDataSource = settings.DataSources.Lists[i];
        var srcWebUrl = GT.Project.Setup.GetUrlWithoutTokens(listDataSource.SrcWeb);
        var listType = listDataSource.ListType;

        if (listType === "DocumentLibrary") {
            steps.push(new GT.Project.Setup.Model.step("Kopierer dokumenter fra " + listDataSource.SrcList, startIndex + i, GT.Project.Setup.CopyFilesAndFolders,
            {
                SrcList: listDataSource.SrcList,
                SrcWeb: srcWebUrl,
                DstList: listDataSource.DstList,
            }));
        } else {
            steps.push(new GT.Project.Setup.Model.step("Kopierer listeelementer fra " + listDataSource.SrcList, startIndex + i, GT.Project.Setup.CopyListItems,
            {
                SrcList: listDataSource.SrcList,
                SrcWeb: srcWebUrl,
                DstList: listDataSource.DstList,
                ListType: listType,
                Fields: listDataSource.Fields
            }));
        }
    }
    return steps;
}

GT.Project.Setup.UpdateListsFromConfig = function () {
    var deferred = GT.jQuery.Deferred();

    GT.jQuery.when(GT.Project.Setup.getFiles(_spPageContextInfo.siteServerRelativeUrl, "SiteAssets", "gt/config/lists"))
    .then(function (files) {
        for (var i = 0; i < files.length; i++) {
            GT.jQuery.getJSON(files[i].ServerRelativeUrl).then(function (data) {
                GT.Project.Setup.UpdateListProperties(data);
                GT.Project.Setup.UpdateListViews(data);
            });
        }
    })
    .done(function () {
        deferred.resolve();
    })
    .fail(function () {
        deferred.reject();
    });

    return deferred.promise();
};
GT.Project.Setup.UpdateListProperties = function (configData) {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var list = clientContext.get_web().get_lists().getByTitle(configData.Name);
    list.set_onQuickLaunch(configData.OnQuickLaunch);
    list.set_enableVersioning(configData.VersioningEnabled);
    list.set_description(configData.Description);
    list.update();

    clientContext.executeQueryAsync(function () {
        deferred.resolve();
        console.log("Modified list properties of " + configData.Name);
    }, function (sender, args) {
        deferred.reject();
        console.error('Request failed. ' + args.get_message());
    });
    return deferred.promise();
};
GT.Project.Setup.UpdateListViews = function (data) {
    var deferred = GT.jQuery.Deferred();

    var listName = data.Name;
    var listViewsToConfigure = data.Views;

    var clientContext = SP.ClientContext.get_current();
    var list = clientContext.get_web().get_lists().getByTitle(listName);
    var viewCollection = list.get_views();

    clientContext.load(viewCollection);
    clientContext.executeQueryAsync(function () {
        for (var i = 0; i < listViewsToConfigure.length; i++) {
            var viewName = listViewsToConfigure[i].Name;
            var rowLimit = listViewsToConfigure[i].RowLimit;
            var query = listViewsToConfigure[i].Query;
            var viewType = listViewsToConfigure[i].ViewType;
            var viewFieldsData = listViewsToConfigure[i].ViewFields;
            var viewUrl = listViewsToConfigure[i].Url;
			var defaultView = listViewsToConfigure[i].DefaultView == true;
            var paged = listViewsToConfigure[i].Paged === true;
			var deleteView = listViewsToConfigure[i].Delete === true;

            var view = null;
            if (viewName != "") {
                view = GT.Project.Setup.GetViewFromCollectionByName(viewCollection, viewName);
            } else if (viewUrl != undefined && viewUrl != "") {
                view = GT.Project.Setup.GetViewFromCollectionByUrl(viewCollection, viewUrl);
            }
            if (view != null) {
				if (deleteView) {
					view.deleteObject();
					continue;
				}
                if (viewFieldsData != undefined && viewFieldsData.length > 0) {
                    var columns = view.get_viewFields();
                    columns.removeAll();
                    for (var index = 0; index < viewFieldsData.length; index++) {
                        columns.add(viewFieldsData[index]);
                    };
                }
                if (rowLimit != undefined && rowLimit != "" && rowLimit > 0) {
                    view.set_rowLimit(rowLimit);
                }
                if (query != undefined && query != "") {
                    view.set_viewQuery(query);
                }
                view.set_paged(paged);
				view.set_defaultView(defaultView);
                view.update();
            } else {

				if (deleteView) { continue; }
                var viewInfo = new SP.ViewCreationInformation();
                viewInfo.set_title(viewName);
                viewInfo.set_rowLimit(rowLimit);
                viewInfo.set_query(query);
                viewInfo.set_paged(paged);
                viewInfo.set_viewFields(viewFieldsData);
                if (viewType) {
                    viewInfo.set_viewTypeKind(viewType);
                }
				viewInfo.set_setAsDefaultView(defaultView)
                viewCollection.add(viewInfo);
            }
        };

        clientContext.load(viewCollection);
        clientContext.executeQueryAsync(function () {
            deferred.resolve();
            console.log("Modified list view(s) of " + listName);
        }, function (sender, args) {
            deferred.reject();
            console.error('Request failed. ' + args.get_message());
        });
    }, function (sender, args) {
        deferred.reject();
        console.error('Request failed. ' + args.get_message());
    });
    return deferred.promise();
};

GT.Project.Setup.GetViewFromCollectionByUrl = function (viewCollection, url) {
    var serverRelativeUrl = _spPageContextInfo.webServerRelativeUrl + "/" + url;
    var viewCollectionEnumerator = viewCollection.getEnumerator();
    while (viewCollectionEnumerator.moveNext()) {
        var view = viewCollectionEnumerator.get_current();
        if (view.get_serverRelativeUrl().toString().toLowerCase() === serverRelativeUrl.toLowerCase()) {
            return view;
        }
    }
    return null;
};
GT.Project.Setup.GetViewFromCollectionByName = function (viewCollection, name) {
    var viewCollectionEnumerator = viewCollection.getEnumerator();
    while (viewCollectionEnumerator.moveNext()) {
        var view = viewCollectionEnumerator.get_current();
        if (view.get_title().toString().toLowerCase() === name.toLowerCase()) {
            return view;
        }
    }
    return null;
};

GT.Project.Setup.GetSettingsFromFile = function () {
    var deferred = GT.jQuery.Deferred();
    var urlToSettings = _spPageContextInfo.siteServerRelativeUrl + "/SiteAssets/gt/config/core/settings.txt";

    GT.jQuery.getJSON(urlToSettings)
    .then(function (data) {
        deferred.resolve(data);
    });

    return deferred.promise();
};
GT.Project.Setup.HandleOnTheFlyConfiguration = function (defaultProperties) {
    var deferred = GT.jQuery.Deferred();
    GT.Project.Setup.resolveProperties(defaultProperties).done(function (properties) {
        GT.Project.GetPhaseNameFromCurrentItem().done(function (currentPhase) {
            // Persist change of phase
            if (currentPhase != undefined && currentPhase != "" && properties.persistedPhase.value != currentPhase) {
                GT.Project.Setup.showWaitMessage();
                GT.Project.ChangeProjectPhase().done(function () {
                    properties.persistedPhase.value = currentPhase;
                    GT.Project.Setup.persistProperties(properties).done(function () {
                        GT.Project.Setup.closeWaitMessage();
                        deferred.resolve(true);
                    });
                });
            } else {
                deferred.resolve(false);
            }
        });
    });
    return deferred.promise();
};

GT.Project.Setup.execute = function (defaultProperties, steps) {
    // 1. should i run configure? No - > stop
    // 2. All right i will run configure!
    // 3. spin over all the steps configured
    // 4. set configured
    var _this = this;
    _this.steps = steps;
    _this.dependentPromises = [];
    var deferred = GT.jQuery.Deferred();

    GT.Project.Setup.resolveProperties(defaultProperties)
    .done(function (properties) {
        console.log("execute: using these settings :" + JSON.stringify(properties));
        if (properties.configured.value === "0") {
            console.log("execute: not configured, showing long running ops message");
            GT.Project.Setup.showWaitMessage();
            var version = properties.version.value;
            var steps = _this.steps[version];
            if (!steps) return;
            var currentStep = parseInt(properties.currentStep.value);
            console.log("execute: current step is " + currentStep);

            _this.dependentPromises.push(GT.jQuery.Deferred());
            _this.dependentPromises[0].resolve();
            _this.dependentPromises[0] = _this.dependentPromises[0].promise();

            while (steps[currentStep] != undefined) {
                var i = _this.dependentPromises.length - 1;
                console.log("execute: queuing step '" + steps[currentStep].name + "'");
                _this.dependentPromises.push(steps[currentStep].execute(_this.dependentPromises[i]));
                currentStep++;
            }
            GT.jQuery.when.apply(GT.jQuery, _this.dependentPromises).done(function () {
                properties.currentStep.value = currentStep;
                properties.configured.value = "1";
                GT.Project.Setup.persistProperties(properties);
                GT.Project.Setup.closeWaitMessage();
                console.log("execute: persisted properties and wrapping up");
                deferred.resolve(true);
            });
        } else {
            deferred.resolve(false);
        }
    });
    return deferred.promise();
};

GT.jQuery(document).ready(function () {
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
            'value': '1.0.0.0'
        },
        webTemplate: {
            'key': 'glittertind_webtemplateid',
            'value': 'ProjectWebTemplate'
        },
        persistedPhase: {
            'key': 'glittertind_persistedPhase',
            'value': 'NA'
        }
    };
    GT.jQuery.when(
        GT.Project.Setup.PatchRequestExecutor(),
        GT.Project.Setup.GetSettingsFromFile()
    ).done(function (executor, settings) {

        var steps = {
            '1.0.0.0': [
                new GT.Project.Setup.Model.step("Setter områdets temafarger", 0, GT.Project.Setup.ApplyTheme,
                    { colorPaletteName: "palette013.spcolor", fontSchemeName: "SharePointPersonality.spfont", backgroundImageUrl: "", shareGenerated: true }),
                new GT.Project.Setup.Model.step("Opprette områdenivå innholdstyper", 1, GT.Project.Setup.CreateWebContentTypes, {}),
                new GT.Project.Setup.Model.step("Sett arving av navigasjon", 2, GT.Project.Setup.InheritNavigation, {}),
                new GT.Project.Setup.Model.step("Konfigurer quicklaunch", 3, GT.Project.Setup.ConfigureQuickLaunch, {}),
                new GT.Project.Setup.Model.step("Oppdater listeegenskaper og visninger", 4, GT.Project.Setup.UpdateListsFromConfig, {})
            ]
        };
        var dataSourceSteps = GT.Project.Setup.GetCopyDataFromSourceListsSteps(settings, 5);
        steps['1.0.0.0'] = steps['1.0.0.0'].concat(dataSourceSteps);

        var scriptbase = _spPageContextInfo.webServerRelativeUrl + "/_layouts/15/";
        GT.jQuery.getScript(scriptbase + "SP.js", function () {
            GT.jQuery.getScript(scriptbase + "SP.Taxonomy.js", function () {

                GT.Project.Setup.execute(properties, steps)
                .done(function (shouldReload) {
                    if (shouldReload) {
                        location.reload();
                    }
                    GT.Project.Setup.HandleOnTheFlyConfiguration(properties)
                    .done(function (shouldReload) {
                        if (shouldReload) {
                            location.reload();
                        }
                    });
                });

            });
        });
    });
});


GT.Project.Setup.PatchRequestExecutor = function () {
    return GT.jQuery.getScript(_spPageContextInfo.webAbsoluteUrl + "/_layouts/15/SP.RequestExecutor.js", function () {
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