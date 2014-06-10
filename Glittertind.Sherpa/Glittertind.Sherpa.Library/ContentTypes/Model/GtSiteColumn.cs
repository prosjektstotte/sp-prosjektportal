using System;
using Glittertind.Sherpa.Library.Taxonomy.Model;

namespace Glittertind.Sherpa.Library.ContentTypes.Model
{
    public class GtSiteColumn
    {
        public Guid ID { get; set; }
        public string InternalName { get; set; }
        public string DisplayName { get; set; }
        public string Description { get; set; }
        public string Group { get; set; }
        public string Type { get; set; }
        public bool IsTaxonomyField { get; set; }
        public bool IsTaxonomyFieldMulti { get; set; }
        public Guid TermStoreId { get; set; }
        public Guid TermSetId { get; set; }

        public GtSiteColumn()
        {
            Group = "Glittertind Områdekolonner";
        }

        public void InitializeTaxonomyProperties(Guid termStoreId)
        {
            TermStoreId = termStoreId;
            if (Type.StartsWith("TaxonomyFieldType"))
            {
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
                return GetTaxonomyFieldAsXml(required);
            } 
            return String.Format(
                    "<Field ID=\"{0}\" Name=\"{1}\" DisplayName=\"{2}\" Type=\"{3}\" Hidden=\"False\" Group=\"{4}\" Description=\"{5}\" Required=\"{6}\" />",
                    ID.ToString("B"), InternalName, DisplayName, Type, Group, Description, required.ToString().ToUpper());
        }

        internal string GetTaxonomyFieldAsXml(bool required)
        {
            Guid hiddenTextFieldId = Guid.NewGuid();
            string multiOrSingle = IsTaxonomyFieldMulti ? "Mult=\"TRUE\"" : "Indexed=\"TRUE\"";

            string taxField = string.Format("<Field Type=\"{0}\" DisplayName=\"{1}\" ID=\"{8}\" ShowField=\"Term1033\" Required=\"{2}\" EnforceUniqueValues=\"FALSE\" {3} Sortable=\"FALSE\" Name=\"{4}\"  Group=\"{9}\"><Default/><Customization><ArrayOfProperty><Property><Name>SspId</Name><Value xmlns:q1=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q1:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">{5}</Value></Property><Property><Name>GroupId</Name></Property><Property><Name>TermSetId</Name><Value xmlns:q2=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q2:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">{6}</Value></Property><Property><Name>AnchorId</Name><Value xmlns:q3=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q3:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">00000000-0000-0000-0000-000000000000</Value></Property><Property><Name>UserCreated</Name><Value xmlns:q4=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q4:boolean\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">false</Value></Property><Property><Name>Open</Name><Value xmlns:q5=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q5:boolean\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">false</Value></Property><Property><Name>TextField</Name><Value xmlns:q6=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q6:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">{7}</Value></Property><Property><Name>IsPathRendered</Name><Value xmlns:q7=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q7:boolean\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">true</Value></Property><Property><Name>IsKeyword</Name><Value xmlns:q8=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q8:boolean\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">false</Value></Property><Property><Name>TargetTemplate</Name></Property><Property><Name>CreateValuesInEditForm</Name><Value xmlns:q9=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q9:boolean\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">false</Value></Property><Property><Name>FilterAssemblyStrongName</Name><Value xmlns:q10=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q10:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">Microsoft.SharePoint.Taxonomy, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c</Value></Property><Property><Name>FilterClassName</Name><Value xmlns:q11=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q11:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">Microsoft.SharePoint.Taxonomy.TaxonomyField</Value></Property><Property><Name>FilterMethodName</Name><Value xmlns:q12=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q12:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">GetFilteringHtml</Value></Property><Property><Name>FilterJavascriptProperty</Name><Value xmlns:q13=\"http://www.w3.org/2001/XMLSchema\" p4:type=\"q13:string\" xmlns:p4=\"http://www.w3.org/2001/XMLSchema-instance\">FilteringJavascript</Value></Property></ArrayOfProperty></Customization></Field>",
                Type,
                DisplayName,
                required.ToString().ToUpper(),
                multiOrSingle,
                InternalName,
                TermStoreId.ToString("D"),
                TermSetId.ToString("D"),
                hiddenTextFieldId.ToString("B"),
                ID.ToString("B"),
                Group
            );
            return taxField;
        }
        public override string ToString()
        {
            return GetFieldAsXml();
        }
    }
}
