using System.Collections.Generic;

namespace Glittertind.Sherpa.Library.SiteHierarchy.Model
{
    public class GtWeb
    {
        public string Name { get; set; }
        public string Url { get; set; }
        public string Template { get; set; }
        public string Description { get; set; }
        public int Language { get; set; }
        public List<GtWeb> Webs { get; set; }
        public List<GtFeature> SiteFeatures { get; set; }
        public List<GtFeature> WebFeatures { get; set; }
        public Dictionary<string, string> Quicklaunch { get; set; }
    }
}
