using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Mime;
using System.Runtime.Serialization.Json;
using System.Security;
using CommandLine;
using CommandLine.Text;
using Glittertind.Sherpa.Library;
using Glittertind.Sherpa.Library.ContentTypes;
using Glittertind.Sherpa.Library.Deploy;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Installer
{
    class Program
    {
        static void Main(string[] args)
        {
            var options = new Options();
            if (!Parser.Default.ParseArguments(args, options))
            {
                options.GetUsage();
                Environment.Exit(1);
            }

            Console.Write("Insert password: ");
            var password = PasswordReader.GetConsoleSecurePassword();
            Console.WriteLine();


            CreateSiteColumnsAndContentTypes(options.UrlToSite, options.UserName, password);
            //UploadAndActivateSandboxSolution(options.UrlToSite, options.UserName, password);

            Console.WriteLine("Installation done");
            Console.ReadKey();
        }

        private static void UploadAndActivateSandboxSolution(string urlToSite, string userName, SecureString password)
        {
            var pathToSandboxedSolution = Path.Combine(Environment.CurrentDirectory, "Tormods-Playground-1.0.wsp");
            var deployManager = new DeployManager(userName, password, urlToSite);
            deployManager.UploadDesignPackage(pathToSandboxedSolution, "_catalogs/solutions");
            deployManager.ActivateDesignPackage("Tormods-Playground-1.0.wsp", "_catalogs/solutions");
        }

        private static void CreateSiteColumnsAndContentTypes(string urlToSite, string userName, SecureString password)
        {
            var pathToSiteColumnJson = Path.Combine(Environment.CurrentDirectory, @"ContentTypes\Configuration\GtSiteColumns.json");
            var siteColumnPersister = new FilePersistanceProvider<List<GtSiteColumn>>(pathToSiteColumnJson);
            var siteColumns = siteColumnPersister.Load();
            
            var pathToContentTypesJson = Path.Combine(Environment.CurrentDirectory, @"ContentTypes\Configuration\GtContentTypes.json");
            var contentTypePersister = new FilePersistanceProvider<List<GtContentType>>(pathToContentTypesJson);
            var contentTypes = contentTypePersister.Load();

            var contentTypeManager = new ContentTypeManager();

            var cc = new ClientContext(urlToSite)
            {
                AuthenticationMode = ClientAuthenticationMode.Default,
                Credentials = new SharePointOnlineCredentials(userName, password)
            };
            try
            {
                contentTypeManager.CreateSiteColumns(cc, siteColumns);
                contentTypeManager.CreateContentTypes(cc, contentTypes);
            }
            finally
            {
                cc.Dispose();    
            }
        }
    }

    internal sealed class Options
    {
        [ParserState]
        public IParserState LastParserState { get; set; }

        [Option('u', "urlToSite", DefaultValue = "https://pzlcloud.sharepoint.com/sites/dev-tormodguldvog", HelpText = "URL til området prosjektportalen skal installeres")]
        public string UrlToSite { get; set; }

        [Option('n', "userName", DefaultValue = "tarjeieo@puzzlepart.com", HelpText = "Brukernavn til personen som skal installere løsningen")]
        public string UserName{ get; set; }


        [HelpOption]
        public string GetUsage()
        {
            return HelpText.AutoBuild(this,
              current => HelpText.DefaultParsingErrorsHandler(this, current));
        }
    }
}
