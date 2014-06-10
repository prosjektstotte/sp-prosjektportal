using System;

namespace Glittertind.Sherpa.Library.ContentTypes.Model
{
    public class GtField
    {
        public Guid ID { get; set; }
        public string InternalName { get; set; }
        public string DisplayName { get; set; }
        public string Description { get; set; }
        public string Group { get; set; }
        public string Type { get; set; }
        public bool IsTaxonomyField { get; set; }
        public bool IsTaxonomyFieldMulti { get; set; }
        public Guid SspId { get; set; }
        public Guid TermSetId { get; set; }

        public GtField()
        {
            Group = "Glittertind Områdekolonner";
        }

        public void InitializeTaxonomyProperties(Guid termStoreId)
        {
            if (Type.StartsWith("TaxonomyFieldType"))
            {
                SspId = termStoreId;
                IsTaxonomyField = true;
                if (Type.Equals("TaxonomyFieldTypeMulti")) IsTaxonomyFieldMulti = true;
            }
        }

        public string GetFieldAsXml()
        {
            return GetFieldAsXml(false);
        }

        public string GetFieldAsXml(bool required)
        {
            if (IsTaxonomyField)
            {
                return GetFieldXml(required,
                    String.Format("ShowField=\"Term1033\" {0}",
                        IsTaxonomyFieldMulti ? "Mult=\"TRUE\"" : "Indexed=\"TRUE\""));
            }
            return GetFieldXml(required, string.Empty);
        }

        private string GetFieldXml(bool required, string additionalProperties)
        {
            return String.Format(
                "<Field ID=\"{0}\" Name=\"{1}\" DisplayName=\"{2}\" Type=\"{3}\" Hidden=\"False\" Group=\"{4}\" Description=\"{5}\" Required=\"{6}\" {7} />",
                ID.ToString("B"), InternalName, DisplayName, Type, Group, Description, required.ToString().ToUpper(), additionalProperties);
        }

        public override string ToString()
        {
            return GetFieldAsXml();
        }
    }
}
