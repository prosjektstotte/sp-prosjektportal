var GT = GT || {};
GT.Project = GT.Project || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);

GT.Project.ChangeProjectPhase = function () {
    var deferred = GT.jQuery.Deferred();

    var currentPhasePromise = GT.Project.GetPhaseTermFromCurrentItem();
    currentPhasePromise.done(function (term) {
        if (term != "" && term.get_label != undefined) {
            console.log('Changing phase to ' + term.get_label());
            GT.jQuery.when(
                GT.Project.ChangeQueryOfListViewOnPage(term.get_label(), "Dokumenter", "SitePages/Forside.aspx"),
                GT.Project.ChangeQueryOfListViewOnPage(term.get_label(), "Oppgaver", "SitePages/Forside.aspx"),
                GT.Project.ChangeQueryOfListViewOnPage(term.get_label(), "Usikkerhet", "SitePages/Forside.aspx"),
                GT.Project.SetMetaDataDefaultsForLib("Dokumenter", "GtProjectPhase", term)
            ).then(function () {
                deferred.resolve();
            });
        }
    });
    return deferred.promise();
};

GT.Project.ChangeQueryOfListViewOnPage = function (phaseName, listName, pageRelativeUrl) {
    var deferred = GT.jQuery.Deferred();
    var viewUrl = pageRelativeUrl;

    var clientContext = SP.ClientContext.get_current();
    var viewCollection = clientContext.get_web().get_lists().getByTitle(listName).get_views();

    clientContext.load(viewCollection);
    clientContext.executeQueryAsync(function () {
        var view = GT.Project.GetViewFromCollectionByUrl(viewCollection, viewUrl);
        if (view != null) {
            view.set_viewQuery("<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='TaxonomyFieldType'>" + phaseName + "</Value></Eq></Where>");
            view.update();

            clientContext.executeQueryAsync(function () {
                deferred.resolve();
                console.log("Modified list view(s) of " + listName);
            }, function (sender, args) {
                deferred.reject();
                console.error('Request failed. ' + args.get_message());
            });
        } else {
            deferred.reject();
            console.log('Could not find any view with url ' + viewUrl + ' for list ' + listName);
        }
    }, function (sender, args) {
        deferred.reject();
        console.error('Request failed. ' + args.get_message());
    });
    return deferred.promise();
};

GT.Project.GetViewFromCollectionByUrl = function (viewCollection, url) {
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

GT.Project.SetMetaDataDefaultsForLib = function (lib, field, term) {
    // GtProjectPhase
    var deferred = GT.jQuery.Deferred();
    var termString = term.get_wssId() + ';#' + term.get_label() + '|' + term.get_termGuid();
    var siteCollRelativeUrl = _spPageContextInfo.webServerRelativeUrl + '/' + lib;
    var template = '<MetadataDefaults><a href="{siteCollRelativeUrl}"><DefaultValue FieldName="{field}">{term}</DefaultValue></a></MetadataDefaults>';
    var result = template.split("{siteCollRelativeUrl}").join(siteCollRelativeUrl);
    result = result.split("{field}").join(field);
    result = result.split("{term}").join(termString);

    var ctx = new SP.ClientContext.get_current();
    var web = ctx.get_web();
    // fragile, will not handle things living under "/lists"
    var list = web.get_lists().getByTitle(lib);
    var fileCreateInfo = new SP.FileCreationInformation();
    fileCreateInfo.set_url(siteCollRelativeUrl + "/Forms/client_LocationBasedDefaults.html");
    fileCreateInfo.set_content(new SP.Base64EncodedByteArray());
    fileCreateInfo.set_overwrite(true);
    var fileContent = result;

    for (var i = 0; i < fileContent.length; i++) {
        fileCreateInfo.get_content().append(fileContent.charCodeAt(i));
    }

    var existingFile = list.get_rootFolder().get_files().add(fileCreateInfo);
    ctx.executeQueryAsync(function (sender, args) {
        console.log("Saved metadata defaults of list " + lib);
        deferred.resolve();
    },
       function (sender, args) {
           console.log("fail: " + args.get_message());
           deferred.reject();
       });
    GT.Project.EnsureMetaDataDefaultsEventReceiver(lib);
    return deferred.promise();

};


GT.Project.EnsureMetaDataDefaultsEventReceiver = function (lib) {

    var ctx = new SP.ClientContext.get_current();
    var web = ctx.get_web();
    var eventReceivers = web.get_lists().getByTitle(lib).get_eventReceivers();
    ctx.load(eventReceivers);

    ctx.executeQueryAsync(function (sender, args) {
        var eventReceiversEnumerator = eventReceivers.getEnumerator();
        console.log(eventReceiversEnumerator);
        var eventReceiverExists = false;
        while (eventReceiversEnumerator.moveNext()) {
            var eventReceiver = eventReceiversEnumerator.get_current();
            var name = eventReceiver.get_receiverName();
            console.log(name);
            if (name === 'LocationBasedMetadataDefaultsReceiver ItemAdded') {
                console.log('Event Receiver exists, noop');
                eventReceiverExists = true;
            }
        }
        if (!eventReceiverExists) {
            var eventRecCreationInfo = new SP.EventReceiverDefinitionCreationInformation();
            eventRecCreationInfo.set_receiverName('LocationBasedMetadataDefaultsReceiver ItemAdded');
            eventRecCreationInfo.set_synchronization(1);
            eventRecCreationInfo.set_sequenceNumber(1000);
            eventRecCreationInfo.set_receiverAssembly('Microsoft.Office.DocumentManagement, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c');
            eventRecCreationInfo.set_receiverClass('Microsoft.Office.DocumentManagement.LocationBasedMetadataDefaultsReceiver');
            eventRecCreationInfo.set_eventType(SP.EventReceiverType.itemAdded);

            eventReceivers.add(eventRecCreationInfo);
            console.log('Added eventreceiver');

        }
    },
       function (sender, args) {
           console.log("fail: " + args.get_message());
       });
}


GT.Project.PopulateProjectPhasePart = function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        GT.jQuery.when(GT.Project.GetPhaseNameFromCurrentItem()).then(function (phaseName) {
            var phases = ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte', 'Realisere'];
            for (var ix = 0; ix < phases.length; ix++) {
                GT.jQuery('.projectPhases').append(GT.Project.GetPhaseLogoMarkup(phases[ix], phases[ix] == phaseName, true));
            }
        });
    });
};

