var GT = GT || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);
GT.Project = GT.Project || {};
GT.Project.Setup = GT.Project.Setup || {};
GT.Project.Setup.ContentTypes = GT.Project.Setup.ContentTypes || {}

GT.Project.Setup.ContentTypes.CreateLookupSiteColumn = function (displayName, internalName, targetList, showField, id, required, multiSelect, description) {
    var deferred = GT.jQuery.Deferred();

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
            fieldDeclaration.push(' Description="' + description + '"');
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
    var deferred = GT.jQuery.Deferred();

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
GT.Project.Setup.ContentTypes.LinkFieldsToContentType = function (contentTypeName, fields) {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var contentTypeCollection = web.get_contentTypes();
    var fieldCollection = web.get_fields();

    clientContext.load(fieldCollection);
    clientContext.load(contentTypeCollection);
    clientContext.executeQueryAsync(function () {
        var contentType = GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(contentTypeCollection, contentTypeName);
        if (contentType != null) {
            var fieldLinkCollection = contentType.get_fieldLinks();
            clientContext.load(fieldLinkCollection);
            clientContext.executeQueryAsync(function () {
                var fieldsToAttach = [];
                for (var i = 0; i < fields.length; i++) {
                    var fieldName = fields[i];
                    if (GT.Project.Setup.ContentTypes.IsFieldAttached(fieldLinkCollection, fieldName)) {
                        console.log('Field ' + fieldName + ' already attached to content type ' + contentTypeName);
                    } else {
                        fieldsToAttach.push(fieldName);
                        clientContext.load(fieldCollection.getByInternalNameOrTitle(fieldName));
                    }
                }
                clientContext.executeQueryAsync(function () {
                    if (fieldsToAttach.length > 0) {
                        for (var i = 0; i < fieldsToAttach.length; i++) {
                            var fieldName = fieldsToAttach[i];
                            var field = fieldCollection.getByInternalNameOrTitle(fieldName);
                            var fieldLink = new SP.FieldLinkCreationInformation();
                            fieldLink.set_field(field);
                            fieldLinkCollection.add(fieldLink);
                        }
                        contentType.update(true);
                        clientContext.load(contentType);
                        clientContext.executeQueryAsync(function () {
                            console.log('Successfully linked site columns to CT ' + contentTypeName);
                            deferred.resolve();
                        }, function (sender, args) {
                            console.log('Request failed: ' + args.get_message());
                            console.log('Failed while linking site columns to CT ' + contentTypeName);
                            deferred.reject();
                        });
                    } else {
                        console.log('All fields were already linked to CT ' + contentTypeName);
                        deferred.resolve();
                    }
                }, function (sender, args) {
                    console.log('Request failed: ' + args.get_message());
                    console.log('Failed while loading fields');
                    deferred.reject();
                });
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
GT.Project.Setup.ContentTypes.IsFieldAttached = function (fieldLinkCollection, fieldName) {
    var enumerator = fieldLinkCollection.getEnumerator();
    while (enumerator.moveNext()) {
        var current = enumerator.get_current();
        if (current.get_name() === fieldName) {
            return true;
        }
    }
    return false;
};

GT.Project.Setup.ContentTypes.AddContentTypeToList = function (clientContext, contentType, listContentTypes, list) {
    var deferred = GT.jQuery.Deferred();

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
    var deferred = GT.jQuery.Deferred();

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
    var deferred = GT.jQuery.Deferred();

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

        GT.jQuery.when.apply(GT.jQuery, promises).always(function () {
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

GT.Project.Setup.ContentTypes.SetFieldDescriptionsOfList = function (listName, fieldDescriptions) {
    var deferred = GT.jQuery.Deferred();

    if (fieldDescriptions != undefined && fieldDescriptions.length > 0) {
        var clientContext = SP.ClientContext.get_current();
        var web = clientContext.get_web();
        var list = web.get_lists().getByTitle(listName);
        var listFields = list.get_fields();

        for (var i = 0; i < fieldDescriptions.length; i++) {
            var fieldName = fieldDescriptions[i]['key'];
            var fieldDesc = fieldDescriptions[i]['value'];
            var currentField = listFields.getByInternalNameOrTitle(fieldName);
            currentField.set_description(fieldDesc);
            currentField.update();
            clientContext.load(currentField);
        }

        clientContext.load(listFields);
        clientContext.executeQueryAsync(function () {
            console.log('Successfully updated field descriptions of list ' + listName);
            deferred.resolve();
        }, function (sender, args) {
            console.log('Request failed: ' + args.get_message());
            console.log(args.get_stackTrace());
            console.log('Failed while updating field descriptions of list ' + listName);
            deferred.reject();
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise();
};

GT.Project.Setup.ContentTypes.AddFieldToListFromXml = function (listName, fieldInternalName, fieldXml) {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var list = web.get_lists().getByTitle(listName);
    var listFields = list.get_fields();

    clientContext.load(listFields);
    clientContext.executeQueryAsync(function () {
        if (GT.Project.Setup.ContentTypes.GetFieldFromCollection(listFields, fieldInternalName) == null) {
            listFields.addFieldAsXml(fieldXml, true, SP.AddFieldOptions.addFieldInternalNameHint);
            clientContext.executeQueryAsync(function () {
                console.log('Successfully added field from Xml to list ' + listName);
                deferred.resolve();
            }, function (sender, args) {
                console.log('Request failed: ' + args.get_message());
                console.log(args.get_stackTrace());
                console.log('Failed while adding field from xml to list ' + listName);
                deferred.reject();
            });
        } else {
            console.log('Field ' + fieldInternalName + ' already exists at list ' + listName);
            deferred.resolve();
        }
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Failed while loading fields for list ' + listName);
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
GT.Project.Setup.ContentTypes.GetFieldFromCollection = function (fieldCollection, internalName) {
    var fieldEnumerator = fieldCollection.getEnumerator();
    while (fieldEnumerator.moveNext()) {
        var field = fieldEnumerator.get_current();
        if (field.get_internalName().toString().toLowerCase() === internalName.toLowerCase()) {
            return field;
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
    return (GT.jQuery.inArray(stringVal, array) > -1);
}

// For debugging
GT.Project.Setup.ContentTypes.PrintFieldXml = function (listName, fieldName) {
    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var list = web.get_lists().getByTitle(listName);
    var listFields = list.get_fields();
    var currentField = listFields.getByInternalNameOrTitle(fieldName);
    clientContext.load(currentField);
    clientContext.executeQueryAsync(function () {
        console.log(currentField);
        console.log(currentField.get_schemaXml());
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
    });
};
