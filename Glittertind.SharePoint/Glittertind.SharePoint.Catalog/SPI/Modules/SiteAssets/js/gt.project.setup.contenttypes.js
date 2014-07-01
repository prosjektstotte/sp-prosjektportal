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
        var contentTypeEnumerator = contentTypeCollection.getEnumerator();
        var contentTypeExists = false;
        // Find the previously created content type
        while (contentTypeEnumerator.moveNext()) {
            var ct = contentTypeEnumerator.get_current();
            if (ct.get_name().toString().toLowerCase() === internalName.toLowerCase()) {
                contentTypeExists = true;
                break;
            }
        }

        if (!contentTypeExists) {
            var rootWebContentTypesEnumerator = siteColContentTypeCollection.getEnumerator();
            var existingContentType = null;
            // Find the previously created content type
            while (rootWebContentTypesEnumerator.moveNext()) {
                var ct = rootWebContentTypesEnumerator.get_current();
                if (ct.get_id().toString().toLowerCase() === parentContentTypeId.toLowerCase()) {
                    existingContentType = ct;
                    break;
                }
            }
            if (existingContentType != null) {
                var contentTypeInfo = new SP.ContentTypeCreationInformation();
                contentTypeInfo.set_name(internalName);
                contentTypeInfo.set_parentContentType(existingContentType);
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
        var contentTypeEnumerator = contentTypeCollection.getEnumerator();
        var newContentType;
        while (contentTypeEnumerator.moveNext()) {
            var ct = contentTypeEnumerator.get_current();
            if (ct.get_name() === contentTypeName) {
                newContentType = ct;
                break;
            }
        }

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