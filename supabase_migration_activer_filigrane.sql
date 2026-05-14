-- Add activer_filigrane column to parametres table
ALTER TABLE parametres 
ADD COLUMN IF NOT EXISTS activer_filigrane BOOLEAN DEFAULT TRUE;
