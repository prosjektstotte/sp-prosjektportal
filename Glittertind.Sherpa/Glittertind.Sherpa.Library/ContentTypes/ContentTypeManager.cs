using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Microsoft.SharePoint.Client;

namespace Glittertind.Sherpa.Library.ContentTypes
{
    public class ContentTypeManager : IContentTypeManager
    {
        public ClientContext ClientContext { get; set; }
        public ContentTypeManager(string urlToSite, ICredentials credentials)
        {
            ClientContext = new ClientContext(urlToSite)
            {
                AuthenticationMode = ClientAuthenticationMode.Default,
                Credentials = credentials
            };
        }

        public void CreateSiteColumns(List<GtSiteColumn> siteColumns)
        {
            Web web = ClientContext.Web;
            FieldCollection fields = web.Fields;
            ClientContext.Load(fields);
            ClientContext.ExecuteQuery();

            foreach (GtSiteColumn siteColumn in siteColumns)
            {
                if (Enumerable.Any(fields, item => item.InternalName == siteColumn.InternalName))
                {
                    continue;
                }
                DeleteHiddenFieldForTaxonomyField(ClientContext, fields, siteColumn.ID);

                var fieldXml = siteColumn.GetFieldAsXml();
                Field fld = fields.AddFieldAsXml(fieldXml, true, AddFieldOptions.AddFieldInternalNameHint);
                ClientContext.Load(fields);
                ClientContext.Load(fld);
                ClientContext.ExecuteQuery();
            }
        }

        /// <summary>
        /// When a taxonomy field is added, a hidden field is automatically created with the syntax [random letter] + [field id on "N" format]
        /// If a taxonomy field is deleted and then readded, an exception will be thrown if this field is not deleted first.
        /// See  http://blogs.msdn.com/b/boodablog/archive/2014/06/07/a-duplicate-field-name-lt-guid-gt-was-found-re-creating-a-taxonomy-field-using-the-client-object-model.aspx
        /// </summary>
        /// <param name="cc"></param>
        /// <param name="fields"></param>
        /// <param name="fieldId"></param>
        private void DeleteHiddenFieldForTaxonomyField(ClientContext cc, FieldCollection fields, Guid fieldId)
        {
            string hiddenFieldName = fieldId.ToString("N").Substring(1);
            var field = fields.FirstOrDefault(f => f.InternalName.EndsWith(hiddenFieldName));
            if (field != null)
            {
                field.DeleteObject();
                cc.ExecuteQuery();
            }
        }

        public void CreateContentTypes(List<GtContentType> contentTypes)
        {
            Web web = ClientContext.Web;
            ContentTypeCollection existingContentTypes = web.ContentTypes;
            ClientContext.Load(existingContentTypes);
            ClientContext.ExecuteQuery();

            foreach (GtContentType contentType in contentTypes)
            {
                if (Enumerable.Any(existingContentTypes, item => item.Name == contentType.InternalName))
                {
                    continue;
                }

                var contentTypeCreationInformation = contentType.GetContentTypeCreationInformation();
                var newContentType = existingContentTypes.Add(contentTypeCreationInformation);
                ClientContext.ExecuteQuery();

                AddSiteColumnsToContentType(contentType);
            }
        }

        private void AddSiteColumnsToContentType(GtContentType configContentType)
        {
            Web web = ClientContext.Web;
            ContentTypeCollection contentTypes = web.ContentTypes;
            ClientContext.Load(contentTypes);
            ClientContext.ExecuteQuery();
            ContentType contentType = contentTypes.GetById(configContentType.ID);
            FieldCollection fields = web.Fields;
            ClientContext.Load(contentType);
            ClientContext.Load(fields);
            ClientContext.ExecuteQuery();

            foreach (var fieldName in configContentType.SiteColumnsInternalNames)
            {
                Field webField = fields.GetByInternalNameOrTitle(fieldName);
                FieldLinkCollection contentTypeFields = contentType.FieldLinks;
                ClientContext.Load(webField);
                ClientContext.Load(contentTypeFields);
                ClientContext.ExecuteQuery();

                if (Enumerable.Any(contentTypeFields, existingFieldName => existingFieldName.Name == fieldName))
                {
                    continue;
                }

                var link = new FieldLinkCreationInformation {Field = webField};
                contentType.FieldLinks.Add(link);
                contentType.Update(true);
                ClientContext.ExecuteQuery();    
            }
        }

        public void DisposeContext()
        {
            if (ClientContext != null)
            {
                ClientContext.Dispose();
            }
        }
    }
}
