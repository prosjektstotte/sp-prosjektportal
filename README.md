Prosjektportal for SharePoint
=================

Prosjektportal for SharePoint (kodenavn "Glittertind") er et prosjektstyringsverktøy for SharePoint Online og SharePoint 2013. Det bruker  [<a href="https://github.com/sharepoint-sherpa/sherpa">Sherpa </a>] for installasjon.

Dette prosjektet består i dag av to ulike løsninger, Sherpa og Glittertind.
* Sherpa et en kommandolinjeapplikasjon for å installere SharePoint-løsnignen til SharePoint Online og On-Prem. 
* Glittertind er et SharePoint-prosjekt for prosjektstyring basert på prosjektveiviseren.no

## Sherpa
### Hva er Sherpa?   
* Sherpa er laget for å installere tilpasninger og konfigurere SharePoint for både SharePoint 2013 On-Premises og SharePoint Online.
* Sherpa hjelper deg til å
  * Sette opp taksonomi (grupper, term set, termer) 
  * Laste opp, aktivere samt oppgradere sandbox-løsninger
  * Sette opp felter og innholdstyper i områdesamlingen
  * Aktivere funksjoner i områdesamlingen
  * Deaktivere og aktivere funksjoner etter oppgradering

### Hvordan fungerer Sherpa? 
* Sherpa er en samling av hjelpefunksjoner som snakker med SharePoint via CSOM. 
  * Dette betyr at Sherpa kan kommunisere med både SharePoint 2013 On-Prem og SharePoint Online. 
* Det medfølger en konsollapplikasjon som bruker disse hjelpefunksjonene. 
  * Konsollapplikasjonen leser fra flere konfigurasjonsfiler. 
  * Konsollapplikasjonen har et enkelt brukergrensesnitt for å utføre de ulike funksjonene Sherpa kan gjøre. 

### Hvordan komme i gang?
1. Last ned Sherpa fra Github (foreløpig kun mulig å laste ned som en Visual Studio solution) [<a href="https://github.com/sharepoint-sherpa/sherpa">herfra. </a>] 
2. Endre konfigurasjonsfilene til ditt behov 
3. Bygg løsningen og naviger til output-mappen til applikasjonen (typisk ‘rot/sp-prosjektportal\Glittertind.Sherpa\Glittertind.Sherpa.Installer\bin\Debug') 
4. Legg evt. SharePoint sandbox-løsninger i en mappe som heter solutions i samme mappe som applikasjonen ligger
5. Start Sherpa.exe applikasjonen i et kommandolinjevindu og angi parameterne url, username og om applikasjonen skal koble seg til SharePoint Online
  * Sherpa.exe --help for hjelpetekst
6. Sherpa autentiserer brukeren og dersom vellykket velger en hvilke funksjoner som skal utføres

### Kjente begrensninger
* For On-Premises installasjon må applikasjonen kjøre på samme server som SharePoint
* For On-Premises installasjon kjører applikasjonen utelukkende i kontekst av innlogget bruker

### Sherpa Feature Requests
* Mulighet for flere term-nivåer
* Mulighet for å opprette termobjekter uten å måtte spesifisere GUID
* Mulighet for å opprette områder og områdehierarki fra json-konfig
* Separer Sherpa og Glittertind på Github

## Glittertind
Glittertind er kodenavnet for prosjektportalen for SharePoint som er bygget på bestilling for Asker Kommune. Glittertind inneholder SharePoint-artefakter som til sammen utgjør et prosjektstyringsverktøy. Det blir satt opp en portefølgeside der en får en oversikt over eksisterende prosjekter og kan opprette nye prosjektrom. Hvert prosjekt oppretter en del lister, en del standardelementer og logikk for å gjennomføre et prosjekt etter prosjektveiviserens modell. Prosjektveiviseren er Difis anbefalte prosjektmodell for gjennomføring av digitaliseringsprosjekter i offentlige virksomheter.

Glittertind installeres med Sherpa.

## Relevante ressurser
* JSON Prettifier: http://www.uize.com/examples/json-prettifier.html
* Prosjektveiviseren: http://www.prosjektveiviseren.no/

# Maintainers
Tarjei Ormestøyl [<a href="mailto:tarjeieo@puzzlepart.com">tarjeieo@puzzlepart.com</a>], 
Ole Kristian Mørch-Storstein [<a href="mailto:olekms@puzzlepart.com">olekms@puzzlepart.com</a>]