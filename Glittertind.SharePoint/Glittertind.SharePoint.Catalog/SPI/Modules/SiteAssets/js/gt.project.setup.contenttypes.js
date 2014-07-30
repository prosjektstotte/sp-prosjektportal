GT.Project.Setup.ContentTypes.CreateLookupSiteColumn = function (displayName, internalName, targetList, showField, id, required, multiSelect) {
    var deferred = $.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var siteColumnsCollection = web.get_fields();
    var field = web.get_fields().getByInternalNameOrTitle(internalName);

    clientContext.load(field);
    //Will go into error handler if the field doesn't exist
    clientContext.executeQueryAsync(function () {
        console.log('Field ' + displayName + ' already exists');
        deferred.resolve();
    }, function (sender, args) {
        var list = web.get_lists().getByTitle(targetList);
        clientContext.load(list);
        clientContext.executeQueryAsync(function () {
            var fieldType = multiSelect ? "LookupMulti" : "Lookup";
            var fieldDeclaration = [];
            fieldDeclaration.push('<Field Type="' + fieldType + '" Group="Glittertind Områdekolonner" PrependId="TRUE" ');
            fieldDeclaration.push(' DisplayName="' + displayName + '" Name="' + internalName + '"');
            fieldDeclaration.push(' List="{' + list.get_id() + '}" ShowField="' + showField + '"');
            fieldDeclaration.push(' Mult="' + multiSelect.toString().toUpperCase() + '"');
            fieldDeclaration.push(' Required="' + required.toString().toUpperCase() + '" ID="' + id + '" ');
            fieldDeclaration.push('></Field>');

            var fieldXml = fieldDeclaration.join("");
            siteColumnsCollection.addFieldAsXml(fieldXml, false, SP.AddFieldOptions.AddFieldInternalNameHint);

            clientContext.load(siteColumnsCollection);
            clientContext.executeQueryAsync(function () {
                console.log('Successfully created site column ' + displayName);
                deferred.resolve();
            }, function (sender, args) {
                console.log('Request failed: ' + args.get_message());
                console.log(args.get_stackTrace());
                console.log('Failed while creating site column ' + displayName);
                deferred.reject();
            });
        }, function (sender, args) {
            console.log('Request failed: ' + args.get_message());
            console.log(args.get_stackTrace());
            console.log('Failed while getting list ' + targetList);
            deferred.reject();
        });
    });

    return deferred.promise();
};

