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
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
        SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
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
        });
    });
};

GT.Project.HandleMissingMetadata = function () {
    if (GT.jQuery('.projectFrontPage .projectMetadata table tr.GtProjectManager td.fieldValue').text().trim() == '') {
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

GT.Project.InitFrontpage = function () {
    GT.Project.ExecuteFunctionsAfterSPLoaded([
        GT.Project.PopulateProjectPhasePart,
        GT.Project.ShowMetadataIfIsWelcomePage,
    ]);
};
GT.Project.InitOwnerControls = function () {
    GT.Project.ExecuteFunctionsAfterSPLoaded([
        GT.Project.HandleMissingMetadata,
        GT.Project.SetEditMetadataUrls
    ]);
};

GT.Project.ExecuteFunctionsAfterSPLoaded = function (funcsToExecute) {
    // For IE 10,11+
    if (SP && SP.SOD) {
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
            SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
            SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
                for (var i = funcsToExecute.length - 1; i >= 0; i--) {
                    funcsToExecute[i]();
                    funcsToExecute.pop();
                }
            });
        });
    };

    // For Chrome - SP.SOD.executeFunc only has a 53% success rate with Chrome
    if (window['ExecuteOrDelayUntilScriptLoaded']) {
        ExecuteOrDelayUntilScriptLoaded(function () {
            ExecuteOrDelayUntilScriptLoaded(function () {
                for (var i = funcsToExecute.length - 1; i >= 0; i--) {
                    funcsToExecute[i]();
                    funcsToExecute.pop();
                }
            }, "sp.taxonomy.js");
        }, "sp.js");
    };
}

GT.Project.ChangeProjectPhase = function () {
    var deferred = GT.jQuery.Deferred();

    var currentPhasePromise = GT.Project.GetPhaseTermFromCurrentItem();
    currentPhasePromise.done(function (term) {
        var safeTerm = GT.Project.GetSafeTerm(term);
        if (safeTerm != "" && safeTerm.get_label != undefined) {
            console.log('Changing phase to ' + safeTerm.get_label());
            GT.jQuery.when(
                GT.Project.ChangeQueryOfListViewOnPage(safeTerm.get_label(), "Dokumenter", "SitePages/Forside.aspx"),
                GT.Project.ChangeQueryOfListViewOnPage(safeTerm.get_label(), "Oppgaver", "SitePages/Forside.aspx", true),
                GT.Project.ChangeQueryOfListViewOnPage(safeTerm.get_label(), "Usikkerhet", "SitePages/Forside.aspx"),
                GT.Project.SetMetaDataDefaultsForLib("Dokumenter", "GtProjectPhase", safeTerm)
            ).then(function () {
                deferred.resolve();
            });
        }
    });
    return deferred.promise();
};

