Prosjektportal for SharePoint
=================

Prosjektportal for SharePoint er et prosjektstyringsverktøy for SharePoint Online og SharePoint 2013 basert på <a href="http://prosjektveiviseren.no">prosjektveiviseren</a>. 

# Hva er prosjektportal for SharePoint?
Prosjektportalen for SharePoint (kodenavn "Glittertind") er bygget av <a href="http://www.puzzlepart.com">Puzzlepart AS</a> på bestilling for Asker Kommune. Glittertind inneholder SharePoint-artefakter som til sammen utgjør et prosjektstyringsverktøy. Det blir satt opp en portefølgeside der en får en oversikt over eksisterende prosjekter og kan opprette nye prosjektrom. Hvert prosjektområde inneholder en del lister, en del standardelementer og logikk for å gjennomføre et prosjekt etter prosjektveiviserens modell. Prosjektveiviseren er Difis anbefalte prosjektmodell for gjennomføring av digitaliseringsprosjekter i offentlige virksomheter.

Glittertind installeres med <a href="https://github.com/sharepoint-sherpa/sherpa">Sherpa </a>, som er en kommandolinjeapplikasjon som setter opp taksonomi, installerer sandboxed solutions, setter opp innholdstyper og konfigurerer områdesamlingen.

# Hvordan installere løsningen?
## Før du starter
Før du starter er det viktig å være klar over følgende
* Glittertind setter opp taksonomi i den globale managed metadata servicen ved å opprette en termgruppe Glittertind og term set i denne gruppen
* Applikasjonen må derfor kjøres av en bruker som er termlagrinsadministrator ('term store administrator')
* Områdesamlingen ('site collection') må opprettes på forhånd, se steg 1 under.
* Bortsett fra taksonomi gjør ikke løsningen noe med andre områdesamlinger eller globale innstillinger i SharePoint
* Dersom du er på On-Prem må applikasjonen kjøre på en SharePoint server
* Løsningen har foreløpig begrenset funksjonalitet i IE8 og IE9.

## Steg for steg
1. En områdesamling må opprettes for prosjektportalen. Vi anbefaler ikke at prosjektportalen installeres i en områdesamling som brukes til noe annet fra før. Vi anbefaler at områdesamlingen opprettes med norsk språk og malen gruppeområde ('team site'). Gjør steg 2-4 mens du venter på at områdesamlingen opprettes.
2. For å installere løsningen uten å gjøre endringer anbefaler vi at den ferdigpakkede løsningen lastes ned fra Releases på denne siden. 
3. Pakk ut installasjonspakken til disken, og naviger til mappen via kommandolinjen.
4. På kommandolinjen, skriv sherpa.exe --help for å se mulige parametere
5. Dersom du er på SharePoint Online: På kommandolinjen, skriv sherpa.exe --url "URL til nyopprettet områdesamling" --userName "brukernavn til områdesamlingadministrator" --spo
5. Dersom du er på SharePoint 2013 On-Prem: På kommandolinjen, skriv sherpa.exe --url "URL til nyopprettet områdesamling"
6. Applikasjonen starter. Dersom du bruker SharePoint Online må du skrive passord. Du får nå opp en del valg, der operasjonene 1 til 4 er viktigst.
7. Kjør gjennom operasjonene i applikasjonen 1 til 4 i rekkefølge. Hvert steg må gå gjennom uten feil for at alt skal fungere. Dersom du opplever feil, ta kontakt for å se på mulige problemløsninger.
8. Etter at operasjonene er gjennomført skal prosjektportalen være oppe og kjøre.

# Maintainers
Tarjei Ormestøyl [<a href="mailto:tarjeieo@puzzlepart.com">tarjeieo@puzzlepart.com</a>], 
Ole Kristian Mørch-Storstein [<a href="mailto:olekms@puzzlepart.com">olekms@puzzlepart.com</a>]