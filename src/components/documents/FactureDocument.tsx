import { forwardRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { numberToFrenchWords } from '@/lib/numberToWords'
import { formatCurrency } from '@/lib/utils'

interface FactureDocumentProps {
  facture: any;
  entreprise: any;
}

export const FactureDocument = forwardRef<HTMLDivElement, FactureDocumentProps>(
  ({ facture, entreprise }, ref) => {
    if (!facture) return null;

    const primaryColor = '#0d9488'; // Medical teal
    const accentColor = '#14b8a6';

    const montantTtcTotal = facture.montant_ttc ?? facture.montantTtc ?? 0;
    
    return (
      <div 
        ref={ref} 
        className="p-8 bg-white text-gray-800 font-sans"
        style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakAfter: 'always' }}
      >
        {/* Premium Header with Gradient Effect */}
        <div className="relative mb-8">
          {/* Top gradient bar */}
          <div 
            className="absolute -top-8 -left-8 -right-8 h-2"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
          />
          
          <div className="flex justify-between items-start pt-6">
            {/* Company Info */}
            <div className="flex-1">
              {/* Logo */}
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
                    {entreprise?.nomEntreprise?.[0] || 'P'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-800">{entreprise?.nomEntreprise || 'ParaGestion'}</h1>
                    <p className="text-xs text-gray-500 font-medium">Parapharmacie Management</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-0.5 text-sm text-gray-600">
                <p className="font-medium">{entreprise?.adresse}</p>
                <p>{entreprise?.codePostale} {entreprise?.ville}</p>
                <p>Tél: {entreprise?.telephone}</p>
                <p>Email: {entreprise?.email}</p>
                {entreprise?.ice && <p className="font-medium mt-1">ICE: {entreprise.ice}</p>}
              </div>
            </div>

            {/* Invoice Title */}
            <div className="text-right">
              <div 
                className="inline-block px-6 py-3 rounded-2xl text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                <h2 className="text-3xl font-black tracking-tight">
                  {facture.isAvoir ? 'AVOIR' : 'FACTURE'}
                </h2>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-lg font-bold text-gray-800">{facture.numero}</p>
                <p className="text-sm text-gray-500">
                  Date: {format(new Date(facture.dateEmission), 'dd MMMM yyyy', { locale: fr })}
                </p>
                {facture.dateEcheance && (
                  <p className="text-sm text-gray-500">
                    Échéance: {format(new Date(facture.dateEcheance), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="mb-8 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Facturé à</p>
              <p className="text-lg font-bold text-gray-800">
                {facture.client?.nom || facture.client?.nomSociete || '-'}
              </p>
              {facture.client?.adresse && (
                <p className="text-sm text-gray-600 mt-1">{facture.client.adresse}</p>
              )}
              {(facture.client?.codePostale || facture.client?.ville) && (
                <p className="text-sm text-gray-600">
                  {facture.client?.codePostale} {facture.client?.ville}
                </p>
              )}
              {facture.client?.telephone && (
                <p className="text-sm text-gray-600">Tél: {facture.client.telephone}</p>
              )}
              {facture.client?.email && (
                <p className="text-sm text-gray-600">{facture.client.email}</p>
              )}
            </div>
            
            <div className="text-right">
              {facture.client?.ice && (
                <div className="inline-block px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-bold text-primary">ICE</p>
                  <p className="text-sm font-mono font-bold text-gray-800">{facture.client.ice}</p>
                </div>
              )}
              {facture.modePaiement && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paiement</p>
                  <p className="text-sm font-semibold text-gray-700">{facture.modePaiement}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr 
                className="text-white text-xs uppercase tracking-wider font-bold"
                style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
              >
                <th className="py-4 px-5 text-left rounded-tl-2xl">Désignation</th>
                <th className="py-4 px-4 text-center">Qté</th>
                <th className="py-4 px-4 text-right">Prix HT</th>
                <th className="py-4 px-4 text-right">TVA</th>
                <th className="py-4 px-4 text-right rounded-tr-2xl">Total HT</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {facture.lignes?.map((ligne: any, index: number) => {
                const prixHt = ligne.prix_unitaire_ht ?? ligne.prixUnitaireHt ?? 0;
                const montantHt = ligne.montant_ht ?? ligne.montantHt ?? (prixHt * (ligne.quantite || 1));
                const montantTtc = ligne.montant_ttc ?? ligne.montantTtc ?? 0;
                const qte = ligne.quantite || 1;
                const prixTtc = montantTtc / qte;
                const tva = ligne.tva ?? 0;
                
                return (
                  <tr 
                    key={index} 
                    className={`
                      border-b border-gray-100 last:border-0
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    <td className="py-4 px-5">
                      <p className="font-semibold text-gray-800">{ligne.designation || '-'}</p>
                      {ligne.reference && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">Réf: {ligne.reference}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                        {qte}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-semibold text-gray-700">{formatCurrency(prixHt)}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                        {tva}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(montantHt)}</p>
                    </td>
                  </tr>
                );
              })}
              {(!facture.lignes || facture.lignes.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Aucun article
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            {/* Summary Card */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                  Récapitulatif
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-gray-600">Total HT</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(facture.montant_ht ?? facture.montantHt ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-gray-600">TVA</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(facture.montant_tva ?? facture.montantTva ?? 0)}
                  </span>
                </div>
                {facture.mode_paiement === 'Espèces' && (
                  <div className="flex justify-between items-center py-3 px-4">
                    <span className="text-gray-600">Droit de Timbre</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(((Number(facture.montant_ht ?? 0)) + (Number(facture.montant_tva ?? 0))) * 0.0025)}
                    </span>
                  </div>
                )}
                <div 
                  className="flex justify-between items-center py-4 px-4 text-white font-bold text-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  <span>Total TTC</span>
                  <span>{formatCurrency(facture.montant_ttc ?? facture.montantTtc ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Remaining Amount Warning */}
            {facture.isAvoir && (
              <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <p className="text-sm font-bold text-orange-700">Avoir</p>
                </div>
                <p className="text-xs text-orange-600">Cet avoir annule la facture {facture.numeroFactureOriginale}</p>
              </div>
            )}
            {Number(facture.resteAPayer ?? 0) > 0 && !facture.isAvoir && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm font-bold text-red-700">Reste à payer</p>
                </div>
                <p className="text-2xl font-black text-red-700">{formatCurrency(facture.resteAPayer)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amount in Words */}
        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Arrêté {facture.isAvoir ? "l'avoir" : "la présente facture"} à la somme de :</span>
            <br />
            <span className="font-bold text-gray-800 italic text-base">
              {numberToFrenchWords(Math.abs(Number(facture.montantTtc ?? facture.montant_ttc ?? 0)))} Dirhams
            </span>
          </p>
        </div>

        {/* Bank Details - Always on 2nd page */}
        {entreprise?.banque && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                <span className="text-sm font-bold">🏦</span>
              </div>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Coordonnées Bancaires</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-medium">Banque</p>
                <p className="font-semibold text-gray-800">{entreprise.banque}</p>
              </div>
              {entreprise.swift && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">SWIFT / BIC</p>
                  <p className="font-mono font-semibold text-gray-800">{entreprise.swift}</p>
                </div>
              )}
              {entreprise.rib && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-medium">RIB</p>
                  <p className="font-mono font-bold text-gray-800 text-base">{entreprise.rib}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="flex justify-between items-end pt-8 border-t-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="w-40 h-16 border-b-2 border-dashed border-gray-300 mb-2"></div>
            <p className="text-xs font-semibold text-gray-500">Cachet et Signature du Client</p>
          </div>
          <div className="text-center">
            <div 
              className="w-40 h-16 border-b-2 border-dashed mx-auto mb-2"
              style={{ borderColor: primaryColor }}
            ></div>
            <p className="text-xs font-semibold text-gray-500">Cachet et Signature de la Société</p>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200">
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
            {entreprise?.ice && <span>ICE: {entreprise.ice}</span>}
            {entreprise?.rc && <span>RC: {entreprise.rc}</span>}
            {entreprise?.ifNumber && <span>IF: {entreprise.ifNumber}</span>}
            {entreprise?.tpPatente && <span>Patente: {entreprise.tpPatente}</span>}
          </div>
        </div>
      </div>
    );
  }
);

FactureDocument.displayName = 'FactureDocument';
