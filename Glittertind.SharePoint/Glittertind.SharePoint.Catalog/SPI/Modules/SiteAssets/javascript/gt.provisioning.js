var GT = GT || {};
GT.Provisioning = GT.Provisioning || {};

GT.Provisioning.CreateWebFromCustomForm = function () {
	event.preventDefault();
	var name = document.getElementById('projectNameInput').value;
	var url = document.getElementById('projectUrlInput').value;
	var desc = document.getElementById('projectDescriptionInput').value;

	if (!name || !url) {
		document.getElementById('projectValidation').innerHTML = "<div>Navn og URL er obligatoriske felter</div>";
		return;
	}
	GT.Provisioning.CreateWeb(name, url, desc);
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
	clientContext.executeQueryAsync(Function.createDelegate(this, function () {
		var newUrl = this.newWeb.get_url()
		console.log(newUrl);
		//1. Stop long running operation
		//2. Close modal dialog (if existing)
		//3. Redirect to new site's '_layouts/15/permsetup.aspx?HideCancel=1'
	}
	), Function.createDelegate(this, function () {
		console.log('fail');
		//1. Stop long running operation
		//2. Show error message
	}));
}
