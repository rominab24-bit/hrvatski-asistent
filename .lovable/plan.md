# Plan: Priprema Android Studio projekta i izrada testnog APK-a

## Cilj
Pripremiti „Kućni Budžet" za lokalno testiranje na Android uređaju: dodati Android platformu u Capacitor, otvoriti projekt u Android Studio, izgraditi debug APK i omogućiti instalaciju na mobitel. Web objava na domeni ostaje za kasniju odluku.

## Trenutačno stanje
- Aplikacija nije objavljena na webu (`published_url: null`).
- Custom domena `rominab24.com` je već spojena, ali stranice `/privacy` i `/terms` nisu javno dostupne dok se ne objavi.
- Capacitor konfiguracija postoji (`capacitor.config.ts`), ali Android platforma još nije dodana (`android/` direktorij ne postoji).
- Security scan pokazuje upozorenja na pakete `@capacitor/cli` i `jspdf` — preporučljivo ih je ažurirati prije builda.

## Koraci

1. **Ažuriranje ranjivih ovisnosti**
   - Provjeriti dostupne nove verzije za `@capacitor/cli` i `jspdf`.
   - Ažurirati ih ako su kompatibilne s Capacitor 8.
   - Pokrenuti build kako bi se potvrdilo da nije došlo do pogoršanja.

2. **Provjera Capacitor resursa**
   - Osigurati da postoje izvorne datoteke za ikone i splash screen (`public/icon.png`, `public/splash.png` ili slične).
   - Provjeriti da `capacitor.config.ts` nema `server.url` (produkcijski build mora koristiti lokalne datoteke).

3. **Dodavanje Android platforme**
   - Pokrenuti `npx cap add android`.
   - Time se kreira `android/` direktorij s Gradle projektom.

4. **Build web aplikacije**
   - Pokrenuti `npm run build`.
   - Provjeriti da `dist/` sadrži sve potrebne statičke datoteke.

5. **Sinkronizacija nativnog projekta**
   - Pokrenuti `npx cap sync android`.
   - Time se kopira web build u Android projekt i ažuriraju Capacitor pluginovi (Camera, Splash Screen).

6. **Otvaranje u Android Studio**
   - Pokrenuti `npx cap open android`.
   - Alternativno: ručno otvoriti `android/` direktorij u Android Studio.

7. **Izrada debug APK-a**
   - U Android Studio odabrati `Build → Build Bundle(s) / APK(s) → Build APK(s)`.
   - Dobivena datoteka bit će smještena u `android/app/build/outputs/apk/debug/app-debug.apk`.

8. **Upute za instalaciju na uređaj**
   - Omogućiti „Nepoznate izvore" na Android uređaju.
   - Prebaciti `app-debug.apk` na mobitel (Bluetooth, USB, Google Drive, itd.).
   - Pokrenuti datoteku i instalirati aplikaciju.

9. **Verifikacija**
   - Provjeriti da se aplikacija pokreće bez grešaka.
   - Testirati osnovne funkcije: prijava, ručni unos troška, skeniranje računa (ako kamera radi).

## Napomene za buduću Google Play objavu
- Za Google Play je potrebna **Google Play Developer** račun (jednokratna naknada).
- Google Play zahtijeva **Android App Bundle (AAB)**, a ne APK.
- AAB se generira u Android Studio putem `Build → Generate Signed Bundle / APK` uz vlastiti keystore.
- Aplikacija mora biti objavljena na javnoj domeni (`rominab24.com/privacy`) jer prikuplja email, lozinku, financijske podatke i fotografije računa.

## Što očekivati nakon plana
- Dobit ćete radnu `app-debug.apk` datoteku za testiranje na vlastitom uređaju.
- Web aplikacija ostaje neobjavljena dok sami ne odlučite objaviti je.