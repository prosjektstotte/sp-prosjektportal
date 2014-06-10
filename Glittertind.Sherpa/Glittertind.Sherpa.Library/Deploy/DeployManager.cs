using System;
using System.IO;
using System.Net;
using System.Text;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Publishing;
using File = System.IO.File;

namespace Glittertind.Sherpa.Library.Deploy
{
    public class DeployManager : IDeployManager
    {
        private readonly ICredentials _credentials;
        private readonly string _urlToWeb;

        //Our sandboxed solution Guid
        private readonly Guid _sandboxedSolutionGuid = new Guid("4248075f-9981-4034-8ff2-9b9e15ba328c");

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
            if (string.IsNullOrEmpty(fileName) || string.IsNullOrEmpty(_urlToWeb) || string.IsNullOrEmpty(siteRelativeUrlToLibrary))
            {
                throw new Exception("Could not create path to solution package!");
            }

            var fileUrl = CombineAbsoluteUri(_urlToWeb, siteRelativeUrlToLibrary, fileName);
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
        /// <param name="nameOfPackage">The filename of the package</param>
        /// <param name="siteRelativeUrlToLibrary">Site relative URL to the library of the package</param>
        public void ActivateDesignPackage(string nameOfPackage, string siteRelativeUrlToLibrary)
        {
            using (var context = new ClientContext(_urlToWeb))
            {
                context.Credentials = _credentials;

                var packageInfo = new DesignPackageInfo()
                {
                    PackageGuid = Guid.Empty,
                    PackageName = nameOfPackage
                };

                context.Load(context.Site);
                context.ExecuteQuery();
                var fileUrl = CombineServerRelativeUri(context.Site.ServerRelativeUrl, siteRelativeUrlToLibrary, nameOfPackage);

                Console.WriteLine("Installing solution package " + nameOfPackage);
                Console.WriteLine("This could take a minute");
                DesignPackage.Install(context, context.Site, packageInfo, fileUrl);
                context.ExecuteQuery();

                Console.WriteLine("Activated package " + nameOfPackage);
            }
        }

        private string CombineServerRelativeUri(params string[] args)
        {
            var sb = new StringBuilder();
            foreach (string arg in args)
            {
                sb.Append( "/" + arg.Trim('/'));
            }
            return sb.ToString();
        }
        private string CombineAbsoluteUri(params string[] args)
        {
            return CombineServerRelativeUri(args).TrimStart('/');
        }
    }
}
