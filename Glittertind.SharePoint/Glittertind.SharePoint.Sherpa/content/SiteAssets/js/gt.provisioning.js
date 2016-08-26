var GT = GT || {};
GT.Provisioning = GT.Provisioning || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);

function waitMessage() {
    window.parent.eval("window.waitDialog = SP.UI.ModalDialog.showWaitScreenWithNoClose('Oppretter prosjektområde', '', 80, 450);");
}
function closeWaitMessage() {
    if (window.parent.waitDialog != null) {
        window.parent.waitDialog.close();
    }
};

GT.Provisioning.CreateWebFromCustomForm = function () {
    document.getElementById('projectFormValidation').innerHTML = "";

    var nameField = document.getElementById('projectNameInput');
    var urlField = document.getElementById('projectUrlInput');
    var descField = document.getElementById('projectDescriptionInput');

    if (nameField.checkValidity && (!nameField.checkValidity() || !urlField.checkValidity() || !descField.checkValidity())) {
        document.getElementById('projectFormValidation').innerHTML = "Navn og URL-kortnavn er obligatoriske felter";
        return;
    }

    waitMessage();
    GT.Provisioning.CreateWeb(nameField.value, urlField.value, descField.value);
};

GT.Provisioning.CreateWeb = function (webTitle, webUrl, webDescription) {
    var webTemplate = '{9CA326D3-723F-4E65-B8F9-DB7E18802AC4}#ProjectWebTemplate';
    var webLanguage = 1044;

    var clientContext = SP.ClientContext.get_current();
    var currentWeb = clientContext.get_web();

    var webCreateInfo = new SP.WebCreationInformation();
    webCreateInfo.set_description(webDescription);
    webCreateInfo.set_language(webLanguage);
    webCreateInfo.set_title(webTitle);
    webCreateInfo.set_url(webUrl);
    webCreateInfo.set_useSamePermissionsAsParentSite(false);
    webCreateInfo.set_webTemplate(webTemplate);

    this.newWeb = currentWeb.get_webs().add(webCreateInfo);
    clientContext.load(this.newWeb);
    clientContext.executeQueryAsync(
		Function.createDelegate(this, GT.Provisioning.OnCreateWebSuccess),
		Function.createDelegate(this, GT.Provisioning.OnCreateWebFailure)
	);
};

GT.Provisioning.OnCreateWebSuccess = function (sender, args) {
    //1. Stop long running operation
    //2. Close modal dialog (if existing)
    //3. Redirect to new site's '_layouts/15/permsetup.aspx?HideCancel=1'
    var newUrl = this.newWeb.get_url()
    closeWaitMessage();

    var setupPermissionsUrl = newUrl + '/_layouts/15/permsetup.aspx?HideCancel=1';
    window.location.replace(setupPermissionsUrl);
};

GT.Provisioning.OnCreateWebFailure = function (sender, args) {
    closeWaitMessage();
    document.getElementById('projectFormValidation').innerHTML = args.get_message();
    console.log('En feil oppstod: ' + args.get_message());
    console.log("raw response data: \n" + args.get_webRequestExecutor().get_responseData());
};

GT.Provisioning.SetupUrlPreviewAndValidation = function () {
    GT.jQuery('#projectUrlPreview').text(_spPageContextInfo.siteAbsoluteUrl + "/");
    GT.jQuery('#projectUrlInput').on('keyup', function (event) {
        event = event || window.event; //IE8 doesn't pass an instance of the event object to the handler, you'll have to get it from the global object
        var target = event.target || event.srcElement; // It doesn't share all of the properties and methods, either, including target
        var previewUrl = _spPageContextInfo.siteAbsoluteUrl + "/" + GT.jQuery('#projectUrlInput').val();
        GT.jQuery('#projectUrlPreview').text(previewUrl);

        if (GT.jQuery('#projectUrlInput').val().length > 2 && target.validity) {
            if (target.validity.valid) {
                document.getElementById('projectUrlInputValidation').style.display = 'none';
            } else {
                document.getElementById('projectUrlInputValidation').style.display = 'block';
            }
        }
    });
    GT.jQuery('#projectUrlInput').on('change', function (event) {
        event = event || window.event; //IE8 doesn't pass an instance of the event object to the handler, you'll have to get it from the global object
        var target = event.target || event.srcElement; // It doesn't share all of the properties and methods, either, including target
        var previewUrl = _spPageContextInfo.siteAbsoluteUrl + "/" + GT.jQuery('#projectUrlInput').val();
        GT.jQuery('#projectUrlPreview').text(previewUrl);

        if (target.validity && target.validity.valid) {
            document.getElementById('projectUrlInputValidation').style.display = 'none';
        } else if (target.validity) {
            document.getElementById('projectUrlInputValidation').style.display = 'block';
        }
    });
};

GT.Provisioning.CanManageWeb = function () {
    var self = this;
    self.defer = GT.jQuery.Deferred();
    var clientContext = new SP.ClientContext.get_current();
    self.oWeb = clientContext.get_web();
    clientContext.load(self.oWeb);
    clientContext.load(self.oWeb, 'EffectiveBasePermissions');

    var permissionMask = new SP.BasePermissions();
    permissionMask.set(SP.PermissionKind.manageWeb);
    self.shouldShowLink = self.oWeb.doesUserHavePermissions(permissionMask);

    clientContext.executeQueryAsync(Function.createDelegate(self, GT.Provisioning.onQuerySucceededUser), Function.createDelegate(self, GT.Provisioning.onQueryFailedUser));
    return self.defer.promise();
};
GT.Provisioning.onQuerySucceededUser = function () {
    var self = this;
    self.defer.resolve(self.shouldShowLink.get_value());
};

