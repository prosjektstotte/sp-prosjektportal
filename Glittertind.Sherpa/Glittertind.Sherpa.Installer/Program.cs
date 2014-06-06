using System;
using CommandLine;
using CommandLine.Text;
using Glittertind.Sherpa.Library.Deploy;


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

            var pathToSandboxedSolution = string.Format("{0}\\Tormods-Playground-1.0.wsp", Environment.CurrentDirectory);

            Console.Write("Insert password: ");
            var password = PasswordReader.GetConsoleSecurePassword();
            Console.WriteLine();

            var deployManager = new DeployManager(options.UserName, password, options.UrlToSite);
            deployManager.UploadDesignPackage(pathToSandboxedSolution, "_catalogs/solutions");
            deployManager.ActivateDesignPackage("Tormods-Playground-1.0.wsp", "_catalogs/solutions");

            Console.WriteLine("Installation done");
            Console.ReadKey();
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
