# Spießify – Ist-Stand-Analyse (21.08.2026)

Basis: Repo `ducrocqdigital/spiessify`, 173 Commits, Vite + React + TypeScript + Supabase (Projekt `mjwwoasnyzusgzqniyuf`), 57 DB-Migrationen.

## 1. Was die App kann (und wie sie aufgebaut ist)

**Tabellen:** `members`, `penalties`, `penalty_catalog`, `inspection_sessions`, `inspection_results`, `events`, `user_roles`, Storage-Bucket `member-photos`.

**Öffentliche Sicht (ohne Login):** `PublicDashboard` (Startseite) und `IframePenaltyList` lesen ausschließlich über drei DB-Funktionen: `get_members_with_public_stats` (Rangliste), `get_recent_penalties_public` (Ticker), `get_public_penalty_stats` (Kennzahlen). Das ist ein sauberes Muster und genau das, worauf die neue Arena aufsetzen kann.

**Admin (Login, Rolle „Chargierte“ oder „Oberadmin“):** Dashboard, Strafe eintragen, Musterung, Check-in, Mitglieder, Katalog, Events, Nutzer.

**Musterung:** Session starten → pro Schütze ein `inspection_results`-Datensatz → Detailscreen mit +/- pro Katalogeintrag (Kategorie „abnahme“) → beim Speichern werden daraus sofort `penalties` geschrieben und der Status auf „gemustert“ gesetzt.

**Check-in:** Referenzzeit + Anlass liegen nur im `localStorage` des Handys. Klick auf Schütze → Minuten Verspätung → Modal mit Betragsvorschlag → `penalties`-Eintrag. Pünktliche werden nirgends gespeichert.

**Aktives Event:** DB-Funktion `get_active_event` (heutiges Datum zwischen Start und Ende). Strafen bekommen beim Anlegen die `event_id` des aktiven Events.

## 2. Probleme, sortiert nach Relevanz fürs Schützenfest

### Muss vor dem Fest gefixt werden (hoch)

| # | Problem | Wo | Aufwand |
|---|---|---|---|
| F1 | **Multiplikator bei Musterung geht verloren.** Musterung speichert `amount = Katalogbetrag` und `multiplier = 3`, alle Summen rechnen aber nur `amount`. 3× „Hosensteg“ zählt wie 1×. | `inspectionService.ts:194` | 15 min + Daten korrigieren |
| F2 | **Doppelbuchung bei Musterung.** Wer einen Schützen ein zweites Mal öffnet und speichert (Korrektur), bucht alle Strafen erneut. | `InspectionActiveScreen.tsx:84-97` | 1–2 h |
| F3 | **Check-in-Häkchen überleben keinen Reload.** Nur Referenzzeit liegt im localStorage, nicht wer schon eingecheckt ist. App-Wechsel auf dem Handy → alles weg, erneutes Antippen bucht Verspätung doppelt. | `CheckInActiveScreen.tsx:28,114-147` | 1 h (localStorage) oder 3–4 h (eigene Tabelle) |
| F9 | **UTC-Datum.** Strafen nach Mitternacht (bis 2 Uhr) landen auf dem Vortag; ein Event, das „heute“ beginnt, ist bis 2 Uhr nicht aktiv. Schützenfest-Nächte sind genau dieser Zeitraum. | 5 Stellen + 2 DB-Funktionen | 30 min |
| F4 | **Login-Race.** Nach Login landet man manchmal auf der öffentlichen Seite statt im Admin, weil die Rolle noch nicht geladen ist. | `useAuth.tsx:55-68` | 20 min |

### Sicherheit (hoch, aber kein Show-Stopper für das Fest)

Vier Tabellen sind für **anonyme Besucher komplett beschreibbar** (INSERT/UPDATE/DELETE ohne Login): `penalty_catalog` (Beträge!), `events`, `inspection_sessions`, `inspection_results`, sowie der Foto-Bucket. Außerdem kann jeder eingeloggte Nutzer sich selbst auf `is_oberadmin = true` setzen (`user_roles`-Policy). Das Risiko ist real, aber gering: Man muss den anon-Key kennen und gezielt REST-Calls bauen. Fix ist pro Tabelle eine Policy-Änderung, insgesamt ca. 1–1,5 h. **Diese Fixes sind unabhängig vom Frontend, brechen nichts und sollten gemacht werden.**

### Öffentliche Ansichten zeigen falsche/leere Daten (mittel)

| # | Problem | Aufwand |
|---|---|---|
| F5 | „Heute“-Betrag auf dem Public Dashboard ist immer 0 € (liest direkt `penalties`, was anon nicht darf). | 15 min |
| F6 | Personen-Modal zeigt „N Strafen“ im Header, aber „Keine Strafen“ in der Liste (gleicher Grund). | 30 min |
| F7 | **Das iframe-Leaderboard (dein externer Link in der Packmas-App) ist für anonyme Nutzer leer** bzw. rechnet nur aus den letzten 50 Strafen. | 20 min |
| F11 | Ranglisten sind all-time, andere Kacheln event-gefiltert. Inkonsistent. | 30 min |

### Weitere Kleinigkeiten (niedrig)

Nutzerverwaltung funktioniert nicht (nutzt Admin-API mit anon-Key, S6), drei verschiedene Definitionen von „Chargierte“ im Code (S8), `/admin/penalties` ist unerreichbar (F8), Event-Sessions nicht gegen Doppelstart gesichert (F12), Verspätungs-Katalogeintrag wird per Namenssuche gefunden (F13), toter Demo-Login-Code mit Passwort im Bundle (S10), „Eingetragen von“ wird nie angezeigt (F19).

## 3. Bewertung

Die App ist im Kern solide gebaut: saubere Trennung in Services, sinnvolles Datenmodell, öffentlicher Zugriff über DB-Funktionen statt direkter Tabellen. Die Probleme sind typische Lovable-Spuren: Features wurden nacheinander draufgesetzt, ohne dass jemand das Gesamtbild (Event-Filter, Datum, Rechte) nachgezogen hat. Nichts davon erfordert einen Neubau.

**Empfehlung:** Nicht neu bauen. Kritische Fixes direkt im Code (Phase 0), dann die Arena als neue Schicht obendrauf (Phase 1). Nächstes Jahr dann die Frage „eine Plattform statt WordPress + Lovable“.

## 4. Vorgeschlagener Ablauf

**Phase 0 – Stabilisieren (1 Tag):** F1, F2, F3 (localStorage-Variante), F4, F9, F5, F7 sowie die RLS-Policies. Ergebnis: Musterung und Check-in sind am Fest verlässlich, das Leaderboard zeigt echte Zahlen.

**Phase 1 – Arena (2–3 Tage):** Neue öffentliche Seite mit visuellem Leaderboard (22 Figuren, Zug-Sau, Bewegung, Tagesstatistik), liest ausschließlich über die öffentlichen DB-Funktionen, ggf. um ein, zwei neue Funktionen ergänzt (Tagesbetrag, Verlauf pro Schütze). Einbindung in die Packmas-App wie bisher per Link/iframe.

**Phase 2 – Benachrichtigungen (1–2 Tage):** DB-Trigger auf `penalties` → Webhook → Kanal (Telegram / Web-Push / SMS). Kanal austauschbar.

**Phase 3 – Spielelemente (Rest):** Los bei jeder Strafe, Benefits, Tages-Awards.
