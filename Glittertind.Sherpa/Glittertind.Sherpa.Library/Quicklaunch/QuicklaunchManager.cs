using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.Quicklaunch
{
    public class QuicklaunchManager : IQuickLaunchManager
    {
        public ClientContext ClientContext { get; set; }

        private Dictionary<string, string> QuicklaunchNodes { get; set; }
        
        public QuicklaunchManager(Uri urlToSite, ICredentials credentials, IPersistanceProvider<Dictionary<string, string>> quicklaunchProvider)
        {
            ClientContext = new ClientContext(urlToSite)
            {
                AuthenticationMode = ClientAuthenticationMode.Default,
                Credentials = credentials
            };
            QuicklaunchNodes = quicklaunchProvider.Load();
        }

        public void CreateQuicklaunchNodes()
        {
            var web = ClientContext.Web;
            var quickLaunch = web.Navigation.QuickLaunch;
            ClientContext.Load(quickLaunch);
            ClientContext.ExecuteQuery();

            var nodesToDelete = new List<NavigationNode>();
            foreach (NavigationNode node in quickLaunch)
            {
                if (!QuicklaunchNodes.ContainsKey(node.Title))
                {
                    nodesToDelete.Add(node);
                }
            }
            for (int i = 0; i < nodesToDelete.Count; i++)
            {
                nodesToDelete[i].DeleteObject();
            }
            foreach (KeyValuePair<string, string> newNode in QuicklaunchNodes)
            {
                if (quickLaunch.FirstOrDefault(n => n.Title == newNode.Key) == null)
                {
                    quickLaunch.Add(new NavigationNodeCreationInformation
                    {
                        Title = newNode.Key,
                        Url = newNode.Value,
                        AsLastNode = true
                    });
                }
            }
            ClientContext.ExecuteQuery();
        }
    }
}
