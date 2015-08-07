var GT = GT || {};
GT.Project = GT.Project || {};
GT.Project.PhaseForm = GT.Project.PhaseForm || {};
GT.Project.PhaseForm.CheckList = GT.Project.PhaseForm.CheckList || {};
GT.Project.CalendarForm = GT.Project.CalendarForm || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);

window.console = window.console || {};
window.console.log = window.console.log || function (msg) { };

GT.Project.FilterEventLookupOnLogForm = function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        var eventLookup = GT.jQuery('#onetIDListForm .ms-webpart-chrome.ms-webpart-chrome-vertical.ms-webpart-chrome-fullWidth > div > table > tbody > tr > td > #part1 table.ms-formtable select[id^="GtProjectLogEventLookup"]');
        var options = eventLookup.find('option').clone();
        eventLookup.empty();

        var now = new Date();
        options.filter(function (idx, el) {
            var eventName = el.text;
            var eventDate = new Date(eventName.substr(0, 10));
            return (eventDate >= now || eventName === "" || eventName === "(Ingen)");
        }).appendTo(eventLookup);
    });
};

GT.Project.HideProductsInLogFormIfEmpty = function () {
    var productLookups = GT.jQuery('#onetIDListForm .ms-webpart-chrome.ms-webpart-chrome-vertical.ms-webpart-chrome-fullWidth > div > table > tbody > tr > td > #part1 table.ms-formtable > tbody > tr table[id^="GtProjectLogProductLookup"] .ms-input select[id^="GtProjectLogProductLookup"]');
    var produktLookupOptions = productLookups.find('option');
    if (produktLookupOptions.length === 0) {
        productLookups.closest('#part1 table.ms-formtable > tbody > tr').hide();
    }
};

GT.Project.ShowMetadataIfIsWelcomePage = function () {
    var selector = ".projectFrontPage .rightColumnStatic";
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
};

GT.Project.HandleMissingMetadata = function () {
    if (GT.jQuery('.projectFrontPage .projectMetadata table tr.GtProjectPhase td.fieldValue').text().trim() == '' ||
        GT.jQuery('.projectFrontPage .projectMetadata table tr.GtProjectManager td.fieldValue').text().trim() == '' ||
        GT.jQuery('.projectFrontPage .projectMetadata table tr.GtProjectGoals td.fieldValue').text().trim() == '') {
        GT.jQuery('.projectFrontPage .missingMetadataWarning').show();
        GT.jQuery('#changeProjectPhaseLink').hide();
    } else {
        GT.jQuery('#changeProjectPhaseLink').show();
    }
}

GT.Project.SetEditMetadataUrls = function () {
    var editMetaUrl = 'Forms/EditForm.aspx?EditMode=Project&ID=' + _spPageContextInfo.pageItemId;
    GT.jQuery('#editPageMetaLink').attr('href', editMetaUrl);
    var editPhaseUrl = editMetaUrl.replace('Project', 'PhaseOnly');
    GT.jQuery('#changeProjectPhaseLink').attr('href', editPhaseUrl);
}

GT.Project.InitFrontpage = function (requiresPermissions) {
    var funcsToExecute = [
        GT.Project.PopulateProjectPhasePart,
        GT.Project.ShowMetadataIfIsWelcomePage,
    ];

    if (requiresPermissions == "AddAndCustomizePages") {
        funcsToExecute = [
            GT.Project.HandleMissingMetadata,
            GT.Project.SetEditMetadataUrls
        ]
    };

    // For IE 10,11+
    if (SP && SP.SOD) {
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            for (var i = funcsToExecute.length - 1; i >= 0; i--) {
                funcsToExecute[i]();
                funcsToExecute.pop();
            }
        });
    };

    // For Chrome - SP.SOD.executeFunc only has a 53% success rate with Chrome
    if (window['ExecuteOrDelayUntilScriptLoaded']) {
        ExecuteOrDelayUntilScriptLoaded(function () {
            for (var i = funcsToExecute.length - 1; i >= 0; i--) {
                funcsToExecute[i]();
                funcsToExecute.pop();
            }
        }, "sp.js");
    };
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

    var termString = safeTermObject.WssId + ';#' + safeTermObject.Label + '|' + safeTermObject.TermGuid;
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
    GT.jQuery.when(GT.Project.GetPhaseNameFromCurrentItem()).then(function (phaseName) {
        var phases = ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte', 'Realisere'];
        for (var ix = 0; ix < phases.length; ix++) {
            GT.jQuery('.projectPhases').append(GT.Project.GetPhaseLogoMarkup(phases[ix], phases[ix] == phaseName, true, true, ix));
        }
    });
};