GT.Project.GetPhaseLogoMarkup = function (phaseName) {
    GT.Project.GetPhaseLogoMarkup(phaseName, false);
};

GT.Project.GetPhaseLogoMarkup = function (phaseName, selected, wrapInListItemMarkup) {
    var phaseDisplayName = "Ingen fase";
    var phaseLetter = 'X';
    var selectedClass = selected ? "selected" : '';
    if (phaseName != '' && phaseName != undefined) {
        phaseDisplayName = phaseName;
        phaseLetter = phaseName.substr(0, 1);
    }
    var markup = '<div class="gt-phaseIcon ' + selectedClass + '">' +
        '<span class="phaseLetter">' + phaseLetter + '</span>' +
        '<span class="projectPhase">' + phaseDisplayName + '</span>' +
        '</div>';
    if (wrapInListItemMarkup)
        return '<li class="' + selectedClass + '">' + markup + '</li>';
    return markup;
};

GT.Project.GetPhaseNameFromCurrentItem = function () {
    var defer = GT.jQuery.Deferred();
    GT.jQuery.when(GT.Project.GetPhaseTermFromCurrentItem()).done(function (term) {
        if (term != undefined && term != "" && term.get_label != undefined) {
            defer.resolve(term.get_label());
        } else {
            defer.resolve("");
        }
    });
    return defer.promise();
};

GT.Project.GetPhaseTermFromCurrentItem = function () {
    var deferred = GT.jQuery.Deferred();
    var pageFieldNameVar = 'GtProjectPhase';
    var context = SP.ClientContext.get_current();
    var web = context.get_web();

    //_spPageContextInfo is defined in every SharePoint page and has pageListId and pageItemId
    //properties populated in publishing pages
    var pageListId = _spPageContextInfo.pageListId;
    var pageItemId = _spPageContextInfo.pageItemId;

    //getting the list item for the current page
    var webLists = web.get_lists();
    var pageList = webLists.getById(pageListId);
    var pageItem = pageList.getItemById(pageItemId);

    //explicitly requesting to load the field Name for the page item
    context.load(pageItem, pageFieldNameVar);

    context.executeQueryAsync(Function.createDelegate(this, function () {
        var currentPhaseItem = pageItem.get_item(pageFieldNameVar);
        if (currentPhaseItem != '' && currentPhaseItem != undefined) {
            deferred.resolve(currentPhaseItem);
        } else {
            deferred.resolve('');
        }
    }), Function.createDelegate(this, function (sender, args) {
        deferred.resolve('');
        console.log('error when getting page field' + sender + " " + args);
    }));
    return deferred.promise();
};

GT.Project.NewProjectLink = GT.Project.NewProjectLink || {};

GT.Project.NewProjectLink.canManageWeb = function () {
    var self = this;
    self.defer = GT.jQuery.Deferred();
    var clientContext = new SP.ClientContext.get_current();
    self.oWeb = clientContext.get_web();
    clientContext.load(self.oWeb);
    clientContext.load(self.oWeb, 'EffectiveBasePermissions');

    var permissionMask = new SP.BasePermissions();
    permissionMask.set(SP.PermissionKind.manageWeb);
    self.shouldShowLink = self.oWeb.doesUserHavePermissions(permissionMask);

    clientContext.executeQueryAsync(Function.createDelegate(self, GT.Project.NewProjectLink.onQuerySucceededUser), Function.createDelegate(self, GT.Project.NewProjectLink.onQueryFailedUser));
    return self.defer.promise();
};
GT.Project.NewProjectLink.onQuerySucceededUser = function () {
    var self = this;
    self.defer.resolve(self.shouldShowLink.get_value());
};

