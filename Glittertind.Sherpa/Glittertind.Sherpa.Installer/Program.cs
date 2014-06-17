using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CommandLine;
using CommandLine.Text;
using Glittertind.Sherpa.Library;
using Glittertind.Sherpa.Library.ContentTypes;
using Glittertind.Sherpa.Library.Deploy;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Glittertind.Sherpa.Library.Taxonomy;
using Glittertind.Sherpa.Library.Taxonomy.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Installer
{
    class Program
    {
        public static SharePointOnlineCredentials Credentials { get; set; }
        public static string UrlToSite { get; set; }

        static void Main(string[] args)
        {
            var options = new Options();
            if (!Parser.Default.ParseArguments(args, options))
            {
                options.GetUsage();
                Environment.Exit(1);
            }
            UrlToSite = options.UrlToSite;
            PrintLogo();
            Console.WriteLine("Glittertind Sherpa Initiated");
            Console.Write("Insert your SharePoint online password for {0}: ", options.UserName);
            var password = PasswordReader.GetConsoleSecurePassword();
            Console.WriteLine();
            Credentials = new SharePointOnlineCredentials(options.UserName, password);
            try
            {
                Credentials.GetAuthenticationCookie(new Uri(UrlToSite));
            }
            catch (IdcrlException exception)
            {
                Console.WriteLine("Wrong password. Sorry man. Thats too bad.");
                Console.ReadLine();
                Environment.Exit(1);
            }
            Console.WriteLine("Account authenticated");

            ShowStartScreenAndExecuteCommand();

            Console.WriteLine("Installation done");
            Console.ReadKey();
        }


        private static void HandleCommandKeyPress(string input)
        {
            var inputNum = int.Parse(input);
            switch (inputNum)
            {
                case (1):
                {
                    SetupTaxonomy(UrlToSite, Credentials);
                    break;
                }
                case (2):
                {
                    UploadAndActivateSandboxSolution(UrlToSite, Credentials);
                    break;
                }
                case (3):
                {
                    CreateSiteColumnsAndContentTypes(UrlToSite, Credentials);
                    break;
                }
                case (9):
                {
                    DeleteAllGlittertindSiteColumnsAndContentTypes(UrlToSite, Credentials);
                    break;
                }
                case (0):
                {
                    Environment.Exit(0);
                    break;
                }
                default:
                {
                    Environment.Exit(1);
                    break;
                }
            }
            Console.WriteLine("Operation done");
            ShowStartScreenAndExecuteCommand();
        }

        private static void SetupTaxonomy(string urlToSite, SharePointOnlineCredentials credentials)
        {
            Console.WriteLine("Starting setup of tax");
            var path = Path.Combine(Environment.CurrentDirectory, @"config\gttaxonomy.json");
            var taxPersistanceProvider = new FilePersistanceProvider<TermSetGroup>(path);
            var taxonomyManager = new TaxonomyManager(urlToSite, credentials, taxPersistanceProvider, 1044);
            taxonomyManager.WriteTaxonomyToTermStore();
        }

        private static void DeleteAllGlittertindSiteColumnsAndContentTypes(string urlToSite, SharePointOnlineCredentials credentials)
        {
            var contentTypeManager = new ContentTypeManager(urlToSite, credentials);
            contentTypeManager.DeleteAllGlittertindSiteColumnsAndContentTypes("Glittertind");
            contentTypeManager.DisposeContext();
        }

        private static void ShowStartScreenAndExecuteCommand()
        {
            Console.WriteLine("Application options");
            Console.WriteLine("Press 1 for taxonomy setup.");
            Console.WriteLine("Press 2 to upload and activate sandboxed solution.");
            Console.WriteLine("Press 3 to setup site columns and content types.");
            Console.WriteLine("Press 9 to DELETE all Glittertind site columns and content types.");
            Console.WriteLine("Press 0 to exit application.");
            Console.Write("Select a number to perform an operation: ");
            var input = Console.ReadLine();
            HandleCommandKeyPress(input);
        }

        private static void UploadAndActivateSandboxSolution(string urlToSite, SharePointOnlineCredentials credentials)
        {
            var pathToSandboxedSolution = Path.Combine(Environment.CurrentDirectory,"solutions");
            var files = Directory.GetFiles(pathToSandboxedSolution);
            var deployManager = new DeployManager(urlToSite, credentials);
            foreach (var file in files)
            {
                deployManager.UploadDesignPackage(file, "SiteAssets");
                deployManager.ActivateDesignPackage(file, "SiteAssets");
            }
            
           
            
        }

        private static void CreateSiteColumnsAndContentTypes(string urlToSite, SharePointOnlineCredentials credentials)
        {
            Console.WriteLine("Starting setup of site columns and content types");
            var pathToSiteColumnJson = Path.Combine(Environment.CurrentDirectory, @"config\gtfields.json");
            var siteColumnPersister = new FilePersistanceProvider<List<GtField>>(pathToSiteColumnJson);

            var pathToContentTypesJson = Path.Combine(Environment.CurrentDirectory, @"config\gtcontenttypes.json");
            var contentTypePersister = new FilePersistanceProvider<List<GtContentType>>(pathToContentTypesJson);

            var contentTypeManager = new ContentTypeManager(urlToSite, credentials, contentTypePersister, siteColumnPersister);
            contentTypeManager.CreateSiteColumns();
            contentTypeManager.CreateContentTypes();
            contentTypeManager.DisposeContext();
        }

        private static void PrintLogo()
        {
            Console.WriteLine(@"  ________.__  .__  __    __                 __  .__            .___");
            Console.WriteLine(@" /  _____/|  | |__|/  |__/  |_  ____________/  |_|__| ____    __| _/");
            Console.WriteLine(@"/   \  ___|  | |  \   __\   __\/ __ \_  __ \   __\  |/    \  / __ | ");
            Console.WriteLine(@"\    \_\  \  |_|  ||  |  |  | \  ___/|  | \/|  | |  |   |  \/ /_/ | ");
            Console.WriteLine(@" \______  /____/__||__|  |__|  \___  >__|   |__| |__|___|  /\____ | ");
            Console.WriteLine(@"        \/                         \/                    \/      \/ ");
        }
    }

    internal sealed class Options
    {
        [ParserState]
        public IParserState LastParserState { get; set; }

        [Option("url", Required = true, HelpText = "URL til området prosjektportalen skal installeres")]
        public string UrlToSite { get; set; }

        [Option('u', "userName", Required = true, HelpText = "Brukernavn til personen som skal installere løsningen")]
        public string UserName{ get; set; }


        [HelpOption]
        public string GetUsage()
        {
            return HelpText.AutoBuild(this,
              current => HelpText.DefaultParsingErrorsHandler(this, current));
        }
    }
}
