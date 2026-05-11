import { forwardRef, useMemo } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { numberToFrenchWords } from '@/lib/numberToWords'
import { formatCurrency } from '@/lib/utils'

interface FactureDocumentProps {
  facture: any
  entreprise: any
}

export const FactureDocument = forwardRef<HTMLDivElement, FactureDocumentProps>(
  ({ facture, entreprise }, ref) => {
    if (!facture) return null

    const safeVal = (obj: any, ...keys: string[]) => {
      for (const key of keys) {
        const val = obj?.[key]
        if (val !== null && val !== undefined) return val
      }
      return 0
    }

    const montantTtc = safeVal(facture, 'montantTtc', 'montant_ttc')
    const montantHt = safeVal(facture, 'montantHt', 'montant_ht')
    const montantTva = safeVal(facture, 'montantTva', 'montant_tva')
    const resteAPayer = safeVal(facture, 'resteAPayer', 'reste_a_payer')
    const modePaiement = facture.modePaiement || facture.mode_paiement || ''

    const lignes = facture.lignes || []
    const lineCount = lignes.length

    const compact = lineCount > 10

    const dateEmission = facture.dateEmission
      ? format(new Date(facture.dateEmission), 'dd MMMM yyyy', { locale: fr })
      : ''
    const dateEcheance = facture.dateEcheance
      ? format(new Date(facture.dateEcheance), 'dd MMMM yyyy', { locale: fr })
      : ''

    return (
      <>
        <style>{`
          @page {
            margin: 0;
            size: A4;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-break {
              page-break-inside: avoid;
            }
          }
        `}</style>
        <div
          ref={ref}
          className="bg-white text-slate-900 font-sans"
          style={{
            width: '210mm',
            height: '297mm',
            overflow: 'hidden',
            padding: compact ? '12mm 14mm 10mm' : '16mm 16mm 12mm',
            fontFamily: "'Inter Variable', sans-serif",
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ===== HEADER ===== */}
          <div className={compact ? 'mb-3' : 'mb-5'}>
            <div className="flex justify-between items-start">
              {/* Left: Company Info */}
              <div className="flex-1">
                {entreprise?.logoUrl && entreprise.logoUrl !== 'image.png' && entreprise.logoUrl?.startsWith('http') ? (
                  <img
                    src={entreprise.logoUrl}
                    alt="Logo"
                    className={compact ? 'h-10 object-contain mb-2' : 'h-14 object-contain mb-2.5'}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-[6px] bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
                      {entreprise?.nomEntreprise?.[0] || 'P'}
                    </div>
                    <h1 className={`font-bold text-slate-900 leading-tight ${compact ? 'text-lg' : 'text-xl'}`}>
                      {entreprise?.nomEntreprise || 'ParaGestion'}
                    </h1>
                  </div>
                )}
                <div className={`space-y-0.5 text-slate-500 leading-snug ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                  {entreprise?.adresse && <p>{entreprise.adresse}</p>}
                  {entreprise?.ville && <p>{entreprise.ville}</p>}
                  <p>
                    {entreprise?.telephone && <span>Tél: {entreprise.telephone}</span>}
                    {entreprise?.email && <span className="ml-2">Email: {entreprise.email}</span>}
                  </p>
                  {entreprise?.ice && <p className="font-medium text-slate-700">ICE: {entreprise.ice}</p>}
                </div>
              </div>

              {/* Right: Watermark + Invoice Meta */}
              <div className="text-right relative min-w-[180px]">
                <div
                  className={`absolute -top-3 right-0 font-black tracking-[0.15em] text-slate-200 select-none leading-none pointer-events-none ${compact ? 'text-[40px]' : 'text-[52px]'}`}
                  style={{ color: '#e2e8f0' }}
                >
                  FACTURE
                </div>
                <div className="relative pt-7">
                  <p className={`font-bold text-slate-900 tracking-tight ${compact ? 'text-xl' : 'text-2xl'}`}>
                    {facture.numero}
                  </p>
                  <div className={`mt-1 space-y-0.5 text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                    <p>Émission: {dateEmission}</p>
                    {dateEcheance && <p>Échéance: {dateEcheance}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2.5 border-t border-slate-200" />
          </div>

          {/* ===== CLIENT INFO ===== */}
          <div className={compact ? 'mb-3' : 'mb-4'}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`font-semibold text-slate-400 uppercase tracking-widest mb-1 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                  Facturé à
                </p>
                <p className={`font-bold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {facture.client?.nomSociete || facture.client?.nom || '-'}
                </p>
                {facture.client?.adresse && (
                  <p className={`text-slate-500 mt-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{facture.client.adresse}</p>
                )}
                {(facture.client?.codePostale || facture.client?.ville) && (
                  <p className={`text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                    {facture.client?.codePostale} {facture.client?.ville}
                  </p>
                )}
                {facture.client?.telephone && (
                  <p className={`text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Tél: {facture.client.telephone}</p>
                )}
                {facture.client?.email && (
                  <p className={`text-slate-500 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{facture.client.email}</p>
                )}
              </div>
              {facture.client?.ice && (
                <div className="text-right">
                  <p className={`font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>ICE</p>
                  <p className={`font-mono font-semibold text-slate-700 ${compact ? 'text-[10px]' : 'text-xs'}`}>{facture.client.ice}</p>
                </div>
              )}
            </div>
          </div>

          {/* ===== ITEMS TABLE ===== */}
          <div className="flex-1 flex flex-col min-h-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className={`pb-1.5 text-left font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                    Désignation
                  </th>
                  <th className={`pb-1.5 text-center font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                    Qté
                  </th>
                  <th className={`pb-1.5 text-right font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                    Prix HT
                  </th>
                  <th className={`pb-1.5 text-right font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                    TVA
                  </th>
                  <th className={`pb-1.5 text-right font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                    Total HT
                  </th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne: any, index: number) => {
                  const qte = ligne.quantite || 1
                  const prixHt = ligne.prix_unitaire_ht ?? ligne.prixUnitaireHt ?? 0
                  const montantLigneHt = ligne.montant_ht ?? ligne.montantHt ?? (qte * prixHt)
                  const tva = ligne.tva ?? 0

                  return (
                    <tr key={index} className="border-b border-slate-100 last:border-0">
                      <td className={`${compact ? 'py-1.5' : 'py-2.5'} pr-3`}>
                        <p className={`font-semibold text-slate-900 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                          {ligne.designation || '-'}
                        </p>
                        {ligne.reference && (
                          <p className={`text-slate-400 mt-0.5 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                            Réf: {ligne.reference}
                          </p>
                        )}
                      </td>
                      <td className={`${compact ? 'py-1.5' : 'py-2.5'} px-1.5 text-center align-top`}>
                        <span className={`font-medium text-slate-700 ${compact ? 'text-[10px]' : 'text-xs'}`}>{qte}</span>
                      </td>
                      <td className={`${compact ? 'py-1.5' : 'py-2.5'} px-1.5 text-right align-top`}>
                        <span className={`text-slate-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>{formatCurrency(prixHt)}</span>
                      </td>
                      <td className={`${compact ? 'py-1.5' : 'py-2.5'} px-1.5 text-right align-top`}>
                        {Number(tva) > 0 ? (
                          <span className={`inline-block font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[4px] ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                            {tva}%
                          </span>
                        ) : (
                          <span className={`text-slate-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>—</span>
                        )}
                      </td>
                      <td className={`${compact ? 'py-1.5' : 'py-2.5'} pl-1.5 text-right align-top`}>
                        <span className={`font-semibold text-slate-900 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                          {formatCurrency(montantLigneHt)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Aucun article
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ===== Spacer to push bottom sections down ===== */}
            <div className="flex-1" />

            {/* ===== TOTALS ===== */}
            <div className="flex justify-end mb-3">
              <div className="w-60">
                <div className={`space-y-1 pb-2 border-b border-dashed border-slate-300 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total HT</span>
                    <span className={`font-medium text-slate-800 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      {formatCurrency(montantHt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">TVA</span>
                    <span className={`font-medium text-slate-800 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      {formatCurrency(montantTva)}
                    </span>
                  </div>
                </div>
                <div className={`flex justify-between items-center pt-2 ${compact ? 'text-sm' : 'text-base'} font-bold text-slate-900`}>
                  <span>Total TTC</span>
                  <span>{formatCurrency(montantTtc)}</span>
                </div>
              </div>
            </div>

            {/* ===== PAYMENT MODE + AMOUNT IN WORDS ===== */}
            <div className={`grid grid-cols-2 gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
              <div className="bg-slate-50 rounded-[6px] border border-slate-100 p-2.5">
                <p className={`font-semibold text-slate-400 uppercase tracking-widest mb-0.5 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                  Mode de paiement
                </p>
                {modePaiement ? (
                  <p className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{modePaiement}</p>
                ) : (
                  <p className={`text-slate-400 italic ${compact ? 'text-[10px]' : 'text-xs'}`}>Non spécifié</p>
                )}
              </div>
              <div className="bg-slate-50 rounded-[6px] border border-slate-100 p-2.5">
                <p className={`font-semibold text-slate-400 uppercase tracking-widest mb-0.5 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                  Arrêtée à la somme de
                </p>
                <p className={`font-bold text-slate-800 leading-snug ${compact ? 'text-[9px]' : 'text-xs'}`}>
                  {numberToFrenchWords(Math.abs(Number(montantTtc)))}
                </p>
              </div>
            </div>

            {/* ===== SIGNATURES ===== */}
            <div className={`flex justify-between items-end pt-3 border-t border-dashed border-slate-300 ${compact ? 'mb-2' : 'mb-3'}`}>
              <div className="text-center flex-1">
                <div className="w-40 h-11 border-b-2 border-dashed border-slate-300 mx-auto mb-1" />
                <p className="text-[8px] font-medium text-slate-400">Cachet et Signature du Client</p>
              </div>
              <div className="text-center flex-1">
                <div className="w-40 h-11 border-b-2 border-dashed border-slate-300 mx-auto mb-1" />
                <p className="text-[8px] font-medium text-slate-400">Cachet et Signature de la Société</p>
              </div>
            </div>

            {/* ===== FOOTER ===== */}
            <div className="border-t border-slate-100 pt-2 text-center">
              <p className="text-[8px] text-slate-400">
                {entreprise?.ice && <span>ICE: {entreprise.ice}</span>}
                {entreprise?.rc && <span className="ml-2">RC: {entreprise.rc}</span>}
                {entreprise?.ifNumber && <span className="ml-2">IF: {entreprise.ifNumber}</span>}
              </p>
              <p className="text-[7px] text-slate-300 mt-0.5">Généré par ParaGestion</p>
            </div>
          </div>
        </div>
      </>
    )
  }
)

FactureDocument.displayName = 'FactureDocument'
