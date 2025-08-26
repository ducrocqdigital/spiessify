-- Add email and phone columns to members table
ALTER TABLE public.members 
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT;

-- Insert all 23 members with the provided data
INSERT INTO public.members (first_name, last_name, birth_date, email, phone, rank, is_active) VALUES
('Florian', 'Brokamp', '1985-12-05', 'f.brokamp@outlook.com', '491716504809', 'schuetze', true),
('Niklas', 'Brokamp', '1990-01-10', 'n.s.brokamp@gmail.com', '491706286958', 'schuetze', true),
('Tarek', 'Chehab', '1985-10-18', 'tchehab@gmx.de', '491785211523', 'schuetze', true),
('Ruben', 'Daemen', '1985-02-22', 'rubendaemen@hotmail.com', '4915161516441', 'schuetze', true),
('Daniel', 'Ducrocq', '1985-06-13', 'daniel@ducrocq.de', '491772442527', 'schuetze', true),
('Dominik', 'Eisenschmidt', '1986-03-06', 'd.eisenschmidt@gmail.com', '16463995175', 'schuetze', true),
('Sascha', 'Erpenbach', '1985-12-18', 'saschaerpenbach@web.de', '4917682160564', 'schuetze', true),
('Marcel', 'Faymonville', '1985-10-17', 'marcelfaymonville@gmx.de', '491638266912', 'schuetze', true),
('Henning', 'Freiherr von Gagern', '1981-04-13', 'hvgagern@hotmail.com', '491774313070', 'schuetze', true),
('Steffen', 'Geyer', '1986-07-08', 'steffen.geyer@hey.com', '4915738273746', 'schuetze', true),
('Stephan', 'Hahn', '1985-10-20', 'stephan_hahn_ne@gmx.net', '491634895609', 'schuetze', true),
('Karl-Heinz', 'Kühl', '1985-08-21', 'kkuehl85@gmail.com', '491795663320', 'schuetze', true),
('Alexej', 'Lücke', '1984-10-23', 'alexej.luecke@gmail.com', '4915110616900', 'schuetze', true),
('Matthias', 'Mielke', NULL, NULL, NULL, 'schuetze', true),
('Simon', 'Pentzien', '1985-10-22', 'simon.pentzien@gmail.com', '4915233544895', 'schuetze', true),
('Florian', 'Reinartz', '1986-05-02', 'freinartz@gmx.de', '4915168841698', 'schuetze', true),
('Patrick', 'Steuber', '1985-12-14', 'patrick.steuber@gmx.de', '491775600601', 'schuetze', true),
('Francisco', 'Varon Romero', '1985-08-07', 'Francisco@t-online.de', '491789163764', 'schuetze', true),
('Pascal', 'Vent', '1986-02-25', 'pascal.vent@gmail.com', '41763522452', 'schuetze', true),
('Dominik', 'Von Waldthausen', '1985-10-04', 'dominikvw@gmx.de', '491784013574', 'schuetze', true),
('Jonathan', 'Wilhelm', '1985-07-06', 'jonathanmfwilhelm@gmail.com', '491705895656', 'schuetze', true),
('Nils', 'Winter', '1985-10-21', 'nlswntr@gmail.com', '491777820508', 'schuetze', true),
('Christian', 'Wolf', '1986-04-16', 'christian-wolf-2000@web.de', '491778749319', 'schuetze', true);