Prosjektportal for SharePoint
=================

Dette prosjektet består i dag av to ulike løsninger, Sherpa og Glittertind.
* Sherpa et en kommandolinjeapplikasjon for å installere SharePoint-løsnignen til SharePoint Online og On-Prem. 
* Glittertind er et SharePoint-prosjekt for prosjektstyring basert på prosjektveiviseren.no

## Sherpa
1. Hva er Sherpa?   
  a. Sherpa er laget for å håndtere utfordringen med å installere og sette opp SharePoint tilpasninger på både SharePoint 2013 On-Premises og SharePoint Online.
  b. Sherpa gir deg muligheten til følgende 
    * Sette opp taksonomi (grupper, term set, termer) fra konfigurasjonsfil  
    * Laste opp, aktivere samt oppgradere sandkasseløsninger 
    * Sette opp felter og innholdstyper i områdesamling 
    * Aktivere funksjoner i områdesamling 
    * Deaktivere og aktivere funksjoner etter oppgradering 
2. Hvordan fungerer det? 
  a. Sherpa er i utgangspunktet et klassebibliotek av hjelpefunksjoner som snakker med SharePoint via klientside objektmodellen (CSOM). Dette betyr at Sherpa kan kommunisere med både SharePonint 2013 On-Prem og SharePoint Online. 
  b. Vi har utviklet en konsollapplikasjon som bruker klassebiblioteket. Konsollapplikasjonen leser fra flere konfigurasjonsfiler. Konsollapplikasjonen har et enkelt brukergrensesnitt for å utføre de ulike funksjonene Sherpa kan gjøre. 
3.	Hvordan kommer jeg i gang?
  a. Last ned Sherpa fra Github (foreløpig kun mulig å laste ned som en Visual Studio solution). 
  b. Endre konfigurasjonsfilene til ditt behov 
  c. Bygg løsningen og naviger til output-mappen til applikasjonen (typisk 'rot/sp-prosjektportal\Glittertind.Sherpa\Glittertind.Sherpa.Installer\bin\Debug') 
  d. Legg evt. SharePoint sandkasseløsninger i en mappe som heter solutions her 
  e. Start applikasjonen i et kommandolinjevindu med --help som parameter for å se hvilke parametere som sherpa bruker.  
  f. Sherpa har nå startet og etter å ha autentisert en kan velge hvilke funksjoner som skal utføres.

## Glittertind
Glittertind inneholder SharePoint-artefakter som til sammen utgjør et prosjektstyringsverktøy. Glittertind installeres med Sherpa.

## Relevante ressurser
JSON Prettifier: http://www.uize.com/examples/json-prettifier.html