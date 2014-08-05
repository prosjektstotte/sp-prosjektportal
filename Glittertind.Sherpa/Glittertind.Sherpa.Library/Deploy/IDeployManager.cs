namespace Glittertind.Sherpa.Library.Deploy
{
    interface IDeployManager
    {
        void UploadDesignPackage(string localFilePath, string libraryName);
        void ActivateDesignPackage(string nameOfPackage, string siteRelativeUrlToLibrary);
    }
}
