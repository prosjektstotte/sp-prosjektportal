using System;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    public abstract class TermItemBase
    {
        public string Title { get; set; }
        public Guid Id { get; set; }
        
        protected TermItemBase(Guid id, string title)
        {
            Title = title;
            Id = id;
        }

        public TermItemBase()
        {
            
        }
    }
}
