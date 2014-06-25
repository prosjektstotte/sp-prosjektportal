using System;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.Features.Model
{
    public class GtFeatureActivation
    {
        public Guid FeatureId { get; set; }
        public string FeatureName { get; set; }
        public FeatureDefinitionScope Scope { get; set; }
        public string Url { get; set; }
        public bool ReactivateOnUpgrade { get; set; }
    }
}
