var GT = GT || {};
GT.Common = GT.Common || {};

GT.Common.DetectEditMode = function () {
    var webPartPageForm = document.forms[MSOWebPartPageFormName];
    if (webPartPageForm) {
        var inDesignModeElement = webPartPageForm.MSOLayout_InDesignMode;
        if (inDesignModeElement) {
            var inDesignMode = inDesignModeElement.value;
            if (inDesignMode == 1) {
                document.documentElement.className += " designmode";
            }
        }
    }
};

GT.Common.IsEditMode = function () {
    if (jQuery('html').hasClass('designmode')) return true;
    return false;
};

GT.Common.GetPhaseLogoMarkup = function (phaseName) {
    GT.Common.GetPhaseLogoMarkup(phaseName, false);
};

GT.Common.GetPhaseLogoMarkup = function (phaseName, selected, wrapInListItemMarkup) {
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
        if (currentPhaseItem != '' && currentPhaseItem != undefined) {
            var currentPhaseName = currentPhaseItem.Label;
            deferred.resolve(currentPhaseName);
        } else {
            deferred.resolve('');
        }
        deferred.promise();
    }), Function.createDelegate(this, function (sender, args) {
        deferred.resolve('');
        deferred.promise();
        console.log('error when getting page field' + sender + " " + args);
    }));
    return deferred;
};

jQuery(function() {
    GT.Common.DetectEditMode();
});