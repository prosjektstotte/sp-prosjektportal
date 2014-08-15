using System.Collections.Generic;
using System.Linq;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.SiteHierarchy
{
    public class QuicklaunchManager
    {
        public void CreateQuicklaunchNodes(ClientContext clientContext, Web web, Dictionary<string, string> quicklaunchNodes)
        {
            if (quicklaunchNodes == null) return;

            var quickLaunch = web.Navigation.QuickLaunch;
            clientContext.Load(quickLaunch);
            clientContext.ExecuteQuery();

            var nodesToDelete = new List<NavigationNode>();
            foreach (NavigationNode node in quickLaunch)
            {
                if (!quicklaunchNodes.ContainsKey(node.Title))
                {
                    nodesToDelete.Add(node);
                }
            }
            for (int i = 0; i < nodesToDelete.Count; i++)
            {
                nodesToDelete[i].DeleteObject();
            }
            foreach (KeyValuePair<string, string> newNode in quicklaunchNodes)
            {
                if (quickLaunch.FirstOrDefault(n => n.Title == newNode.Key) == null)
                {
                    quickLaunch.Add(new NavigationNodeCreationInformation
                    {
                        Title = newNode.Key,
                        Url = newNode.Value,
                        AsLastNode = true,
                        IsExternal = true
                    });
                }
            }
            clientContext.ExecuteQuery();
        }
    }
}
