using System.Collections.Generic;
using Glittertind.Sherpa.Library.Features.Model;

namespace Glittertind.Sherpa.Library.SiteHierarchy.Model
{
    class GtWeb
    {
        public string Name { get; set; }
        public string Url { get; set; }
        public string Template { get; set; }
        public string Description { get; set; }
        public List<GtWeb> Webs { get; set; }
        public List<GtFeatureActivation> SiteFeatures { get; set; }
        public List<GtFeatureActivation> WebFeatures { get; set; }
    }
}
