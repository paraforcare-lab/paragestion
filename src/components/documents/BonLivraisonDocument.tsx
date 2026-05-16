import { forwardRef } from 'react'
import { DocumentPreview } from './DocumentPreview'

interface BonLivraisonDocumentProps {
  bon: any;
  entreprise: any;
}

export const BonLivraisonDocument = forwardRef<HTMLDivElement, BonLivraisonDocumentProps>(
  ({ bon, entreprise }, ref) => {
    if (!bon) return null
    return <DocumentPreview ref={ref} type="bon_livraison" data={bon} entreprise={entreprise} />
  }
)

BonLivraisonDocument.displayName = 'BonLivraisonDocument'
