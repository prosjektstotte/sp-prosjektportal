var GT = GT || {};
GT.Project = GT.Project || {};
GT.Project.CurrentItemPhase = null;

GT.Project.ChangePhase = function (phaseName) {
    GT.Project.ChangeQueryOfListViewsOnFrontPage(phaseName);
};

GT.Project.ChangeQueryOfListViewsOnFrontPage = function (phaseName) {
    var deferred = $.Deferred();

    var listsToUpdate = ["Dokumenter", "Oppgaver", "Usikkerhet"];
    var viewUrl = "SitePages/Forside.aspx";

    var clientContext = SP.ClientContext.get_current();
    for (var i = 0; i < listsToUpdate.length; i++) {
        var listName = listsToUpdate[i];
        var list = clientContext.get_web().get_lists().getByTitle(listName);
        var viewCollection = list.get_views();

        clientContext.load(viewCollection);
        clientContext.executeQueryAsync(function () {
            var view = GT.Project.GetViewFromCollectionByUrl(viewCollection, viewUrl);
            if (view != null) {
                view.set_query("<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='TaxonomyFieldType'>" + phaseName + "</Value></Eq></Where>");
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
                console.error('Could not find any view with url ' + viewUrl + ' for list ' + listName);
            }
        }, function (sender, args) {
            deferred.reject();
            console.error('Request failed. ' + args.get_message());
        });
    }
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
GT.Project.ChangeMetadataDefaultPhaseValueOfLists = function (phaseName) {
    alert('ole k has not implemented this');
};

GT.Project.PopulateProjectPhasePart = function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        jQuery.when(GT.Project.GetPhaseFromCurrentItem()).then(function (phaseName) {
            var phases = ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte', 'Realisere'];
            for (var ix = 0; ix < phases.length; ix++) {
                jQuery('.projectPhases').append(GT.Project.GetPhaseLogoMarkup(phases[ix], phases[ix] == phaseName, true));
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

GT.Project.GetPhaseFromCurrentItem = function () {
    var defer = $.Deferred();
    $.when(GT.Project.GetPhaseTermFromCurrentItem()).done(function (term) { defer.resolve(term.Label); });
    return defer.promise();
};

GT.Project.GetPhaseTermFromCurrentItem = function () {
    var pageItem;
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
    pageItem = pageList.getItemById(pageItemId);

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