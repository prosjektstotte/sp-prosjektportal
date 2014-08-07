Prosjektportal for SharePoint
=================

Dette prosjektet består i dag av to ulike løsninger, Sherpa og Glittertind.
* Sherpa et en kommandolinjeapplikasjon for å installere SharePoint-løsnignen til SharePoint Online og On-Prem. 
* Glittertind er et SharePoint-prosjekt for prosjektstyring basert på prosjektveiviseren.no

## Sherpa
### Hva er Sherpa?   
* Sherpa er laget for å håndtere utfordringen med å installere og sette opp SharePoint tilpasninger på både SharePoint 2013 On-Premises og SharePoint Online.
* Sherpa gir deg muligheten til følgende 
  * Sette opp taksonomi (grupper, term set, termer) fra konfigurasjonsfil  
  * Laste opp, aktivere samt oppgradere sandkasseløsninger 
  * Sette opp felter og innholdstyper i områdesamling 
  * Aktivere funksjoner i områdesamling 
  * Deaktivere og aktivere funksjoner etter oppgradering

### Hvordan fungerer det? 
* Sherpa er i utgangspunktet et klassebibliotek av hjelpefunksjoner som snakker med SharePoint via klientside objektmodellen (CSOM). Dette betyr at Sherpa kan kommunisere med både SharePonint 2013 On-Prem og SharePoint Online. 
* Vi har utviklet en konsollapplikasjon som bruker klassebiblioteket. Konsollapplikasjonen leser fra flere konfigurasjonsfiler. Konsollapplikasjonen har et enkelt brukergrensesnitt for å utføre de ulike funksjonene Sherpa kan gjøre. 

### Hvordan kommer jeg i gang?
* Last ned Sherpa fra Github (foreløpig kun mulig å laste ned som en Visual Studio solution). 
* Endre konfigurasjonsfilene til ditt behov 
* Bygg løsningen og naviger til output-mappen til applikasjonen (typisk 'rot/sp-prosjektportal\Glittertind.Sherpa\Glittertind.Sherpa.Installer\bin\Debug') 
* Legg evt. SharePoint sandkasseløsninger i en mappe som heter solutions her 
* Start applikasjonen i et kommandolinjevindu med --help som parameter for å se hvilke parametere som sherpa bruker.  
* Sherpa har nå startet og etter å ha autentisert en kan velge hvilke funksjoner som skal utføres.

## Glittertind
Glittertind er kodenavnet for prosjektportalen for SharePoint som er bygget på bestilling for Asker Kommune. Glittertind inneholder SharePoint-artefakter som til sammen utgjør et prosjektstyringsverktøy. Det blir satt opp en portefølgeside der en får en oversikt over eksisterende prosjekter og kan opprette nye prosjektrom. Hvert prosjekt oppretter en del lister, en del standardelementer og logikk for å gjennomføre et prosjekt etter prosjektveiviserens modell. Prosjektveiviseren er Difis anbefalte prosjektmodell for gjennomføring av digitaliseringsprosjekter i offentlige virksomheter.

Glittertind installeres med Sherpa.

## Relevante ressurser
* JSON Prettifier: http://www.uize.com/examples/json-prettifier.html
* Prosjektveiviseren: http://www.prosjektveiviseren.no/