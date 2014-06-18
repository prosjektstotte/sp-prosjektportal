using System;
using System.Net;
using CommandLine;
using CommandLine.Text;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Installer
{
    class Program
    {
        public static ICredentials Credentials { get; set; }
        public static Uri UrlToSite { get; set; }

        static void Main(string[] args)
        {
            Console.Clear();
            var options = new Options();
            if (!Parser.Default.ParseArguments(args, options))
            {
                options.GetUsage();
                Environment.Exit(1);
            }
            UrlToSite = new Uri(options.UrlToSite);
            
            PrintLogo();
            Console.WriteLine("Glittertind Sherpa Initiated");

            if (options.SharePointOnline)
            {
                Console.WriteLine("Login to {0}", UrlToSite);
                var authenticationHandler = new AuthenticationHandler();
                Credentials = authenticationHandler.GetCredentialsForSharePointOnline(options.UserName, options.UrlToSite);
            }
            else
            {
                Credentials = CredentialCache.DefaultCredentials;

                using (var context = new ClientContext(options.UrlToSite) { Credentials = Credentials})
                {
                    Console.WriteLine("Authenticated with default credentials");
                }
            }
            ShowStartScreenAndExecuteCommand();
        }

        private static void ShowStartScreenAndExecuteCommand()
        {
            Console.WriteLine("Application options");
            Console.WriteLine("Press 1 to install managed metadata groups and term sets.");
            Console.WriteLine("Press 2 to upload and activate sandboxed solution.");
            Console.WriteLine("Press 3 to setup site columns and content types.");
            Console.WriteLine("Press 4 to activate features.");
            Console.WriteLine("Press 9 to DELETE all Glittertind site columns and content types.");
            Console.WriteLine("Press 0 to exit application.");
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write("Select a number to perform an operation: ");
            Console.BackgroundColor = ConsoleColor.White;
            Console.ForegroundColor = ConsoleColor.Black;
            var input = Console.ReadLine();
            Console.ResetColor();
            HandleCommandKeyPress(input);
        }

        private static void HandleCommandKeyPress(string input)
        {
            int inputNum;
            if (!int.TryParse(input, out inputNum))
            {
                Console.WriteLine("Invalid input");
                ShowStartScreenAndExecuteCommand();
            }
            var installationManager = new InstallationManager(UrlToSite, Credentials);
            switch (inputNum)
            {
                case 1:
                {
                    installationManager.SetupTaxonomy();
                    break;
                }
                case 2:
                {
                    installationManager.UploadAndActivateSandboxSolution();
                    break;
                }
                case 3:
                {
                    installationManager.CreateSiteColumnsAndContentTypes();
                    break;
                }
                case 4:
                {
                    installationManager.ActivateFeatures();
                    break;
                }
                case 9:
                {
                    installationManager.DeleteAllGlittertindSiteColumnsAndContentTypes();
                    break;
                }
                case 0:
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

        [Option('u', "userName", HelpText = "Brukernavn til personen som skal installere løsningen")]
        public string UserName{ get; set; }

        [Option('o', "online", HelpText = "Indikerer om løsningen skal installeres til SharePoint online")]
        public bool SharePointOnline { get; set; }

        [HelpOption]
        public string GetUsage()
        {
            return HelpText.AutoBuild(this,
              current => HelpText.DefaultParsingErrorsHandler(this, current));
        }
    }
}
