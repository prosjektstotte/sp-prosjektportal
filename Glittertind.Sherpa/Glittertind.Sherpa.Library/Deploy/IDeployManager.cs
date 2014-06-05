using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Glittertind.Sherpa.Library.Deploy
{
    interface IDeployManager
    {
        void UploadDesignPackage(string localFilePath, string siteRelativeUrlToLibrary);
        void ActivateDesignPackage(Guid idOfPackage, string siteRelativeUrlToLibrary);
        void ActivateDesignPackage(string nameOfPackage, string siteRelativeUrlToLibrary);
    }
}
