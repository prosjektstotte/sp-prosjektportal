<%@ Page Language="C#" MasterPageFile="~masterurl/default.master" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint,Version=15.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c" meta:webpartpageexpansion="full" meta:progid="SharePoint.WebPartPage.Document" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">
    <SharePoint:encodedliteral runat="server" text="<%$Resources:wss,multipages_homelink_text%>" encodemethod="HtmlEncode"/>
    -
   <SharePoint:projectproperty property="Title" runat="server"/>
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderPageImage" runat="server">
	<img src="/_layouts/15/images/blank.gif?rev=23" width='1' height='1' alt="" /></asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
	<SharePoint:ProjectProperty Property="Title" runat="server"/>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderTitleAreaClass" runat="server">
	<SharePoint:ProjectProperty Property="Title" runat="server"/>
</asp:Content>
<asp:Content ID="Content5" ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/javascript/jquery-2.1.1.min.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/javascript/gt.provisioning.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:CssRegistration Name="&lt;% $SPUrl:~sitecollection/SiteAssets/css/gt.style.css %&gt;" runat="server" ></SharePoint:CssRegistration>
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
	<div class="newProjectPage">
		<h1>Opprett nytt prosjektområde</h1>
	    <div class="projectInputForm">
	        <label for="projectNameInput">Navn <span>*</span></label>
            <input id="projectNameInput" type="text" placeholder="Prosjektets navn" autofocus required />
	        <label for="projectUrlInput">URL-kortnavn <span>*</span></label>
            <input id="projectUrlInput" type="text" placeholder="Kortnavn som brukes i URL" required pattern="[a-zA-Z-\d]{3,20}" />
			<div id="projectUrlInputValidation" class="validationMessage" style="display:none">URL-kortnavnet kan bare inneholde bokstaver (utenom æøå), tall og bindestrek og må være mellom 3 og 20 tegn langt.</div>
	        <label for="projectDescriptionInput">Beskrivelse</label>
            <textarea id="projectDescriptionInput" type="text" placeholder="Beskrivelse av prosjektområdet"></textarea>
	        <div id="projectFormValidation" class="validationMessage"></div>
	        <button id="createProjectBtn" onclick="GT.Provisioning.CreateWebFromCustomForm(); return false;">Opprett prosjektområde</button>
	    </div>
    </div>
	<script type="text/javascript">
	    document.getElementById('projectUrlInput').addEventListener('change', function (event) {
	        if (event.target.validity.valid) {
	            document.getElementById('projectUrlInputValidation').style.display = 'none';
	        } else {
	            document.getElementById('projectUrlInputValidation').style.display = 'block';
	        }
	    }, false);
	</script>
</asp:Content>