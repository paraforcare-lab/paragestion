-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: Produits
CREATE TABLE IF NOT EXISTS produits (
    id BIGSERIAL PRIMARY KEY,
    reference TEXT UNIQUE,
    designation TEXT NOT NULL,
    nom TEXT, -- Added for compatibility
    description TEXT,
    categorie TEXT,
    marque TEXT,
    barcode TEXT,
    image_url TEXT,
    prix_achat_ht DECIMAL(15, 2) DEFAULT 0,
    prix_vente_ht DECIMAL(15, 2) DEFAULT 0,
    tva DECIMAL(5, 2) DEFAULT 20,
    prix_achat_ttc DECIMAL(15, 2) GENERATED ALWAYS AS (prix_achat_ht * (1 + tva / 100)) STORED,
    prix_vente_ttc DECIMAL(15, 2) GENERATED ALWAYS AS (prix_vente_ht * (1 + tva / 100)) STORED,
    stock_actuel DECIMAL(15, 2) DEFAULT 0,
    stock_min DECIMAL(15, 2) DEFAULT 5,
    unite TEXT DEFAULT 'unité',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist and constraints are correct
DO $$ 
BEGIN 
  -- If 'nom' exists and is NOT NULL, make it nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produits' AND column_name='nom') THEN
    ALTER TABLE produits ALTER COLUMN nom DROP NOT NULL;
  END IF;
  
  -- Ensure 'designation' exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produits' AND column_name='designation') THEN
    ALTER TABLE produits ADD COLUMN designation TEXT;
    -- Copy data from 'nom' if available
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produits' AND column_name='nom') THEN
      UPDATE produits SET designation = nom;
    END IF;
    UPDATE produits SET designation = 'Produit sans nom' WHERE designation IS NULL;
    ALTER TABLE produits ALTER COLUMN designation SET NOT NULL;
  END IF;
END $$;

-- Table: Clients
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    ville TEXT,
    code_postal TEXT,
    pays TEXT DEFAULT 'Maroc',
    ice TEXT,
    rc TEXT,
    if_identifiant TEXT,
    patente TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    ville TEXT,
    ice TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Devis
CREATE TABLE IF NOT EXISTS devis (
    id BIGSERIAL PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    client_id BIGINT REFERENCES clients(id),
    date_emission DATE DEFAULT CURRENT_DATE,
    date_validite DATE,
    statut TEXT DEFAULT 'brouillon', -- brouillon, envoyé, accepté, refusé, facturé
    montant_ht DECIMAL(15, 2) DEFAULT 0,
    montant_tva DECIMAL(15, 2) DEFAULT 0,
    montant_ttc DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    conditions_paiement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Devis Lignes
CREATE TABLE IF NOT EXISTS devis_lignes (
    id BIGSERIAL PRIMARY KEY,
    devis_id BIGINT REFERENCES devis(id) ON DELETE CASCADE,
    produit_id BIGINT REFERENCES produits(id),
    reference TEXT,
    designation TEXT NOT NULL,
    quantite DECIMAL(15, 2) NOT NULL,
    prix_unitaire_ht DECIMAL(15, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 20,
    montant_ht DECIMAL(15, 2),
    montant_ttc DECIMAL(15, 2),
    ordre INTEGER DEFAULT 0
);

-- Table: Factures
CREATE TABLE IF NOT EXISTS factures (
    id BIGSERIAL PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    client_id BIGINT REFERENCES clients(id),
    devis_id BIGINT REFERENCES devis(id),
    date_emission DATE DEFAULT CURRENT_DATE,
    date_echeance DATE,
    statut TEXT DEFAULT 'brouillon', -- brouillon, en_attente, payée, partiellement_payée, annulée
    mode_paiement TEXT,
    montant_ht DECIMAL(15, 2) DEFAULT 0,
    montant_tva DECIMAL(15, 2) DEFAULT 0,
    montant_ttc DECIMAL(15, 2) DEFAULT 0,
    reste_a_payer DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    conditions_paiement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Facture Lignes
CREATE TABLE IF NOT EXISTS facture_lignes (
    id BIGSERIAL PRIMARY KEY,
    facture_id BIGINT REFERENCES factures(id) ON DELETE CASCADE,
    produit_id BIGINT REFERENCES produits(id),
    reference TEXT,
    designation TEXT NOT NULL,
    quantite DECIMAL(15, 2) NOT NULL,
    prix_unitaire_ht DECIMAL(15, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 20,
    montant_ht DECIMAL(15, 2),
    montant_ttc DECIMAL(15, 2),
    ordre INTEGER DEFAULT 0
);

-- Table: Bons de Commande (Fournisseurs)
CREATE TABLE IF NOT EXISTS bons_commande (
    id BIGSERIAL PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    fournisseur_id BIGINT REFERENCES fournisseurs(id),
    date_commande DATE DEFAULT CURRENT_DATE,
    date_livraison_prevue DATE,
    statut TEXT DEFAULT 'brouillon', -- brouillon, envoyé, livré, annulé
    montant_ht DECIMAL(15, 2) DEFAULT 0,
    montant_tva DECIMAL(15, 2) DEFAULT 0,
    montant_ttc DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Bon Commande Lignes
CREATE TABLE IF NOT EXISTS bon_commande_lignes (
    id BIGSERIAL PRIMARY KEY,
    bon_commande_id BIGINT REFERENCES bons_commande(id) ON DELETE CASCADE,
    produit_id BIGINT REFERENCES produits(id),
    reference TEXT,
    designation TEXT NOT NULL,
    quantite DECIMAL(15, 2) NOT NULL,
    prix_unitaire_ht DECIMAL(15, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 20,
    ordre INTEGER DEFAULT 0
);

-- Table: Bons de Livraison (Fournisseurs)
CREATE TABLE IF NOT EXISTS bons_livraison (
    id BIGSERIAL PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    fournisseur_id BIGINT REFERENCES fournisseurs(id),
    bon_commande_id BIGINT REFERENCES bons_commande(id),
    date_livraison DATE DEFAULT CURRENT_DATE,
    statut TEXT DEFAULT 'reçu', -- reçu, annulé
    montant_ht DECIMAL(15, 2) DEFAULT 0,
    montant_tva DECIMAL(15, 2) DEFAULT 0,
    montant_ttc DECIMAL(15, 2) DEFAULT 0,
    stock_updated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Bon Livraison Lignes
CREATE TABLE IF NOT EXISTS bon_livraison_lignes (
    id BIGSERIAL PRIMARY KEY,
    bon_livraison_id BIGINT REFERENCES bons_livraison(id) ON DELETE CASCADE,
    produit_id BIGINT REFERENCES produits(id),
    reference TEXT,
    designation TEXT NOT NULL,
    quantite DECIMAL(15, 2) NOT NULL,
    prix_unitaire_ht DECIMAL(15, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 20,
    ordre INTEGER DEFAULT 0
);

-- Table: Mouvements de Stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id BIGSERIAL PRIMARY KEY,
    produit_id BIGINT REFERENCES produits(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- initial, achat, vente, ajustement, retour
    quantite DECIMAL(15, 2) NOT NULL,
    date_mouvement TIMESTAMPTZ DEFAULT NOW(),
    reference_document TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Logs Activités
CREATE TABLE IF NOT EXISTS logs_activites (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Paramètres
CREATE TABLE IF NOT EXISTS parametres (
    id BIGSERIAL PRIMARY KEY,
    nom_entreprise TEXT,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    ice TEXT,
    rc TEXT,
    if_identifiant TEXT,
    patente TEXT,
    logo_url TEXT,
    devise TEXT DEFAULT 'DH',
    conditions_paiement_defaut TEXT,
    pied_page_defaut TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('produits', 'clients', 'fournisseurs', 'devis', 'factures', 'bons_commande', 'bons_livraison', 'parametres')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;

-- RPC Function to execute SQL (for development)
DROP FUNCTION IF EXISTS execute_sql(text);
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
