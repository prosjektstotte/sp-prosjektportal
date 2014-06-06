namespace Glittertind.Sherpa.Library
{
    public interface IPersistanceProvider<T>
    {
        void Save(T terms);
        T Load();
    }
}
