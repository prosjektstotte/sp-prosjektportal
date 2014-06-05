using System;
using System.IO;
using System.Net;
using System.Security;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Publishing;
using File = System.IO.File;

namespace Glittertind.Sherpa.Library.Deploy
{
    class DeployManager : IDeployManager
    {
        private readonly SecureString _password;
        private readonly string _userName;
        private readonly string _urlToWeb;

        //Our sandboxed solution Guid
        private readonly Guid _sandboxedSolutionGuid = new Guid("900c28f1-fd88-47e2-8234-ef5cff5d0035");

        public DeployManager(string userName, string password, string urlToWeb)
        {
            _urlToWeb = urlToWeb;
            _userName = userName;

            _password = new SecureString();
            foreach (char c in password) _password.AppendChar(c);
        }
        /// <summary>
        /// Uploads a design package to a library. Can be used for uploading sandboxed solutions to solution gallery.
        /// Starting point: http://blog.symprogress.com/2013/07/upload-wsp-file-to-office365-sp2013-using-webclient/
        /// </summary>
        /// <param name="localFilePath">Path to package (wsp)</param>
        /// <param name="siteRelativeUrlToLibrary">Site relative URL to SharePoint Library</param>
        public void UploadDesignPackage(string localFilePath, string siteRelativeUrlToLibrary)
        {
            var fileName = Path.GetFileName(localFilePath);
            if (!string.IsNullOrEmpty(fileName))
            {
                var fileUrl = String.Format("{0}/{1}/{2}", _urlToWeb.TrimEnd('/'), siteRelativeUrlToLibrary.TrimEnd('/'), fileName.TrimStart('/'));
                UploadFile(_urlToWeb, fileUrl, localFilePath);
            }
        }
        private void UploadFile(string siteUrl, string fileUrl, string localPath)
        {
            var targetSite = new Uri(siteUrl);

            using (var spWebClient = new SPWebClient())
            {
                var credentials = new SharePointOnlineCredentials(_userName, _password);

                var authCookie = credentials.GetAuthenticationCookie(targetSite);
                spWebClient.CookieContainer = new CookieContainer();
                spWebClient.CookieContainer.Add(new Cookie("FedAuth",
                          authCookie.Replace("SPOIDCRL=", string.Empty),
                          string.Empty, targetSite.Authority));
                spWebClient.UseDefaultCredentials = false;
                try
                {
                    Stream stream = spWebClient.OpenWrite(targetSite + fileUrl, "PUT");
                    BinaryWriter writer = new BinaryWriter(stream);
                    writer.Write(File.ReadAllBytes(localPath));
                    writer.Close();
                    stream.Close();
                }
                catch (WebException we)
                {
                    Console.WriteLine(we.Message);
                }
                Console.WriteLine("Uploaded package to library");
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
                context.Credentials = new SharePointOnlineCredentials(_userName, _password);

                var packageInfo = new DesignPackageInfo()
                {
                    PackageGuid = _sandboxedSolutionGuid,
                    MajorVersion = 1,
                    MinorVersion = 1,
                    PackageName = nameOfPackage
                };

                Console.WriteLine("Installing design package " + nameOfPackage);
                DesignPackage.Install(context, context.Site, packageInfo, siteRelativeUrlToLibrary);
                context.ExecuteQuery();

                Console.WriteLine("Applying Design Package!");
                DesignPackage.Apply(context, context.Site, packageInfo);
                context.ExecuteQuery();
            }
        }
        /// <summary>
        /// Activate a design package based on Guid
        /// </summary>
        /// <param name="idOfPackage"></param>
        /// <param name="siteRelativeUrlToLibrary">Site relative URL to the library of the package</param>
        public void ActivateDesignPackage(Guid idOfPackage, string siteRelativeUrlToLibrary)
        {
            throw new NotImplementedException();
        }
    }
}
