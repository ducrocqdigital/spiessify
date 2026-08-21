# Spießify – Kontext für Claude

## Wer und was

Daniel Ducrocq ist Feldwebel („Spieß") des Schützenzugs **Pack Mers** (Neusser Schützenlust, 22 aktive Schützen, 25-jähriges Jubiläum 2026). Schützenfest: **Fr 28.08. bis Mi 02.09.2026**, Nachtermin Chargiertenumzug Sa 05.09.

**Daniel ist kein Programmierer.** Verbindliche Arbeitsweise:

- Immer auf Deutsch antworten.
- Jede Änderung in einem Satz erklären: was sie für ihn als Nutzer bewirkt. Kein Code, kein SQL zur Bewertung vorlegen.
- Selbst testen (Build, Typecheck) bevor etwas gepusht wird. Direkt auf `main` pushen.
- Größere UI-Umbauten vorher kurz beschreiben und Daniels OK holen.
- Vor schreibenden Datenbank-Änderungen: Export der betroffenen Tabellen als Sicherung.

## Systeme

- **Diese App** (Vite + React + TS + Supabase): Strafenverwaltung des Zugs. Musterung („Abnahme") mit Teil-Raster, Check-in mit automatischer Verspätungsbuchung, Leaderboard (Zug-Sau = meiste Strafen), Events pro Schützenfest, Rollen (Oberadmin, Chargierte).
- **Supabase-Projekt:** `mjwwoasnyzusgzqniyuf` (eu-central-1). Daniel gibt bei Bedarf einen Access Token für die Management-API in die Session. SQL läuft über `POST https://api.supabase.com/v1/projects/mjwwoasnyzusgzqniyuf/database/query`. Migrationen zusätzlich als Datei unter `supabase/migrations/` ablegen (Doku, sie werden nicht automatisch angewendet).
- **Deploy:** Lovable ist mit dem Repo verbunden, deployed aber NUR nach manuellem „Publish"-Klick durch Daniel. Geplant/eingerichtet: Netlify Auto-Deploy bei jedem Push (`netlify.toml` liegt im Repo). Live-URL bisher: https://spiessify.lovable.app
- **Pack-Mers-App** (WordPress, `app.pack-mers.de`): bindet `/iframe/penalties` als Leaderboard ein.

## Architektur-Kurzüberblick

- Öffentliche Seiten (ohne Login) lesen NUR über SECURITY-DEFINER-RPCs: `get_members_with_public_stats`, `get_recent_penalties_public`, `get_public_penalty_stats`, `get_member_penalties_public`, `get_active_event`. Alle sind **event-gefiltert**: aktives Event → nur dessen Strafen, sonst Gesamthistorie.
- Admin-Flows: `src/services/*Service.ts` je Domäne. Check-in: `checkinService` + Tabellen `checkin_sessions`/`checkin_results` (Häkchen in DB, überlebt Gerätewechsel; nur eine aktive Session, Unique-Index). Musterung: `inspectionService` + `inspection_results.penalty_ids uuid[]` (erneutes Speichern ersetzt Strafen statt doppelt zu buchen).
- Musterungs-Maske: Teil-Raster in `src/services/uniformParts.ts` (Zonen, rangabhängig: Chargierte = feldwebel/leutnant/oberleutnant bekommen Goldene Hutkordel + Löwenkopfsäbel statt Gewehr, Leutnant/Oberleutnant zusätzlich Feldbinde). Zustände: fehlt/versaut/dreckig/unzureichend (+ Ungepflegt als Einzelpunkt). Preise kommen zur Laufzeit aus `penalty_catalog`, gefunden **über den exakten Namen**.
- Datum: immer `localDateString()` aus `src/lib/dates.ts` (Europe/Berlin), nie `toISOString().split('T')[0]`. DB-Funktionen nutzen `(now() AT TIME ZONE 'Europe/Berlin')::date`.
- `penaltyService.create()` verweigert ohne aktives Event (wirft deutschen Fehlertext, Toasts zeigen ihn an).

## Warnungen (nicht verletzen)

1. **Katalognamen sind Anker:** „Fehlendes Uniformteil", „Versautes/Dreckiges/Unzureichendes Uniformteil", „Fehlende Nadel", „Fehlendes Eichenlaub", „Ungepflegt", „Verspätung pro Minute", „Verpasste Abnahme", „Verpasster Termin/Umzug (…)" werden im Code per Name gefunden. Beträge darf Daniel im Katalog frei ändern; Umbenennen/Deaktivieren bricht die Buchung still.
2. **RLS ist scharf:** anon = nur lesen; Schreiben nur für Oberadmin/Chargierte (`user_can_manage_members()`); `user_roles` nur Oberadmin. Neue Tabellen genauso absichern.
3. **Events nie löschen** (`ON DELETE SET NULL` macht Strafen herrenlos). Test-Events dürfen das echte Event (Start 28.08.) nicht überlappen.
4. **Altbestand 2025 nicht korrigieren** – Daniel hat entschieden, dass er unangetastet bleibt (auch der bekannte 2×-Nadel-Fall).
5. `.env` liegt im Repo (Vite-Public-Werte, Anon-Key) – bekannt und akzeptiert, nicht „aufräumen".

## Stand 21.08.2026 (alles deployed bis Commit „Inspection grid…")

Phase 0 komplett: Check-in-Persistenz in DB, Musterung rechnet korrekt (Betrag × Multiplikator) und bucht idempotent, Berlin-Datumslogik, Login-Race behoben, öffentliche Ansichten zeigen echte Zahlen über RPCs, RLS geschlossen, „kein aktives Event"-Sperre + Banner. Dazu: Ein-Tipp-Check-in mit Auto-Buchung Verspäteter, Bearbeiten-Dialog (Ankunftszeit ändern → Betrag neu berechnet, Betrag manuell überschreibbar, zweistufiges Auschecken), Pausieren/Fortsetzen für Check-in UND Musterung (Banner im Dashboard), Teil-Raster-Musterung mit Tracking („Musterung: Feder – unzureichend" in der Strafnotiz), Schnellbuchung für Nicht-Erschienene in beiden Beenden-Dialogen, Admin-Ranking event-gefiltert, Strafverwaltung repariert (totes localStorage-Gate entfernt), Dialoge scrollbar, Schild-Icon für Admin.

## Offene Punkte

- 2026er-Event anlegen/prüfen: Start 28.08., Ende 02.09. oder 05.09.? (Daniel fragen.) Test-Event „Test" danach sauber wegräumen (nicht löschen – archivieren oder Enddatum in die Vergangenheit).
- Ränge der zwei Chargierten (Leutnant, Oberleutnant) in den Profilen setzen – aktuell stehen fast alle als „schuetze".
- Nach dem Fest: Teileliste + erlaubte Zustände pro Teil in eine DB-Tabelle mit kleiner Admin-Seite (statt `uniformParts.ts`); Figur-Visualisierung; Spielprinzip aus `docs/` (Arena, Orden, Zocken); Sprach-Abnahme als Idee; Supabase- und GitHub-Tokens widerrufen/rotieren; Nutzerverwaltung reparieren (nutzt Admin-API mit anon-Key, funktional tot); drei „Chargierte"-Definitionen im Code vereinheitlichen.

## Konzept-Dokumente

`docs/spielprinzip.md`, `docs/situationen-ablaeufe.md`, `docs/ist-stand-analyse.md`, `docs/uebergabe-phase0.md` – Spielprinzip und Analyse für die Zeit nach dem Fest. Nichts davon dieses Jahr bauen, außer Daniel sagt es ausdrücklich.
