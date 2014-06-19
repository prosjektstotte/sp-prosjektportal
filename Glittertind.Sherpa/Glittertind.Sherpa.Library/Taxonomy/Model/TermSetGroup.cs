using System;
using System.Collections.Generic;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    public class TermSetGroup : TermItemBase
    {
        public TermSetGroup() { }
        public TermSetGroup(Guid id, string title) : base(id, title)
        {
            TermSets = new List<TermSet>();
        }

        public List<TermSet> TermSets { get; set; }
    }
}
