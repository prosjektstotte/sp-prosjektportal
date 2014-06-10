using System.Collections.Generic;
using Glittertind.Sherpa.Library.ContentTypes.Model;

namespace Glittertind.Sherpa.Library.ContentTypes
{
    interface IContentTypeManager
    {
        void CreateContentTypes(List<GtContentType> contentTypes);
        void CreateSiteColumns(List<GtField> fields);
    }
}
