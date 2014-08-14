var GT = GT || {};
GT.Project = GT.Project || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);


GT.Project.ShowMetadataIfIsWelcomePage = function (selector) {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        var ctx = SP.ClientContext.get_current();
        var web = ctx.get_web();
        var rootFolder = web.get_rootFolder();

        ctx.load(rootFolder);
        ctx.executeQueryAsync(function () {
            var welcomePage = rootFolder.get_welcomePage();
            if (_spPageContextInfo.serverRequestPath.endsWith(welcomePage)) {
                GT.jQuery(selector).show();
            } else {
                GT.jQuery(selector).html('<p>Informasjon om prosjektet er kun tilgjengelig fra <a href="../' + welcomePage + '">forsiden</a></p>').show();
            }

        }, function () {
            console.log('An error has accured. Showing metadata to avoid hiding it in fault.');
            GT.jQuery(selector).show();
        });
    });
};

GT.Project.ChangeProjectPhase = function () {
    var deferred = GT.jQuery.Deferred();

    var currentPhasePromise = GT.Project.GetPhaseTermFromCurrentItem();
    currentPhasePromise.done(function (term) {
        var safeTerm = GT.Project.GetSafeTerm(term);
        if (safeTerm != "" && safeTerm.get_label != undefined) {
            console.log('Changing phase to ' + safeTerm.get_label());
            GT.jQuery.when(
                GT.Project.ChangeQueryOfListViewOnPage(safeTerm.get_label(), "Dokumenter", "SitePages/Forside.aspx"),
                GT.Project.ChangeQueryOfListViewOnPage(safeTerm.get_label(), "Oppgaver", "SitePages/Forside.aspx"),
                GT.Project.ChangeQueryOfListViewOnPage(safeTerm.get_label(), "Usikkerhet", "SitePages/Forside.aspx"),
                GT.Project.SetMetaDataDefaultsForLib("Dokumenter", "GtProjectPhase", safeTerm)
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
            var camlArray = [];
            camlArray.push(
                "<Where>",
                    "<Or>",
                        "<Eq>",
                            "<FieldRef Name='GtProjectPhase' />",
                            "<Value Type='TaxonomyFieldType'>" + phaseName + "</Value>",
                        "</Eq>",
                        "<Eq>",
                            "<FieldRef Name='GtProjectPhase' />",
                            "<Value Type='TaxonomyFieldType'>Flere faser</Value>",
                        "</Eq>",
                    "</Or>",
                "</Where>");
            view.set_viewQuery(camlArray.join(""));
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
    var deferred = GT.jQuery.Deferred();

    var safeTermObject = GT.Project.GetSafeTerm(term);

    var termString = term.WssId + ';#' + term.Label + '|' + term.TermGuid;
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

GT.Project.GetSafeTerm = function (term) {
    var safeTermObject = term;
    if (safeTermObject != undefined) {
        if (safeTermObject.Label == undefined && safeTermObject.TermGuid == undefined && safeTermObject.WssId == undefined && safeTermObject.get_label != undefined) {
            safeTermObject.Label = safeTermObject.get_label();
            safeTermObject.TermGuid = safeTermObject.get_termGuid();
            safeTermObject.WssId = safeTermObject.get_wssId();
        } else if (safeTermObject.get_label == undefined && safeTermObject.get_termGuid == undefined && safeTermObject.get_wssId == undefined) {
            safeTermObject.get_label = function () { return safeTermObject.Label; }
            safeTermObject.get_termGuid = function () { return safeTermObject.TermGuid; }
            safeTermObject.get_wssId = function () { return safeTermObject.WssId; }
        }
    }
    return safeTermObject;
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
                GT.jQuery('.projectPhases').append(GT.Project.GetPhaseLogoMarkup(phases[ix], phases[ix] == phaseName, true, true));
            }
        });
    });
};

GT.Project.GetPhaseLogoMarkup = function (phaseName) {
    GT.Project.GetPhaseLogoMarkup(phaseName, false);
};

GT.Project.GetPhaseLogoMarkup = function (phaseName, selected, wrapInListItemMarkup, linkToDocumentLibrary) {
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
    if (linkToDocumentLibrary)
        markup = '<a href="../Dokumenter/Forms/AllItems.aspx?FilterField1=GtProjectPhase&FilterValue1=' + phaseDisplayName + '">' + markup + '</a>';
    if (wrapInListItemMarkup)
        markup = '<li class="' + selectedClass + '">' + markup + '</li>';

    return markup;
};

