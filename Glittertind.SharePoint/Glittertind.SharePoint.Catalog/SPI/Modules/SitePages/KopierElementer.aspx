<%@ Page Language="C#" MasterPageFile="~masterurl/default.master" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint,Version=15.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c" meta:progid="SharePoint.WebPartPage.Document" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">
	<SharePoint:FieldValue ID="PageTitle" FieldName="Title" runat="server"/>
	-
   <SharePoint:projectproperty property="Title" runat="server"/>
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderPageImage" runat="server">
	<img src="/_layouts/15/images/blank.gif?rev=23" width='1' height='1' alt="" /></asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
	<SharePoint:FieldValue ID="FieldValue2" FieldName="Title" runat="server"/>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderTitleAreaClass" runat="server">
	<SharePoint:FieldValue ID="FieldValue1" FieldName="Title" runat="server"/>
</asp:Content>
<asp:Content ID="Content5" ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
	<SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/jquery-1.11.1.min.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
	<SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.generics.js?rev=20160826" runat="server" Language="javascript" ></SharePoint:ScriptLink>
	<SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.common.js?rev=20160826" runat="server" Language="javascript" ></SharePoint:ScriptLink>
	<SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.provisioning.js?rev=20160826" runat="server" Language="javascript" ></SharePoint:ScriptLink>
	<SharePoint:CssRegistration Name="&lt;% $SPUrl:~sitecollection/SiteAssets/gt/css/gt.style.css?rev=20160826 %&gt;" runat="server" ></SharePoint:CssRegistration>
	<SharePoint:CssRegistration Name="&lt;% $SPUrl:~sitecollection/SiteAssets/gt/css/fabric.min.css %&gt;" runat="server" ></SharePoint:CssRegistration>
	<SharePoint:CssRegistration Name="&lt;% $SPUrl:~sitecollection/SiteAssets/gt/css/fabric.components.min.css %&gt;" runat="server" ></SharePoint:CssRegistration>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderSearchArea" runat="server">
	<SharePoint:DelegateControl runat="server" ControlId="SmallSearchInputBox"/>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderLeftActions" runat="server" />
<asp:Content ContentPlaceHolderID="PlaceHolderPageDescription" runat="server" >
</asp:Content>
<asp:Content ID="Content9" ContentPlaceHolderID="PlaceHolderBodyAreaClass" runat="server">
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
	<div id="gtcopylistelements">
		<div class="gtelementform">
		    <div class="validationMessage" style="display:none;">Denne siden kan ikke besøkes direkte, kun via et prosjektområde.</div>
            <div class="gtinfomessage">Viser elementer fra valgt liste som du kan kopiere ned til prosjektet ditt.</div>
            <div class="gtbuttons">
			    <button type="button" class="ms-Button ms-Button--primary" onclick="GT.Provisioning.CopyListElements(); return false;"><span class="ms-Button-label">Hent valgte elementer</span></button>
                <button type="button" class="ms-Button" onclick="GT.Provisioning.AbortCopyListElements(); return false;"><span class="ms-Button-label">Avbryt og gå tilbake</span></button>
            </div>
            <table class="gtelements">
            </table>
            <div class="gtbuttons">
			    <button type="button" class="ms-Button ms-Button--primary" onclick="GT.Provisioning.CopyListElements(); return false;"><span class="ms-Button-label">Hent valgte elementer</span></button>
                <button type="button" class="ms-Button" onclick="GT.Provisioning.AbortCopyListElements(); return false;"><span class="ms-Button-label">Avbryt og gå tilbake</span></button>
            </div>
		</div>
	</div>
	<script type="text/javascript">
	    GT.jQuery(document).ready(function () {
	        GT.Provisioning.InitalizeCopyElementsPage();
		});
	</script>
</asp:Content>
