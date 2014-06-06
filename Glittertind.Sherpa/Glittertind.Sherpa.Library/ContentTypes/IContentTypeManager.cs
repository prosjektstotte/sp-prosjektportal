using System.Collections.Generic;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.ContentTypes
{
    interface IContentTypeManager
    {
        void CreateContentTypes(ClientContext cc, List<GtContentType> contentTypes);
        void CreateSiteColumns(ClientContext cc, List<GtSiteColumn> contentTypes);
        void AddSiteColumnsToContentType(ClientContext cc, GtContentType configContentType);
    }
}
