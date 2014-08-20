/* Denne filen er knyttet til en HTML-fil med samme navn, og henter innhold fra den. Du kan ikke flytte, slette, gi nytt navn til eller gjør andre endringer i denne filen før tilknytningen mellom filene er fjernet. */

function DisplayTemplate_bd704d93659848be8fb9a9f9f8feb496(ctx) {
  var ms_outHtml=[];
  var cachePreviousTemplateData = ctx['DisplayTemplateData'];
  ctx['DisplayTemplateData'] = new Object();
  DisplayTemplate_bd704d93659848be8fb9a9f9f8feb496.DisplayTemplateData = ctx['DisplayTemplateData'];

  ctx['DisplayTemplateData']['TemplateUrl']='~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Control_Table_Erfaringslogg.js';
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

var ListRenderRenderWrapper = function(itemRenderResult, inCtx, tpl)
{
    var iStr = [];
    iStr.push('<tr>');
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
,'				<th>Prosjekt</th>'
,'				<th>Beskrivelse</th>'
,'				<th>Ansvarlig</th>'
,'				<th>Konsekvens</th>'
,'				<th>Anbefaling</th>'
,'				<th>Akt&#248;rer</th>'
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
function RegisterTemplate_bd704d93659848be8fb9a9f9f8feb496() {

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("Control_List", DisplayTemplate_bd704d93659848be8fb9a9f9f8feb496);
}

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Control_Table_Erfaringslogg.js", DisplayTemplate_bd704d93659848be8fb9a9f9f8feb496);
}
//
    //
}
RegisterTemplate_bd704d93659848be8fb9a9f9f8feb496();
if (typeof(RegisterModuleInit) == "function" && typeof(Srch.U.replaceUrlTokens) == "function") {
  RegisterModuleInit(Srch.U.replaceUrlTokens("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Control_Table_Erfaringslogg.js"), RegisterTemplate_bd704d93659848be8fb9a9f9f8feb496);
}