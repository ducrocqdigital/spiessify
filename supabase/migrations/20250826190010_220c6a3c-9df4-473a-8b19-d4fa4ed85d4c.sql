-- Clear existing penalty catalog data
DELETE FROM penalty_catalog;

-- Insert new penalty catalog entries based on the provided data

-- TIMING category
INSERT INTO penalty_catalog (name, category, amount, description) VALUES
('Verspätung pro Minute', 'timing', 1, NULL),
('Verspätetes Einreihen', 'timing', 5, NULL),
('Verpasste Abnahme', 'timing', 10, NULL),
('Verpasster Termin/Umzug (entschuldigt)', 'timing', 50, NULL),
('Verpasster Termin/Umzug', 'timing', 75, NULL);

-- SOZIALES category
INSERT INTO penalty_catalog (name, category, amount, description) VALUES
('Anschwärzen', 'soziales', 1, NULL),
('Pack mers Ruf nicht mitmachen', 'soziales', 2, NULL),
('Ekliges Verhalten', 'soziales', 2, NULL),
('Negatives Verhalten', 'soziales', 3, NULL),
('Unkollegiales Verhalten', 'soziales', 4, NULL);

-- ABNAHME category
INSERT INTO penalty_catalog (name, category, amount, description) VALUES
('Ungepflegt', 'abnahme', 1, NULL),
('Dreckiges Uniformteil', 'abnahme', 2, NULL),
('Unzureichendes Uniformteil', 'abnahme', 2, NULL),
('Fehlende Nadel', 'abnahme', 2, NULL),
('Fehlendes Eichenlaub', 'abnahme', 3, NULL),
('Versautes Uniformteil', 'abnahme', 4, NULL),
('Fehlendes Uniformteil', 'abnahme', 5, NULL);

-- MARSCHIEREN category
INSERT INTO penalty_catalog (name, category, amount, description) VALUES
('Scheisse marschieren', 'maschieren', 2, NULL),
('Oft/lange Austreten', 'maschieren', 2, NULL),
('Sonnenbrille auf dem Markt', 'maschieren', 3, NULL),
('Rauchen/Telefonieren', 'maschieren', 3, NULL),
('Austreten ohne Erlaubnis', 'maschieren', 4, NULL);