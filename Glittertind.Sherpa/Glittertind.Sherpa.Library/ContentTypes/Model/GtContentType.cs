using System;
using System.Collections.Generic;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.ContentTypes.Model
{
    public class GtContentType
    {
        public string ID { get; set; }
        public string InternalName { get; set; }
        public string DisplayName { get; set; }
        public string Description { get; set; }
        public string Group { get; set; }
        public List<string> SiteColumnsInternalNames { get; set; }

        public GtContentType()
        {
            Group = "Glittertind Innholdstyper";
        }

        public ContentTypeCreationInformation GetContentTypeCreationInformation()
        {
            return new ContentTypeCreationInformation
            {
                Name = InternalName,
                Id = DisplayName,
                Group = Group
            };
        }
    }
}
