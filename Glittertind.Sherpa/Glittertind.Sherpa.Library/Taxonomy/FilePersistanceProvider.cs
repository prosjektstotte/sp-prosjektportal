using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Glittertind.Sherpa.Library.Taxonomy.Model;

namespace Glittertind.Sherpa.Library.Taxonomy
{
    public class FilePersistanceProvider : IPersistanceProvider
    {
        public string Path { get; set; }

        public void Save(TermItemBase termSet)
        {
            var jsonSerializer = new JavaScriptSerializer();
            var result = jsonSerializer.Serialize(termSet);
            
        }

        public T Load<T>()
        {
            var jsonSerializer = new JavaScriptSerializer();
            var result = jsonSerializer.Deserialize<T>("");
            return result;
            
        }
        
    }
}
