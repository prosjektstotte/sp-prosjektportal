GT.Project.Setup.ContentTypes.CreateLookupSiteColumn = function (displayName, internalName, targetList, showField, required, id) {
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
            var fieldDeclaration = [];
            fieldDeclaration.push('<Field Type="Lookup" Group="Glittertind Områdekolonner" PrependId="TRUE" ');
            fieldDeclaration.push(' DisplayName="' + displayName + '" Name="' + internalName + '"');
            fieldDeclaration.push(' List="{' + list.get_id() + '}" ShowField="' + showField + '"');
            fieldDeclaration.push(' Required="' + required + '" ID="' + id + '" ');
            fieldDeclaration.push('></Field>');

            var fieldXml = fieldDeclaration.join("");
            siteColumnsCollection.addFieldAsXml(fieldXml, false, SP.AddFieldOptions.AddFieldInternalNameHint);

            clientContext.load(siteColumnsCollection);
            clientContext.executeQueryAsync(function () {
                console.log('Successfully created site column');
                deferred.resolve();
            }, function (sender, args) {
                console.log('Request failed: ' + args.get_message());
                console.log(args.get_stackTrace());
                console.log('Failed while creating site column');
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
                        console.log('Successfully created content type');
                        deferred.resolve();
                    }, function () {
                        console.log('Created content type, but couldnt set displayname');
                        deferred.resolve();
                    });
                }, function (sender, args) {
                    console.log('Request failed: ' + args.get_message());
                    console.log(args.get_stackTrace());
                    console.log('Failed while creating content type');
                    deferred.reject();
                });
            } else {
                console.log('Failed while creating content type - couldnt find parent content type');
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
                        console.log('Successfully linked site column to CT');
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
}

GT.Project.Setup.ContentTypes.AddWebContentTypeToList = function (listName, contentTypeName) {
    var deferred = $.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var contentTypeCollection = web.get_contentTypes();
    var list = web.get_lists().getByTitle(listName);

    clientContext.load(contentTypeCollection);
    clientContext.load(list);
    clientContext.executeQueryAsync(function () {
        var webContentType = GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(contentTypeCollection, contentTypeName);
        if (webContentType != null) {
            var listContentTypes = list.get_contentTypes();
            clientContext.load(listContentTypes);
            clientContext.executeQueryAsync(function () {
                if (GT.Project.Setup.ContentTypes.DoesContentTypeExistInCollection(listContentTypes, contentTypeName)) {
                    console.log('Content type ' + contentTypeName + ' is already added to the list ' + listName);
                    deferred.resolve();
                } else {
                    var newListContentType = listContentTypes.addExistingContentType(webContentType);
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
            }, function (sender, args) {
                console.log('Request failed: ' + args.get_message());
                console.log(args.get_stackTrace());
                console.log('Failed getting list content type collection for list ' + listName);
                deferred.reject();
            });
        } else {
            console.log('Failed getting content type ' + contentTypeName);
            deferred.reject();
        }
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Failed while loading content types and list during attaching to list');
        deferred.reject();
    });

    return deferred.promise();
};

GT.Project.Setup.ContentTypes.DoesContentTypeExistInCollection = function(contentTypeCollection, internalName) {
    return GT.Project.Setup.ContentTypes.GetContentTypeFromCollection(contentTypeCollection, internalName) != null;
};

GT.Project.Setup.ContentTypes.GetContentTypeFromCollection = function(contentTypeCollection, internalName) {
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