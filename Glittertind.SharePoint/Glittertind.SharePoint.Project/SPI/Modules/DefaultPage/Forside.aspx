<%@ Page language="C#" masterpagefile="~masterurl/default.master" inherits="Microsoft.SharePoint.WebPartPages.WebPartPage,Microsoft.SharePoint,Version=15.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="Taxonomy" Namespace="Microsoft.SharePoint.Taxonomy" Assembly="Microsoft.SharePoint.Taxonomy, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">
    <sharepoint:encodedliteral runat="server" text="<%$Resources:wss,multipages_homelink_text%>" encodemethod="HtmlEncode" />
    -
    <sharepoint:projectproperty property="Title" runat="server" />
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderPageImage" runat="server"><img src="/_layouts/15/images/blank.gif?rev=23" width='1' height='1' alt="" /></asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    <SharePoint:ProjectProperty Property="Title" runat="server"/>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderTitleAreaClass" runat="server">
    <SharePoint:ProjectProperty Property="Title" runat="server"/>
</asp:Content>
<asp:Content ID="Content5" ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <meta name="CollaborationServer" content="SharePoint Team Web Site" />
    <sharepoint:styleblock runat="server">
        .s4-nothome {
	        display:none;
        }
    </sharepoint:styleblock>
    <sharepoint:scriptblock runat="server">
	    var navBarHelpOverrideKey = "WSSEndUser";
	</sharepoint:scriptblock>
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/jquery-1.11.1.min.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.common.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.project.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.project.setup.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:CssRegistration Name="&lt;% $SPUrl:~sitecollection/SiteAssets/gt/css/gt.style.css %&gt;" runat="server" ></SharePoint:CssRegistration>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderSearchArea" runat="server">
	<SharePoint:DelegateControl runat="server" ControlId="SmallSearchInputBox" />
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderLeftActions" runat="server" />
<asp:Content ContentPlaceHolderID="PlaceHolderPageDescription" runat="server" />
<asp:Content ID="Content9" ContentPlaceHolderID="PlaceHolderBodyAreaClass" runat="server">
    <sharepoint:styleblock runat="server">
        .ms-bodyareaframe {
	        padding: 0px;
        }
    </sharepoint:styleblock>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
    <style type="text/css">
        .ms-WPBorder {
            border: none;
        }
    </style>
    <table class="projectFrontPage" width="100%" cellpadding="0" cellspacing="0" style="padding: 5px 10px 10px 10px;">
	    <tr>
		    <td valign="top" width="70%">
		        <div class="projectPhaseSection">
		            <h2 style="text-align:justify;" class="ms-webpart-titleText gt-phaseHeading"><nobr><span>Prosjektets faser</span><span id="WebPartCaptionWPQ2"></span></nobr></h2>
                    <a id="changeProjectPhaseLink" href="javascript:void(0);">Endre fase</a>
		            <ul class="projectPhases"></ul>
		        </div>
			    <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" Title="<%$Resources:cms,WebPartZoneTitle_Left%>" ID="LeftColumn" Orientation="Vertical" />
			    &#160;
		    </td>
		    <td>&#160;</td>
		    <td valign="top" width="30%">
		        <div class="rightColumnStatic">
			        <h2 style="text-align:justify;" class="ms-webpart-titleText"><nobr><span>Om prosjektet</span><span id="WebPartCaptionWPQ2"></span></nobr></h2>
                    <div class="projectMetadata">
                        <table>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectNumber" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:TextField FieldName="GtProjectNumber" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectServiceArea" />
                                </td>
                                <td class="fieldValue">
                                    <Taxonomy:TaxonomyFieldControl FieldName="GtProjectServiceArea" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectType" />
                                </td>
                                <td class="fieldValue">
                                    <Taxonomy:TaxonomyFieldControl FieldName="GtProjectType" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr class="GtProjectPhase">
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectPhase" />
                                </td>
                                <td class="fieldValue">
                                    <Taxonomy:TaxonomyFieldControl FieldName="GtProjectPhase" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr class="GtProjectManager">
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectManager" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:UserField FieldName="GtProjectManager" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectOwner" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:UserField FieldName="GtProjectOwner" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtStartDate" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:DateTimeField FieldName="GtStartDate" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtEndDate" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:DateTimeField FieldName="GtEndDate" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtStatusRisk" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:CheckBoxChoiceField FieldName="GtStatusRisk" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtStatusTime" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:CheckBoxChoiceField FieldName="GtStatusTime" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtStatusBudget" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:CheckBoxChoiceField FieldName="GtStatusBudget" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                            <tr class="GtProjectGoals">
                                <td>
                                    <SharePoint:FieldLabel runat="server" FieldName="GtProjectGoals" />
                                </td>
                                <td class="fieldValue">
                                    <SharePoint:NoteField FieldName="GtProjectGoals" ControlMode="Display" runat="server" />
                                </td>
                            </tr>
                        </table>
						<SharePoint:SPSecurityTrimmedControl runat="server" AuthenticationRestrictions="AuthenticatedUsersOnly" Permissions="AddAndCustomizePages" PermissionContext="CurrentItem">
							<div class="missingMetadataWarning">Viktig informasjon om prosjektet er ikke satt. Du bør sette disse egenskapene snarest.</div>
							<a id="editPageMetaLink" class="ms-navedit-editLinksText" href="#"><span class="ms-navedit-editLinksIconWrapper ms-verticalAlignMiddle"><img class="ms-navedit-editLinksIcon" src="/_layouts/15/images/spcommon.png?rev=23"></span>Rediger egenskapene over</a>
						</SharePoint:SPSecurityTrimmedControl>
		            </div>
		        </div>
			    <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" Title="<%$Resources:cms,WebPartZoneTitle_Right%>" ID="RightColumn" Orientation="Vertical" />
			    &#160;
		    </td>
		    <td>&#160;</td>
	    </tr>
    </table>
	<SharePoint:ScriptBlock runat="server">if(typeof(MSOLayout_MakeInvisibleIfEmpty) == "function") {MSOLayout_MakeInvisibleIfEmpty();}</SharePoint:ScriptBlock>
    <script type="text/javascript" language="javascript">
        jQuery(document).ready(function() {
            GT.Project.PopulateProjectPhasePart();
        });
    </script>
    <SharePoint:SPSecurityTrimmedControl runat="server" AuthenticationRestrictions="AuthenticatedUsersOnly" Permissions="AddAndCustomizePages" PermissionContext="CurrentItem">
        <script type="text/javascript">
            jQuery(document).ready(function () {
    	        var editMetaUrl = 'Forms/EditForm.aspx?EditMode=Project&ID=' + _spPageContextInfo.pageItemId;
    	        jQuery('#editPageMetaLink').attr('href', editMetaUrl);

                var editPhaseUrl = editMetaUrl.replace('Project', 'PhaseOnly');
                jQuery('#changeProjectPhaseLink').attr('href', editPhaseUrl);
    	        HandleMissingMetadata();
            });

            function HandleMissingMetadata() {
    	        if (jQuery('.projectFrontPage .projectMetadata table tr.GtProjectPhase td.fieldValue').text().trim() == '' ||
	                jQuery('.projectFrontPage .projectMetadata table tr.GtProjectManager td.fieldValue').text().trim() == '' ||
	                jQuery('.projectFrontPage .projectMetadata table tr.GtProjectGoals td.fieldValue').text().trim() == '') {
	                jQuery('.projectFrontPage .missingMetadataWarning').show();
	                jQuery('#changeProjectPhaseLink').hide();
	            } else {
    	            jQuery('#changeProjectPhaseLink').show();
	            }
            }
        </script>
    </SharePoint:SPSecurityTrimmedControl>
</asp:Content>