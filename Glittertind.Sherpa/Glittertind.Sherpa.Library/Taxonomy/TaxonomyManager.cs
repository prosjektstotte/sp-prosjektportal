using System;
using System.Collections.Generic;
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
        private readonly Uri _urlToSite;
        private readonly GtTermSetGroup _termSetGroup;

        public TaxonomyManager(Uri urlToSite, ICredentials credentials, GtTermSetGroup termSetGroup)
        {
            _urlToSite = urlToSite;
            _credentials = credentials;
            _termSetGroup = termSetGroup;
        }

        public void WriteTaxonomyToTermStore()
        {
            ValidateConfiguration(_termSetGroup);
            using (var context = new ClientContext(_urlToSite))
            {
                // user must be termstore admin
                context.Credentials = _credentials;
                var termStore = GetTermStore(context);

                var termGroup = termStore.Groups.ToList().FirstOrDefault(g => g.Id == _termSetGroup.Id) ??
                                termStore.CreateGroup(_termSetGroup.Title, _termSetGroup.Id);
                
                context.Load(termGroup, x => x.TermSets);
                context.ExecuteQuery();

                var language = termStore.DefaultLanguage;
                foreach (var termSet in _termSetGroup.TermSets)
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

        /// <summary>
        /// Checks that no ID's in the configuration file contains duplicate Ids. 
        /// Also checks that no terms at the same level have duplicate names.
        /// Both scenarios will lead to problems with 'rogue' terms and term sets
        /// </summary>
        /// <param name="gtTermGroup"></param>
        /// <returns></returns>
        public void ValidateConfiguration(GtTermSetGroup gtTermGroup)
        {
            var termIdsForEnsuringUniqueness = new List<Guid> {gtTermGroup.Id};

            foreach (var termSet in gtTermGroup.TermSets)
            {
                if (termIdsForEnsuringUniqueness.Contains(termSet.Id)) 
                    throw new NotSupportedException("One or more term items has the same Id which is not supported. Termset Id " + termSet.Id);
                
                termIdsForEnsuringUniqueness.Add(termSet.Id);
                foreach (var term in termSet.Terms)
                {
                    if (termIdsForEnsuringUniqueness.Contains(term.Id))
                        throw new NotSupportedException("One or more term items has the same Id which is not supported. Term Id " + term.Id);

                    termIdsForEnsuringUniqueness.Add(term.Id);
                    // Terms at the same level cannot have duplicate names
                    string currentTermTitle = term.Title;
                    if (termSet.Terms.Count(t => t.Title.Equals(currentTermTitle)) != 1) 
                        throw new NotSupportedException("Found duplicate term names at the same level which is not supported. Term name " + term.Title);
                }
            }
        }
    }
}
