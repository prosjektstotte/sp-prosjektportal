namespace Glittertind.Sherpa.Library.Deploy
{
    interface IDeployManager
    {
        void UploadDesignPackage(string localFilePath, string siteRelativeUrlToLibrary);
        void ActivateDesignPackage(string nameOfPackage, string siteRelativeUrlToLibrary);
    }
}
