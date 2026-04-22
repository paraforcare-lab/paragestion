-- =====================================================
-- FIX RLS (Row Level Security) POLICIES
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Enable RLS on all tables
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_passagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE avoirs ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies for each table
-- These allow users to see/insert/update/delete ONLY their own data

-- Fournisseurs policies
DROP POLICY IF EXISTS "fournisseurs can read" ON fournisseurs;
DROP POLICY IF EXISTS "fournisseurs can insert" ON fournisseurs;
CREATE POLICY "fournisseurs can read" ON fournisseurs FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "fournisseurs can insert" ON fournisseurs FOR INSERT WITH CHECK (user_id = auth.uid());

-- Clients policies  
DROP POLICY IF EXISTS "clients can read" ON clients;
DROP POLICY IF EXISTS "clients can insert" ON clients;
CREATE POLICY "clients can read" ON clients FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "clients can insert" ON clients FOR INSERT WITH CHECK (user_id = auth.uid());

-- Produits policies
DROP POLICY IF EXISTS "produits can read" ON produits;
DROP POLICY IF EXISTS "produits can insert" ON produits;
CREATE POLICY "produits can read" ON produits FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "produits can insert" ON produits FOR INSERT WITH CHECK (user_id = auth.uid());

-- Factures policies
DROP POLICY IF EXISTS "factures can read" ON factures;
DROP POLICY IF EXISTS "factures can insert" ON factures;
CREATE POLICY "factures can read" ON factures FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "factures can insert" ON factures FOR INSERT WITH CHECK (user_id = auth.uid());

-- Devis policies
DROP POLICY IF EXISTS "devis can read" ON devis;
DROP POLICY IF EXISTS "devis can insert" ON devis;
CREATE POLICY "devis can read" ON devis FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "devis can insert" ON devis FOR INSERT WITH CHECK (user_id = auth.uid());

-- Bons Commande policies
DROP POLICY IF EXISTS "bons_commande can read" ON bons_commande;
DROP POLICY IF EXISTS "bons_commande can insert" ON bons_commande;
CREATE POLICY "bons_commande can read" ON bons_commande FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "bons_commande can insert" ON bons_commande FOR INSERT WITH CHECK (user_id = auth.uid());

-- Bons Livraison policies
DROP POLICY IF EXISTS "bons_livraison can read" ON bons_livraison;
DROP POLICY IF EXISTS "bons_livraison can insert" ON bons_livraison;
CREATE POLICY "bons_livraison can read" ON bons_livraison FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "bons_livraison can insert" ON bons_livraison FOR INSERT WITH CHECK (user_id = auth.uid());

-- Depenses policies
DROP POLICY IF EXISTS "depenses can read" ON depenses;
DROP POLICY IF EXISTS "depenses can insert" ON depenses;
CREATE POLICY "depenses can read" ON depenses FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "depenses can insert" ON depenses FOR INSERT WITH CHECK (user_id = auth.uid());

-- Parametres policies (one per user)
DROP POLICY IF EXISTS "parametres can read" ON parametres;
DROP POLICY IF EXISTS "parametres can insert" ON parametres;
CREATE POLICY "parametres can read" ON parametres FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "parametres can insert" ON parametres FOR INSERT WITH CHECK (user_id = auth.uid());

-- Ventes Passagers policies
DROP POLICY IF EXISTS "ventes_passagers can read" ON ventes_passagers;
DROP POLICY IF EXISTS "ventes_passagers can insert" ON ventes_passagers;
CREATE POLICY "ventes_passagers can read" ON ventes_passagers FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "ventes_passagers can insert" ON ventes_passagers FOR INSERT WITH CHECK (user_id = auth.uid());

-- Avoirs policies
DROP POLICY IF EXISTS "avoirs can read" ON avoirs;
DROP POLICY IF EXISTS "avoirs can insert" ON avoirs;
CREATE POLICY "avoirs can read" ON avoirs FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "avoirs can insert" ON avoirs FOR INSERT WITH CHECK (user_id = auth.uid());

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('fournisseurs', 'clients', 'produits', 'factures', 'devis', 
                 'bons_commande', 'bons_livraison', 'depenses', 'parametres', 
                 'ventes_passagers', 'avoirs');

SELECT 'RLS policies created successfully!' as status;