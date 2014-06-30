using System.Collections.Generic;

namespace Glittertind.Sherpa.Library.ContentTypes.Model
{
    public sealed class GtCalculatedProps
    {
        public GtResultType ResultType { get; set; }
        public string Formula { get; set; }
        public List<GtFieldRefs> FieldRefs { get; set; }
    }
}