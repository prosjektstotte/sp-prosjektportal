Prosjektportal for SharePoint
=================

Prosjektportal for SharePoint er et prosjektstyringsverktøy for SharePoint basert på <a href="http://prosjektveiviseren.no">Prosjektveiviseren</a>. 

# Hva er prosjektportal for SharePoint?
Prosjektportal for SharePoint (kodenavn "Glittertind") er bygget av <a href="http://www.puzzlepart.com">Puzzlepart AS</a> på bestilling for Asker Kommune og <a href="http://www.ks.no/kommit">KommIT</a>. Glittertind inneholder SharePoint-artefakter som til sammen utgjør et prosjektstyringsverktøy. Det blir satt opp en portefølgeside der en får en oversikt over eksisterende prosjekter og kan opprette nye prosjektrom. Hvert prosjektområde inneholder en del lister, en del standardelementer og logikk for å gjennomføre et prosjekt etter prosjektveiviserens modell. Prosjektveiviseren er Difis anbefalte prosjektmodell for gjennomføring av digitaliseringsprosjekter i offentlige virksomheter.

Glittertind installeres med <a href="https://github.com/sharepoint-sherpa/sherpa">Sherpa </a>, som er en kommandolinjeapplikasjon som setter opp taksonomi, installerer sandboxed solutions, setter opp innholdstyper og konfigurerer områdesamlingen.

## Omfang i SharePoint
Løsningen består av taksonomi, innholdstyper og en sandkasseløsning ('sandboxed solution'). Bortsett fra taksonomi gjør ikke løsningen noe med andre områdesamlinger eller globale innstillinger i SharePoint

## Kjekt å vite
Løsningen har foreløpig begrenset funksjonalitet i Internet Explorer 8 og 9. Spesielt betyr dette at opprettelse av prosjektområder ikke er støttet i disse nettleserne. Du må bruke en annen nettleser, eller oppgradere til en nyere versjon av Internet Explorer.

# Hvordan installere løsningen?
## Viktig! Før du starter
Før du starter er det viktig å være klar over følgende
* Glittertind setter opp taksonomi i den globale managed metadata servicen ved å opprette en termgruppe 'Glittertind' og term set og termer i denne gruppen
* Områdesamlingen ('site collection') må opprettes på forhånd, se steg 1 under.
* Applikasjonen <strong>må</strong> kjøres av en bruker som er termlagrinsadministrator ('term store administrator') og områdesamlingsadministrator ('site collection administrator') i områdesamlingen som prosjektportalen skal installeres i
* (On-Premises) Applikasjonen må kjøre på en av SharePoint-serverne i farmen
* (On-Premises) Servicen 'Microsoft SharePoint Foundation Sandboxed Code Service' må være startet i farmen

## Steg for steg
1. En områdesamling må opprettes for prosjektportalen. Vi anbefaler ikke at prosjektportalen installeres i en områdesamling som brukes til noe annet fra før. Vi anbefaler at områdesamlingen opprettes med norsk språk og malen gruppeområde ('team site'). Gjør steg 2-4 mens du venter på at områdesamlingen opprettes.
2. For å installere løsningen uten å gjøre endringer anbefaler vi at den ferdigpakkede løsningen lastes ned fra <a href="https://github.com/prosjektstotte/sp-prosjektportal/releases">Releases</a> på denne siden. 
3. Pakk ut installasjonspakken til disken, og naviger til mappen via kommandolinjen.
4. På kommandolinjen, skriv sherpa.exe --help for å se mulige parametere
5. Dersom du er på SharePoint Online: På kommandolinjen, skriv sherpa.exe --url "URL til nyopprettet områdesamling" --userName "brukernavn til områdesamlingadministrator" --spo
5. Dersom du er på SharePoint 2013 On-Prem: På kommandolinjen, skriv sherpa.exe --url "URL til nyopprettet områdesamling"
6. Applikasjonen starter. Dersom du bruker SharePoint Online må du skrive passord. Du får nå opp en del valg, der operasjonene 1 til 4 er viktigst.
7. Kjør gjennom operasjonene i applikasjonen 1 til 4 i rekkefølge. Hvert steg må gå gjennom uten feil for at alt skal fungere. Dersom du opplever feil, ta kontakt for å se på mulige problemløsninger.
8. Etter at operasjonene er gjennomført skal prosjektportalen være oppe og kjøre.

# Kontakt
For spørsmål og innspill, ta kontakt med KommIT ved <a href="mailto:lars.sverre.gjolme@ks.no">Lars Sverre Gjølme</a> eller Asker Kommune ved <a href="mailto:Geir.Graff@asker.kommune.no">Geir Graff</a>. For bistand til installasjon av løsningen eller muligheter for videreutvikling og spesialtilpasninger, ta kontakt med <a href="mailto:support@puzzlepart.com">Puzzlepart</a> eller <a href="mailto:tormod.guldvog@puzzlepart.com">Tormod Guldvog</a>. Vi gjør oppmerksom på at eventuell bistand vil være en fakturerbar tjeneste.

# Maintainers
Tarjei Ormestøyl [<a href="mailto:tarjeieo@puzzlepart.com">tarjeieo@puzzlepart.com</a>], 
Ole Kristian Mørch-Storstein [<a href="mailto:olekms@puzzlepart.com">olekms@puzzlepart.com</a>]

# Feilsøking
## Problem: Du får feilmeldingen "Method not found: ‘Void Microsoft.SharePoint.Client.ContentTypeCreationInformation.set_Id(System.String)’" i steg 3 når du installerer løsningen til On-Premises.

Løsning: Du installerer på feil miljø eller har en gammel versjon av SharePoint 2013 (før Service Pack 1). Du må installere Service Pack 1 for å kunne installere løsningen. <a href="http://developeratwar.com/2014/10/you-get-an-exception-occured-method-not-found-void-microsoft-sharepoint-client-conten-ttypecreationinformation-set_idsystem-string">Les mer om denne feilen</a>

## Problem: Du får feilmeldingen "Value does not fall within the expected range" i steg 2 når du installerer løsningen.

Løsning: Sannsynligvis installerer du til et underområde istedenfor til en områdesamling. Du må først opprette en områdesamling fra SharePoint Admin Center (Office 365) eller Central Administration (On-premises). Se installasjonssteg 1.

## Problem: Installasjon av termset (operasjon 1) og andre operasjoner på SharePoint 2013 on-premises feiler med meldingen: "An exception occured: The remote server returned an error: (401) Unauthorized."

Mulig løsning: Serveren har loopback check slått på. Se <a href="http://support.microsoft.com/kb/926642/en-us?wa=wsignin1.0">KB-926642 for løsning.</a>