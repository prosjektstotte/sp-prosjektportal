var GT = GT || {};
if (GT.jQuery === undefined) GT.jQuery = jQuery.noConflict(true);

String.prototype.trimStart = function (c) {
    if (this.length == 0)
        return this;
    c = c ? c : ' ';
    var i = 0;
    var val = 0;
    for (; this.charAt(i) == c && i < this.length; i++);
    return this.substring(i);
};

String.prototype.trimEnd = function (c) {
    c = c ? c : ' ';
    var i = this.length - 1;
    for (; i >= 0 && this.charAt(i) == c; i--);
    return this.substring(0, i + 1);
};

String.prototype.trim = function (c) {
    return this.trimStart(c).trimEnd(c);
};

String.prototype.leadingUpper = function () {
    var result = "";
    if (this.length > 0) {
        result += this[0].toUpperCase();
        if (this.length > 1)
            result += this.substring(1, this.length);
    }
    return result;
};

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

String.prototype.isEmpty = function () {
    if (!this.match(/\S/)) {
        return true;
    }
    if (this == "&nbsp;") {
        return true;
    }
    return false;
};

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

function IsInCollection(stringVal, array) {
    return (GT.jQuery.inArray(stringVal, array) > -1);
};