using System.Collections.Generic;
using System.Linq;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.ContentTypes
{
    public class ContentTypeManager : IContentTypeManager
    {
        /// <summary>
        /// Currently does not work
        /// </summary>
        /// <param name="cc"></param>
        /// <param name="contentTypes"></param>
        public void CreateContentTypes(ClientContext cc, List<GtContentType> contentTypes)
        {
            Web web = cc.Web;
            ContentTypeCollection existingContentTypes = web.ContentTypes;
            cc.Load(existingContentTypes);
            cc.ExecuteQuery();

            foreach (GtContentType contentType in contentTypes)
            {
                if (Enumerable.Any(existingContentTypes, item => item.StringId == contentType.ID))
                {
                    continue;
                }

                existingContentTypes.Add(contentType.GetContentTypeCreationInformation());
                cc.ExecuteQuery();
            }
        }

        public void CreateSiteColumns(ClientContext cc, List<GtSiteColumn> siteColumns)
        {
            Web web = cc.Web;
            FieldCollection fields = web.Fields;
            cc.Load(fields);
            cc.ExecuteQuery();

            foreach (GtSiteColumn siteColumn in siteColumns)
            {
                if (Enumerable.Any(fields, item => item.InternalName == siteColumn.InternalName))
                {
                    continue;
                }
                Field fld = fields.AddFieldAsXml(siteColumn.GetFieldAsXml(), true, AddFieldOptions.DefaultValue);
                cc.Load(fields);
                cc.Load(fld);
                cc.ExecuteQuery();
            }
        }

        public void AddSiteColumnsToContentType(ClientContext cc, GtContentType configContentType)
        {
            Web web = cc.Web;
            ContentTypeCollection contentTypes = web.ContentTypes;
            cc.Load(contentTypes);
            cc.ExecuteQuery();
            ContentType contentType = contentTypes.GetById(configContentType.ID);
            FieldCollection fields = web.Fields;
            cc.Load(contentType);
            cc.Load(fields);
            cc.ExecuteQuery();

            foreach (var fieldName in configContentType.SiteColumnsInternalNames)
            {
                Field fld = fields.GetByInternalNameOrTitle(fieldName);
                FieldLinkCollection contentTypeFields = contentType.FieldLinks;
                cc.Load(fld);
                cc.Load(contentTypeFields);
                cc.ExecuteQuery();

                if (Enumerable.Any(contentTypeFields, existingFieldName => existingFieldName.Name == fieldName))
                {
                    continue;
                }

                FieldLinkCreationInformation link = new FieldLinkCreationInformation {Field = fld};
                contentType.FieldLinks.Add(link);
                contentType.Update(true);
                cc.ExecuteQuery();    
            }
        }
    }
}
