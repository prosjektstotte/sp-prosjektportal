using System;

namespace Glittertind.Sherpa.Library.ContentTypes.Model
{
    public class GtSiteColumn
    {
        public Guid ID { get; set; }
        public string InternalName { get; set; }
        public string DisplayName { get; set; }
        public string Description { get; set; }
        public string Group { get; set; }
        public string Type { get; set; }

        public GtSiteColumn()
        {
            Group = "Glittertind Områdekolonner";
        }

        public string GetFieldAsXml()
        {
            return
                String.Format(
                    @"<Field ID='{0}' Name='{1}' DisplayName='{2}' Type='{3}' Hidden='False' Group='{4}' Description='{5}' />",
                    ID, InternalName, DisplayName, Type, Group, Description);
        }
    }
}
