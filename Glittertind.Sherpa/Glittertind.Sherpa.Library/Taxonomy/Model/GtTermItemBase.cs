using System;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    public abstract class GtTermItemBase
    {
        public string Title { get; set; }
        public Guid Id { get; set; }
        
        protected GtTermItemBase(Guid id, string title)
        {
            Title = title;
            Id = id;
        }

        public GtTermItemBase()
        {
            
        }
    }
}
