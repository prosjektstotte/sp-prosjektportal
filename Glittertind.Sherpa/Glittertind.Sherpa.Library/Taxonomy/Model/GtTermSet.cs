using System;
using System.Collections.Generic;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    public class GtTermSet : GtTermItemBase
    {
        public GtTermSet() { }
        public GtTermSet(Guid id, string title) : base(id, title)
        {
            Terms = new List<GtTerm>();
        }

        public List<GtTerm> Terms { get; set; }
    }
}