GT.Project.Setup.ContentTypes.CreateContentType = function (displayName, internalName, description, parentContentTypeId) {
    var deferred = $.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var contentTypeCollection = web.get_contentTypes();
    var siteCol = clientContext.get_site();
    var siteColContentTypeCollection = siteCol.get_rootWeb().get_contentTypes();

    clientContext.load(contentTypeCollection);
    clientContext.load(siteColContentTypeCollection);
    clientContext.executeQueryAsync(function () {
        if (!GT.Project.Setup.ContentTypes.DoesContentTypeExistInCollection(contentTypeCollection, internalName)) {
            var parentContentType = GT.Project.Setup.ContentTypes.GetContentTypeFromCollectionById(siteColContentTypeCollection, parentContentTypeId);
            if (parentContentType != null) {
                var contentTypeInfo = new SP.ContentTypeCreationInformation();
                contentTypeInfo.set_name(internalName);
                contentTypeInfo.set_parentContentType(parentContentType);
                contentTypeInfo.set_description(description);
                contentTypeInfo.set_group("Glittertind Innholdstyper");

                var newContentType = contentTypeCollection.add(contentTypeInfo);
                clientContext.executeQueryAsync(function () {
                    newContentType.set_name(displayName);
                    newContentType.update(true);
                    clientContext.executeQueryAsync(function () {
                        console.log('Successfully created content type ' + displayName);
                        deferred.resolve();
                    }, function () {
                        console.log('Created content type, but couldnt set displayname for ' + internalName);
                        deferred.resolve();
                    });
                }, function (sender, args) {
                    console.log('Request failed: ' + args.get_message());
                    console.log(args.get_stackTrace());
                    console.log('Failed while creating content type ' + internalName);
                    deferred.reject();
                });
            } else {
                console.log('Failed while creating content type - couldnt find parent content type ' + parentContentType);
                deferred.reject();
            }
        } else {
            console.log('Content type ' + displayName + ' already exists');
            deferred.resolve();
        }
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Failed while getting content type collection');
        deferred.reject();
    });

    return deferred.promise();
};
GT.Project.Setup.ContentTypes.LinkFieldToContentType = function (contentTypeName, fieldName) {
    var deferred = $.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var contentTypeCollection = web.get_contentTypes();
    var field = web.get_fields().getByInternalNameOrTitle(fieldName);

    clientContext.load(contentTypeCollection);
    clientContext.load(field);
    clientContext.executeQueryAsync(function () {
        var newContentType = GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(contentTypeCollection, contentTypeName);
        if (newContentType != null) {
            var fieldLinkCollection = newContentType.get_fieldLinks();
            clientContext.load(fieldLinkCollection);
            clientContext.executeQueryAsync(function () {
                var fieldAttached = false;
                var enumerator = newContentType.get_fieldLinks().getEnumerator();
                while (enumerator.moveNext()) {
                    var current = enumerator.get_current();
                    if (current.get_name() === fieldName) {
                        fieldAttached = true;
                        break;
                    }
                }
                if (fieldAttached) {
                    console.log('Field ' + fieldName + ' already attached to content type ' + contentTypeName);
                    deferred.resolve();
                } else {
                    var fieldLink = new SP.FieldLinkCreationInformation();
                    fieldLink.set_field(field);
                    newContentType.get_fieldLinks().add(fieldLink);
                    newContentType.update(true);

                    clientContext.load(newContentType);
                    clientContext.executeQueryAsync(function () {
                        console.log('Successfully linked site column ' + fieldName + ' to CT ' + contentTypeName);
                        deferred.resolve();
                    }, function (sender, args) {
                        console.log('Request failed: ' + args.get_message());
                        console.log(args.get_stackTrace());
                        console.log('Failed while linking site column to CT');
                        deferred.reject();
                    });
                }
            }, function () {
                console.log("Can't find fieldlink collection");
                deferred.reject();
            });
        } else {
            console.log("Can't find content type " + contentTypeName);
            deferred.reject();
        }
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Error while getting fields for linking');
        deferred.reject();
    });
    return deferred.promise();
};

GT.Project.Setup.ContentTypes.AddContentTypeToList = function (clientContext, contentType, listContentTypes, list) {
    var deferred = $.Deferred();

    var contentTypeName = contentType.get_name();
    var listName = list.get_title();
    if (GT.Project.Setup.ContentTypes.DoesContentTypeExistInCollection(listContentTypes, contentTypeName)) {
        console.log('Content type ' + contentTypeName + ' is already added to the list ' + listName);
        deferred.resolve();
    } else {
        var newListContentType = listContentTypes.addExistingContentType(contentType);
        clientContext.executeQueryAsync(function () {
            console.log('Successfully attached content type to list ' + listName);
            deferred.resolve();
        }, function (sender, args) {
            console.log('Request failed: ' + args.get_message());
            console.log(args.get_stackTrace());
            console.log('Failed attaching content type ' + contentTypeName + 'to list ' + listName);
            deferred.reject();
        });
    }
    return deferred.promise();
};

GT.Project.Setup.ContentTypes.AddContentTypeToListByName = function (clientContext, siteContentTypeCollection, webContentTypeCollection, listContentTypes, list, contentTypeName) {
    var deferred = $.Deferred();

    var webContentType = GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(webContentTypeCollection, contentTypeName);
    if (webContentType != null) {
        return GT.Project.Setup.ContentTypes.AddContentTypeToList(clientContext, webContentType, listContentTypes, list);
    } else {
        var siteContentType = GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(siteContentTypeCollection, contentTypeName);
        if (siteContentType != null) {
            return GT.Project.Setup.ContentTypes.AddContentTypeToList(clientContext, siteContentType, listContentTypes, list);
        } else {
            console.log('Failed getting content type ' + contentTypeName);
            deferred.reject();
        }
    }

    return deferred.promise();
};

