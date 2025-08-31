-- Update existing inspection penalties to have the active event ID
UPDATE penalties 
SET event_id = (SELECT id FROM events WHERE is_archived = false ORDER BY created_at DESC LIMIT 1)
WHERE event_id IS NULL 
  AND penalty_type_id IN (
    SELECT id FROM penalty_catalog WHERE category = 'abnahme'
  )
  AND notes LIKE 'Musterung:%';