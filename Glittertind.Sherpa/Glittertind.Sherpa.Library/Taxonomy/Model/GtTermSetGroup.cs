using System;
using System.Collections.Generic;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    public class GtTermSetGroup : GtTermItemBase
    {
        public GtTermSetGroup() { }
        public GtTermSetGroup(Guid id, string title) : base(id, title)
        {
            TermSets = new List<GtTermSet>();
        }

        public List<GtTermSet> TermSets { get; set; }
    }
}
