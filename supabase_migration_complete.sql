-- =====================================================
-- SMARTFACTURE MULTI-TENANT MIGRATION
-- Complete migration to add user_id and fix all schema issues
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Step 1: Add user_id columns to all tables that need them
-- =====================================================

DO $$
DECLARE table_name TEXT;
BEGIN
    -- List of tables that need user_id
    FOR table_name IN 
        SELECT 'produits' UNION ALL
        SELECT 'clients' UNION ALL
        SELECT 'fournisseurs' UNION ALL
        SELECT 'devis' UNION ALL
        SELECT 'factures' UNION ALL
        SELECT 'bons_commande' UNION ALL
        SELECT 'bons_livraison' UNION ALL
        SELECT 'depenses' UNION ALL
        SELECT 'parametres' UNION ALL
        SELECT 'ventes_passagers'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id UUID',
            table_name
        );
    END LOOP;
END $$;

-- Step 2: Create user_id indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_produits_user_id ON produits(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_user_id ON fournisseur(user_id);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_user_id ON fournisseurs(user_id);
CREATE INDEX IF NOT EXISTS idx_devis_user_id ON devis(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_user_id ON factures(user_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_user_id ON bons_commande(user_id);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_user_id ON bons_livraison(user_id);
CREATE INDEX IF NOT EXISTS idx_depenses_user_id ON depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_parametres_user_id ON parametres(user_id);
CREATE INDEX IF NOT EXISTS idx_ventes_passagers_user_id ON ventes_passagers(user_id);

-- Step 3: Fix missing columns in produits
-- =====================================================

DO $$
BEGIN
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS taux_tva DECIMAL(5, 2) DEFAULT 20;
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS designation TEXT;
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS nom TEXT;
END $$;

-- Step 4: Fix missing columns in clients
-- =====================================================

DO $$
BEGIN
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom_societe TEXT;
END $$;

-- Step 5: Fix missing columns in fournisseurs
-- =====================================================

DO $$
BEGIN
    ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS code TEXT;
    ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS nom_societe TEXT;
    ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'entreprise';
END $$;

-- Step 6: Fix missing columns in factures
-- =====================================================

DO $$
BEGIN
    ALTER TABLE factures ADD COLUMN IF NOT EXISTS cogs DECIMAL(15, 2) DEFAULT 0;
    ALTER TABLE factures ADD COLUMN IF NOT EXISTS mode_paiement TEXT;
END $$;

-- Step 7: Fix missing columns in facture_lignes
-- =====================================================

DO $$
BEGIN
    ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS prix_unitaire DECIMAL(15, 2);
END $$;

-- Step 8: Create ventes_passagers table if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS ventes_passagers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    numero TEXT UNIQUE NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    montant_ht DECIMAL(15, 2) DEFAULT 0,
    montant_tva DECIMAL(15, 2) DEFAULT 0,
    montant_ttc DECIMAL(15, 2) DEFAULT 0,
    cogs DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 9: Create ventes_passagers_lignes table if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS ventes_passagers_lignes (
    id BIGSERIAL PRIMARY KEY,
    vp_id BIGINT REFERENCES ventes_passagers(id) ON DELETE CASCADE,
    produit_id BIGINT REFERENCES produits(id),
    designation TEXT NOT NULL,
    quantite DECIMAL(15, 2) NOT NULL,
    prix_unitaire_ht DECIMAL(15, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 20,
    montant_ht DECIMAL(15, 2),
    montant_ttc DECIMAL(15, 2),
    montant_tva DECIMAL(15, 2),
    ordre INTEGER DEFAULT 0
);

-- Step 10: Create avoirs table if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS avoirs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    numero TEXT UNIQUE NOT NULL,
    facture_id BIGINT REFERENCES factures(id),
    client_id BIGINT REFERENCES clients(id),
    date_emission DATE DEFAULT CURRENT_DATE,
    montant_ht DECIMAL(15, 2) DEFAULT 0,
    montant_tva DECIMAL(15, 2) DEFAULT 0,
    montant_ttc DECIMAL(15, 2) DEFAULT 0,
    statut TEXT DEFAULT 'en_attente',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 11: Create avoir_lignes table if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS avoir_lignes (
    id BIGSERIAL PRIMARY KEY,
    avoir_id BIGINT REFERENCES avoirs(id) ON DELETE CASCADE,
    produit_id BIGINT REFERENCES produits(id),
    designation TEXT NOT NULL,
    quantite DECIMAL(15, 2) NOT NULL,
    prix_unitaire_ht DECIMAL(15, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 20,
    montant_ht DECIMAL(15, 2),
    montant_ttc DECIMAL(15, 2),
    ordre INTEGER DEFAULT 0
);

-- Step 12: Verify all tables have user_id
-- =====================================================

SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✓ Has user_id'
        ELSE '✗ Missing user_id'
    END as status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON c.table_name = t.table_name 
    AND c.column_name = 'user_id'
    AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
        'produits', 'clients', 'fournisseurs', 'devis', 'factures',
        'bons_commande', 'bons_livraison', 'depenses', 'parametres',
        'ventes_passagers', 'avoirs'
    )
ORDER BY t.table_name;

-- Step 13: Check existing columns for each table
-- =====================================================

SELECT '=== COLUMNS CHECK ===' as result;

-- Produits columns
SELECT 'produits' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produits' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Clients columns  
SELECT 'clients' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Fournisseurs columns
SELECT 'fournisseurs' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fournisseurs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Factures columns
SELECT 'factures' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'factures' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Depenses columns
SELECT 'depenses' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'depenses' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Migration completed! Check results above.' as status;