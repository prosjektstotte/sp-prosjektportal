using System;
using System.Collections.Generic;
using System.Net;
using Glittertind.Sherpa.Library.Features.Model;
using Glittertind.Sherpa.Library.SiteHierarchy.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.SiteHierarchy
{
    class SiteHierarchyManager : ISiteHierarchyManager
    {
        private readonly Uri _urlToSite;
        private readonly ICredentials _credentials;
        private readonly GtWeb _configurationWeb;

        public SiteHierarchyManager(Uri urlToSite, ICredentials credentials, IPersistanceProvider<GtWeb> siteHierarchyPersistanceProvider)
        {
            _urlToSite = urlToSite;
            _credentials = credentials;
            _configurationWeb = siteHierarchyPersistanceProvider.Load();
        }
        public void CreateSitesAndActivateFeatures()
        {
            using (var clientContext = new ClientContext(_urlToSite.AbsoluteUri))
            {
                clientContext.Credentials = _credentials;

                EnsureAndConfigureWebAndActivateFeatures(clientContext, _configurationWeb);
            }
        }

        /// <summary>
        /// Check if web exists at Url
        /// If not, create it
        /// Set properties
        /// Activate SiteCol features
        /// Activate Web Features
        /// Go through subwebs
        /// </summary>
        /// <param name="context"></param>
        /// <param name="web"></param>
        private void EnsureAndConfigureWebAndActivateFeatures(ClientContext context, GtWeb configWeb)
        {
            var subWeb = (from w in web.Webs where w.Title == YourTitle select w).SingleOrDefault();
            if (subWeb != null)
            {
                // if found true
                return true;
            }
        }
        public void ReactivateSelectedFeatures()
        {
            throw new NotImplementedException();
        }

        private string GetAbsoluteUrl(string relativeOrAbsoluteUrl)
        {
            if (relativeOrAbsoluteUrl.StartsWith("/"))
                return UriUtilities.CombineAbsoluteUri(_urlToSite.AbsoluteUri, relativeOrAbsoluteUrl);
            return relativeOrAbsoluteUrl;
        }
    }
}
