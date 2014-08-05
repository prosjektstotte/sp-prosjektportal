var GT = GT || {};
GT.Common = GT.Common || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);

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
    if (GT.jQuery('html').hasClass('designmode')) return true;
    return false;
};

GT.jQuery(function () {
    GT.Common.DetectEditMode();
});