GT.Project.ChangeQueryOfListViewOnPage = function (phaseName, listName, pageRelativeUrl, isTaskList) {
    var deferred = GT.jQuery.Deferred();

    var clientContext = SP.ClientContext.get_current();
    var viewCollection = clientContext.get_web().get_lists().getByTitle(listName).get_views();

    clientContext.load(viewCollection);
    clientContext.executeQueryAsync(function () {
        var view = GT.Project.GetViewFromCollectionByUrl(viewCollection, pageRelativeUrl);
        if (view) {
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

            if (isTaskList) {
                camlArray = [];
                camlArray.push(
                    "<Where>",
                    "<And>",
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
                    "<Neq>",
                    "<FieldRef Name='Status' />",
                    "<Value Type='Text'>Fullført</Value>",
                    "</Neq>",
                    "</And>",
                    "</Where>");
            }

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
            deferred.resolve();
            console.log('Could not find any view with url ' + pageRelativeUrl + ' for list ' + listName);
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

    GT.Project.EnsureMetaDataDefaultsEventReceiver(lib);

    var ctx = new SP.ClientContext.get_current();
    var web = ctx.get_web();
    // fragile, will not handle things living under "/lists"
    var list = web.get_lists().getByTitle(lib);
    var listRootFolder = list.get_rootFolder();
    ctx.load(list, 'RootFolder');
    ctx.load(listRootFolder, 'ServerRelativeUrl');
    ctx.executeQueryAsync(function (sender, args) {
        var libUrl = listRootFolder.get_serverRelativeUrl();
        var safeTermObject = GT.Project.GetSafeTerm(term);

        var termString = safeTermObject.WssId + ';#' + safeTermObject.Label + '|' + safeTermObject.TermGuid;
        var template = '<MetadataDefaults><a href="{siteCollRelativeUrl}"><DefaultValue FieldName="{field}">{term}</DefaultValue></a></MetadataDefaults>';
        var result = template.split("{siteCollRelativeUrl}").join(libUrl);
        result = result.split("{field}").join(field);
        result = result.split("{term}").join(termString);

        var fileCreateInfo = new SP.FileCreationInformation();
        fileCreateInfo.set_url(libUrl + "/Forms/client_LocationBasedDefaults.html");
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
    },
        function (sender, args) {
            console.log("fail: " + args.get_message());
            deferred.reject();
        });
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
        var eventReceiverExists = false;
        while (eventReceiversEnumerator.moveNext()) {
            var eventReceiver = eventReceiversEnumerator.get_current();
            var name = eventReceiver.get_receiverName();
            if (name === 'LocationBasedMetadataDefaultsReceiver ItemAdded') {
                console.log('LocationBasedMetadataDefaultsReceiver event receiver exists - backing off');
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
            console.log('Added LocationBasedMetadataDefaultsReceiver event receiver');

        }
    },
        function (sender, args) {
            console.log("Failed while getting event receivers: " + args.get_message());
        });
};


GT.Project.PopulateProjectPhasePart = function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
        SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
            GT.jQuery.when(
                GT.Project.GetPhaseNameFromCurrentItem(),
                GT.Project.GetProjectPhases(),
                GT.Project.GetChecklistData()
            ).then(function (currentPhase, allPhases, checklistData) {
                if (allPhases) {
                    var oldInternetExplorer = detectIE() && detectIE() < 11;
                    var frontPagePhases = allPhases.filter(function (f) { return f.ShowOnFrontpage; });
                    if (frontPagePhases && frontPagePhases.length > 0) {
                        var phasesWithSubText = frontPagePhases.filter(function (f) { return f.SubText; });
                        var widthPerPhase = 100 / frontPagePhases.length;
                        for (var ix = 0; ix < frontPagePhases.length; ix++) {
                            if (frontPagePhases[ix].ShowOnFrontpage) {
                                var checkListItemStats = checklistData[frontPagePhases[ix].Name];
                                var phaseLogoMarkup = GT.Project.GetPhaseLogoMarkup(frontPagePhases[ix], frontPagePhases[ix].Name == currentPhase, true, true, widthPerPhase, ix, (ix + 1) == frontPagePhases.length, checkListItemStats, oldInternetExplorer);
                                GT.jQuery('.projectPhases').append(phaseLogoMarkup).addClass(oldInternetExplorer ? 'legacy-ie' : 'not-legacy-ie').addClass(phasesWithSubText.length > 0 ? 'has-subtext' : 'no-subtext');
                            }
                        }
                    }
                }
            });
        });
    });
};

GT.Project.GetPhaseTermSetId = function () {
    var defer = GT.jQuery.Deferred();
    var settingsUrl = String.format("{0}/SiteAssets/gt/config/core/settings.txt", _spPageContextInfo.siteServerRelativeUrl === '/' ? '' : _spPageContextInfo.siteServerRelativeUrl);
    GT.jQuery.getJSON(settingsUrl)
        .then(function (data) {
            defer.resolve(data.PhaseSettings.TermSetId);
        })
        .fail(function () {
            console.log("Could not find settings file for getting taxonomy term set id. Resolving to default.");
            defer.resolve("abcfc9d9-a263-4abb-8234-be973c46258a");
        });
    return defer.promise();
};

