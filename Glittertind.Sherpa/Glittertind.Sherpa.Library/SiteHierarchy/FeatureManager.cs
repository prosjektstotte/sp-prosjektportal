using System;
using System.Collections.Generic;
using Glittertind.Sherpa.Library.SiteHierarchy.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.SiteHierarchy
{
    public class FeatureManager
    {
        public void ActivateFeatures(ClientContext clientContext, Web web, List<GtFeature> siteFeatures, List<GtFeature> webFeatures)
        {
            foreach (var featureActivation in siteFeatures)
            {
                ActivateFeature(clientContext, web, featureActivation, FeatureDefinitionScope.Site);
            }
            foreach (var featureActivation in webFeatures)
            {
                ActivateFeature(clientContext, web, featureActivation, FeatureDefinitionScope.Web);
            }
        }

        private void ActivateFeature(ClientContext clientContext, Web web, GtFeature feature, FeatureDefinitionScope featureScope)
        {
            switch (featureScope)
            {
                case FeatureDefinitionScope.Web:
                {
                    var featureCollection = web.Features;
                    if (feature.ReactivateAlways) DeActivateFeatureInCollection(clientContext, feature, featureCollection);
                    ActivateFeatureInCollection(clientContext, feature, featureCollection);
                    break;
                }
                case FeatureDefinitionScope.Site:
                {
                    var siteCollection = clientContext.Site;
                    var featureCollection = siteCollection.Features;
                    if (feature.ReactivateAlways) DeActivateFeatureInCollection(clientContext, feature, featureCollection);
                    ActivateFeatureInCollection(clientContext, feature, featureCollection);

                    break;
                }
            }
        }

        private static void ActivateFeatureInCollection(ClientContext clientContext, GtFeature featureInfo, FeatureCollection featureCollection)
        {
            clientContext.Load(featureCollection);
            clientContext.ExecuteQuery();

            var feature = featureCollection.GetById(featureInfo.FeatureId);
            clientContext.Load(feature);
            clientContext.ExecuteQuery();

            if (feature.ServerObjectIsNull != null && (bool)feature.ServerObjectIsNull)
            {
                Console.WriteLine("Activating feature " + featureInfo.FeatureName);
                featureCollection.Add(featureInfo.FeatureId, true, FeatureDefinitionScope.Site);
                clientContext.ExecuteQuery();
            }
        }

        private static void DeActivateFeatureInCollection(ClientContext clientContext, GtFeature featureInfo, FeatureCollection featureCollection)
        {
            clientContext.Load(featureCollection);
            clientContext.ExecuteQuery();

            var feature = featureCollection.GetById(featureInfo.FeatureId);
            clientContext.Load(feature);
            clientContext.ExecuteQuery();

            if (feature.ServerObjectIsNull != null && !(bool)feature.ServerObjectIsNull)
            {
                Console.WriteLine("Deactivating feature " + featureInfo.FeatureName);
                featureCollection.Remove(featureInfo.FeatureId, true);
                clientContext.ExecuteQuery();
            }
        }
    }
}
