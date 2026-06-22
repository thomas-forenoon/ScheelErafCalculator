# Scheel Eraf Calculator

Scheel Eraf Calculator is een Next.js MVP voor het transparant verdelen van een groepsrekening. De app werkt volledig aan clientzijde, bewaart invoer in `localStorage` en gebruikt cents voor alle geldberekeningen.

## App starten

Installeer de afhankelijkheden:

```bash
npm install
```

Start de ontwikkelserver:

```bash
npm run dev
```

Open daarna `http://localhost:3000`.

Voor een productiebuild:

```bash
npm run build
```

## Online zetten via GitHub Pages

Deze app heeft geen backend nodig en kan dus als statische webapp op GitHub Pages draaien.

1. Maak op GitHub een nieuwe repository, bijvoorbeeld `ScheelErafCalculator`.
2. Push deze code naar de `main` branch.
3. Ga in GitHub naar `Settings` > `Pages`.
4. Kies bij `Build and deployment` als source `GitHub Actions`.
5. Na de eerste geslaagde workflow staat de app online.

De link wordt normaal:

```text
https://jouw-gebruikersnaam.github.io/ScheelErafCalculator/
```

Elke nieuwe push naar `main` bouwt en publiceert de app opnieuw.

## Hoe de berekening werkt

De app is bewust een korte flow:

1. Je ziet eerst wat de groep samen besteld heeft, met een korte felicitatie.
2. Daarna vul je je aankomst, vertrek, cocktails, shots, eten en eventueel al gegeven bedrag in.
3. Daarna zie je meteen hoeveel je nog moet storten en kan je het rekeningnummer kopiëren.

De totale rekening is `€585,90`. Die bestaat uit:

- Sponsorcadeau: `€100,00`
- Normale drank na cadeau: `€190,60`
- Cocktails: `€122,80`
- Shots: `€115,50`
- Eten: `€57,00`

Samen telt dit exact op tot `€585,90`.

## Overzicht van de bonnetjes

Bovenaan de app staat een kort verhaalblok met wat de groep samen heeft verzet. Daar zie je in één oogopslag het aantal gewone drankjes, cocktails, shots en hapjes.

De volledige lijst met drank en eten staat achter een knop `Toon wat er op de bonnetjes stond`. Dat houdt de pagina kort op mobiel, maar de detailcontrole blijft beschikbaar. Ook de vijf ticketbedragen en de btw-verdeling staan achter een aparte knop.

## Sponsorcadeau

Het sponsorcadeau is de externe traktatie van `€100,00`.

De normale drank is eerst `€290,60`. Het sponsorcadeau wordt daarvan afgetrokken, waardoor `€190,60` overblijft voor de gewone verdeling. De groep verdeelt dus `€485,90` in plaats van `€585,90`.

## Normale drank

De normale drank na het sponsorcadeau wordt verdeeld op basis van aanwezigheidstijd. Aankomst en vertrek zijn per deelnemer aanpasbaar.

Als de vertrektijd vroeger is dan de aankomsttijd, telt de app dit als vertrek op de volgende dag. Als aankomst en vertrek gelijk zijn, is de aanwezigheidstijd `0` minuten.

## Cocktails

Cocktails worden alleen verdeeld over deelnemers die een cocktailaantal invullen. De verdeling is proportioneel.

Voorbeeld: als iemand `2` cocktails invult en er samen `16` cocktails zijn ingevoerd, betaalt die persoon `2 / 16` van de cocktailpool.

De app toont een waarschuwing wanneer het ingevoerde totaal niet overeenkomt met het aantal cocktails op de bonnetjes.

## Shots

Shots worden alleen verdeeld over deelnemers die een shotaantal invullen. De verdeling is proportioneel.

De app toont een waarschuwing wanneer het ingevoerde totaal niet overeenkomt met het aantal shots op de bonnetjes.

## Eten

Eten is bewust simpel gehouden. Vink `Meegegeten` aan als je mee at. De pot van `€57,00` wordt verdeeld over 10 eters. Laat je het uit, dan betaal je niets voor eten.

## Al betaald

Per deelnemer kan een bedrag bij `Al betaald` worden ingevuld. Dat is bedoeld voor contant geld of een overschrijving die al gebeurd is.

Dit bedrag verandert de verdeling van de rekening niet. Het wordt alleen afgetrokken van het openstaande bedrag:

`nog te betalen = berekend aandeel - al betaald`

Als iemand al meer betaalde dan het berekende aandeel, toont de app `€0,00` als nog te betalen en houdt ze het te veel betaalde bedrag apart bij.

## Betalen

Het laatste scherm toont het openstaande bedrag voor de gekozen persoon. Dat bedrag kan worden betaald naar:

`BE66 9731 6120 5243`

Naast het rekeningnummer staat een knop `Rekeningnummer kopiëren`. Na het kopiëren toont de app meteen feedback. Als kopiëren door de browser wordt geweigerd, blijft het rekeningnummer zichtbaar en selecteerbaar.

## Afronding

Alle berekeningen gebeuren in cents. Per pool gebruikt de app largest-remainder afronding:

1. De exacte aandelen worden berekend.
2. Elk aandeel wordt naar beneden afgerond op hele cents.
3. Overblijvende cents gaan naar de deelnemers met de grootste restwaarde.
4. Bij gelijke restwaarde wordt de deelnemer-id gebruikt als vaste tie-breaker.

Daardoor telt elke pool exact op tot het poolbedrag.

## Controle

De rekenlaag controleert afwijkende cocktail- of shotaantallen en niet-toegewezen bedragen. In de gewone gebruikersflow worden enkel de nodige stappen getoond, zodat de app geen grote controlepagina wordt.
