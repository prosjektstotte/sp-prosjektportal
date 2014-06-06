using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.ContentTypes
{
    interface IContentTypeManager
    {
        void CreateContentType(ClientContext cc, Web web);
        void CreateSiteColumn(ClientContext cc, Web web);
        void AddSiteColumnToContentType(ClientContext cc, Web web);
    }
}
