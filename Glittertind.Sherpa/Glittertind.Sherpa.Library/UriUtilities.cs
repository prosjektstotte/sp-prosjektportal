using System.Linq;
using System.Text;

namespace Glittertind.Sherpa.Library
{
    public static class UriUtilities
    {
        public static string CombineServerRelativeUri(params string[] args)
        {
            var sb = new StringBuilder();
            foreach (string arg in args.Where(snip => snip != "/"))
            {
                sb.Append("/" + arg.Trim('/'));
            }
            return sb.ToString();
        }
        public static string CombineAbsoluteUri(params string[] args)
        {
            return CombineServerRelativeUri(args).TrimStart('/');
        }
    }
}