GT.Provisioning.onQueryFailedUser = function () {
    this.defer.reject();
};

GT.Provisioning.ShowLink = function () {
    GT.Provisioning.CanManageWeb().done(function (shouldShowLink) {
        if (shouldShowLink) GT.jQuery('#newProjectLink').show();
    });
};

GT.Provisioning.PopulateCopyListElementPage = function (sourceListTitle) {
    var caml = "<View><Query><OrderBy><FieldRef Name=\'ID\' Ascending='\FALSE'\ /></OrderBy></Query></View>";
    var url = String.format("{0}/_api/web/lists/getByTitle('{1}')/GetItems", _spPageContextInfo.webServerRelativeUrl, sourceListTitle);
    var requestData = '{"query": { "__metadata": { "type": "SP.CamlQuery" }, "ViewXml": "' + caml + '"}}';
    var digest = GT.jQuery("#__REQUESTDIGEST").val();

    GT.jQuery.ajax({
        url: url,
        type: "POST",
        data: requestData,
        headers: {
            "Accept": "application/json; odata=verbose",
            "X-RequestDigest": digest,
            "Content-Type": "application/json; odata=verbose"
        },
        dataType: "json",
        success: function (data) {
            var infoMessage = GT.jQuery('.gtinfomessage');
            infoMessage.text(String.format("Viser {0} elementer fra listen {1} som du kan kopiere ned til prosjektområdet ditt. Velg elementene du ønsker, og hent de ved å velge knappen nederst på denne siden", data.d.results.length, sourceListTitle));

            var elementsTable = GT.jQuery('table.gtelements');
            elementsTable.append('<tr><th></th><th>Navn</th><th>Fase</th><th>Opprettet</th></tr>');

            for (var x = 0; x < data.d.results.length; x++) {
                var element = data.d.results[x];
                var created = new Date(element.Created);

                var tableRow = GT.jQuery(String.format('<tr class="{0}"></tr>', x % 2 == 1 ? '' : 'ms-HoverBackground-bgColor'))
                .append(
                    String.format('<td class="ms-ChoiceField check-field"><input type="checkbox" class="ms-ChoiceField-input gt-checked-element" value="{0}" id="{0}"><label for="{0}" class="ms-ChoiceField-field"><span class="ms-Label">&nbsp;</span></label></td><td class="ms-ChoiceField title-field"><label for="{0}" class="ms-ChoiceField-field"><span class="ms-Label">{1}</span></label></td><td>{2}</td><td>{3}</td>', element.Id, element.Title, element.GtProjectPhase.Label, created.format("dd.MM.yyyy, HH:mm"))
                );

                elementsTable.append(tableRow);
            }
        }
    });
}

GT.Provisioning.CopyListElements = function() {
    var destinationWebUrl = decodeURIComponent(getParameterByName('dstweb'));
    var destinationListTitle = getParameterByName('dstlist');
    var sourceListTitle = getParameterByName('srclist');

    if (!destinationWebUrl || !destinationListTitle || !sourceListTitle) {
        GT.jQuery('.validationMessage').text('Det har oppstått en feil. URL-parametere ikke satt.').show();
    } else {
        var checkedValues = GT.jQuery('table.gtelements tr td.check-field input.gt-checked-element:checked').map(function() {
            return this.value;
        }).get();

        var srcContext = SP.ClientContext.get_current();
        var srcWeb = srcContext.get_web();
        var srcList = srcWeb.get_lists().getByTitle(sourceListTitle);
        var chosenIds = [];
        checkedValues.forEach(function(id){
            var srcItem = srcList.getItemById(id);
            srcContext.load(srcItem, "Title", "Id", "GtProjectPhase");
            chosenIds.push(srcItem);
        });
        srcContext.executeQueryAsync(function() {
            var dstContext = new SP.ClientContext(destinationWebUrl);
            var dstWeb = dstContext.get_web();
            var dstList = dstWeb.get_lists().getByTitle(destinationListTitle);

            chosenIds.forEach(function(item){
                var fieldsToSynch = ["Title", "GtProjectPhase"];
                try {
                    var itemCreateInfo = new SP.ListItemCreationInformation();
                    var newItem = dstList.addItem(itemCreateInfo);

                    for (var j = 0; j < fieldsToSynch.length; j++) {
                        var fieldName = fieldsToSynch[j];
                        var fieldValue = item.get_item(fieldName);

                        if (fieldValue && fieldName.toUpperCase() !== "ID" && fieldName.toUpperCase() !== "PARENTIDID") {
                            if (fieldValue.TermGuid && fieldValue.WssId) {
                                newItem.set_item(fieldName, fieldValue.WssId);
                            } else {
                                newItem.set_item(fieldName, fieldValue);
                            }
                        }
                    }
                    newItem.update();
                    dstContext.load(newItem);
                } catch(exception) {
                    console.log("Error while creating data item " + item.Title + " - not aborting...")
                    console.log(exception);
                }
            });

            dstContext.executeQueryAsync(function() {
                console.log("Success - items copied");
            }, function (sender, args) {
                console.log("Error copying items");
                console.log(args.get_message());
            });
        }, function(sender,args){
            console.log("Error getting items to copy");
            console.log(args.get_message());
        });
    }
}