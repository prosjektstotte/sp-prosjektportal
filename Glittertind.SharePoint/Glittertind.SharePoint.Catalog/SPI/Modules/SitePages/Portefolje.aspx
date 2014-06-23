﻿<%@ Page Language="C#" MasterPageFile="~masterurl/default.master" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint,Version=15.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c" %>

<%@ Register TagPrefix="Taxonomy" Namespace="Microsoft.SharePoint.Taxonomy" Assembly="Microsoft.SharePoint.Taxonomy, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">
    <SharePoint:encodedliteral runat="server" text="<%$Resources:wss,multipages_homelink_text%>" encodemethod="HtmlEncode" />
    -
   <SharePoint:projectproperty property="Title" runat="server" />
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderPageImage" runat="server">
    <img src="/_layouts/15/images/blank.gif?rev=23" width='1' height='1' alt="" /></asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    <SharePoint:ProjectProperty Property="Title" runat="server" />
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderTitleAreaClass" runat="server">
    <SharePoint:ProjectProperty Property="Title" runat="server" />
</asp:Content>
<asp:Content ID="Content5" ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
    <SharePoint:ScriptLink Name="~sitecollection/SiteAssets/gt/js/gt.common.js" runat="server" Language="javascript" ></SharePoint:ScriptLink>
    <SharePoint:CssRegistration Name="&lt;% $SPUrl:~sitecollection/SiteAssets/gt/css/gt.style.css %&gt;" runat="server" After="corev15.css" ></SharePoint:CssRegistration>
    <meta name="CollaborationServer" content="SharePoint Team Web Site" />
    <SharePoint:styleblock runat="server">
        .s4-nothome {
            display:none;
        }
    </SharePoint:styleblock>
    <SharePoint:scriptblock runat="server">
        var navBarHelpOverrideKey = "WSSEndUser";
    </SharePoint:scriptblock>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderSearchArea" runat="server">
    <SharePoint:DelegateControl runat="server"
        ControlId="SmallSearchInputBox" />
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderLeftActions" runat="server" />
<asp:Content ContentPlaceHolderID="PlaceHolderPageDescription" runat="server" />
<asp:Content ID="Content9" ContentPlaceHolderID="PlaceHolderBodyAreaClass" runat="server">
    <SharePoint:styleblock runat="server">
.ms-bodyareaframe {
        padding: 0px;
}
</SharePoint:styleblock>
</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">

    <style type="text/css">
        .ms-WPBorder {
            border: none;
        }
    </style>
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 5px 10px 10px 10px;">
        <tr>
            <td valign="top" width="20%">
                <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" Title="<%$Resources:cms,WebPartZoneTitle_Left%>" ID="LeftColumn" Orientation="Vertical" />
                &#160;
            </td>
            <td valign="top" width="60%">
                <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" Title="<%$Resources:cms,WebPartZoneTitle_Center%>" ID="CenterColumn" Orientation="Vertical" />
                &#160;
            </td>
            <td>&#160;</td>
            <td valign="top" width="20%">
                <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" Title="<%$Resources:cms,WebPartZoneTitle_Right%>" ID="RightColumn" Orientation="Vertical" />
                &#160;
            </td>
            <td>&#160;</td>
        </tr>
    </table>

    <SharePoint:ScriptBlock runat="server">if(typeof(MSOLayout_MakeInvisibleIfEmpty) == "function") {MSOLayout_MakeInvisibleIfEmpty();}</SharePoint:ScriptBlock>
    
</asp:Content>
