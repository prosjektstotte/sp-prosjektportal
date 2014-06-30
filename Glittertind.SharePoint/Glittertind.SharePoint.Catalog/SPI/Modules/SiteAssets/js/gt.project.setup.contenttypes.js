GT.Project.Setup.ContentTypes.CreateSiteColumn = function (displayName, internalName) {
    var deferred = $.Deferred();
    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var siteColumnsCollection = web.get_fields();

    var xmlField = '<Field Type="Text" DisplayName="' + displayName + '" Name="' + internalName + '" Group="Glittertind Områdekolonner"></Field>';
    siteColumnsCollection.addFieldAsXml(xmlField, false, SP.AddFieldOptions.AddFieldInternalNameHint);

    clientContext.load(siteColumnsCollection);
    clientContext.executeQueryAsync(function() {
        console.log('Successfully created site column');
        deferred.resolve();
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Failed while creating site column');
        deferred.reject();
    });
    return deferred.promise();
};

GT.Project.Setup.ContentTypes.CreateContentType = function (displayName, internalName, description, id) {
    var deferred = $.Deferred();
    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var contentTypeCollection = web.get_contentTypes();
    var newContentType = new SP.ContentTypeCreationInformation();
    newContentType.set_name(internalName);
    newContentType.set_id(id);
    newContentType.set_description(description);
    newContentType.set_group("Glittertind Innholdstyper");

    contentTypeCollection.add(newContentType);
    clientContext.load(contentTypeCollection);
    clientContext.executeQueryAsync(function () {
        console.log('Successfully created content type');
        deferred.resolve();
        //TODO: Set display name
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Failed while creating content type');
        deferred.reject();
    });
    return deferred.promise();
};
GT.Project.Setup.ContentTypes.LinkFieldToContentType = function (contentTypeName, fieldName) {
    var deferred = $.Deferred();
    var clientContext = SP.ClientContext.get_current();
    var web = clientContext.get_web();
    var contentTypeCollection = web.get_contentTypes();
    var field = web.get_fields().getByTitle(fieldName);

    clientContext.load(contentTypeCollection);
    clientContext.load(field);
    clientContext.executeQueryAsync(function() {
        var contentTypeEnumerator = contentTypeCollection.getEnumerator();
        var myCt;
        // Find the previously created content type
        while (contentTypeEnumerator.moveNext()) {
            var ct = contentTypeEnumerator.get_current();
            if (ct.get_name() === contentTypeName) {
                myCt = ct;
                break;
            }
        }

        if (myCt != null) {
            // Create a field link reference
            var fieldLink = new SP.FieldLinkCreationInformation();
            fieldLink.set_field(field);
            // Add the field link reference to the content type
            myCt.get_fieldLinks().add(fieldLink);
            myCt.update(true);

            clientContext.load(myCt);
            clientContext.executeQueryAsync(function () {
                console.log('Successfully linking site column to CT');
                deferred.resolve();
            }, function (sender, args) {
                console.log('Request failed: ' + args.get_message());
                console.log(args.get_stackTrace());
                console.log('Failed while linking site column to CT');
                deferred.reject();
            });
        }
    }, function (sender, args) {
        console.log('Request failed: ' + args.get_message());
        console.log(args.get_stackTrace());
        console.log('Error while getting fields for linking');
        deferred.reject();
    });
    return deferred.promise();
}