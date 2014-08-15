using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using Glittertind.Sherpa.Library.ContentTypes.Model;
using Glittertind.Sherpa.Library.Taxonomy;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Taxonomy;

namespace Glittertind.Sherpa.Library.ContentTypes
{
    public class ContentTypeManager : IContentTypeManager
    {
        public ClientContext ClientContext { get; set; }

        private List<GtContentType> ContentTypes { get; set; }
        private List<GtField> Fields { get; set; }

        /// <summary>
        /// For creating fields and content types
        /// </summary>
        public ContentTypeManager(Uri urlToSite, ICredentials credentials, List<GtContentType> contentTypes, List<GtField> fields)
        {
            ClientContext = new ClientContext(urlToSite)
            {
                AuthenticationMode = ClientAuthenticationMode.Default,
                Credentials = credentials
            };

            Fields = fields;
            SetTaxonomyFieldConfig();

            ContentTypes = contentTypes;
            ValidateConfiguration();
        }

        private void SetTaxonomyFieldConfig()
        {
            var termStoreId = new TaxonomyManager(new Uri(ClientContext.Url), ClientContext.Credentials, null).GetTermStoreId();
            foreach (GtField field in Fields.Where(column => column.Type.StartsWith("TaxonomyFieldType")))
            {
                field.InitializeTaxonomyProperties(termStoreId);
            }
        }

        public void CreateSiteColumns()
        {
            Web web = ClientContext.Web;
            FieldCollection webFieldCollection = web.Fields;
            ClientContext.Load(webFieldCollection);
            ClientContext.ExecuteQuery();

            foreach (GtField field in Fields.Where(field => !webFieldCollection.Any(item => item.InternalName == field.InternalName)))
            {
                if (field.Type.StartsWith("TaxonomyFieldType"))
                {
                    DeleteHiddenFieldForTaxonomyField(webFieldCollection, field.ID);
                    CreateTaxonomyField(field, webFieldCollection);
                }
                else
                {
                    CreateField(field, webFieldCollection);
                }
            }
        }

        private void CreateField(GtField field, FieldCollection fields)
        {
            var fieldXml = field.GetFieldAsXml();
            Field newField = fields.AddFieldAsXml(fieldXml, true, AddFieldOptions.AddFieldInternalNameHint);
            ClientContext.Load(newField);
            ClientContext.ExecuteQuery();
        }

        private void CreateTaxonomyField(GtField field, FieldCollection fields)
        {
            var fieldSchema = field.GetFieldAsXml();
            var newField = fields.AddFieldAsXml(fieldSchema, false, AddFieldOptions.AddFieldInternalNameHint);
            ClientContext.Load(newField);
            ClientContext.ExecuteQuery();

            var newTaxonomyField = ClientContext.CastTo<TaxonomyField>(newField);
            newTaxonomyField.SspId = field.SspId;
            newTaxonomyField.TermSetId = field.TermSetId;
            newTaxonomyField.TargetTemplate = String.Empty;
            newTaxonomyField.AnchorId = Guid.Empty;
            newTaxonomyField.Update();
            ClientContext.ExecuteQuery();
        }

