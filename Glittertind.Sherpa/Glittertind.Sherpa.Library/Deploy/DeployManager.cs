using System;
using System.IO;
using System.Net;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Publishing;
using File = System.IO.File;

namespace Glittertind.Sherpa.Library.Deploy
{
    public class DeployManager : IDeployManager
    {
        private readonly ICredentials _credentials;
        private readonly Uri _urlToWeb;

        public DeployManager(Uri urlToWeb, ICredentials credentials)
        {
            _urlToWeb = urlToWeb;
            _credentials = credentials;
        }
        /// <summary>
        /// Uploads a design package to a library. Can be used for uploading sandboxed solutions to solution gallery.
        /// </summary>
        /// <param name="localFilePath">Path to package (wsp)</param>
        /// <param name="siteRelativeUrlToLibrary">Site relative URL to SharePoint Library</param>
        public void UploadDesignPackage(string localFilePath, string siteRelativeUrlToLibrary)
        {
            var fileName = Path.GetFileName(localFilePath);
            var extension = Path.GetExtension(fileName);
            if (extension != null && extension.ToLower() != ".wsp") throw new NotSupportedException("Only WSPs can be uploaded into the SharePoint solution store. " + localFilePath + " is not a wsp");
            if (string.IsNullOrEmpty(fileName) || _urlToWeb == null || string.IsNullOrEmpty(siteRelativeUrlToLibrary))
            {
                throw new Exception("Could not create path to solution package!");
            }

            var fileUrl = UriUtilities.CombineAbsoluteUri(_urlToWeb.AbsoluteUri, siteRelativeUrlToLibrary, fileName);
            UploadFileToSharePointOnline(_urlToWeb.AbsoluteUri, fileUrl, localFilePath);
        }

        /// <summary>
        /// Actually uploads the package to the library
        /// Starting point: http://blog.symprogress.com/2013/07/upload-wsp-file-to-office365-sp2013-using-webclient/
        /// </summary>
        /// <param name="siteUrl"></param>
        /// <param name="fileUrl"></param>
        /// <param name="localPath"></param>
        private void UploadFileToSharePointOnline(string siteUrl, string fileUrl, string localPath)
        {
            var targetSite = new Uri(siteUrl);

            using (var spWebClient = new SPWebClient())
            {
                Console.WriteLine("Uploading package {0} to library ", Path.GetFileName(localPath));
                var authCookie = ((SharePointOnlineCredentials)_credentials).GetAuthenticationCookie(targetSite);
                spWebClient.CookieContainer = new CookieContainer();
                spWebClient.CookieContainer.Add(new Cookie("FedAuth",
                          authCookie.Replace("SPOIDCRL=", string.Empty),
                          string.Empty, targetSite.Authority));
                spWebClient.UseDefaultCredentials = false;
                try
                {
                    Stream stream = spWebClient.OpenWrite(fileUrl, "PUT");
                    var writer = new BinaryWriter(stream);
                    writer.Write(File.ReadAllBytes(localPath));
                    writer.Close();
                    stream.Close();
                    Console.WriteLine("Uploaded package {0} to library ", Path.GetFileName(localPath));
                }
                catch (WebException we)
                {
                    Console.WriteLine(we.Message);
                }
            }
        }


        /// <summary>
        /// Activates a design package based on package name
        /// Starting point: http://sharepoint.stackexchange.com/questions/90809/is-it-possible-to-activate-a-solution-using-client-code-in-sharepoint-online-201
        /// </summary>
        /// <param name="filePathOrName">The filename of the package</param>
        /// <param name="siteRelativeUrlToLibrary">Site relative URL to the library of the package</param>
        public void ActivateDesignPackage(string filePathOrName, string siteRelativeUrlToLibrary)
        {
            // if we pass in a full path, correct this
            var nameOfPackage = Path.GetFileNameWithoutExtension(filePathOrName);
            using (var context = new ClientContext(_urlToWeb))
            {
                context.Credentials = _credentials;
                context.Load(context.Site);
                context.Load(context.Web);
                context.ExecuteQuery();

                var stagedFileUrl = UriUtilities.CombineServerRelativeUri(context.Site.ServerRelativeUrl, siteRelativeUrlToLibrary, nameOfPackage + ".wsp");
                var packageInfo = GetPackageInfoWithLatestVersion(context, nameOfPackage, stagedFileUrl);

                Console.WriteLine("Installing solution package " + GetFileNameFromPackageInfo(packageInfo));
                DesignPackage.Install(context, context.Site, packageInfo, stagedFileUrl);
                context.ExecuteQuery();

                DeleteFile(context, stagedFileUrl);
            }
        }

