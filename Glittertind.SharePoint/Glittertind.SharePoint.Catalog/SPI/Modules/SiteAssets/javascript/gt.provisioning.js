var GT = GT || {};
GT.Provisioning = GT.Provisioning || {};

GT.Provisioning.CreateWebFromCustomForm = function () {
	console.log('Creating web from form yo');

	event.preventDefault();
    GT.Provisioning.CreateWeb();
};

GT.Provisioning.CreateWeb = function(name, urlName, description, language, webtemplate) {
    console.log('Creating web');
};