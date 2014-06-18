using System.Collections.Generic;
using System.Net;
using Glittertind.Sherpa.Library.Features.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.Features
{
    public class FeatureManager : IFeatureManager
    {
        private readonly string _urlToSite;
        private readonly ICredentials _credentials;
        private readonly List<GtFeatureActivation> _featureActivations;

        public FeatureManager(string urlToSite, ICredentials credentials, IPersistanceProvider<List<GtFeatureActivation>> featurePersistanceProvider)
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

        private void ActivateFeature(GtFeatureActivation featureActivation)
        {
            var absoluteUrlToFeatureActivationScope = GetUrlToFeatureActivationScope(featureActivation.Url);
            using (var clientContext = new ClientContext(absoluteUrlToFeatureActivationScope)
            {
                AuthenticationMode = ClientAuthenticationMode.Default,
                Credentials = _credentials
            })
            {

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

            if (feature.ServerObjectIsNull != null && (bool) feature.ServerObjectIsNull)
            {
                featureCollection.Add(featureActivation.FeatureId, false, FeatureDefinitionScope.None);
                clientContext.ExecuteQuery();
            }
        }

        private string GetUrlToFeatureActivationScope(string relativeOrAbsoluteUrl)
        {
            if (relativeOrAbsoluteUrl.StartsWith("/"))
                return UriUtilities.CombineAbsoluteUri(_urlToSite, relativeOrAbsoluteUrl);
            return relativeOrAbsoluteUrl;
        }
    }
}