GT.Project.Setup.ContentTypes.UpdateListContentTypes = function (listName, contentTypeNames) {
    var deferred = $.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var site = clientContext.get_site();
    var webContentTypeCollection = web.get_contentTypes();
    var siteContentTypeCollection = site.get_rootWeb().get_contentTypes();
    var list = web.get_lists().getByTitle(listName);
    var listContentTypes = list.get_contentTypes();

    clientContext.load(webContentTypeCollection);
    clientContext.load(siteContentTypeCollection);
    clientContext.load(list);
    clientContext.load(listContentTypes, 'Include(Name,Id)');
    clientContext.executeQueryAsync(function () {
        if (!list.get_contentTypesEnabled()) {
            list.set_contentTypesEnabled(true);
            list.update();
        }

        //Making sure that all our custom content types are added before removing defaults
        var promises = [];
        for (var i = 0; i < contentTypeNames.length; i++) {
            promises.push(GT.Project.Setup.ContentTypes.AddContentTypeToListByName(clientContext, siteContentTypeCollection, webContentTypeCollection, listContentTypes, list, contentTypeNames[i]));
        }

        $.when.apply($, promises).always(function () {
            list = web.get_lists().getByTitle(listName);
            listContentTypes = list.get_contentTypes();
            clientContext.load(list);
            clientContext.load(listContentTypes, 'Include(Name,Id)');
            clientContext.executeQueryAsync(function () {
                var contentTypesToRemove = [];
                var contentTypeEnumerator = listContentTypes.getEnumerator();
                while (contentTypeEnumerator.moveNext()) {
                    var ct = contentTypeEnumerator.get_current();
                    if (!IsInCollection(ct.get_name(), contentTypeNames)) {
                        contentTypesToRemove.push(ct);
                    }
                }
                if (contentTypesToRemove.length > 0) {
                    for (var h = 0; h < contentTypesToRemove.length; h++) {
                        contentTypesToRemove[h].deleteObject();
                    }
                    list.update();
                    clientContext.executeQueryAsync(function () {
                        console.log('Successfully removed content types from list ' + listName);
                        deferred.resolve();
                    }, function (sender, args) {
                        console.log('Request failed: ' + args.get_message());
                        console.log('Failed deleting content type for list ' + listName);
                        deferred.reject();
                    });
                } else {
                    console.log('Found no content types to remove from the list ' + listName);
                    deferred.resolve();
                }
            }, function (sender, args) {
                console.log('Request failed: ' + args.get_message());
                console.log(args.get_stackTrace());
                console.log('Failed getting list content type collection for list ' + listName);
                deferred.reject();
            });
        });
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Failed while loading content types and list during attaching to list');
        deferred.reject();
    });

    return deferred.promise();
};

GT.Project.Setup.ContentTypes.DoesContentTypeExistInCollection = function (contentTypeCollection, internalName) {
    return GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(contentTypeCollection, internalName) != null;
};

GT.Project.Setup.ContentTypes.GetContentTypeFromCollection = function (contentTypeCollection, internalName) {
    var contentTypeEnumerator = contentTypeCollection.getEnumerator();
    while (contentTypeEnumerator.moveNext()) {
        var ct = contentTypeEnumerator.get_current();
        if (ct.get_name().toString().toLowerCase() === internalName.toLowerCase()) {
            return ct;
        }
    }
    return null;
};

GT.Project.Setup.ContentTypes.GetContentTypeFromCollectionById = function (contentTypeCollection, id) {
    var contentTypeEnumerator = contentTypeCollection.getEnumerator();
    while (contentTypeEnumerator.moveNext()) {
        var ct = contentTypeEnumerator.get_current();
        if (ct.get_id().toString().toLowerCase() === id.toLowerCase()) {
            return ct;
        }
    }
    return null;
};

function IsInCollection(stringVal, array) {
    return ($.inArray(stringVal, array) > -1);
}