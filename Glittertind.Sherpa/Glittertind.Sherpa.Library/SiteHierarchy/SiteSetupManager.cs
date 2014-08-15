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

                EnsureAndConfigureWebAndActivateFeatures(clientContext, null, _configurationWeb);
            }
        }

        /// <summary>
        /// Assumptions:
        /// 1. The order of webs and subwebs in the config file follows the structure of SharePoint sites
        /// 2. No config element is present without their parent web already being defined in the config file, except the root web
        /// </summary>
        private void EnsureAndConfigureWebAndActivateFeatures(ClientContext context, Web parentWeb, GtWeb configWeb)
        {
            var webToConfigure = EnsureWeb(context, parentWeb, configWeb);

            FeatureManager.ActivateFeatures(context, webToConfigure, configWeb.SiteFeatures, configWeb.WebFeatures);
            QuicklaunchManager.CreateQuicklaunchNodes(context, webToConfigure, configWeb.Quicklaunch);

            foreach (GtWeb subWeb in configWeb.Webs)
            {
                EnsureAndConfigureWebAndActivateFeatures(context, webToConfigure, subWeb);
            }
        }

        private Web EnsureWeb(ClientContext context, Web parentWeb, GtWeb configWeb)
        {
            Web webToConfigure = null;
            if (parentWeb == null)
            {
                //We assume that the root web always exists
                webToConfigure = context.Site.RootWeb;
            }
            else
            {
                webToConfigure = GetSubWeb(context, parentWeb, configWeb.Url);

                if (webToConfigure == null)
                {
                    webToConfigure = parentWeb.Webs.Add(GetWebCreationInformationFromConfig(configWeb));
                    context.ExecuteQuery();
                }
            }
            return webToConfigure;
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
        private Web GetSubWeb(ClientContext context, Web parentWeb, string webUrl)
        {
            context.Load(parentWeb, w => w.Url, w => w.Webs);
            context.ExecuteQuery();

            var absoluteUrlToCheck = parentWeb.Url.TrimEnd('/') + '/' + webUrl;
            // use a simple linq query to get any sub webs with the URL we want to check
            return (from w in parentWeb.Webs where w.Url == absoluteUrlToCheck select w).SingleOrDefault();
        }
    }
}