        public void CreateContentTypes()
        {
            Web web = ClientContext.Web;
            ContentTypeCollection existingContentTypes = web.ContentTypes;
            ClientContext.Load(existingContentTypes);
            ClientContext.ExecuteQuery();

            foreach (GtContentType contentType in ContentTypes)
            {
                if ( existingContentTypes.Any( item => item.Id.ToString().Equals(contentType.ID.ToString(CultureInfo.InvariantCulture)) ) )
                {
                    // We want to add fields even if the content type exists (?)
                    AddSiteColumnsToContentType(contentType);
                }
                else
                {
                    var contentTypeCreationInformation = contentType.GetContentTypeCreationInformation();
                    var newContentType = existingContentTypes.Add(contentTypeCreationInformation);
                    ClientContext.ExecuteQuery();

                    // Update display name (internal name will not be changed)
                    newContentType.Name = contentType.DisplayName;
                    newContentType.Update(true);
                    ClientContext.ExecuteQuery();

                    AddSiteColumnsToContentType(contentType);
                }

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

            foreach (var fieldName in configContentType.Fields)
            {
                // Need to load content type fields every iteration because fields are added to the collection
                Field webField = fields.GetByInternalNameOrTitle(fieldName);
                FieldLinkCollection contentTypeFields = contentType.FieldLinks;
                ClientContext.Load(contentTypeFields);
                ClientContext.Load(webField);
                ClientContext.ExecuteQuery();

                if (Enumerable.Any(contentTypeFields, existingFieldName => existingFieldName.Name == fieldName))
                {
                    continue;
                }

                var link = new FieldLinkCreationInformation { Field = webField };
                var fieldLink = contentType.FieldLinks.Add(link);
                fieldLink.Required = configContentType.RequiredFields.Contains(fieldName);
                contentType.Update(true);
                ClientContext.ExecuteQuery();
            }
        }

        /// <summary>
        /// When a taxonomy field is added, a hidden field is automatically created with the syntax [random letter] + [field id on "N" format]
        /// If a taxonomy field is deleted and then readded, an exception will be thrown if this field is not deleted first.
        /// See  http://blogs.msdn.com/b/boodablog/archive/2014/06/07/a-duplicate-field-name-lt-guid-gt-was-found-re-creating-a-taxonomy-field-using-the-client-object-model.aspx
        /// </summary>
        /// <param name="fields"></param>
        /// <param name="fieldId"></param>
        private void DeleteHiddenFieldForTaxonomyField(FieldCollection fields, Guid fieldId)
        {
            string hiddenFieldName = fieldId.ToString("N").Substring(1);
            var field = fields.FirstOrDefault(f => f.InternalName.EndsWith(hiddenFieldName));
            if (field != null)
            {
                field.DeleteObject();
                ClientContext.ExecuteQuery();
            }
        }

        public void DeleteAllCustomFieldsAndContentTypes()
        {
            Web web = ClientContext.Web;
            ContentTypeCollection existingContentTypes = web.ContentTypes;
            ClientContext.Load(existingContentTypes);
            ClientContext.ExecuteQuery();

            var contentTypeGroups = new List<string>();
            foreach (GtContentType contentType in ContentTypes.Where(contentType => !contentTypeGroups.Contains(contentType.Group)))
            {
                contentTypeGroups.Add(contentType.Group);
            }
            List<ContentType> contentTypes = existingContentTypes.ToList().OrderBy(ct => ct.Id.ToString()).Where(ct => contentTypeGroups.Contains(ct.Group)).ToList();

            for (int i = contentTypes.Count - 1; i >= 0; i--)
            {
                contentTypes[i].DeleteObject();
                try
                {
                    ClientContext.ExecuteQuery();
                }
                catch
                {
                    Console.WriteLine("Could not delete content type '" + contentTypes[i].DisplayFormTemplateName + "' (internal name: " + contentTypes[i].Name + " , Id: " + contentTypes[i].Id + "). This is most probably due to it being in use");
                }

            }

            FieldCollection webFieldCollection = web.Fields;
            ClientContext.Load(webFieldCollection);
            ClientContext.ExecuteQuery();

            var fieldGroups = new List<string>();
            foreach (GtField field in Fields.Where(f => !fieldGroups.Contains(f.Group)))
            {
                fieldGroups.Add(field.Group);
            }
            for (int i = webFieldCollection.Count - 1; i >= 0; i--)
            {
                if (fieldGroups.Contains(webFieldCollection[i].Group))
                {
                    webFieldCollection[i].DeleteObject();
                    try
                    {
                        ClientContext.ExecuteQuery();
                    }
                    catch
                    {
                        Console.WriteLine("Could not delete site column '" + webFieldCollection[i].Title + "' (" + webFieldCollection[i].InternalName + "). This is most probably due to it being in use");
                    }
                }
            }
        }

        public void DisposeContext()
        {
            if (ClientContext != null)
            {
                ClientContext.Dispose();
            }
        }

        public void ValidateConfiguration()
        {
            var fieldIdsForEnsuringUniqueness = new List<Guid>();
            var fieldNamesForEnsuringUniqueness = new List<string>();
            foreach (var field in Fields)
            {
                if (fieldIdsForEnsuringUniqueness.Contains(field.ID))
                    throw new NotSupportedException("One or more fields have the same Id which is not supported. Field Id " + field.ID);
                if (fieldNamesForEnsuringUniqueness.Contains(field.InternalName))
                    throw new NotSupportedException("One or more fields have the same InternalName which is not supported. Field Id " + field.InternalName);

                fieldIdsForEnsuringUniqueness.Add(field.ID);
                fieldNamesForEnsuringUniqueness.Add(field.InternalName);
            }

            var contentTypeIdsForEnsuringUniqueness = new List<string>();
            var contentTypeInternalNamesForEnsuringUniqueness = new List<string>();
            foreach (var contentType in ContentTypes)
            {
                if (contentTypeIdsForEnsuringUniqueness.Contains(contentType.ID))
                    throw new NotSupportedException("One or more content types have the same Id which is not supported. Content Type Id " + contentType.ID);
                if (contentTypeInternalNamesForEnsuringUniqueness.Contains(contentType.InternalName))
                    throw new NotSupportedException("One or more content types have the same InternalName which is not supported. Content Type Id " + contentType.InternalName);

                contentTypeIdsForEnsuringUniqueness.Add(contentType.ID);
                contentTypeInternalNamesForEnsuringUniqueness.Add(contentType.InternalName);
            }
        }
    }
}
