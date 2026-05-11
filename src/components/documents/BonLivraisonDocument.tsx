import { forwardRef } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import { numberToFrenchWords } from '@/lib/numberToWords'

interface BonLivraisonDocumentProps {
  bon: any;
  entreprise: any;
}

const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(String(value).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

const safeFormatDate = (dateValue: any, formatStr: string = 'dd MMMM yyyy'): string => {
  if (!dateValue) return '-';
  try {
    let date: Date;
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T') || dateValue.includes('-')) {
        date = parseISO(dateValue);
      } else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    if (!isValid(date)) return '-';
    return format(date, formatStr, { locale: fr });
  } catch {
    return '-';
  }
};

const calculateLigneMontant = (ligne: any): number => {
  const quantite = safeParseFloat(ligne?.quantite);
  const prixUnitaire = safeParseFloat(ligne?.prixUnitaireHt);
  const montantHt = safeParseFloat(ligne?.montantHt);
  
  if (montantHt > 0) return montantHt;
  return quantite * prixUnitaire;
};

const calculateTotals = (lignes: any[]) => {
  if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
    return { totalHt: 0, totalTva: 0, totalTtc: 0 };
  }
  
  let totalHt = 0;
  for (const ligne of lignes) {
    totalHt += calculateLigneMontant(ligne);
  }
  
  const totalTva = totalHt * 0.2;
  const totalTtc = totalHt + totalTva;
  
  return { totalHt, totalTva, totalTtc };
};