GT.Project.GetPhaseNameFromCurrentItem = function () {
    var defer = GT.jQuery.Deferred();
    GT.jQuery.when(GT.Project.GetPhaseTermFromCurrentItem()).done(function (term) {
        var safeTerm = GT.Project.GetSafeTerm(term);
        if (safeTerm != undefined && safeTerm != "") {
            defer.resolve(safeTerm.get_label());
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

GT.Project.get_allProjectsUnderCurrent = function () {

    var clientContext = SP.ClientContext.get_current();
    var get_allProjectsUnderCurrentDeferred = GT.jQuery.Deferred();

    var webModel = function (title, url, properties) {
        var _this = this;
        _this.title = title;
        _this.url = url;
        _this.properties = properties;
    };

    var get_allWebs = function () {
        var defer = GT.jQuery.Deferred();
        var webCollection = clientContext.get_web().getSubwebsForCurrentUser(null);
        clientContext.load(webCollection, 'Include(RootFolder, ServerRelativeUrl)');

        clientContext.executeQueryAsync(
			function () {
			    if (webCollection !== null && webCollection.get_areItemsAvailable()) {
			        defer.resolve(webCollection);
			    } else { defer.reject(); }
			}, defer.reject);

        return defer.promise();
    }

    var get_webData = function (webCollection) {
        var get_webDataDeferred = GT.jQuery.Deferred();

        var get_pageProperties = function (pagedWebs) {
            var defer = GT.jQuery.Deferred();
            var welcomePages = [];
            for (var i = 0; i < pagedWebs.length; i++) {
                var web = pagedWebs[i];
                var welcomePageUrl = web.get_serverRelativeUrl() + "/" + web.get_rootFolder().get_welcomePage();
                var welcomePage = web.getFileByServerRelativeUrl(welcomePageUrl);
                clientContext.load(web);
                clientContext.load(welcomePage, 'ListItemAllFields');
                welcomePages.push(welcomePage);
            }

            clientContext.executeQueryAsync(
			function () {
			    defer.resolve(welcomePages);
			},
			function () {
			    defer.reject();
			});

            return defer.promise();
        };

        var webs = [], promises = [];

        for (var i = 0; i < webCollection.get_count() ; i++) {
            webs.push(webCollection.itemAt(i));
        }
        var pagedArrays = splitArray(webs, 14);

        for (var i = 0; i < pagedArrays.length; i++) {
            promises.push(get_pageProperties(pagedArrays[i]));
        }

        GT.jQuery.when.apply(GT.jQuery, promises).done(function (result) {
            var models = [];
            for (var i = 0; i < webs.length; i++) {
                var web = webs[i];
                var title = web.get_title();
                var url = web.get_serverRelativeUrl();
                var fetchedFile = webs[i].get_objectData().get_methodReturnObjects().GetFileByServerRelativeUrl;
                var fieldValues = fetchedFile[Object.keys(fetchedFile)[0]].get_objectData().get_clientObjectProperties().ListItemAllFields.get_fieldValues();

                var contentTypeId = fieldValues.ContentTypeId.get_stringValue();
                if (!contentTypeId.startsWith('0x010109010058561F86D956412B9DD7957BBCD67AAE01')) continue;

                var props = {};
                for (var value in fieldValues) {
                    if (value.startsWith("Gt")) {
                        props[value] = fieldValues[value];
                    }
                }

                var model = new webModel(title, url, props);
                models.push(model);
            }
            get_webDataDeferred.resolve(models);

        });

        return get_webDataDeferred.promise();
    };

    get_allWebs().then(function (webCollection) {
        console.log("get_allWebs.done subwebs: " + webCollection.get_count());
        return get_webData(webCollection)
    })
	.then(function (model) {
	    console.log(model);
	    get_allProjectsUnderCurrentDeferred.resolve(model);
	});

    return get_allProjectsUnderCurrentDeferred.promise();

};

GT.Project.render_Portefolje_data = null;
GT.Project.render_Portefolje = function (filter) {
    var $ = GT.jQuery;

    var render = function (webs) {
        var outHtml = [];
        outHtml.push('<ul class="gt-List">');
        for (var i = 0; i < webs.length; i++) {
            var web = webs[i];
            // our "search" function
            if (filter != undefined && web.title.toLowerCase().indexOf(filter.toLowerCase().trim()) === -1) continue;
            var phase = web.properties.GtProjectPhase ? web.properties.GtProjectPhase.Label : '';
            var projectManager = web.properties.GtProjectManager ? web.properties.GtProjectManager.get_lookupValue() : 'ikke satt';
            var projectOwner = web.properties.GtProjectOwner ? web.properties.GtProjectOwner.get_lookupValue() : 'ikke satt';
            outHtml.push('<li>',
							'<div class="gt-projectItem">',
								GT.Project.GetPhaseLogoMarkup(phase),
								'<h2>',
									'<a href="', web.url, '">', web.title, '</a>',
								'</h2>',
								'<div>Prosjektleder: ', projectManager, '</div>',
								'<div>Prosjekteier: ', projectOwner, '</div>',
							'</div>',
						'</li>');
        }
        outHtml.push('</ul>');
        var elm = document.getElementById("gt-csomprojectdir-out");
        elm.innerHTML = outHtml.join('');
    };


    if (!GT.Project.render_Portefolje_data) {
        GT.Project.get_allProjectsUnderCurrent().done(function (webs) {
            GT.Project.render_Portefolje_data = webs;
            render(GT.Project.render_Portefolje_data);
        });
    } else {
        render(GT.Project.render_Portefolje_data);
    }



};


// loosely based on http://stackoverflow.com/questions/8188548/splitting-a-js-array-into-n-arrays
function splitArray(a, maxCapacity) {
    var len = a.length, out = [], i = 0;
    while (i < len) {
        var size = maxCapacity;
        out.push(a.slice(i, i + maxCapacity < len ? i + maxCapacity : len));
        i += size;
    }
    return out;
}