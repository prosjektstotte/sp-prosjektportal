var GT = GT || {};
GT.Project = GT.Project || {};

GT.Project.ChangePhase = function () {
    alert('not implemented');
};

GT.Project.PopulateProjectPhasePart = function () {
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        jQuery.when(GT.Common.GetPhaseFromCurrentItem()).then(function (phaseName) {
            var phases = ['Konsept', 'Planlegge', 'Gjennomføre', 'Avslutte', 'Realisere'];
            for (var ix = 0; ix < phases.length; ix++) {
                jQuery('.projectPhases').append(GT.Common.GetPhaseLogoMarkup(phases[ix], phases[ix] == phaseName, true));
            }
        });
    });
};