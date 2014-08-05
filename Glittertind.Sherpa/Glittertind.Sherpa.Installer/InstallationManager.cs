using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Glittertind.Sherpa.Library;
using Glittertind.Sherpa.Library.ContentTypes;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Glittertind.Sherpa.Library.Deploy;
using Glittertind.Sherpa.Library.Features;
using Glittertind.Sherpa.Library.Features.Model;
using Glittertind.Sherpa.Library.Taxonomy;
using Glittertind.Sherpa.Library.Taxonomy.Model;

namespace Glittertind.Sherpa.Installer
{
    class InstallationManager
    {
        private readonly ICredentials _credentials;
        private readonly Uri _urlToSite;
        private readonly bool _isSharePointOnline;

        public InstallationManager(Uri urlToSite, ICredentials credentials, bool isSharePointOnline)
        {
            _urlToSite = urlToSite;
            _credentials = credentials;
            _isSharePointOnline = isSharePointOnline;
        }

        public void SetupTaxonomy()
        {
            Console.WriteLine("Starting installation of term groups, term sets and terms");
            var path = Path.Combine(Environment.CurrentDirectory, @"config\gttaxonomy.json");
            var taxPersistanceProvider = new FilePersistanceProvider<GtTermSetGroup>(path);
            var taxonomyManager = new TaxonomyManager(_urlToSite, _credentials, taxPersistanceProvider);
            taxonomyManager.WriteTaxonomyToTermStore();
        }

        public void DeleteAllGlittertindSiteColumnsAndContentTypes()
        {
            Console.WriteLine("Deleting all Glitterind columns and content types");
            var contentTypeManager = new ContentTypeManager(_urlToSite, _credentials);
            contentTypeManager.DeleteAllGlittertindSiteColumnsAndContentTypes("Glittertind");
            contentTypeManager.DisposeContext();
        }

        public void UploadAndActivateSandboxSolution()
        {
            Console.WriteLine("Uploading and activating sandboxed solution(s)");
            var pathToSandboxedSolution = Path.Combine(Environment.CurrentDirectory, "solutions");
            var files = Directory.GetFiles(pathToSandboxedSolution);
            var deployManager = new DeployManager(_urlToSite, _credentials, _isSharePointOnline);
            foreach (var file in files.Where(f => Path.GetExtension(f).ToLower() == ".wsp"))
            {
                deployManager.UploadDesignPackageToSiteAssets(file);
                deployManager.ActivateDesignPackage(file, "SiteAssets");
            }
        }

        public void CreateSiteColumnsAndContentTypes()
        {
            Console.WriteLine("Starting setup of site columns and content types");
            var pathToSiteColumnJson = Path.Combine(Environment.CurrentDirectory, @"config\gtfields.json");
            var siteColumnPersister = new FilePersistanceProvider<List<GtField>>(pathToSiteColumnJson);

            var pathToContentTypesJson = Path.Combine(Environment.CurrentDirectory, @"config\gtcontenttypes.json");
            var contentTypePersister = new FilePersistanceProvider<List<GtContentType>>(pathToContentTypesJson);

            var contentTypeManager = new ContentTypeManager(_urlToSite, _credentials, contentTypePersister, siteColumnPersister);
            contentTypeManager.CreateSiteColumns();
            contentTypeManager.CreateContentTypes();
            contentTypeManager.DisposeContext();
        }

        public void ActivateFeatures()
        {
            Console.WriteLine("Starting activation of features");
            var pathToFeatureActivations = Path.Combine(Environment.CurrentDirectory, @"config\gtfeatureactivations.json");
            var featureActivationPersister = new FilePersistanceProvider<List<GtFeatureActivation>>(pathToFeatureActivations);

            var featureManager = new FeatureManager(_urlToSite, _credentials, featureActivationPersister);
            featureManager.ActivateFeatures();
        }

        public void ReactivateFeautures()
        {
            Console.WriteLine("Reactivating features with flag 'ReactivateOnUpgrade'");
            var pathToFeatureActivations = Path.Combine(Environment.CurrentDirectory, @"config\gtfeatureactivations.json");
            var featureActivationPersister = new FilePersistanceProvider<List<GtFeatureActivation>>(pathToFeatureActivations);

            var featureManager = new FeatureManager(_urlToSite, _credentials, featureActivationPersister);
            featureManager.ReActivateFeaturesAfterUpgrade();
        }

        public void ForceReCrawl()
        {
            var deployManager = new DeployManager(_urlToSite, _credentials, _isSharePointOnline);
            deployManager.ForceRecrawl();
        }
    }
}
