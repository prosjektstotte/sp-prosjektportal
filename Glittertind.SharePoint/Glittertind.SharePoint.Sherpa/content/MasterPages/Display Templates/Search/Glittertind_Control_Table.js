/* Denne filen er knyttet til en HTML-fil med samme navn, og henter innhold fra den. Du kan ikke flytte, slette, gi nytt navn til eller gjør andre endringer i denne filen før tilknytningen mellom filene er fjernet. */

function DisplayTemplate_83e2c63a510448eeb5a9b6a183b01866(ctx) {
  var ms_outHtml=[];
  var cachePreviousTemplateData = ctx['DisplayTemplateData'];
  ctx['DisplayTemplateData'] = new Object();
  DisplayTemplate_83e2c63a510448eeb5a9b6a183b01866.DisplayTemplateData = ctx['DisplayTemplateData'];

  ctx['DisplayTemplateData']['TemplateUrl']='~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Control_Table.js';
  ctx['DisplayTemplateData']['TemplateType']='Control';
  ctx['DisplayTemplateData']['TargetControlType']=['Content Web Parts', 'SearchResults'];
  this.DisplayTemplateData = ctx['DisplayTemplateData'];

ms_outHtml.push('',''
,''
); 
if (!$isNull(ctx.ClientControl) &&
    !$isNull(ctx.ClientControl.shouldRenderControl) &&
    !ctx.ClientControl.shouldRenderControl())
{
    return "";
}
ctx.ListDataJSONGroupsKey = "ResultTables";

var noResultsClassName = "ms-srch-result-noResults";

function GetStatusCssClass(status) {
    if (status === undefined || status === null) return 'status-unknown';

    var statusToCheck = status.toLowerCase();

    if (statusToCheck === 'etter plan') return 'status-red';
    else if (statusToCheck === 'forsinket') return 'status-red';
    else if (statusToCheck === 'foran plan') return 'status-green';
    else if (statusToCheck === 'på plan') return 'status-green';
    else if (statusToCheck === 'høy') return 'status-red';
    else if (statusToCheck === 'medium') return 'status-yellow';
    else if (statusToCheck === 'lav') return 'status-green';
    else if (statusToCheck === 'over budsjett') return 'status-red';
    else if (statusToCheck === 'på budsjett') return 'status-green';
    else if (statusToCheck === 'under budsjett') return 'status-green';
    else if (statusToCheck === 'vet ikke') return 'status-yellow';

    return 'status-unknown';
};

var ListRenderRenderWrapper = function(itemRenderResult, inCtx, tpl)
{
    var iStr = [];
    if (inCtx.CurrentItemIdx % 2 === 0) {
        iStr.push('<tr class="ms-HoverBackground-bgColor">');
    } else {
        iStr.push('<tr>');
    }
    iStr.push(itemRenderResult);
    iStr.push('</tr>');
    return iStr.join('');
}
ctx['ItemRenderWrapper'] = ListRenderRenderWrapper;
ms_outHtml.push(''
,'    <table class="gt-result-table">'
,'		<thead>'
,'			<tr>'
,'				<th>Tittel</th>'
,'				<th>Effektm&#229;l</th>'
,'				<th>Prosjekteier</th>'
,'				<th>Prosjektleder</th>'
,'				<th>Status tid</th>'
,'				<th>Status risiko</th>'
, '				<th>Status budsjett</th>'
, '				<th>Fase</th>'
,'				<th>Sist endret</th>'
,'			</tr>'
,'		</thead>'
,'		<tbody>'
,'           ', ctx.RenderGroups(ctx) ,''
,'		 </tbody>'
,'	</table>'
,'	'
,'	'
,'	'
,'	'
);
if (ctx.ClientControl.get_shouldShowNoResultMessage())
{
ms_outHtml.push(''
,'        <div class="', noResultsClassName ,'">Ingen elementer &#229; vise</div>'
);
}
ms_outHtml.push(''
,''
,'    '
);

  ctx['DisplayTemplateData'] = cachePreviousTemplateData;
  return ms_outHtml.join('');
}
function RegisterTemplate_83e2c63a510448eeb5a9b6a183b01866() {

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("Control_List", DisplayTemplate_83e2c63a510448eeb5a9b6a183b01866);
}

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Control_Table.js", DisplayTemplate_83e2c63a510448eeb5a9b6a183b01866);
}
//
    //
}
RegisterTemplate_83e2c63a510448eeb5a9b6a183b01866();
if (typeof(RegisterModuleInit) == "function" && typeof(Srch.U.replaceUrlTokens) == "function") {
  RegisterModuleInit(Srch.U.replaceUrlTokens("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Control_Table.js"), RegisterTemplate_83e2c63a510448eeb5a9b6a183b01866);
}