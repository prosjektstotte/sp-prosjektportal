<%@ Page language="C#" MasterPageFile="~masterurl/default.master"    Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage,Microsoft.SharePoint,Version=15.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c"  %> <%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Import Namespace="Microsoft.SharePoint" %> <%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<asp:Content ContentPlaceHolderId="PlaceHolderPageTitle" runat="server">
	<SharePoint:EncodedLiteral runat="server" text="<%$Resources:wss,multipages_homelink_text%>" EncodeMethod="HtmlEncode"/> - <SharePoint:ProjectProperty Property="Title" runat="server"/>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderPageImage" runat="server"><img src="/_layouts/15/images/blank.gif?rev=23" width='1' height='1' alt="" /></asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderPageTitleInTitleArea" runat="server">
		 <label class="ms-hidden"><SharePoint:ProjectProperty Property="Title" runat="server"/></label>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderTitleAreaClass" runat="server">
<SharePoint:UIVersionedContent runat="server" UIVersion="<=3">
	<ContentTemplate>
		<style type="text/css">
		td.ms-titleareaframe, .ms-pagetitleareaframe {
			height: 10px;
		}
		div.ms-titleareaframe {
			height: 100%;
		}
		.ms-pagetitleareaframe table {
			background: none;
			height: 10px;
		}
		</style>
	</ContentTemplate>
</SharePoint:UIVersionedContent>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderAdditionalPageHead" runat="server">
	<meta name="CollaborationServer" content="SharePoint Team Web Site" />
<SharePoint:StyleBlock runat="server">
.s4-nothome {
	display:none;
}
</SharePoint:StyleBlock>
	<SharePoint:ScriptBlock runat="server">
	var navBarHelpOverrideKey = "WSSEndUser";
	</SharePoint:ScriptBlock>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderSearchArea" runat="server">
	<SharePoint:DelegateControl runat="server"
		ControlId="SmallSearchInputBox" />
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderLeftActions" runat="server" />
<asp:Content ContentPlaceHolderId="PlaceHolderPageDescription" runat="server"/>
<asp:Content ContentPlaceHolderId="PlaceHolderBodyAreaClass" runat="server">
<SharePoint:StyleBlock runat="server">
.ms-bodyareaframe {
	padding: 0px;
}
</SharePoint:StyleBlock>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderMain" runat="server">
	<table cellspacing="0" border="0" width="100%">
	  <tr class="s4-die">
	   <td class="ms-pagebreadcrumb">
		  <asp:SiteMapPath SiteMapProvider="SPContentMapProvider" id="ContentMap" SkipLinkText="" NodeStyle-CssClass="ms-sitemapdirectional" runat="server"/>
	   </td>
	  </tr>
	  <tr>
	   <td class="ms-webpartpagedescription"><SharePoint:ProjectProperty Property="Description" runat="server"/></td>
	  </tr>
	  <tr>
		<td>
		 <table width="100%" cellpadding="0" cellspacing="0" style="padding: 5px 10px 10px 10px;">
		  <tr>
		   <td valign="top" width="70%">
			   <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="Left" Title="loc:Left" />
			   &#160;
		   </td>
		   <td>&#160;</td>
		   <td valign="top" width="30%">
			   <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="Right" Title="loc:Right" />
			   &#160;
		   </td>
		   <td>&#160;</td>
		  </tr>
		 </table>
		</td>
	  </tr>
	</table>
</asp:Content>
