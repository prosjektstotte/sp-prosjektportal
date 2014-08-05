namespace Glittertind.Sherpa.Library.Deploy
{
    interface IDeployManager
    {
        void UploadDesignPackageToSiteAssets(string localFilePath);
        void ActivateDesignPackage(string nameOfPackage, string siteRelativeUrlToLibrary);
    }
}
