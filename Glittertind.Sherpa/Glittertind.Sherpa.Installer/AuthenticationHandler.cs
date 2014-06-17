using System;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Installer
{
    public class AuthenticationHandler
    {
        public SharePointOnlineCredentials LoginUser(string userName, string urlToSite)
        {
            while (true)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.Write("Enter your password for {0}: ", userName);
                var password = PasswordReader.GetConsoleSecurePassword();
                Console.ResetColor();
                Console.WriteLine();

                var credentials = new SharePointOnlineCredentials(userName, password);
                if (AuthenticateUser(credentials, urlToSite))
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("Account successfully authenticated!");
                    Console.ResetColor();

                    return credentials;
                }
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Couldn't authenticate user. Try again.");
                Console.ResetColor();
            }
        }

        private bool AuthenticateUser(SharePointOnlineCredentials credentials, string urlToSite)
        {
            try
            {
                credentials.GetAuthenticationCookie(new Uri(urlToSite));
                return true;
            }
            catch (IdcrlException)
            {
                return false;
            }
        }
    }
}
