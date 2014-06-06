using Glittertind.Sherpa.Library.Taxonomy.Model;

namespace Glittertind.Sherpa.Library.Taxonomy
{
    public interface IPersistanceProvider
    {
        void Save(TermItemBase terms);
        T Load<T>();
    }
}
