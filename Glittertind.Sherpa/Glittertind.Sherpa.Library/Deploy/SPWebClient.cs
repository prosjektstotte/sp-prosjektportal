using System;
using System.Net;

namespace Glittertind.Sherpa.Library.Deploy
{
    class SPWebClient : WebClient
    {
        public CookieContainer CookieContainer { get; set; }

        protected override WebRequest GetWebRequest(Uri address)
        {
            HttpWebRequest request = base.GetWebRequest(address) as HttpWebRequest;
            if (request != null)
            {
                request.CookieContainer = CookieContainer;
            }
            return request;
        }
    }

}
