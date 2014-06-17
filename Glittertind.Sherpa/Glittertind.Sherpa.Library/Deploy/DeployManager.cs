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
        private readonly string _urlToWeb;
        
        public DeployManager(string urlToWeb, ICredentials credentials)
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
            if (extension != null && extension.ToLower() != ".wsp") throw new NotSupportedException("Only WSPs can be uploaded into the SharePoint solution store. "+localFilePath + " is not a wsp");
            if (string.IsNullOrEmpty(fileName) || string.IsNullOrEmpty(_urlToWeb) || string.IsNullOrEmpty(siteRelativeUrlToLibrary))
            {
                throw new Exception("Could not create path to solution package!");
            }

            var fileUrl = UriUtilities.CombineAbsoluteUri(_urlToWeb, siteRelativeUrlToLibrary, fileName);
            UploadFileToSharePointOnline(_urlToWeb, fileUrl, localFilePath);
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

                var packageInfo = new DesignPackageInfo
                {
                    PackageName = nameOfPackage,
                    MajorVersion = 1,
                    MinorVersion = 0
                };

                context.Load(context.Site);
                context.Load(context.Web);
                context.ExecuteQuery();
                var fileUrl = UriUtilities.CombineServerRelativeUri(context.Site.ServerRelativeUrl, siteRelativeUrlToLibrary, nameOfPackage +".wsp");

                Console.WriteLine("Installing solution package " + nameOfPackage);
                Console.WriteLine("This could take a minute");
                DesignPackage.Install(context, context.Site, packageInfo,fileUrl);
                context.ExecuteQuery();
                var web = context.Web;
                var file = web.GetFileByServerRelativeUrl(fileUrl);
                context.Load(file);
                file.DeleteObject();
                context.ExecuteQuery();
                Console.WriteLine("Activated package " + nameOfPackage);
            }
        }
    }
}
