using System;
using System.Security;
using System.Text;

namespace Glittertind.Sherpa.Installer
{
    /// <summary>
    /// Stolen from https://gist.github.com/huobazi/1039424
    /// </summary>
    class PasswordReader
    {

        /// <summary>
        /// Gets the console secure password.
        /// </summary>
        /// <returns></returns>
        public static SecureString GetConsoleSecurePassword()
        {
            var pwd = new SecureString();
            while (true)
            {
                ConsoleKeyInfo i = Console.ReadKey(true);
                if (i.Key == ConsoleKey.Enter)
                {
                    break;
                }
                if (i.Key == ConsoleKey.Backspace && pwd.Length > 0)
                {
                    pwd.RemoveAt(pwd.Length - 1);
                    Console.Write("\b \b");
                }
                else
                {
                    pwd.AppendChar(i.KeyChar);
                    Console.Write("*");
                }
            }
            return pwd;
        }

        /// <summary>
        /// Gets the console password.
        /// </summary>
        /// <returns></returns>
        public static string GetConsolePassword()
        {
            var sb = new StringBuilder();
            while (true)
            {
                ConsoleKeyInfo cki = Console.ReadKey(true);
                if (cki.Key == ConsoleKey.Enter)
                {
                    Console.WriteLine();
                    break;
                }

                if (cki.Key == ConsoleKey.Backspace)
                {
                    if (sb.Length > 0)
                    {
                        Console.Write("\b\0\b");
                        sb.Length--;
                    }

                    continue;
                }

                Console.Write('*');
                sb.Append(cki.KeyChar);
            }

            return sb.ToString();
        }
    }
}
