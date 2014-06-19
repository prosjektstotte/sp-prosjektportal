using System;
using System.Collections.Generic;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    public class Term : TermItemBase
    {
        public Term() { }

        public Term(Guid id, string title) : base(id, title)
        {
            Terms = new List<Term>();
        }

        public List<Term> Terms { get; set; }
    }
}