GT.Project.GetProjectPhases = function () {
    var defer = GT.jQuery.Deferred();

    GT.jQuery.when(GT.Project.GetPhaseTermSetId()).then(function (termSetId) {
        var context = SP.ClientContext.get_current();
        var taxSession = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);
        var termStore = taxSession.getDefaultSiteCollectionTermStore();
        var termSet = termStore.getTermSet(termSetId);
        var terms = termSet.getAllTerms();

        context.load(terms);
        context.executeQueryAsync(Function.createDelegate(this, function () {
            var termsArray = terms.get_data().map(function (t) {
                return {
                    Id: t.get_id(),
                    Name: t.get_name(),
                    ShowOnFrontpage: t.get_localCustomProperties()["ShowOnFrontpage"] ? t.get_localCustomProperties()["ShowOnFrontpage"] === 'true' : true,
                    SubText: t.get_localCustomProperties()["SubText"] ? t.get_localCustomProperties()["SubText"] : ""
                };
            });
            defer.resolve(termsArray);
        }), Function.createDelegate(this, function () {
            console.log('Error: Could not load terms');
            defer.reject(arguments);
        }));
    });
    return defer.promise();
};

GT.Project.GetPhaseLogoMarkup = function (phase, selected, wrapInListItemMarkup, linkToDocumentLibrary, widthPerPhase, index, isLastPhase, checklistStats, oldInternetExplorer) {
    var phaseDisplayName = "Ingen fase";
    var phaseLetter = 'X';
    var phaseSubText = '';
    var phaseClasses = [];

    if (index != undefined) {
        phaseClasses.push(String.format('phasenumber-{0}', (index + 1)));
    }
    if (selected) {
        phaseClasses.push("selected");
    }
    if (isLastPhase) {
        phaseClasses.push("last-phase");
    }
    if (phase && phase.Name) {
        phaseDisplayName = phase.Name;
        phaseLetter = phaseDisplayName.substr(0, 1);
        phaseSubText = phase.SubText;
    }
    var checklistMarkup = String.format("<h3>Beslutningspunkter for {0}</h3><ul><li>Ingen punkter funnet for denne fasen</li><li class='spacer'></li>" +
        "<li><a class='see-all' href='{1}/Lists/Fasesjekkliste/AllItems.aspx'>Gå til fasesjekklisten</a></li></ul>",
        phaseDisplayName, _spPageContextInfo.webServerRelativeUrl);

    if (checklistStats) {
        checklistMarkup = String.format("<h3>Beslutningspunkter for {0}</h3><ul>" +
            "<li><span class='gt-icon gt-nostatus'></span>{1} åpne punkter</li>" +
            "<li><span class='gt-icon gt-completed'></span>{2} utførte punkter</li>" +
            "<li><span class='gt-icon gt-ignored'></span>{3} ikke relevante</li>" +
            "<li class='spacer'><span> </span></li>" +
            "<li><a class='see-all' href='{4}/Lists/Fasesjekkliste/AllItems.aspx?FilterField1=GtProjectPhase&FilterValue1={5}'>Se alle sjekkpunktene for denne fasen</a></li></ul>",
            phaseDisplayName, checklistStats.Open, checklistStats.Closed, checklistStats.Ignored, _spPageContextInfo.webServerRelativeUrl, encodeURIComponent(phaseDisplayName));
    }

    var markup = String.format('<div class="gt-phaseIcon {0}">' +
        '<span class="phaseLetter">{1}</span>' +
        '<span class="projectPhase">{2}</span>' +
        '<span class="phaseSubText">{3}</span>' +
        '</div>', phaseClasses.join(' '), phaseLetter, phaseDisplayName, phaseSubText);

    if (linkToDocumentLibrary)
        markup = String.format('<a href="{0}/Dokumenter/Forms/AllItems.aspx?FilterField1=GtProjectPhase&FilterValue1={1}">{2}</a><div class="checklistStats">{3}</div>', _spPageContextInfo.webServerRelativeUrl, phaseDisplayName, markup, checklistMarkup);
    if (wrapInListItemMarkup) {
        var styleForIE = '';
        //No support for flex in IE < 10
        if (oldInternetExplorer) {
            styleForIE = String.format('style="width:{0}%;"', widthPerPhase);
        }
        markup = String.format('<li class="{0}" {1}>{2}</li>', phaseClasses.join(' '), styleForIE, markup);
    }

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

GT.Project.GetChecklistData = function () {
    var defer = GT.jQuery.Deferred();

    var caml = "<View><Query><OrderBy><FieldRef Name=\'ID\' /></OrderBy></Query></View>";
    var url = String.format("{0}/_api/web/lists/getByTitle('Fasesjekkliste')/GetItems", _spPageContextInfo.webServerRelativeUrl);
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
            var checklistItems = {};

            for (var i = 0; i < data.d.results.length; i++) {
                var checklistItem = data.d.results[i];
                if (checklistItem.GtProjectPhase) {
                    var phaseName = checklistItem.GtProjectPhase.Label;
                    var status = checklistItem.GtChecklistStatus;

                    var existingPhase = checklistItems[phaseName];
                    if (!existingPhase) {
                        checklistItems[phaseName] = {
                            Id: checklistItem.GtProjectPhase.TermGuid,
                            Closed: 0,
                            Open: 0,
                            Ignored: 0
                        };
                        existingPhase = checklistItems[phaseName];
                    }
                    if (status === "Ja" || status === "Utført") {
                        existingPhase.Closed += 1;
                    } else if (status === "Ignorert" || status === "Ikke relevant") {
                        existingPhase.Ignored += 1;
                    } else {
                        existingPhase.Open += 1;
                    }
                }
            }
            defer.resolve(checklistItems);
        },
        fail: function () {
            console.log("error while getting checklistdata");
            console.log(arguments);
            defer.reject();
        }
    });

    return defer.promise();
}

