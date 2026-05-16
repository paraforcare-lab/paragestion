import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, Package, ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Produit {
  id: number | string;
  reference?: string;
  designation?: string;
  nom?: string;
  marque?: string;
  prixVenteHt: number;
  prixVenteTtc?: number;
  tauxTva: number;
  stockActuel: number;
  imageUrl?: string;
  image_url?: string;
  prixAchatHt?: number;
}

interface ProductSelectorProps {
  produits: Produit[];
  onSelect: (produit: Produit, quantite: number) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

interface ProductCardProps {
  produit: Produit;
  onClick: () => void;
  selected: boolean;
  key?: string | number;
}

const StockBadge = ({ stock }: { stock: number }) => {
  if (stock <= 0) {
    return <span className="text-[10px] font-semibold text-white bg-rose-500 px-2.5 py-1 rounded-full">Épuisé</span>
  }
  if (stock <= 5) {
    return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">{stock} restant{stock > 1 ? 's' : ''}</span>
  }
  return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">{stock} en stock</span>
}

const ProductCard = ({
  produit,
  onClick,
  selected,
}: ProductCardProps) => {
  const stock = Number(produit.stockActuel ?? 0);
  const outOfStock = stock <= 0;
  const imageUrl = produit.imageUrl || produit.image_url;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={outOfStock}
      className={cn(
        "w-full relative text-left transition-all duration-200",
        "flex gap-4 items-start p-4",
        selected
          ? "bg-emerald-50/30"
          : "hover:bg-slate-50",
        outOfStock && "opacity-50 cursor-not-allowed",
        "border-b border-slate-100 last:border-0"
      )}
    >
      {/* Left accent bar for selected state */}
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-200",
        selected ? "bg-emerald-500" : "bg-transparent"
      )} />

      {/* Product Image */}
      <div className={cn(
        "w-[68px] h-[68px] rounded-[12px] overflow-hidden shrink-0 border",
        selected ? "border-emerald-200" : "border-slate-200"
      )}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={produit.designation || produit.nom || 'Produit'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.classList.add('flex', 'items-center', 'justify-center');
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <Package className="w-7 h-7 text-slate-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn(
              "text-sm font-semibold truncate",
              outOfStock ? "text-slate-400" : "text-slate-800"
            )}>
              {produit.designation || produit.nom || 'Produit'}
            </p>
            {(produit.marque || produit.reference) && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {produit.marque && <span>{produit.marque}</span>}
                {produit.marque && produit.reference && <span> • </span>}
                {produit.reference && <span className="font-mono">{produit.reference}</span>}
              </p>
            )}
          </div>
          <StockBadge stock={stock} />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-lg font-black text-emerald-600">
            {formatCurrency(produit.prixVenteHt)}
          </span>
          <span className="text-[10px] font-medium text-slate-400">HT</span>
          {produit.prixVenteTtc && (
            <>
              <span className="text-xs text-slate-300 mx-0.5">•</span>
              <span className="text-sm font-bold text-slate-700">
                {formatCurrency(produit.prixVenteTtc)}
              </span>
              <span className="text-[10px] font-medium text-slate-400">TTC</span>
            </>
          )}
          {produit.tauxTva !== undefined && (
            <>
              <span className="text-xs text-slate-300 mx-0.5">•</span>
              <span className="text-[10px] font-medium text-slate-400">TVA {produit.tauxTva}%</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export function ProductSelector({
  produits,
  onSelect,
  trigger,
  disabled,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [quantite, setQuantite] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredProduits = produits.filter(p => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      (p.designation || p.nom || '').toLowerCase().includes(searchLower) ||
      (p.reference || '').toLowerCase().includes(searchLower) ||
      (p.marque || '').toLowerCase().includes(searchLower)
    );
  });

  const selectedProduit = produits.find(p => p.id === selectedId);
  const stock = selectedProduit ? Number(selectedProduit.stockActuel ?? 0) : 0;

  const handleSelect = (produit: Produit) => {
    if (selectedId === produit.id) {
      setSelectedId(null);
    } else {
      setSelectedId(produit.id);
      setQuantite(1);
    }
  };

  const handleConfirm = () => {
    if (selectedProduit) {
      onSelect(selectedProduit, quantite);
      setIsOpen(false);
      setSelectedId(null);
      setSearchTerm('');
      setQuantite(1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedId) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            disabled={disabled}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-[4px] shadow-none"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sélectionner un produit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-[10px] bg-emerald-50">
              <ShoppingCart className="h-[18px] w-[18px] text-emerald-600" />
            </div>
            Sélectionner un produit
          </DialogTitle>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher par nom, référence ou marque..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-[10px] focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/15 shadow-none text-sm transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {searchTerm && (
            <p className="text-xs text-slate-400 mt-2">
              {filteredProduits.length} résultat{filteredProduits.length !== 1 ? 's' : ''} pour "{searchTerm}"
            </p>
          )}
        </DialogHeader>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredProduits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="mb-5">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300">
                  <rect x="16" y="24" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <rect x="8" y="30" width="64" height="36" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M32 38H48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M28 44H52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M30 50H50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="58" cy="22" r="10" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
                  <path d="M54 22H62" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M58 18V26" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {searchTerm
                  ? `Aucun produit trouvé`
                  : "Aucun produit disponible"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                {searchTerm
                  ? `Aucun résultat pour "${searchTerm}"`
                  : "Ajoutez des produits dans la section Produits"}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProduits.map((produit) => (
                <ProductCard
                  key={produit.id}
                  produit={produit}
                  onClick={() => handleSelect(produit)}
                  selected={selectedId === produit.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Dock Action Bar */}
        {selectedProduit && (
          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-4">
              {/* Minimal Quantity Selector */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0 group">
                  <button
                    type="button"
                    onClick={() => setQuantite(Math.max(1, quantite - 1))}
                    className="h-9 w-9 flex items-center justify-center rounded-l-[10px] border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 -mr-px"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div className="relative">
                    <Input
                      type="number"
                      value={quantite}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantite(Math.max(1, Math.min(stock, val)));
                      }}
                      min={1}
                      max={stock}
                      className="w-14 h-9 text-center font-bold text-sm rounded-none border-x-0 border-slate-200 bg-white focus:ring-0 focus:border-emerald-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantite(Math.min(stock, quantite + 1))}
                    disabled={quantite >= stock}
                    className="h-9 w-9 flex items-center justify-center rounded-r-[10px] border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 -ml-px disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {stock <= 5 && (
                  <span className="text-[10px] text-amber-600 font-medium">Stock limité</span>
                )}
              </div>

              <Button
                type="button"
                onClick={handleConfirm}
                className="h-10 px-5 rounded-[4px] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter au panier
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
