var GT = GT || {};
GT.Provisioning = GT.Provisioning || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);

function waitMessage(message) {
    window.parent.eval(String.format("window.waitDialog = SP.UI.ModalDialog.showWaitScreenWithNoClose('{0}', '', 80, 450);", message));
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

    waitMessage('Oppretter prosjektområde');
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

GT.Provisioning.GetDataSources = function () {
    var deferred = GT.jQuery.Deferred();
    var urlToFile = _spPageContextInfo.siteServerRelativeUrl + "/SiteAssets/gt/config/core/datasources.txt";

    GT.jQuery.getJSON(urlToFile)
    .then(function (data) {
        deferred.resolve(data);
    });

    return deferred.promise();
};

GT.Provisioning.GetUrlOfDataSourceByList = function(srcListName) {
    var deferred = GT.jQuery.Deferred();

    GT.jQuery.when(GT.Provisioning.GetDataSources()).then(function (data) {
        var srcWebUrl = _spPageContextInfo.siteServerRelativeUrl;
        for (var i = 0; i < data.DataSources.Lists.length; i++) {
            var listDataSource = data.DataSources.Lists[i];
            if (listDataSource.SrcList === srcListName) {
                srcWebUrl = GT.Common.GetUrlWithoutTokens(listDataSource.SrcWeb);
                continue;
            }
        }
        deferred.resolve(srcWebUrl);
    });

    return deferred.promise();
}
GT.Provisioning.InitalizeCopyElementsPage = function() {
    var destinationWebUrl = getParameterByName('dstweb');
    var destinationListTitle = getParameterByName('dstlist');
    var sourceListTitle = getParameterByName('srclist');
    if (!destinationWebUrl || !destinationListTitle || !sourceListTitle) {
        GT.jQuery('.validationMessage').show();
    } else {
        SP.SOD.executeOrDelayUntilScriptLoaded(function(){
            GT.Provisioning.PopulateCopyListElementPage(sourceListTitle);
        } , "sp.js");
    }
}
GT.Provisioning.PopulateCopyListElementPage = function (sourceListTitle) {
    GT.jQuery.when(
        GT.Provisioning.GetUrlOfDataSourceByList(sourceListTitle)
    ).then(function(sourceListUrl) {
        GT.Provisioning.SourceListUrl = sourceListUrl;
        var caml = "<View><Query><OrderBy><FieldRef Name=\'ID\' Ascending='\FALSE'\ /></OrderBy></Query></View>";

        var clientContext = new SP.ClientContext(sourceListUrl);
        var srcList = clientContext.get_web().get_lists().getByTitle(sourceListTitle);

        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml(caml);

        this.srcListItems = srcList.getItems(camlQuery);

        clientContext.load(this.srcListItems, 'Include(Id,Title,GtProjectPhase,Created)');
        clientContext.executeQueryAsync(Function.createDelegate(this, function() {
            GT.jQuery('.gtinfomessage').text(String.format("Viser {0} elementer fra listen {1} som du kan kopiere ned til prosjektområdet ditt. Velg elementene du ønsker, og hent de ved å velge knappen nederst på denne siden", this.srcListItems.get_count(), sourceListTitle));

            var elementsTable = GT.jQuery('table.gtelements');
            elementsTable.append('<tr><th></th><th>Navn</th><th>Fase</th><th>Opprettet</th></tr>');

            var counter = 0;
            var listItemEnumerator = this.srcListItems.getEnumerator();
            while (listItemEnumerator.moveNext()) {
                var currentListItem = listItemEnumerator.get_current();
                var createdDate = new Date(currentListItem.get_item('Created'));
                var phase = currentListItem.get_item('GtProjectPhase');
                var phaseLabel = phase && phase.Label ? phase.Label : "";

                var tableRow = GT.jQuery(String.format('<tr class="{0}"></tr>', counter % 2 == 1 ? '' : 'ms-HoverBackground-bgColor'))
                .append(
                    String.format('<td class="ms-ChoiceField check-field"><input type="checkbox" class="ms-ChoiceField-input gt-checked-element" value="{0}" id="{0}"><label for="{0}" class="ms-ChoiceField-field"><span class="ms-Label">&nbsp;</span></label></td><td class="ms-ChoiceField title-field"><label for="{0}" class="ms-ChoiceField-field"><span class="ms-Label">{1}</span></label></td><td>{2}</td><td>{3}</td>', currentListItem.get_id(), currentListItem.get_item('Title'), phaseLabel, createdDate.format("dd.MM.yyyy, HH:mm"))
                );

                elementsTable.append(tableRow);
                counter++;
            }
        }), Function.createDelegate(this, function() {
            GT.jQuery('.validationMessage').text('Det har oppstått en feil. Kunne ikke hente listeelementer').show();
            console.log(arguments);
        }));
    });
}

GT.Provisioning.CopyListElements = function() {
    var destinationWebUrl = decodeURIComponent(getParameterByName('dstweb'));
    var destinationListTitle = getParameterByName('dstlist');
    var sourceListTitle = getParameterByName('srclist');

    if (!destinationWebUrl || !destinationListTitle || !sourceListTitle) {
        GT.jQuery('.validationMessage').text('Det har oppstått en feil. URL-parametere ikke satt.').show();
    } else {
        waitMessage('Kopierer valgte elementer');
        var checkedValues = GT.jQuery('table.gtelements tr td.check-field input.gt-checked-element:checked').map(function() {
            return this.value;
        }).get();

        var srcContext = new SP.ClientContext(GT.Provisioning.SourceListUrl);
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
                closeWaitMessage();
                waitMessage('Kopiering vellykket!');
                setTimeout(function(){
                    closeWaitMessage();
                    location.replace(destinationWebUrl);
                }, 1000);
            }, function (sender, args) {
                console.log("Error copying items");
                console.log(args.get_message());
                closeWaitMessage();
            GT.jQuery('.validationMessage').text('Det har oppstått en feil.').show();
            });
        }, function(sender,args){
            console.log("Error getting items to copy");
            console.log(args.get_message());
            closeWaitMessage();
            GT.jQuery('.validationMessage').text('Det har oppstått en feil.').show();
        });
    }
}
GT.Provisioning.AbortCopyListElements = function() {
    var destinationWebUrl = decodeURIComponent(getParameterByName('dstweb'));
    if (destinationWebUrl) {
        location.replace(destinationWebUrl);
    } else {
        location.replace(_spPageContextInfo.siteAbsoluteUrl);
    }
}