GT.Project.PhaseForm.CheckList.render = function () {
    GT.jQuery(".ms-webpart-zone.ms-fullWidth #gtchecklist").remove();

    GT.Project.PhaseForm.CheckList.getData().done(function (items) {
        var outHtml = [];
        outHtml.push('<div id="gtchecklist">',
            '<h2 class="ms-h2">Fasesjekkliste</h2>',
            '<ul>');
        for (var i = 0; i < items.length; i++) {
            outHtml.push('<li>',
                '<div class="gt-checklist-link" onclick="GT.Project.PhaseForm.CheckList.onClick(\'', items[i].get_editItemUrl(), '\')">',
                '<span class="gt-icon ', items[i].get_statusCssClass(), '" title="', items[i].Status, '"></span>',
                '<span class="gt-checklist-title">', items[i].Title, '</span></div>',
                '</li>');
        }
        outHtml.push('</ul><div class="gt-reload-msg" onclick="GT.Project.PhaseForm.CheckList.render();"><span class="gt-reload-icon"></span>Oppdater sjekklisten</div></div>');

        GT.jQuery(".ms-webpart-zone.ms-fullWidth").append(outHtml.join(""));
    });
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
        camlQuery.set_viewXml("<View><Query><Where><Eq><FieldRef Name='GtProjectPhase'/><Value Type='TaxonomyFieldType'>" + phase + "</Value></Eq></Where><OrderBy><FieldRef Name='GtSortOrder' /><FieldRef Name='ID' /></OrderBy></Query></View>");
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

GT.Project.PhaseForm.CheckList.onClick = function (url) {
    SP.UI.ModalDialog.showModalDialog({
        url: url
    });
};

GT.Project.PhaseForm.CheckList.CheckListItem = function (title, id, status) {
    var self = this;
    self.Title = title;
    self.Id = id;
    self.Status = status;
    self.get_statusCssClass = function () {
        if (self.Status === 'Ja' || self.Status === 'Utført') {
            return 'gt-completed';
        }
        if (self.Status === 'Ignorert' || self.Status === 'Ikke relevant') {
            return 'gt-ignored';
        }
        if (self.Status === 'Nei') {
            return 'gt-failed';
        }
        return 'gt-nostatus';
    };
    self.get_editItemUrl = function () {
        return _spPageContextInfo.webServerRelativeUrl + "/Lists/Fasesjekkliste/EditForm.aspx?ID=" + self.Id + "&Source=" + encodeURIComponent(window.location.toString());
    };
};

GT.Project.CalendarForm.RenderRelatedLogElements = function () {
    GT.jQuery(".ms-webpart-zone.ms-fullWidth #gtloglist").remove();
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
            var descriptionWithLineBreaks = items[i].Description ? items[i].Description.replace(/(?:\r\n|\r|\n)/g, '<br />') : '';
            outHtml.push(i % 2 == 1 ? '<tr>' : '<tr class="ms-HoverBackground-bgColor">',
                '<td><div class="gt-logelement-link" onclick="GT.Project.CalendarForm.LogElementOnClick(\'', items[i].get_viewItemUrl(), '\')">',
                '<span class="gt-title">', items[i].Title, '</span></div></td>',
                '<td>', descriptionWithLineBreaks, '</td>',
                '<td>', items[i].Type, '</td>',
                '<td>', items[i].ReportedBy, '</td>',
                '</tr>');
        }
        outHtml.push('</tbody></table>',
            '<div class="gt-reload-msg" onclick="GT.Project.CalendarForm.RenderRelatedLogElements();"><span class="gt-reload-icon"></span>Oppdater loggelementer</div>',
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

GT.Project.CalendarForm.LogElementOnClick = function (url) {
    SP.UI.ModalDialog.showModalDialog({
        url: url
    });
};

GT.Project.CalendarForm.LogElement = function (title, id, description, type, reportedBy) {
    var self = this;
    self.Title = title;
    self.Id = id;
    self.Description = description;
    self.Type = type;
    self.ReportedBy = reportedBy;

    self.get_viewItemUrl = function () {
        return _spPageContextInfo.webServerRelativeUrl + "/Lists/Prosjektlogg/DispForm.aspx?ID=" + self.Id + "&Source=" + encodeURIComponent(window.location.toString());
    };
};

// dependency on knockout.js
GT.Project.Model = GT.Project.Model || {};
GT.Project.Model.webModel = function () {
    var _this = this;
    _this.title = ko.observable();
    _this.url = ko.observable();
    _this.lastChanged = ko.observable();
    _this.created = ko.observable();
    _this.lastChangedDisplayValue = ko.computed(function () {
        if (this.lastChanged() != undefined) {
            return new Date(this.lastChanged()).format("dd.MM.yyyy");
        }
        return '';

    }, this);
    _this.createdDisplayValue = ko.computed(function () {
        if (this.created() != undefined) {
            return new Date(this.created()).format("dd.MM.yyyy");
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
        return GT.Project.Model.appViewModel.projects().slice(0, 5);
    }, GT.Project.Model.appViewModel);

    var get_webData = function (webCollection) {
        var get_webDataDeferred = GT.jQuery.Deferred();

        var clientContext = new SP.ClientContext.get_current();
        var web = clientContext.get_web();
        this.webCollection = web.getSubwebsForCurrentUser(null);
        clientContext.load(this.webCollection);
        clientContext.executeQueryAsync(Function.createDelegate(this, function () {
            var subsites = this.webCollection.get_data().map(function (i) {
                var model = new GT.Project.Model.webModel();
                model.title(i.get_title());
                model.url(i.get_serverRelativeUrl());
                model.lastChanged(i.get_lastItemModifiedDate());
                model.created(i.get_created());
                return model;
            });
            subsites.sort(function (a, b) {
                return new Date(b.created()) - new Date(a.created());
            });

            for (var x = 0; x < subsites.length; x++) {
                GT.Project.Model.appViewModel.projects.push(subsites[x]);
            }
            GT.Project.Model.appViewModel.loaded(true);
            get_webDataDeferred.resolve(GT.Project.Model.appViewModel);
        }), Function.createDelegate(this, function () {
            console.log('Error getting recent projects');
            console.log(arguments);
        }));

        return get_webDataDeferred.promise();
    };

    get_webData().then(function () { masterDefered.resolve() });;

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