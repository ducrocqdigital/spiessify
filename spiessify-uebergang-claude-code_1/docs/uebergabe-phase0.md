# Übergabe: Spießify für Pack Mers – Stand 21.08.2026

Dieses Dokument ist die erste Nachricht in einer neuen Cowork-Sitzung, in der das Repo `ducrocqdigital/spiessify` als Quelle verbunden ist. Es ersetzt den Gesprächsstand der vorherigen Sitzung.

## Wer und was

Daniel ist Feldwebel („Spieß") des Schützenzugs **Pack Mers** (Neusser Schützenlust, 22 aktive Schützen, 25-jähriges Jubiläum 2026). Schützenfest: **Fr 28.08. bis Mi 02.09.2026**, Nachtermin Chargiertenumzug Sa 05.09. Heute ist der 21.08., also sieben Tage bis zum Start.

Daniel ist kein Programmierer. Code und SQL muss er nicht bewerten. Arbeitsweise: Jede Änderung in einem Satz auf Deutsch erklären, was sie für ihn als Nutzer bewirkt. Selbst testen, bevor etwas live geht. Größere Dinge als Vorschau zeigen. Direkt auf `main` pushen, Lovable deployed automatisch. Während der Arbeitsphase ändert Daniel in Lovable nichts.

## Die Systeme

**Spießify** (Lovable-App, Vite + React + TS + Supabase): Strafenverwaltung für den Zug. Musterung („Abnahme") mit Katalog, Check-in mit automatischer Verspätungsberechnung, Leaderboard (Zug-Sau = meiste Strafen), Events pro Schützenfest, Rollen (Oberadmin, Chargierte). Repo: `github.com/ducrocqdigital/spiessify` (173 Commits, Analyse liegt vor). Supabase-Projekt: `mjwwoasnyzusgzqniyuf`. Lovable bleibt dieses Jahr als Deploy-Pipeline, Frage „wofür noch Lovable" wird nach dem Fest entschieden.

**Pack-Mers-App** (WordPress, mobil, `app.pack-mers.de`, zentrales Passwort, keine Nutzerverwaltung): Marschbefehl als Custom Post Type „Termine", 25 Termine für 2026 sind eingetragen (Excel „Termine_Schuetzenfest_2026_1.xlsx" liegt vor). Spießify-Leaderboard ist dort als externer Link (`/iframe/penalties`) eingehängt. Zugriff per Novamira-MCP war in einer früheren Sitzung vorhanden.

## Beschlossen: Phase 0, „Stand letztes Jahr, nur verlässlich"

Nur Hygiene, keine neuen Features. Aufwand ca. 1 bis 1,5 Tage inkl. Test. Reihenfolge:

1. **Check-in überlebt alles.** Heute liegen nur Referenzzeit und Anlass im localStorage, die Häkchen („wer ist schon da") nur im React-State (`CheckInActiveScreen.tsx:28,114-147`, `AdminDashboard.tsx:295`). App-Wechsel auf dem Handy = alles weg, erneutes Antippen bucht Verspätung doppelt. Daniel hat letztes Jahr deshalb Screenshots gemacht. Lösung: eigene Tabellen (`checkin_sessions`, `checkin_results`) analog zur Musterung, Timer serverseitig, Fortsetzen von jedem Gerät. Wichtigster Punkt für Daniel.
2. **Musterung rechnet richtig und bucht nicht doppelt.** `inspectionService.ts:194` schreibt `amount = Katalogbetrag` statt `amount × multiplier`, alle Summen rechnen nur `amount` (3× Hosensteg = 1×). `InspectionActiveScreen.tsx:84-97` bucht bei jedem erneuten Speichern alle Strafen nochmal. Vor Datenkorrektur aus 2025 Daniel die Fälle zeigen.
3. **Mitternacht.** `new Date().toISOString().split('T')[0]` an 5 Stellen = UTC-Datum; DB-Funktionen `get_active_event`, `get_public_penalty_stats` nutzen `CURRENT_DATE`. Umstellen auf Europe/Berlin.
4. **Login-Race.** `useAuth.tsx:55-68` setzt `loading=false` bevor das Profil geladen ist, `ProtectedRoute` leitet auf `/` um.
5. **Öffentliche Ansichten.** `PublicDashboard` „Heute" immer 0 € (liest `penalties` direkt, anon darf nicht). `PersonDetailModal` gleiche Ursache. `IframePenaltyList` (der Link in der Pack-Mers-App!) für anon leer, rechnet sonst nur aus den letzten 50 Strafen. Auf die RPCs `get_members_with_public_stats`, `get_recent_penalties_public`, `get_public_penalty_stats` umstellen, ggf. erweitern.
6. **RLS schließen.** `penalty_catalog`, `events`, `inspection_sessions`, `inspection_results`, Storage `member-photos`: FOR ALL `USING(true)` ohne Rollenbindung, anon darf schreiben. `user_roles`: jeder Authentifizierte kann sich `is_oberadmin=true` setzen. Policies auf authenticated + Rollencheck per SECURITY-DEFINER-Funktion.
7. **Kein aktives Event.** Ohne aktives Event fällt der Filter still weg (alle Strafen aller Zeiten werden gezeigt) und neue Strafen bekommen `event_id NULL` (`penalteService.ts:67-69,100-103,176-179,223-228,298-301`). Das ist der Grund, warum Daniel aktuell „den alten Stand" sieht (2026er-Event startet erst am 28.08.). Lösung: klarer Hinweis „kein aktives Event", Eintragen verweigern, Event-Pflicht in `create()`.

Weitere bekannte, niedrig priorisierte Punkte stehen in `spiessify-ist-stand.md` (Nutzerverwaltung nutzt Admin-API mit anon-Key und ist funktional tot; drei verschiedene „Chargierte"-Definitionen; `/admin/penalties` unerreichbar wegen `localStorage.isAdmin`-Gate; Session-Doppelstart nicht abgesichert; Demo-Credentials im Bundle).

## Events: Hinweise für Daniels Tests

- Aktiv = heutiges Datum zwischen `start_date` und `end_date`, `is_archived=false`, bei Überlappung gewinnt das frühere `start_date` stillschweigend.
- Test-Event: heute beginnen, **spätestens 27.08. enden**, damit es das echte nicht überlappt.
- Events nicht selbst löschen: `ON DELETE SET NULL` macht die Strafen herrenlos. Test-Event samt Testeinträgen sauber wegräumen (Aufgabe für die neue Sitzung, wenn Daniel Bescheid gibt).
- 2026er-Event prüfen: Start 28.08., Ende 02.09. oder 05.09. (Chargiertenumzug), Daniel fragen.

## Zugänge

- Supabase: Daniel erstellt einen Access Token (supabase.com → Account → Access Tokens) und gibt ihn in der neuen Sitzung ein. Vor jeder schreibenden DB-Änderung Export der betroffenen Tabellen, SQL wird nicht zur Bewertung vorgelegt, sondern in einem Satz erklärt. Token nach dem Fest widerrufen.
- GitHub: Repo muss beim Erstellen der Sitzung als Quelle verbunden sein. Der GitHub-Token aus der alten Sitzung wird gelöscht und nicht mehr gebraucht.
- Repo war kurz öffentlich, ist wieder privat. Das leere Repo `spiessify-app` kann gelöscht werden.

## Noch offen von Daniel

- Seine „Nerv-Liste" vom letzten Jahr (kleine Ergänzungen für ihn persönlich). Kandidaten: „entschuldigt" beim Check-in, letzte Strafe mit einem Tipp zurücknehmen, „nicht erschienen" bei der Musterung. Daniel testet die App erst selbst mit Testeinträgen.

## Konzept für später (nicht dieses Jahr bauen)

Drei Dokumente liegen vor: `spiessify-ist-stand.md`, `spiessify-situationen-ablaeufe.md`, `spiessify-spielprinzip-v2.md`. Der Gesprächsstand ging darüber hinaus und ist hier in Kurzform festgehalten:

**Ziel:** Mehr Spaß, mehr Gemeinschaft. Das Spiel reichert das Fest an, es erzieht nicht (Ordnung regelt der Katalog). Es drängt sich nie vor, funktioniert, wenn jemand spielen will, und staut sich nicht, wenn drei Stunden niemand spielt.

**Wertekern:** Basis ist null, Beitrag ist plus, Verfehlung ist minus. Pünktlich sein ist Erwartung, keine Leistung. Held ist, wer lange feiert und trotzdem morgens pünktlich mit guter Laune steht. Euro-Strafen bleiben immer (Kasse), neutralisiert wird nur die Spielwertung (Daniels Bestätigung steht noch aus).

**Leitplanken:** Kein Versammlungszwang (eins zu eins oder Kleinstgruppe, andere schauen beiläufig zu). Handy ist Zusatz, nie Bedingung. Abnahme kostet null Sekunden extra (7 Abnahmen, ca. 40 Sek. pro Mann). Unmittelbarkeit zählt („zack, halbiert"). Alles in Maßen, Deckel überall. Alles Negative passiert direkt ohne Karte/Spiel, Spiele sind immer Chancen.

**Datenfrage als Rückgrat:** Es zählen nur Daten, die ohne Daniel entstehen und sich selbst beweisen: Zeitstempel (Check-in, Fotos), Fotos als Beleg, knappe Stimmen (Kameradenorden: jeder hat pro Tag genau einen zu verleihen, an jeden außer sich selbst, mit Begründung). Bingo/Beobachtungen fallen raus (kein Prüfer). Daniel bewertet Eingereichtes zeitlich flexibel über einen „Posteingang", nie situationsgebunden.

**Ideen, festgehalten, nicht beschlossen:** Spielfeld als Visualisierung des Standes (Figuren, Orden dran, Krone), Form offen, Pferderennen nur eine Variante. Zock „doppelt oder halb" mit Hausvorteil auf kleine Strafen. Orden statt „Sold". Zwei Titel: Hauptsponsor (meiste Euro) und ein Ehren-Titel. Physische Karten mit QR-Codes (rot/grün/gelb) als haptischer Trigger und Ersatz für Push, nur als Chancen. Self-Check-in per QR-Code, den Daniel am Revers trägt, hybrid mit Abtippen. iPad Mini als zweites Gerät (Bühne, Akkuschonung). Spieß-Kommentator (KI-Kommentare, Morgenreport). Foto-Feed mit Zeitstempel (Nachtwächter). Daniel fand zuletzt: Karten ohne digitale Verknüpfung sind nur Würfeln, der Charme muss aus Gerät + Daten kommen. Das Konzept ist noch nicht greifbar genug und wird nach dem Fest in Ruhe weitergedacht.

**Kanal für Benachrichtigungen:** offen (Telegram-Bot, Web-Push via Homescreen, SMS, WhatsApp-Copy-Paste). Bot in WhatsApp-Gruppe ist offiziell nicht möglich.
