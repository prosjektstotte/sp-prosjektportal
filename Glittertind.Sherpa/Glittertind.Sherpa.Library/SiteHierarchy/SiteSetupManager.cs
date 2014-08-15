using System;
using System.Linq;
using System.Net;
using Glittertind.Sherpa.Library.SiteHierarchy.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.SiteHierarchy
{
    public class SiteSetupManager : ISiteSetupManager
    {
        private readonly Uri _urlToSite;
        private readonly ICredentials _credentials;
        private readonly GtWeb _configurationWeb;
        private FeatureManager FeatureManager { get; set; }
        private QuicklaunchManager QuicklaunchManager { get; set; }

        public SiteSetupManager(Uri urlToSite, ICredentials credentials, GtWeb configurationWeb)
        {
            _urlToSite = urlToSite;
            _credentials = credentials;
            _configurationWeb = configurationWeb;

            FeatureManager = new FeatureManager();
            QuicklaunchManager = new QuicklaunchManager();
        }
        public void SetupSites()
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
        private void EnsureAndConfigureWebAndActivateFeatures(ClientContext context, GtWeb configWeb)
        {
            Web webToConfigure = null;
            if (IsRootweb(configWeb))
            {
                //We assume that the root web always exists
                webToConfigure = context.Site.RootWeb;
            }
            else if (!WebExists(context, configWeb.Url))
            {
                //This _should_ open the parent and that site _should_ exist if the webs are in correct order
                var parent = context.Site.OpenWeb(configWeb.Url);
                context.Load(parent);
                context.ExecuteQuery();

                webToConfigure = parent.Webs.Add(GetWebCreationInformationFromConfig(configWeb));
                context.ExecuteQuery();
            }

            //FeatureManager.ActivateFeatures(context, webToConfigure, configWeb.SiteFeatures, configWeb.WebFeatures);
            QuicklaunchManager.CreateQuicklaunchNodes(context, webToConfigure, configWeb.Quicklaunch);

            foreach (GtWeb subWeb in configWeb.Webs)
            {
                EnsureAndConfigureWebAndActivateFeatures(context, subWeb);
            }
        }

        private WebCreationInformation GetWebCreationInformationFromConfig(GtWeb configWeb)
        {
            return new WebCreationInformation
                {
                    Title = configWeb.Name,
                    Description = configWeb.Description,
                    Language = configWeb.Language,
                    Url = configWeb.Url,
                    UseSamePermissionsAsParentSite = true,
                    WebTemplate = configWeb.Template
                };
        }

        private static bool IsRootweb(GtWeb configWeb)
        {
            return configWeb.Url == "/";
        }


        private string GetAbsoluteUrl(string relativeOrAbsoluteUrl)
        {
            if (relativeOrAbsoluteUrl.StartsWith("/"))
                return UriUtilities.CombineAbsoluteUri(_urlToSite.AbsoluteUri, relativeOrAbsoluteUrl);
            return relativeOrAbsoluteUrl;
        }

        private bool WebExists(ClientContext context, string webUrl)
        {
            // load up the root web object but only 
            // specifying the sub webs property to avoid 
            // unneeded network traffic
            var web = context.Web;
            context.Load(web, w => w.Webs);
            context.ExecuteQuery();

            // use a simple linq query to get any sub webs with the URL we want to check
            var subWeb = (from w in web.Webs where w.Url == webUrl select w).SingleOrDefault();
            if (subWeb != null)
            {
                // if found true
                return true;
            }
            // default to false...
            return false;
        }
    }
}
