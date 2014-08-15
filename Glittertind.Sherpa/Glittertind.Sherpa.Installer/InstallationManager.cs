using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Glittertind.Sherpa.Library;
using Glittertind.Sherpa.Library.ContentTypes;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Glittertind.Sherpa.Library.SiteHierarchy;
using Glittertind.Sherpa.Library.SiteHierarchy.Model;
using Glittertind.Sherpa.Library.Deploy;
using Glittertind.Sherpa.Library.Taxonomy;
using Glittertind.Sherpa.Library.Taxonomy.Model;
using Microsoft.SharePoint.Client;

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
            var taxonomyManager = new TaxonomyManager(_urlToSite, _credentials, taxPersistanceProvider.Load());
            taxonomyManager.WriteTaxonomyToTermStore();
            Console.WriteLine("Done installation of term groups, term sets and terms");
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
            Console.WriteLine("Done uploading and activating sandboxed solution(s)");
        }

        public void CreateSiteColumnsAndContentTypes()
        {
            Console.WriteLine("Starting setup of site columns and content types");
            var pathToSiteColumnJson = Path.Combine(Environment.CurrentDirectory, @"config\gtfields.json");
            var siteColumnPersister = new FilePersistanceProvider<List<GtField>>(pathToSiteColumnJson);

            var pathToContentTypesJson = Path.Combine(Environment.CurrentDirectory, @"config\gtcontenttypes.json");
            var contentTypePersister = new FilePersistanceProvider<List<GtContentType>>(pathToContentTypesJson);

            var contentTypeManager = new ContentTypeManager(_urlToSite, _credentials, contentTypePersister.Load(), siteColumnPersister.Load());
            contentTypeManager.CreateSiteColumns();
            contentTypeManager.CreateContentTypes();
            contentTypeManager.DisposeContext();
            Console.WriteLine("Done setup of site columns and content types");
        }

        public void ConfigureSites()
        {
            Console.WriteLine("Starting configuring sites");
            var pathToSiteSetup = Path.Combine(Environment.CurrentDirectory, @"config\gtsitehierarchy.json");
            var sitePersister = new FilePersistanceProvider<GtWeb>(pathToSiteSetup);
            
            using (var clientContext = new ClientContext(_urlToSite) { Credentials = _credentials })
            {
                var siteManager = new SiteSetupManager(clientContext, sitePersister.Load());
                siteManager.SetupSites();
            }
            Console.WriteLine("Done configuring sites");
        }

        public void TeardownSites()
        {
            Console.WriteLine("Starting teardown of sites");
            var pathToSiteSetup = Path.Combine(Environment.CurrentDirectory, @"config\gtsitehierarchy.json");
            var sitePersister = new FilePersistanceProvider<GtWeb>(pathToSiteSetup);

            using (var clientContext = new ClientContext(_urlToSite) {Credentials = _credentials})
            {
                var siteManager = new SiteSetupManager(clientContext, sitePersister.Load());
                siteManager.DeleteSites();
            }
            Console.WriteLine("Done teardown of sites");
        }

        public void DeleteAllGlittertindSiteColumnsAndContentTypes()
        {
            Console.WriteLine("Deleting all Glitterind columns and content types");
            var pathToSiteColumnJson = Path.Combine(Environment.CurrentDirectory, @"config\gtfields.json");
            var siteColumnPersister = new FilePersistanceProvider<List<GtField>>(pathToSiteColumnJson);

            var pathToContentTypesJson = Path.Combine(Environment.CurrentDirectory, @"config\gtcontenttypes.json");
            var contentTypePersister = new FilePersistanceProvider<List<GtContentType>>(pathToContentTypesJson);

            var contentTypeManager = new ContentTypeManager(_urlToSite, _credentials, contentTypePersister.Load(), siteColumnPersister.Load());
            contentTypeManager.DeleteAllCustomFieldsAndContentTypes();
            contentTypeManager.DisposeContext();
            Console.WriteLine("Done deleting all Glitterind columns and content types");
        }

        public void ForceReCrawl()
        {
            var deployManager = new DeployManager(_urlToSite, _credentials, _isSharePointOnline);
            deployManager.ForceRecrawl();
        }
    }
}
