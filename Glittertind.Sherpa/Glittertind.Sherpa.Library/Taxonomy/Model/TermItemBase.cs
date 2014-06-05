using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Glittertind.Sherpa.Library.Taxonomy.Model
{
    abstract class TermItemBase
    {
        public string Title { get; set; }
        public Guid Id { get; set; }
    }
}
