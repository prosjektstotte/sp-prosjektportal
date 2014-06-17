using System.IO;
using System.Web.Script.Serialization;

namespace Glittertind.Sherpa.Library
{
    public class FilePersistanceProvider<T> : IPersistanceProvider<T>
    {
        public string Path { get; set; }

        public FilePersistanceProvider(string path)
        {
            Path = path;
        }

        public void Save(T poco)
        {
            var jsonSerializer = new JavaScriptSerializer();
            var result = jsonSerializer.Serialize(poco);
            File.WriteAllText(Path, result);
        }

        public T Load()
        {
            var jsonSerializer = new JavaScriptSerializer();
            using (var reader = new StreamReader(Path))
            {
                var json = reader.ReadToEnd();
                var result = jsonSerializer.Deserialize<T>(json);
                return result;
            }
        }
    }
}