        private DesignPackageInfo GetPackageInfoWithLatestVersion(ClientContext context, string nameOfPackage, string fileUrl)
        {
            var web = context.Web;
            var stagedFile = web.GetFileByServerRelativeUrl(fileUrl);
            context.Load(stagedFile, f => f.Exists, f => f.Name);
            context.ExecuteQuery();
            if (stagedFile.Exists)
            {
                return GetPackageInfoWithFirstAvailableMinorVersion(context, nameOfPackage, 1, 0);
            }
            return null;
        }

        private DesignPackageInfo GetPackageInfoWithFirstAvailableMinorVersion(ClientContext context, string nameOfPackage, int majorVersion, int minorVersion)
        {
            var newVersionPackageInfo = GetPackageInfo(nameOfPackage, majorVersion, minorVersion);

            var nameInSolutionGallery = GetFileNameFromPackageInfo(newVersionPackageInfo);
            var fileInSolutionGallery =
                context.Web.GetFileByServerRelativeUrl(context.Site.ServerRelativeUrl + "/_catalogs/solutions/" + nameInSolutionGallery);
            context.Load(fileInSolutionGallery, f => f.Exists);
            context.ExecuteQuery();

            return !fileInSolutionGallery.Exists ? newVersionPackageInfo : GetPackageInfoWithFirstAvailableMinorVersion(context, nameOfPackage, majorVersion, minorVersion+1);
        }

        private DesignPackageInfo GetPackageInfo(string nameOfPackage, int majorVersion, int minorVersion)
        {
            return new DesignPackageInfo
            {
                PackageName = nameOfPackage,
                MajorVersion = majorVersion,
                MinorVersion = minorVersion
            };
        }

        /// <summary>
        /// This is how SharePoint creates the name of the package that is installed
        /// </summary>
        /// <param name="packageInfo"></param>
        /// <returns></returns>
        private static string GetFileNameFromPackageInfo(DesignPackageInfo packageInfo)
        {
            return string.Format("{0}-v{1}.{2}.wsp", packageInfo.PackageName, packageInfo.MajorVersion, packageInfo.MinorVersion);
        }

        private static void DeleteFile(ClientContext context, string fileUrl)
        {
            var web = context.Web;
            var file = web.GetFileByServerRelativeUrl(fileUrl);
            context.Load(file);
            file.DeleteObject();
            context.ExecuteQuery();
        }

        public void ForceRecrawl()
        {
            using (var context = new ClientContext(_urlToWeb))
            {
                context.Credentials = _credentials;
                context.Load(context.Web);
                context.ExecuteQuery();
                ForceRecrawlOf(context.Web, context);

            }

        }

        private void ForceRecrawlOf(Web web, ClientContext context)
        {
            Console.WriteLine("Scheduling full recrawl of: " + web.Url);
            context.Credentials = _credentials;

            context.Load(web, x => x.AllProperties, x => x.Webs);
            context.ExecuteQuery();
            var version = 0;
            var subWebs = web.Webs;

            var allProperties = web.AllProperties;
            if (allProperties.FieldValues.ContainsKey("vti_searchversion"))
            {
                version = (int)allProperties["vti_searchversion"];
            }
            version++;
            allProperties["vti_searchversion"] = version;
            web.Update();
            context.ExecuteQuery();
            foreach (var subWeb in subWebs)
            {
                ForceRecrawlOf(subWeb, context);
            }
        }

    }

}
