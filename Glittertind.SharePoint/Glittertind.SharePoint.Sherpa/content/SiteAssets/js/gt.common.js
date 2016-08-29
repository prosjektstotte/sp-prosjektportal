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

// See tokens here: http://msdn.microsoft.com/en-us/library/office/ms431831%28v=office.15%29.aspx
GT.Common.GetUrlWithoutTokens = function (url) {
    return url.replace('{Site}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{SiteUrl}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{SiteUrlEncoded}', encodeURIComponent(_spPageContextInfo.webAbsoluteUrl))
              .replace('{SiteCollection}', _spPageContextInfo.siteAbsoluteUrl)
              .replace('{SiteCollectionEncoded}', encodeURIComponent(_spPageContextInfo.siteAbsoluteUrl))
			  .replace('{site}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{siteurl}', _spPageContextInfo.webAbsoluteUrl)
              .replace('{siteurlencoded}', encodeURIComponent(_spPageContextInfo.webAbsoluteUrl))
              .replace('{sitecollection}', _spPageContextInfo.siteAbsoluteUrl)
              .replace('{sitecollectionencoded}', encodeURIComponent(_spPageContextInfo.siteAbsoluteUrl))
              .replace('{sitecollectionrelative}', _spPageContextInfo.siteServerRelativeUrl)
              .replace('{SiteCollectionRelative}', _spPageContextInfo.siteServerRelativeUrl);
};

GT.Common.GetFormDigestForSite = function(url) {
    var deferred = GT.jQuery.Deferred();

    GT.jQuery.ajax({
        type: "POST",
        headers: {
            "accept": "application/json;odata=verbose"
        },
        url: url + "/_api/contextinfo",
        contentType: "text/html; charset=utf-8",
        dataType: "html",
        success: function (data, status) {
            var contextInfo = JSON.parse(data);
            deferred.resolve(contextInfo.d.GetContextWebInformation.FormDigestValue);
        },
        error: function (xmlReq) {
            console.log('error: ' + xmlReq.status + ' \n\r ' + xmlReq.statusText + '\n\r' + xmlReq.responseText);
            deferred.reject();
        }
    });
    return deferred.promise();
};
GT.jQuery(function () {
    GT.Common.DetectEditMode();
    GT.Common.DetectAndStapleIEVersion();
});