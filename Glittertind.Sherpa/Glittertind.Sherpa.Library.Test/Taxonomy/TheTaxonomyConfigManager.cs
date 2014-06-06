using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Glittertind.Sherpa.Library.Taxonomy;
using Glittertind.Sherpa.Library.Taxonomy.Model;
using NUnit.Framework;

namespace Glittertind.Sherpa.Library.Test.Taxonomy
{
    [TestFixture]
    class TheTaxonomyConfigManager
    {
        private TaxonomyManager _underTest = new TaxonomyManager("xxxx","xxxx","https://xxxx.sharepoint.com", 1033, new MockTaxonmyPersistanceProvider());
        [SetUp]

        public void SetUp()
        {
        }

        [Test]
        public void ShouldWriteTaxonomyToTermStore()
        {
            _underTest.WriteTaxonomyToTermStore();
        }

        public TermSetGroup BuildTaxonomy()
        {
            var termSetGroup = new TermSetGroup(new Guid("c56bb677-f782-4cf6-a6d6-17685ee9f19d"), "Glittertind");
            var tjenesteOmrade = new TermSet(new Guid("99af1a25-88c1-4781-a05c-8446928d3fdd"), "Tjenesteområde");

            tjenesteOmrade.Terms.Add(new Term(new Guid("46475d37-c854-439e-b04b-2433f2dc2566"), "Arbeid"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("88058353-ac05-4652-a4fc-690b649ab03a"), "Barn og familie"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("ab3dd407-a44b-4783-aa45-481fb9f564ba"), "Bolig og eiendom"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("6479faf1-3141-46ef-94d6-fc65e8f51448"), "Forbrukerspørsmål"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("8b3870f8-59a2-4cef-a281-19228b286bbf"), "Helse"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("e302dff1-4fb3-4d86-894a-f3bd769f4764"), "Individ og samfunn"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("8d1082d0-a44d-452d-baef-212b938c5102"), "Innvandring og integrering"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("27805ae3-5749-44d9-94a7-146eedb06cfb"), "Kultur, idrett og fritid"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("40191080-4a2a-4b8f-9c76-c31be95ae5d4"), "Næring"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("b81d2835-beae-41ae-a810-89cf1bea480f"), "Natur og miljø"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("1d2c7635-142c-48b9-a218-1107dae02478"), "Omsorg, trygd og sosiale tjenester"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("f0cd3add-0115-4f3d-9971-2b7e1215a059"), "Rettslige spørsmål"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("1cc62a1d-2bc2-4b0f-ba14-8f3fe6fd25fc"), "Skatter og avgifter"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("adbf99fa-a7b2-492e-bfbf-23c8d0b7b2a1"), "Skole og utdanning"));
            tjenesteOmrade.Terms.Add(new Term(new Guid("486fc975-9717-4ced-a905-559f88fc5424"), "Trafikk, reiser og samferdsel"));

            termSetGroup.TermSets.Add(tjenesteOmrade);

            var fase = new TermSet(new Guid("abcfc9d9-a263-4abb-8234-be973c46258a"), "Fase");
            fase.Terms.Add(new Term(new Guid("99e85650-33de-4af4-b8db-edffbc8a310b"), "Konsept"));
            fase.Terms.Add(new Term(new Guid("cda4f1e1-3488-4e57-8a04-6973df239689"), "Planlegge"));
            fase.Terms.Add(new Term(new Guid("99d7765a-c786-4792-a1a1-866ef0f982b9"), "Gjennomføre"));
            fase.Terms.Add(new Term(new Guid("30e03c52-8c3e-4cfe-9b18-ca71593ce130"), "Avslutte"));
            fase.Terms.Add(new Term(new Guid("b7ba84f0-70b9-45c4-8c50-8f73bf15bbec"), "Realisere"));

            termSetGroup.TermSets.Add(fase);

            return termSetGroup;

        }

    }