export const BonLivraisonDocument = forwardRef<HTMLDivElement, BonLivraisonDocumentProps>(
  ({ bon, entreprise }, ref) => {
    const primaryColor = '#0d9488';
    const accentColor = '#14b8a6';

    const isLoading = !bon;
    const lignes = bon?.lignes || [];
    const totals = calculateTotals(lignes);
    
    const displayedMontantHt = safeParseFloat(bon?.montantHt) || totals.totalHt;
    const displayedMontantTva = safeParseFloat(bon?.montantTva) || totals.totalTva;
    const displayedMontantTtc = safeParseFloat(bon?.montantTtc) || totals.totalTtc;
    const showTotals = displayedMontantTtc > 0;

    return (
      <div 
        ref={ref} 
        className="p-8 bg-white text-gray-800 font-sans" 
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Chargement du document...</p>
          </div>
        ) : (
        <>
        <div className="relative mb-8">
          <div 
            className="absolute -top-8 -left-8 -right-8 h-2"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
          />
          
          <div className="flex justify-between items-start pt-6">
            <div className="flex-1">
              {entreprise?.logoUrl && entreprise.logoUrl !== 'image.png' && entreprise.logoUrl?.startsWith('http') ? (
                <img 
                  src={entreprise.logoUrl} 
                  alt="Logo" 
                  className="h-20 object-contain mb-4"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    {(entreprise?.nomEntreprise?.[0] || 'P')}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-800">{entreprise?.nomEntreprise || 'ParaGestion'}</h1>
                    <p className="text-xs text-gray-500 font-medium">Parapharmacie Management</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-0.5 text-sm text-gray-600">
                <p className="font-medium">{entreprise?.adresse || '-'}</p>
                <p>{entreprise?.codePostale || ''} {entreprise?.ville || ''}</p>
                <p>Tél: {entreprise?.telephone || '-'}</p>
                <p>Email: {entreprise?.email || '-'}</p>
                {entreprise?.ice && <p className="font-medium mt-1">ICE: {entreprise.ice}</p>}
              </div>
            </div>

            <div className="text-right">
              <div 
                className="inline-block px-6 py-3 rounded-2xl text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                <h2 className="text-3xl font-black tracking-tight">BON DE LIVRAISON</h2>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-lg font-bold text-gray-800">{bon?.numero || '-'}</p>
                <p className="text-sm text-gray-500">
                  Date: {safeFormatDate(bon?.date, 'dd MMMM yyyy')}
                </p>
                {bon?.dateLivraison && (
                  <p className="text-sm text-gray-500">
                    Livraison: {safeFormatDate(bon.dateLivraison, 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fournisseur</p>
              <p className="text-lg font-bold text-gray-800">
                {bon?.fournisseur?.nom || bon?.fournisseur?.nomSociete || '-'}
              </p>
              {bon?.fournisseur?.adresse && (
                <p className="text-sm text-gray-600 mt-1">{bon.fournisseur.adresse}</p>
              )}
              {(bon?.fournisseur?.codePostale || bon?.fournisseur?.ville) && (
                <p className="text-sm text-gray-600">
                  {bon.fournisseur.codePostale} {bon.fournisseur.ville}
                </p>
              )}
              {bon?.fournisseur?.telephone && (
                <p className="text-sm text-gray-600">Tél: {bon.fournisseur.telephone}</p>
              )}
              {bon?.fournisseur?.email && (
                <p className="text-sm text-gray-600">{bon.fournisseur.email}</p>
              )}
            </div>
            
            <div className="text-right">
              {bon?.fournisseur?.ice && (
                <div className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-bold text-primary">ICE</p>
                  <p className="text-sm font-mono font-bold text-gray-800">{bon.fournisseur.ice}</p>
                </div>
              )}
              {bon?.bonCommande?.numero && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Réf Commande</p>
                  <p className="text-sm font-semibold text-gray-700">{bon.bonCommande.numero}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr 
                className="text-white text-xs uppercase tracking-wider font-bold"
                style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
              >
                <th className="py-4 px-5 text-left rounded-tl-2xl">Désignation</th>
                <th className="py-4 px-4 text-center">Qté</th>
                <th className="py-4 px-4 text-right rounded-tr-2xl">Prix HT</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {lignes.length > 0 ? (
                lignes.map((ligne: any, index: number) => {
                  const ligneMontant = calculateLigneMontant(ligne);
                  return (
                    <tr 
                      key={ligne?.id || index}
                      className={`
                        border-b border-gray-100 last:border-0
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                    >
                      <td className="py-4 px-5">
                        <p className="font-semibold text-gray-800">{ligne?.designation || '-'}</p>
                        {ligne?.reference && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">Réf: {ligne.reference}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                          {safeParseFloat(ligne?.quantite)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-bold text-gray-800">{formatCurrency(ligneMontant)}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-400">
                    Aucun article
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showTotals && (
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                    Récapitulatif
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between items-center py-3 px-4">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(displayedMontantHt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4">
                    <span className="text-gray-600">TVA (20%)</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(displayedMontantTva)}</span>
                  </div>
                  <div 
                    className="flex justify-between items-center py-4 px-4 text-white font-bold text-lg"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    <span>Total TTC</span>
                    <span>{formatCurrency(displayedMontantTtc)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTotals && (
          <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Arrêté le présent bon de livraison à la somme de :</span>
              <br />
              <span className="font-bold text-gray-800 italic text-base">
                {numberToFrenchWords(Math.abs(displayedMontantTtc))} Dirhams
              </span>
            </p>
          </div>
        )}

        {bon?.notes && (
          <div className="mb-8 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{bon.notes}</p>
          </div>
        )}

        <div className="flex justify-between items-end pt-8 border-t-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="w-40 h-16 border-b-2 border-dashed border-gray-300 mb-2"></div>
            <p className="text-xs font-semibold text-gray-500">Cachet et Signature du Fournisseur</p>
          </div>
          <div className="text-center">
            <div 
              className="w-40 h-16 border-b-2 border-dashed mx-auto mb-2"
              style={{ borderColor: primaryColor }}
            ></div>
            <p className="text-xs font-semibold text-gray-500">Cachet et Signature de la Société</p>
          </div>
        </div>

        <div className="mt-12 pt-4 border-t border-gray-200">
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
            {entreprise?.ice && <span>ICE: {entreprise.ice}</span>}
            {entreprise?.rc && <span>RC: {entreprise.rc}</span>}
            {entreprise?.ifNumber && <span>IF: {entreprise.ifNumber}</span>}
            {entreprise?.tpPatente && <span>Patente: {entreprise.tpPatente}</span>}
          </div>
        </div>
        </>
        )}
      </div>
    );
  }
);

BonLivraisonDocument.displayName = 'BonLivraisonDocument';
