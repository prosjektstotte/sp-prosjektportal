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
        private readonly string _urlToWeb;
        private readonly int _lcid;
        private IPersistanceProvider<TermSetGroup> Provider { get; set; }

        public TaxonomyManager(ICredentials credentials, string urlToWeb, int lcid, IPersistanceProvider<TermSetGroup> provider)
        {
            Provider = provider;
            _urlToWeb = urlToWeb;
            _credentials = credentials;
            _lcid = lcid;
        }

        public void WriteTaxonomyToTermStore()
        {
            var group = (TermSetGroup) Provider.Load();
            using (var context = new ClientContext(_urlToWeb))
            {
                // user must be termstore admin
                context.Credentials = _credentials;
                var termStore = GetTermStore(context);

                var termGroup = termStore.Groups.ToList().FirstOrDefault(g => g.Id == @group.Id) ??
                                termStore.CreateGroup(@group.Title, @group.Id);

                context.Load(termGroup, x => x.TermSets);
                context.ExecuteQuery();
                
                foreach (var termSet in group.TermSets)
                {
                    var spTermSet = termStore.GetTermSet(termSet.Id);
                    context.Load(spTermSet,x=>x.Terms);
                    context.ExecuteQuery();
                    if (spTermSet.ServerObjectIsNull.Value)
                    {
                        spTermSet = termGroup.CreateTermSet(termSet.Title, termSet.Id, _lcid);
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
                            var spterm = spTermSet.CreateTerm(term.Title, _lcid, term.Id);
                            context.Load(spterm);
                            context.ExecuteQuery();
                        }
                    }
                }
            }
        }

        public static TermStore GetTermStore(ClientContext context)
        {
            TaxonomySession taxonomySession = TaxonomySession.GetTaxonomySession(context);
            taxonomySession.UpdateCache();
            context.Load(taxonomySession);
            context.ExecuteQuery();

            TermStore termStore = taxonomySession.GetDefaultSiteCollectionTermStore();
            context.Load(termStore, x => x.Groups, x => x.Id);
            context.ExecuteQuery();
            return termStore;
        }

        public static Guid GetTermStoreId(ICredentials credentials, string urlToWeb)
        {
            using (var context = new ClientContext(urlToWeb))
            {
                // user must be termstore admin
                context.Credentials = credentials;
                var termStore = GetTermStore(context);

                return termStore.Id;
            }
        }
    }
}
