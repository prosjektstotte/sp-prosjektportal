using System;
using System.Linq;
using System.Net;
using Glittertind.Sherpa.Library.Taxonomy.Model;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Taxonomy;

namespace Glittertind.Sherpa.Library.Taxonomy
{
    public class TaxonomyManager : ITaxonomyManager
    {
        private readonly ICredentials _credentials;
        private readonly string _urlToSite;
        private IPersistanceProvider<TermSetGroup> Provider { get; set; }

        public TaxonomyManager(string urlToSite, ICredentials credentials, IPersistanceProvider<TermSetGroup> provider)
        {
            Provider = provider;
            _urlToSite = urlToSite;
            _credentials = credentials;
        }

        public void WriteTaxonomyToTermStore()
        {
            var group = Provider.Load();
            using (var context = new ClientContext(_urlToSite))
            {
                // user must be termstore admin
                context.Credentials = _credentials;
                var termStore = GetTermStore(context);

                var termGroup = termStore.Groups.ToList().FirstOrDefault(g => g.Id == @group.Id) ??
                                termStore.CreateGroup(@group.Title, @group.Id);
                
                context.Load(termGroup, x => x.TermSets);
                context.ExecuteQuery();

                var language = termStore.DefaultLanguage;
                foreach (var termSet in group.TermSets)
                {
                    var spTermSet = termStore.GetTermSet(termSet.Id);
                    context.Load(spTermSet,x=>x.Terms);
                    context.ExecuteQuery();
                    if (spTermSet.ServerObjectIsNull.Value)
                    {
                        spTermSet = termGroup.CreateTermSet(termSet.Title, termSet.Id, language);
                        context.Load(spTermSet,x=>x.Terms);
                        context.ExecuteQuery();
                    }

                    foreach (var term in termSet.Terms)
                    {
                        var spTerm = termStore.GetTerm(term.Id);
                        context.Load(spTerm);
                        context.ExecuteQuery();
                        if (spTerm.ServerObjectIsNull.Value)
                        {
                            var spterm = spTermSet.CreateTerm(term.Title, language, term.Id);
                            context.Load(spterm);
                            context.ExecuteQuery();
                        }
                    }
                }
            }
        }

        public TermStore GetTermStore(ClientContext context)
        {
            TaxonomySession taxonomySession = TaxonomySession.GetTaxonomySession(context);
            taxonomySession.UpdateCache();
            context.Load(taxonomySession);
            context.ExecuteQuery();

            TermStore termStore = taxonomySession.GetDefaultSiteCollectionTermStore();
            context.Load(termStore, x => x.Groups, x => x.Id, x=> x.DefaultLanguage);
            context.ExecuteQuery();
            return termStore;
        }

        public Guid GetTermStoreId()
        {
            using (var context = new ClientContext(_urlToSite))
            {
                // user must be termstore admin
                context.Credentials = _credentials;
                var termStore = GetTermStore(context);

                return termStore.Id;
            }
        }
    }
}
