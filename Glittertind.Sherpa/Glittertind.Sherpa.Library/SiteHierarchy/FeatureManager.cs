using System;
using System.Collections.Generic;
using System.Net;
using Glittertind.Sherpa.Library.SiteHierarchy.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.SiteHierarchy
{
    public class FeatureManager
    {
        public void ActivateFeatures(ClientContext clientContext, List<GtFeature> siteFeatures, List<GtFeature> webFeatures)
        {
            if (siteFeatures != null)
            {
                foreach (var featureActivation in siteFeatures)
                {
                    ActivateFeature(clientContext, clientContext.Web, featureActivation, FeatureDefinitionScope.Site);
                }
            }
            if (webFeatures != null)
            {
                foreach (var featureActivation in webFeatures)
                {
                    ActivateFeature(clientContext, clientContext.Web, featureActivation, FeatureDefinitionScope.Web);
                }
            }
        }

        private void ActivateFeature(ClientContext clientContext, Web web, GtFeature feature, FeatureDefinitionScope featureScope)
        {
            //TODO: REMOVE THIS LINE. For testing purposes only
            if (feature.FeatureName.StartsWith("Glittertind")) return;

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

            if (!DoesFeatureExistInCollection(featureCollection, featureInfo.FeatureId))
            {
                Console.WriteLine("Activating feature " + featureInfo.FeatureName);
                // FeaturedefinitionScope.None is the way to go for any feature. http://stackoverflow.com/questions/17803291/failing-to-activate-a-feature-using-com-in-sharepoint-2010
                featureCollection.Add(featureInfo.FeatureId, true, FeatureDefinitionScope.None);
                clientContext.ExecuteQuery();
            }
        }

        private static void DeActivateFeatureInCollection(ClientContext clientContext, GtFeature featureInfo, FeatureCollection featureCollection)
        {
            clientContext.Load(featureCollection);
            clientContext.ExecuteQuery();

            if (DoesFeatureExistInCollection(featureCollection, featureInfo.FeatureId))
            {
                Console.WriteLine("Deactivating feature " + featureInfo.FeatureName);
                featureCollection.Remove(featureInfo.FeatureId, true);
                clientContext.ExecuteQuery();
            }
        }

        private static bool DoesFeatureExistInCollection(FeatureCollection featureCollection, Guid featureId)
        {
            var featureEnumerator = featureCollection.GetEnumerator();
            while (featureEnumerator.MoveNext())
            {
                if (featureEnumerator.Current.DefinitionId.Equals(featureId))
                {
                    return true;
                }
            }
            return false;
        }
    }
}
