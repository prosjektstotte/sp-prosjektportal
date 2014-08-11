/* Denne filen er knyttet til en HTML-fil med samme navn, og henter innhold fra den. Du kan ikke flytte, slette, gi nytt navn til eller gjør andre endringer i denne filen før tilknytningen mellom filene er fjernet. */

function DisplayTemplate_938b62db24e346c1a9f5feff8c3d0d8b(ctx) {
  var ms_outHtml=[];
  var cachePreviousTemplateData = ctx['DisplayTemplateData'];
  ctx['DisplayTemplateData'] = new Object();
  DisplayTemplate_938b62db24e346c1a9f5feff8c3d0d8b.DisplayTemplateData = ctx['DisplayTemplateData'];

  ctx['DisplayTemplateData']['TemplateUrl']='~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Item_Project_details.js';
  ctx['DisplayTemplateData']['TemplateType']='Item';
  ctx['DisplayTemplateData']['TargetControlType']=['Content Web Parts', 'SearchResults'];
  this.DisplayTemplateData = ctx['DisplayTemplateData'];

  ctx['DisplayTemplateData']['ManagedPropertyMapping']={'Path':null, 'Title':null, 'ProjectManager':['GtProjectManagerOWSUSER'], 'ProjectOwner':['GtProjectOwnerOWSUSER'], 'ProjectPhase':['owstaxIdGtProjectPhase'], 'Created':null, 'GtProjectGoalsOWSMTXT':null, 'GtStatusTimeOWSCHCS':null, 'GtStatusRiskOWSCHCS':null, 'GtStatusBudgetOWSCHCS':null, 'LastModifiedTime':null};
  var cachePreviousItemValuesFunction = ctx['ItemValues'];
  ctx['ItemValues'] = function(slotOrPropName) {
    return Srch.ValueInfo.getCachedCtxItemValue(ctx, slotOrPropName)
};

ms_outHtml.push('',''
);

var url = $getItemValue(ctx, "Path");
var title = $getItemValue(ctx, "Title");
var projectManager = $getItemValue(ctx, "ProjectManager");
var projectOwner = $getItemValue(ctx, "ProjectOwner");
var projectPhase = $getItemValue(ctx, "ProjectPhase").toString();
var created = new Date($getItemValue(ctx, "Created").inputValue).format("dd MMM yyyy");
var createdTime = new Date($getItemValue(ctx, "Created").inputValue).format("dd MMM yyyy kl HH:mm:ss");
var projectGoals = $getItemValue(ctx, "GtProjectGoalsOWSMTXT").inputValue
var projectGoalsTrimmed = Srch.U.getTrimmedString( projectGoals , 20);
var statusTime = $getItemValue(ctx, "GtStatusTimeOWSCHCS");
var statusRisk = $getItemValue(ctx, "GtStatusRiskOWSCHCS");
var statusBudget = $getItemValue(ctx, "GtStatusBudgetOWSCHCS");
var lastModified = $getItemValue(ctx, "LastModifiedTime");


ms_outHtml.push(''
,'            <td>'
,'				<a href="', url ,'">', title ,'</a>'
,'			</td>'
,'			<td title="', projectGoals ,'">'
,'				', projectGoalsTrimmed ,''
,'			</td>'
,'			<td>'
,'				', projectOwner ,''
,'			</td>'
,'			<td>'
,'				', projectManager ,''
,'			</td>'
,'			<td>'
,'				', statusTime ,''
,'			</td>'
,'			<td>'
,'				', statusRisk ,''
,'			</td>'
,'			<td>'
,'				', statusBudget ,''
,'			</td>'
,'			<td>'
,'				', lastModified ,''
,'			</td>'
,'			<td>'
,'				', projectPhase ,''
,'			</td>			'
,'    '
);

  ctx['ItemValues'] = cachePreviousItemValuesFunction;
  ctx['DisplayTemplateData'] = cachePreviousTemplateData;
  return ms_outHtml.join('');
}
function RegisterTemplate_938b62db24e346c1a9f5feff8c3d0d8b() {

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("TwoLines", DisplayTemplate_938b62db24e346c1a9f5feff8c3d0d8b);
}

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Item_Project_details.js", DisplayTemplate_938b62db24e346c1a9f5feff8c3d0d8b);
}
//

    //
}
RegisterTemplate_938b62db24e346c1a9f5feff8c3d0d8b();
if (typeof(RegisterModuleInit) == "function" && typeof(Srch.U.replaceUrlTokens) == "function") {
  RegisterModuleInit(Srch.U.replaceUrlTokens("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Item_Project_details.js"), RegisterTemplate_938b62db24e346c1a9f5feff8c3d0d8b);
}