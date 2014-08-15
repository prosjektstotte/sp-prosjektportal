using System;
using System.Collections.Generic;
using System.Net;
using Glittertind.Sherpa.Library.Features.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.Features
{
    public class FeatureManager : IFeatureManager
    {
        private readonly Uri _urlToSite;
        private readonly ICredentials _credentials;
        private readonly List<GtFeatureActivation> _featureActivations;

        public FeatureManager(Uri urlToSite, ICredentials credentials, IPersistanceProvider<List<GtFeatureActivation>> featurePersistanceProvider)
        {
            _urlToSite = urlToSite;
            _credentials = credentials;
            _featureActivations = featurePersistanceProvider.Load();
        }
        public void ActivateFeatures()
        {
            foreach (var featureActivation in _featureActivations)
            {
                ActivateFeature(featureActivation);
            }
        }

        public void ReActivateFeaturesAfterUpgrade()
        {
            foreach (GtFeatureActivation featureActivation in _featureActivations)
            {
                if (!featureActivation.ReactivateOnUpgrade) continue;

                var absoluteUrlToFeatureActivationScope = GetUrlToFeatureActivationScope(featureActivation.Url);
                using (var clientContext = new ClientContext(absoluteUrlToFeatureActivationScope))
                {
                    clientContext.Credentials = _credentials;

                    switch (featureActivation.Scope)
                    {
                        case FeatureDefinitionScope.Web:
                        {
                            var web = clientContext.Web;
                            var featureCollection = web.Features;
                            DeActivateFeatureInCollection(clientContext, featureActivation, featureCollection);
                            ActivateFeatureInCollection(clientContext, featureActivation, featureCollection);

                            break;
                        }
                        case FeatureDefinitionScope.Site:
                        {
                            var siteCollection = clientContext.Site;
                            var featureCollection = siteCollection.Features;
                            DeActivateFeatureInCollection(clientContext, featureActivation, featureCollection);
                            ActivateFeatureInCollection(clientContext, featureActivation, featureCollection);

                            break;
                        }
                    }
                }
            }
        }

        private void ActivateFeature(GtFeatureActivation featureActivation)
        {
            var absoluteUrlToFeatureActivationScope = GetUrlToFeatureActivationScope(featureActivation.Url);
            using (var clientContext = new ClientContext(absoluteUrlToFeatureActivationScope))
            {
                clientContext.Credentials = _credentials;

                switch (featureActivation.Scope)
                {
                    case FeatureDefinitionScope.Web:
                    {
                        var web = clientContext.Web;
                        var featureCollection = web.Features;
                        ActivateFeatureInCollection(clientContext, featureActivation, featureCollection);

                        break;
                    }
                    case FeatureDefinitionScope.Site:
                    {
                        var siteCollection = clientContext.Site;
                        var featureCollection = siteCollection.Features;
                        ActivateFeatureInCollection(clientContext, featureActivation, featureCollection);

                        break;
                    }
                }
            }
        }

        private static void ActivateFeatureInCollection(ClientContext clientContext, GtFeatureActivation featureActivation, FeatureCollection featureCollection)
        {
            clientContext.Load(featureCollection);
            clientContext.ExecuteQuery();

            var feature = featureCollection.GetById(featureActivation.FeatureId);
            clientContext.Load(feature);
            clientContext.ExecuteQuery();

            if (feature.ServerObjectIsNull != null && (bool)feature.ServerObjectIsNull)
            {
                Console.WriteLine("Activating feature " + featureActivation.FeatureName);
                featureCollection.Add(featureActivation.FeatureId, true, FeatureDefinitionScope.Site);
                clientContext.ExecuteQuery();
            }
        }

        private static void DeActivateFeatureInCollection(ClientContext clientContext, GtFeatureActivation featureActivation, FeatureCollection featureCollection)
        {
            clientContext.Load(featureCollection);
            clientContext.ExecuteQuery();

            var feature = featureCollection.GetById(featureActivation.FeatureId);
            clientContext.Load(feature);
            clientContext.ExecuteQuery();

            if (feature.ServerObjectIsNull != null && !(bool)feature.ServerObjectIsNull)
            {
                Console.WriteLine("Deactivating feature " + featureActivation.FeatureName);
                featureCollection.Remove(featureActivation.FeatureId, true);
                clientContext.ExecuteQuery();
            }
        }
    }
}
