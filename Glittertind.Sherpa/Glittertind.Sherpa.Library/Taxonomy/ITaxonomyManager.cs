using Glittertind.Sherpa.Library.Taxonomy.Model;

namespace Glittertind.Sherpa.Library.Taxonomy
{
    public interface ITaxonomyManager
    {
        void WriteTaxonomyToTermStore();
        void ValidateConfiguration(GtTermSetGroup group);
    }
}
