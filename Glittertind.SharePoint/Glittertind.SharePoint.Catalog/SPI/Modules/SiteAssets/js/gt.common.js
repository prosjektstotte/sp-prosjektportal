var GT = GT || {};
GT.Common = GT.Common || {};
GT.Project = GT.Project || {};

GT.Common.GetPhaseLogoMarkup = function (phaseName) {
    GT.Common.GetPhaseLogoMarkup(phaseName, false);
};

GT.Common.GetPhaseLogoMarkup = function (phaseName, selected) {
    var phaseDisplayName = "Ingen fase";
    var phaseLetter = 'X';
    var selectedClass = selected ? "selected" : '';
    if (phaseName != '' && phaseName != undefined) {
        phaseDisplayName = phaseName;
        phaseLetter = phaseName.substr(0, 1);
    }
    return '<div class="gt-phaseIcon ' + selectedClass + '">' +
        '<span class="phaseLetter">' + phaseLetter + '</span>' +
        '<span class="projectPhase">' + phaseDisplayName + '</span>' +
        '</div>';
};

GT.Common.GetPhaseFromCurrentItem = function () {
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

    var deferred = jQuery.Deferred();
    context.executeQueryAsync(Function.createDelegate(this, function () {
        var currentPhaseItem = pageItem.get_item(pageFieldNameVar);
        var currentPhaseName = currentPhaseItem.Label;
        deferred.resolve(currentPhaseName);
        deferred.promise();
    }), Function.createDelegate(this, function (sender, args) {
        deferred.resolve('');
        deferred.promise();
        console.log('error when getting page field' + sender + " " + args);
    }));
    return deferred;
};

GT.Common.PopulateProjectPhasePart = function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        jQuery.when(GT.Common.GetPhaseFromCurrentItem()).then(function (phaseName) {
            var phases = ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte', 'Realisere'];
            for (var ix = 0; ix < phases.length; ix++) {
                jQuery('.projectPhases').append('<li>' + GT.Common.GetPhaseLogoMarkup(phases[ix], phases[ix] == phaseName) + '</li>');
            }
        });
    });
};

GT.Project.ChangePhase = function () {
    alert('not implemented');
};