    internal class MockTaxonmyPersistanceProvider : IPersistanceProvider
    {
        private string _cannedJson =
              "{\"TermSets\":[{\"Terms\":[{\"Terms\":[],\"Title\":\"Arbeid\",\"Id\":\"46475d37-c854-439e-b04b-2433f2dc2566\"},{\"Terms\":[],\"Title\":\"Barn og familie\",\"Id\":\"88058353-ac05-4652-a4fc-690b649ab03a\"},{\"Terms\":[],\"Title\":\"Bolig og eiendom\",\"Id\":\"ab3dd407-a44b-4783-aa45-481fb9f564ba\"},{\"Terms\":[],\"Title\":\"Forbrukerspørsmål\",\"Id\":\"6479faf1-3141-46ef-94d6-fc65e8f51448\"},{\"Terms\":[],\"Title\":\"Helse\",\"Id\":\"8b3870f8-59a2-4cef-a281-19228b286bbf\"},{\"Terms\":[],\"Title\":\"Individ og samfunn\",\"Id\":\"e302dff1-4fb3-4d86-894a-f3bd769f4764\"},{\"Terms\":[],\"Title\":\"Innvandring og integrering\",\"Id\":\"8d1082d0-a44d-452d-baef-212b938c5102\"},{\"Terms\":[],\"Title\":\"Kultur, idrett og fritid\",\"Id\":\"27805ae3-5749-44d9-94a7-146eedb06cfb\"},{\"Terms\":[],\"Title\":\"Næring\",\"Id\":\"40191080-4a2a-4b8f-9c76-c31be95ae5d4\"},{\"Terms\":[],\"Title\":\"Natur og miljø\",\"Id\":\"b81d2835-beae-41ae-a810-89cf1bea480f\"},{\"Terms\":[],\"Title\":\"Omsorg, trygd og sosiale tjenester\",\"Id\":\"1d2c7635-142c-48b9-a218-1107dae02478\"},{\"Terms\":[],\"Title\":\"Rettslige spørsmål\",\"Id\":\"f0cd3add-0115-4f3d-9971-2b7e1215a059\"},{\"Terms\":[],\"Title\":\"Skatter og avgifter\",\"Id\":\"1cc62a1d-2bc2-4b0f-ba14-8f3fe6fd25fc\"},{\"Terms\":[],\"Title\":\"Skole og utdanning\",\"Id\":\"adbf99fa-a7b2-492e-bfbf-23c8d0b7b2a1\"},{\"Terms\":[],\"Title\":\"Trafikk, reiser og samferdsel\",\"Id\":\"486fc975-9717-4ced-a905-559f88fc5424\"}],\"Title\":\"Tjenesteområde\",\"Id\":\"99af1a25-88c1-4781-a05c-8446928d3fdd\"},{\"Terms\":[{\"Terms\":[],\"Title\":\"Konsept\",\"Id\":\"99e85650-33de-4af4-b8db-edffbc8a310b\"},{\"Terms\":[],\"Title\":\"Planlegge\",\"Id\":\"cda4f1e1-3488-4e57-8a04-6973df239689\"},{\"Terms\":[],\"Title\":\"Gjennomføre\",\"Id\":\"99d7765a-c786-4792-a1a1-866ef0f982b9\"},{\"Terms\":[],\"Title\":\"Avslutte\",\"Id\":\"30e03c52-8c3e-4cfe-9b18-ca71593ce130\"},{\"Terms\":[],\"Title\":\"Realisere\",\"Id\":\"b7ba84f0-70b9-45c4-8c50-8f73bf15bbec\"}],\"Title\":\"Fase\",\"Id\":\"abcfc9d9-a263-4abb-8234-be973c46258a\"}],\"Title\":\"Glittertind\",\"Id\":\"c56bb677-f782-4cf6-a6d6-17685ee9f19d\"}";

        public string Result { get; set; }
        public void Save(TermItemBase termSet)
        {
            var jsonSerializer = new JavaScriptSerializer();
            var result = jsonSerializer.Serialize(termSet);
            Result = result;
        }

        public T Load<T>()
        {
            var jsonSerializer = new JavaScriptSerializer();
            var result = jsonSerializer.Deserialize<T>(_cannedJson);
            return result;
        }
        
        
    }



}
