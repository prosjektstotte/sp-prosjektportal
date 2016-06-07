/* Denne filen er knyttet til en HTML-fil med samme navn, og henter innhold fra den. Du kan ikke flytte, slette, gi nytt navn til eller gjør andre endringer i denne filen før tilknytningen mellom filene er fjernet. */

function DisplayTemplate_7d5e6d851c064998bcbb7baf0cbf1bff(ctx) {
  var ms_outHtml=[];
  var cachePreviousTemplateData = ctx['DisplayTemplateData'];
  ctx['DisplayTemplateData'] = new Object();
  DisplayTemplate_7d5e6d851c064998bcbb7baf0cbf1bff.DisplayTemplateData = ctx['DisplayTemplateData'];

  ctx['DisplayTemplateData']['TemplateUrl']='~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Item_NewProject.js';
  ctx['DisplayTemplateData']['TemplateType']='Item';
  ctx['DisplayTemplateData']['TargetControlType']=['Content Web Parts', 'SearchResults'];
  this.DisplayTemplateData = ctx['DisplayTemplateData'];

  ctx['DisplayTemplateData']['ManagedPropertyMapping']={'Path':['Path'], 'Title':['Title'], 'ProjectManager':['GtProjectManagerOWSUSER'], 'ProjectOwner':['GtProjectOwnerOWSUSER'], 'ProjectPhase':['owstaxIdGtProjectPhase'], 'Created':['Created']};
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
var projectPhase = $getItemValue(ctx, "ProjectPhase");
var created = new Date($getItemValue(ctx, "Created").inputValue).format("dd MMM yyyy");
var createdTime = new Date($getItemValue(ctx, "Created").inputValue).format("dd MMM yyyy kl HH:mm:ss");
ms_outHtml.push(''
,'             <div class="new gt-projectItem" title="Opprettet den ', createdTime ,'">'
,'                <h2><a href="', url ,'">', title ,'</a></h2> <span>', created ,'</span>'
,'            </div>'
,'    '
);

  ctx['ItemValues'] = cachePreviousItemValuesFunction;
  ctx['DisplayTemplateData'] = cachePreviousTemplateData;
  return ms_outHtml.join('');
}
function RegisterTemplate_7d5e6d851c064998bcbb7baf0cbf1bff() {

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("TwoLines", DisplayTemplate_7d5e6d851c064998bcbb7baf0cbf1bff);
}

if ("undefined" != typeof (Srch) &&"undefined" != typeof (Srch.U) &&typeof(Srch.U.registerRenderTemplateByName) == "function") {
  Srch.U.registerRenderTemplateByName("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Item_NewProject.js", DisplayTemplate_7d5e6d851c064998bcbb7baf0cbf1bff);
}
//

    //
}
RegisterTemplate_7d5e6d851c064998bcbb7baf0cbf1bff();
if (typeof(RegisterModuleInit) == "function" && typeof(Srch.U.replaceUrlTokens) == "function") {
  RegisterModuleInit(Srch.U.replaceUrlTokens("~sitecollection\u002f_catalogs\u002fmasterpage\u002fDisplay Templates\u002fSearch\u002fGlittertind_Item_NewProject.js"), RegisterTemplate_7d5e6d851c064998bcbb7baf0cbf1bff);
}