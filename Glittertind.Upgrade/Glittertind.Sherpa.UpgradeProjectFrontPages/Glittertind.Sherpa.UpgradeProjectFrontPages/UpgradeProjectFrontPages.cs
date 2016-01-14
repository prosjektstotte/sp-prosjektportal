using System;
using System.IO;
using System.Reflection;
using Microsoft.SharePoint.Client;
using Sherpa.Library.API;
using log4net;
using Sherpa.Library.SiteHierarchy.Model;
using File = Microsoft.SharePoint.Client.File;
using Flurl;

namespace Glittertind.Sherpa.UpgradeProjectFrontPages
{
    public class UpgradeProjectFrontPages : ITask
    {
        private static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        public void ExecuteOn(ShWeb web, ClientContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            var rootWeb = context.Site.RootWeb;
            var webs = context.LoadQuery(rootWeb.Webs.IncludeWithDefaultProperties());
            context.ExecuteQuery();

            Log.InfoFormat("Starting update process of site {0}", web.Url);

            string assemblyFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            if (assemblyFolder != null)
            {
                string frontPageFileName = "Forside.aspx";
                string frontPageFilePath = Path.Combine(assemblyFolder, frontPageFileName);
                var frontPage = System.IO.File.ReadAllBytes(Path.GetFullPath(frontPageFilePath));

                foreach (Web subweb in webs)
                {
                    Log.InfoFormat("Updating frontpage of web {0}", subweb.Title);
                    var sitePages = subweb.Lists.GetByTitle("Områdesider");
                    var rootFolder = sitePages.RootFolder;

                    context.Load(sitePages);
                    context.Load(rootFolder, r => r.ServerRelativeUrl);
                    context.ExecuteQuery();

                    var fileLocation = Url.Combine(subweb.Url, $"SitePages/{frontPageFileName}");

                     var newFile = new FileCreationInformation
                    {
                        Content = frontPage,
                        Url = fileLocation,
                        Overwrite = true
                    };
                    File uploadFile = rootFolder.Files.Add(newFile);

                    context.Load(uploadFile);
                    context.Load(uploadFile.ListItemAllFields.ParentList, l => l.ForceCheckout, l => l.EnableMinorVersions, l => l.EnableModeration);
                    context.ExecuteQuery();
                }
            }
        }
    }
}
