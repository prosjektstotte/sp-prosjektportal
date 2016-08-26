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

GT.Common.DetectIEVersion = function () {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    var trident = ua.indexOf('Trident/');

    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    if (trident > 0) {
        // IE 11 (or newer) => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    // other browser
    return 666;
};

GT.Common.DetectAndStapleIEVersion = function() {
    var ieVersion = GT.Common.DetectIEVersion();
    if (ieVersion != 666) {
        if (ieVersion < 10) {
            document.documentElement.className += " nonhtml5browser";
        }
        document.documentElement.className += " ieversion-" + ieVersion;
    }
};

GT.Common.IsNonHtml5Browser = function() {
    if (GT.jQuery('html').hasClass('nonhtml5browser')) return true;
    return false;
};

GT.jQuery(function () {
    GT.Common.DetectEditMode();
    GT.Common.DetectAndStapleIEVersion();
});