GT.Project.GetPhaseLogoMarkup = function (phaseName) {
    GT.Project.GetPhaseLogoMarkup(phaseName, false);
};

GT.Project.GetPhaseLogoMarkup = function (phaseName, selected, wrapInListItemMarkup, linkToDocumentLibrary, index) {
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
        markup = '<li class="' + selectedClass + ' phasenumber-' + (index + 1) + '">' + markup + '</li>';

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

GT.Project.GetFieldValueFromCurrentItem = function (pageFieldNameVar) {
    var deferred = GT.jQuery.Deferred();
    var context = SP.ClientContext.get_current();
    var web = context.get_web();

    //_spPageContextInfo is defined in every SharePoint page and has pageListId and pageItemId
    //properties populated in publishing pages
    var pageListId = _spPageContextInfo.pageListId;
    var pageItemId = getParameterByName("ID");

    //getting the list item for the current page
    var webLists = web.get_lists();
    var pageList = webLists.getById(pageListId);
    var pageItem = pageList.getItemById(pageItemId);

    //explicitly requesting to load the field Name for the page item
    context.load(pageItem, pageFieldNameVar);

    context.executeQueryAsync(Function.createDelegate(this, function () {
        var fieldValue = pageItem.get_item(pageFieldNameVar);
        deferred.resolve(fieldValue);
    }), Function.createDelegate(this, function (sender, args) {
        deferred.reject();
        console.log('error when getting page field' + pageFieldNameVar + " " + args);
    }));
    return deferred.promise();
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

GT.Project.PhaseForm.CheckList.render = function () {
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
                '<div>Fasesjekkliste er basert på beslutningspunkt fra <a href="http://prosjektveiviseren.no/" target="_blank">Prosjektveiviseren</a></div>',
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
        var list = ctx.get_web().get_lists().getByTitle('Fasesjekkliste');
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
                var checkListItem = new GT.Project.PhaseForm.CheckList.CheckListItem(title, id, status);
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

GT.Project.PhaseForm.CheckList.CheckListItem = function (title, id, status) {
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
        var editElmLink = _spPageContextInfo.webServerRelativeUrl + "/Lists/Fasesjekkliste/EditForm.aspx?ID=" + self.Id;
        if (sourceUrl) {
            editElmLink += "&Source=" + encodeURIComponent(sourceUrl);
        }
        return editElmLink;
    };
};

GT.Project.CalendarForm.RenderRelatedLogElements = function () {
    var promise = GT.Project.CalendarForm.getData();

    promise.done(function (items) {
        var outHtml = [];
        outHtml.push('<div id="gtloglist">',
                        '<h2 class="ms-h2">Elementer fra loggen</h2>',
                        '<table><tbody>',
                        '<tr><th>Tittel</th>',
                        '<th>Beskrivelse</th>',
                        '<th>Loggelement</th>',
                        '<th>Meldt av</th></tr>');
        for (var i = 0; i < items.length; i++) {
            outHtml.push(i % 2 == 1 ? '<tr>' : '<tr class="ms-HoverBackground-bgColor">',
                    '<td><a href="', items[i].get_viewItemUrl(window.location.toString()), '" >',
                    '<span class="gt-title">', items[i].Title, '</span></a></td>',
                    '<td>', items[i].Description, '</td>',
                    '<td>', items[i].Type, '</td>',
                    '<td>', items[i].ReportedBy, '</td>',
            '</tr>');
        }
        outHtml.push('</tbody></table>',
                '</div>');
        GT.jQuery(".ms-webpart-zone.ms-fullWidth").append(outHtml.join(""));
    });
};
GT.Project.CalendarForm.getData = function () {
    var dateAndTime = GT.Project.GetFieldValueFromCurrentItem("GtProjectEventDateAndTitle");
    var scriptPromise = GT.jQuery.getScript(_spPageContextInfo.siteServerRelativeUrl + "/_layouts/15/SP.RequestExecutor.js");

    var promise = GT.jQuery
    .when(dateAndTime, scriptPromise)
    .then(function (fieldValue) {
        var defer = GT.jQuery.Deferred();
        var ctx = new SP.ClientContext.get_current();
        var list = ctx.get_web().get_lists().getByTitle('Prosjektlogg');
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml("<View><Query><Where><Eq><FieldRef Name='GtProjectLogEventLookup'/><Value Type='Lookup'>" + fieldValue + "</Value></Eq></Where><OrderBy><FieldRef Name='Created' /></OrderBy></Query></View>");
        var listItems = list.getItems(camlQuery);
        ctx.load(listItems);
        ctx.executeQueryAsync(function () {
            var listItemEnumerator = listItems.getEnumerator();
            var logElements = [];
            while (listItemEnumerator.moveNext()) {
                var item = listItemEnumerator.get_current();
                var title = item.get_item('Title');
                var id = item.get_item('ID');
                var desc = item.get_item('GtProjectLogDescription');
                var type = item.get_item('GtProjectLogType');
                var reportedBy = item.get_item('GtProjectLogReporter');
                if (reportedBy != null) {
                    reportedBy = reportedBy.get_lookupValue();
                }
                var logElement = new GT.Project.CalendarForm.LogElement(title, id, desc, type, reportedBy);
                logElements.push(logElement);
            }
            defer.resolve(logElements);
        }, function (sender, args) {
            console.log("Couldn't get project log elements for the specified meeting");
            console.log(args.get_message());
            defer.reject();
        });
        return defer.promise();

    });

    return promise;
};

GT.Project.CalendarForm.LogElement = function (title, id, description, type, reportedBy) {
    var self = this;
    self.Title = title;
    self.Id = id;
    self.Description = description;
    self.Type = type;
    self.ReportedBy = reportedBy;

    self.get_viewItemUrl = function (sourceUrl) {
        var editElmLink = _spPageContextInfo.webServerRelativeUrl + "/Lists/Prosjektlogg/DispForm.aspx?ID=" + self.Id;
        if (sourceUrl) {
            editElmLink += "&Source=" + encodeURIComponent(sourceUrl);
        }
        return editElmLink;
    };
};

// dependency on knokcout.js
GT.Project.Model = GT.Project.Model || {};

//Also used from display template
GT.Project.Model.GetStatusCssClass = function (status) {
    if (status === undefined || status === null) return 'status-unknown';

    var statusToCheck = status.toLowerCase();

    if (statusToCheck === 'etter plan') return 'status-red';
    else if (statusToCheck === 'foran plan') return 'status-green';
    else if (statusToCheck === 'på plan') return 'status-green';
    else if (statusToCheck === 'høy') return 'status-red';
    else if (statusToCheck === 'medium') return 'status-yellow';
    else if (statusToCheck === 'lav') return 'status-green';
    else if (statusToCheck === 'over budsjett') return 'status-red';
    else if (statusToCheck === 'på budsjett') return 'status-green';
    else if (statusToCheck === 'under budsjett') return 'status-green';
    else if (statusToCheck === 'vet ikke') return 'status-yellow';

    return 'status-unknown';
};

GT.Project.Model.webModel = function () {
    var _this = this;
    _this.title = ko.observable();
    _this.url = ko.observable();
    _this.lastChanged = ko.observable();
    _this.created = ko.observable();
    _this.projectGoal = ko.observable();
    _this.projectManager = ko.observable();
    _this.projectOwner = ko.observable();
    _this.statusTime = ko.observable();
    _this.statusTimeCss = ko.computed(function () {
        return GT.Project.Model.GetStatusCssClass(_this.statusTime());
    }, this);
    _this.statusRisk = ko.observable();
    _this.statusRiskCss = ko.computed(function () {
        return GT.Project.Model.GetStatusCssClass(_this.statusRisk());
    }, this);
    _this.statusBudget = ko.observable();
    _this.statusBudgetCss = ko.computed(function () {
        return GT.Project.Model.GetStatusCssClass(_this.statusBudget());
    }, this);
    _this.lastChanged = ko.observable();
    _this.phase = ko.observable();
    _this.matchesFilter = ko.observable(true);
    _this.lastChangedDisplayValue = ko.computed(function () {
        if (this.lastChanged() != undefined) {
            return this.lastChanged().format("dd. MMM yyyy");
        }
        return '';

    }, this);
    _this.createdDisplayValue = ko.computed(function () {
        if (this.created() != undefined) {
            return this.created().format("dd. MMM yyyy");
        }
        return '';

    }, this);
};

GT.Project.Model.appViewModel = GT.Project.Model.appViewModel || {};
GT.Project.get_allProjectsUnderCurrent = function () {

    var masterDefered = GT.jQuery.Deferred();

    GT.Project.Model.appViewModel.projects = ko.observableArray([]);
    GT.Project.Model.appViewModel.loaded = ko.observable(false);
    GT.Project.Model.appViewModel.recentlyCreatedProjects = ko.computed(function () {
        var unsortedProjects = GT.Project.Model.appViewModel.projects().slice(0); // cloning array
        unsortedProjects.sort(function (a, b) {
            return b.created() - a.created();
        });

        return unsortedProjects.slice(0, 5);

    }, GT.Project.Model.appViewModel);
    GT.Project.Model.appViewModel.attentionProjects = ko.computed(function () {
        var attentionProjects = []; // cloning array
        var existingProjects = GT.Project.Model.appViewModel.projects();
        for (var i = 0; i < existingProjects.length; i++) {
            if (existingProjects[i].matchesFilter()) {
                attentionProjects.push(existingProjects[i]);
            }
        }

        return attentionProjects;

    }, GT.Project.Model.appViewModel);
    GT.Project.Model.appViewModel.filter = function (filterObject) {
        var projects = this.projects();
        var keys = Object.keys(filterObject);
        var visible = false;
        for (var i = 0; i < projects.length; i++) {
            var match = false;
            for (var y = 0; y < keys.length; y++) {

                var currentValue = projects[i][keys[y]]();
                var filterValue = filterObject[keys[y]];
            
                if (typeof filterValue === 'string') {
                    currentValue = currentValue.toLowerCase();
                    filterValue = filterValue.toLowerCase();
                    var filterValues = filterValue.split(";");
                    for (var x = 0; x < filterValues.length; x++) {
                        var currentFilterValue = filterValues[x];

                        if (currentFilterValue.indexOf("!") == 0) {
                            currentFilterValue = currentFilterValue.substr(1);
                            if (currentValue.indexOf(currentFilterValue) !== -1) {
                                match = false;
                                break;
                            }
                        } else {
                            if (currentValue.indexOf(currentFilterValue) !== -1) {
                                match = true;
                                break;
                            }
                        }
                    }
                }
                else if ((filterValue instanceof Date)) {
                    if (filterValue > currentValue) {
                        match = true;
                        break;
                    }
                }
                else {
                    console.log("Fail when filtering");
                }
            }
            projects[i].matchesFilter(match);
        }
    }

    var clientContext = SP.ClientContext.get_current();
    var get_allWebs = function () {
        var defer = GT.jQuery.Deferred();
        var webCollection = clientContext.get_web().getSubwebsForCurrentUser(null);
        //clientContext.load(webCollection, 'Include(RootFolder, ServerRelativeUrl)');
        clientContext.load(webCollection);

        clientContext.executeQueryAsync(
            function () {
                if (webCollection !== null && webCollection.get_areItemsAvailable()) {
                    defer.resolve(webCollection);
                } else {
                    defer.reject();
                }
            }, function (sender, args) {
                console.error('Request failed. ' + args.get_message());
                defer.reject();
            });

        return defer.promise();
    }

    var get_webData = function (webCollection) {
        var get_webDataDeferred = GT.jQuery.Deferred();

        var get_pageProperties = function (pagedWebs) {
            var defer = GT.jQuery.Deferred();
            for (var i = 0; i < pagedWebs.length; i++) {
                var web = pagedWebs[i];
                var rootFolder = web.get_rootFolder();

                clientContext.load(web);
                //clientContext.load(rootFolder);
            }
            clientContext.executeQueryAsync(function () {
                var welcomePages = [];
                for (var i = 0; i < pagedWebs.length; i++) {
                    var web = pagedWebs[i];
                    //Will throw  Unauthorized exception when users have only 'View' permissions: web.get_rootFolder().get_welcomePage();
                    var welcomePageUrl = web.get_serverRelativeUrl() + "/SitePages/Forside.aspx";
                    var welcomePage = web.getFileByServerRelativeUrl(welcomePageUrl);
                    clientContext.load(welcomePage, 'ListItemAllFields');
                    welcomePages.push(welcomePage);
                };
                clientContext.executeQueryAsync(function () {
                    defer.resolve(welcomePages);
                }, function (sender, args) {
                    console.error('Request failed. ' + args.get_message());
                    defer.reject();
                });
            }, function (sender, args) {
                console.error('Request failed. ' + args.get_message());
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
            GT.Project.Model.appViewModel.projects([]);

            for (var i = 0; i < webs.length; i++) {
                var web = webs[i];


                var fetchedFile = webs[i].get_objectData().get_methodReturnObjects().GetFileByServerRelativeUrl;
                var fieldValues = fetchedFile[Object.keys(fetchedFile)[0]].get_objectData().get_clientObjectProperties().ListItemAllFields.get_fieldValues();

                var contentTypeId = fieldValues.ContentTypeId.get_stringValue();
                if (!contentTypeId.startsWith('0x010109010058561F86D956412B9DD7957BBCD67AAE01')) continue;

                var model = new GT.Project.Model.webModel();

                model.title(web.get_title());
                model.url(web.get_serverRelativeUrl());
                model.projectGoal(fieldValues.GtProjectGoals ? fieldValues.GtProjectGoals : '');
                model.projectManager(fieldValues.GtProjectManager ? fieldValues.GtProjectManager.get_lookupValue() : 'ikke satt');
                model.projectOwner(fieldValues.GtProjectOwner ? fieldValues.GtProjectOwner.get_lookupValue() : 'ikke satt');
                model.statusTime(fieldValues.GtStatusTime ? fieldValues.GtStatusTime : '');
                model.statusRisk(fieldValues.GtStatusRisk ? fieldValues.GtStatusRisk : '');
                model.statusBudget(fieldValues.GtStatusBudget ? fieldValues.GtStatusBudget : '');
                var properDateInput = fieldValues.Last_x0020_Modified.replace(' ', 'T') + 'Z';
                model.lastChanged(new Date(properDateInput));
                model.created(new Date(fieldValues.Created));
                model.phase(fieldValues.GtProjectPhase ? fieldValues.GtProjectPhase.Label : '');
                GT.Project.Model.appViewModel.projects.push(model);
            }
            GT.Project.Model.appViewModel.loaded(true);
            get_webDataDeferred.resolve(GT.Project.Model.appViewModel);

        });

        return get_webDataDeferred.promise();
    };

    get_allWebs().then(function (webCollection) {
        console.log("get_allWebs.done subwebs: " + webCollection.get_count());
        return get_webData(webCollection);
    }).then(function () { masterDefered.resolve() });;

    return masterDefered.promise();

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
};