GT.Project.NewProjectLink.onQueryFailedUser = function () {
    this.defer.reject();
};

GT.Project.NewProjectLink.showLink = function () {
    GT.Project.NewProjectLink.canManageWeb().done(function (shouldShowLink) {
        if (shouldShowLink) GT.jQuery('#newProjectLink').show();
    });
};


GT.Project.PhaseForm = GT.Project.PhaseForm || {};
GT.Project.PhaseForm.CheckList = GT.Project.PhaseForm.CheckList || {};

GT.Project.PhaseForm.CheckList.render = function () {
    // 
    var promise = GT.Project.PhaseForm.CheckList.getData();

    promise.done(function (items) {
        var outHtml = [];
        outHtml.push('<div id="gtchecklist">',
						'<h2 class="ms-h2">Fasesjekkliste</h2>',
						'<ul>');
        for (var i = 0; i < items.length; i++) {
            outHtml.push('<li>',
							'<a href="', items[i].get_editItemUrl(window.location.toString()), '" >',
								'<span class="gt-icon ', items[i].get_statusCssClass(), '" title="', items[i].Status, '"></span>',
								'<span class="gt-checklist-title">', items[i].Title, '</span></a>',
						'</li>');
        }
        outHtml.push('</ul>',
				'<div>Sjekklisten er basert på beslutningspunkt fra <a href="http://prosjektveiviseren.no/" target="_blank">Prosjektveiviseren</a></div>',
		        '</div>');
        GT.jQuery(".ms-webpart-zone.ms-fullWidth").append(outHtml.join(""));

    });

};

GT.Project.GetCurrentPhase = function () {
    var defer = GT.jQuery.Deferred();
    var ctx = new SP.ClientContext.get_current();
    var web = ctx.get_web();
    var props = web.get_allProperties();
    ctx.load(web);
    ctx.load(props); //need to load the properties explicitly 		
    ctx.executeQueryAsync(function () {
        var phase = props.get_fieldValues()['glittertind_persistedPhase'];
        console.log(phase);
        defer.resolve(phase);
    }, function () {
        defer.reject();
    });
    return defer.promise();
};



GT.Project.PhaseForm.CheckList.getData = function () {
    var currentPhasePromise = GT.Project.GetCurrentPhase();
    var scriptPromise = GT.jQuery.getScript(_spPageContextInfo.siteServerRelativeUrl + "/_layouts/15/SP.RequestExecutor.js");

    var promise = GT.jQuery
	.when(currentPhasePromise, scriptPromise)
	.then(function (phase) {
	    var defer = GT.jQuery.Deferred();
	    var ctx = new SP.ClientContext.get_current();
	    var list = ctx.get_web().get_lists().getByTitle('Sjekkliste');
	    var camlQuery = new SP.CamlQuery();
	    camlQuery.set_viewXml("<View><Query><Where><Eq><FieldRef Name='GtProjectPhase'/><Value Type='TaxonomyFieldType'>" + phase + "</Value></Eq></Where><OrderBy><FieldRef Name='Title' /></OrderBy></Query></View>");
	    var listItems = list.getItems(camlQuery);
	    ctx.load(listItems);
	    ctx.executeQueryAsync(function () {
	        var listItemEnumerator = listItems.getEnumerator();
	        var checkListItems = [];
	        while (listItemEnumerator.moveNext()) {
	            var item = listItemEnumerator.get_current();
	            var title = item.get_item('Title');
	            var id = item.get_item('ID');
	            var status = item.get_item('GtChecklistStatus');
	            var checkListItem = new GT.Project.PhaseForm.CheckList.checkListItem(title, id, status);
	            checkListItems.push(checkListItem);
	        }
	        defer.resolve(checkListItems);
	    }, function (sender, args) {
	        console.log(args.get_message());
	        defer.reject();
	    });
	    return defer.promise();

	});

    return promise;

};

GT.Project.PhaseForm.CheckList.checkListItem = function (title, id, status) {
    var self = this;
    self.Title = title;
    self.Id = id;
    self.Status = status;
    self.get_statusCssClass = function () {
        if (self.Status === 'Ja') {
            return 'gt-completed';
        }
        if (self.Status === 'Ignorert') {
            return 'gt-ignored';
        }
        if (self.Status === 'Nei') {
            return 'gt-failed';
        }
        return 'gt-nostatus';
    };
    self.get_editItemUrl = function (sourceUrl) {
        var editElmLink = _spPageContextInfo.webServerRelativeUrl + "/Lists/Sjekkliste/EditForm.aspx?ID=" + self.Id;
        if (sourceUrl) {
            editElmLink += "&Source=" + encodeURIComponent(sourceUrl);
        }
        return editElmLink;
    };
};
