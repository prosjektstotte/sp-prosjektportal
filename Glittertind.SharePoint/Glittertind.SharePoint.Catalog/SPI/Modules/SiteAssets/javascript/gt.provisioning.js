var GT = GT || {};
GT.Provisioning = GT.Provisioning || {};

function waitMessage() {
	window.parent.eval("window.waitDialog = SP.UI.ModalDialog.showWaitScreenWithNoClose('Oppretter prosjektområde', '', 80, 450);");
}
function closeWaitMessage() {
	if (window.parent.waitDialog != null) {
		window.parent.waitDialog.close();
	}
};

GT.Provisioning.CreateWebFromCustomForm = function () {
	document.getElementById('projectValidation').innerHTML = "";

	var name = document.getElementById('projectNameInput').value;
	var url = document.getElementById('projectUrlInput').value;
	var desc = document.getElementById('projectDescriptionInput').value;

	if (!name || !url) {
		document.getElementById('projectValidation').innerHTML = "Navn og URL er obligatoriske felter";
		return;
	}
	var urlToNewWeb = _spPageContextInfo.webServerRelativeUrl + "/" + url;
	jQuery.when(GT.Provisioning.DoesWebExist(urlToNewWeb)).then(function (doesWebExist) {
		if (doesWebExist) {
			document.getElementById('projectValidation').innerHTML = "Det finnes allerede et område med denne URLen";
		} else {
			waitMessage();
			GT.Provisioning.CreateWeb(name, url, desc);
		}
	});
};

GT.Provisioning.CreateWeb = function (webTitle, webUrl, webDescription) {
	// Just insert your reference to your feature and webtemplate here
	var webTemplate = 'STS#0'; //'{4a110786-9683-4734-97ca-f2eca95ca377}#WTProject';
	var webLanguage = 1044;

	var clientContext = SP.ClientContext.get_current();
	var currentWeb = clientContext.get_web();

	var webCreateInfo = new SP.WebCreationInformation();
	webCreateInfo.set_description(webDescription);
	webCreateInfo.set_language(webLanguage);
	webCreateInfo.set_title(webTitle);
	webCreateInfo.set_url(webUrl);
	webCreateInfo.set_useSamePermissionsAsParentSite(false);
	webCreateInfo.set_webTemplate(webTemplate);

	this.newWeb = currentWeb.get_webs().add(webCreateInfo);
	clientContext.load(this.newWeb);
	clientContext.executeQueryAsync(
		Function.createDelegate(this, GT.Provisioning.OnCreateWebSuccess),
		Function.createDelegate(this, GT.Provisioning.OnCreateWebFailure)
	);
};

GT.Provisioning.OnCreateWebSuccess = function (sender, args) {
	//1. Stop long running operation
	//2. Close modal dialog (if existing)
	//3. Redirect to new site's '_layouts/15/permsetup.aspx?HideCancel=1'
	var newUrl = this.newWeb.get_url()
	GT.Provisioning.ModifyNavigationOfNewWeb(this.newWeb)

	closeWaitMessage();

	var setupPermissionsUrl = newUrl + '/_layouts/15/permsetup.aspx?HideCancel=1';
	window.location.replace(setupPermissionsUrl);
};

GT.Provisioning.OnCreateWebFailure = function (sender, args) {
	closeWaitMessage();
	console.log('En feil oppstod: ' + args.get_message() + '\n' + args.get_stackTrace());
	//1. Stop long running operation
	//2. Show error message
};

GT.Provisioning.ModifyNavigationOfNewWeb = function (web) {
	var clientContext = SP.ClientContext.get_current();
	var navigation = web.get_navigation();
	navigation.set_useShared(true);
	clientContext.executeQueryAsync();
};

GT.Provisioning.DoesWebExist = function (serverRelativeUrlOrFullUrl) {
	var deferred = jQuery.Deferred();
	jQuery.ajax({
		url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/webinfos?$filter=ServerRelativeUrl eq '" + serverRelativeUrlOrFullUrl + "'",
		type: "GET",
		headers: { "Accept": "application/json; odata=verbose" },
		success: function (data) {
			var webs = data.d.results.length;
			if (webs >= 1) {
				deferred.resolve(true);
			} else {
				deferred.resolve(false);
			}
			deferred.promise();
		},
		error: function (jqXHR, textStatus, errorThrown) {
			alert(textStatus);
		}
	});
	return deferred;
};