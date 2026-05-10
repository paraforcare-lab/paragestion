import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Package, ShoppingCart, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
        "w-full p-3 rounded-xl border-2 text-left transition-all duration-200",
        "flex gap-3 items-stretch",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        outOfStock && "opacity-50 cursor-not-allowed border-dashed"
      )}
    >
      {/* Product Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-6 h-6 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "font-semibold text-sm truncate",
              outOfStock ? "text-muted-foreground" : "text-foreground"
            )}>
              {produit.designation || produit.nom || 'Produit'}
            </p>
            {selected && (
              <div className="flex-shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
          {produit.marque && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {produit.marque}
              {produit.reference && ` • ${produit.reference}`}
            </p>
          )}
          {!produit.marque && produit.reference && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {produit.reference}
            </p>
          )}
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-emerald-600">
              {formatCurrency(produit.prixVenteHt)}
            </span>
            <span className="text-[10px] text-muted-foreground">HT</span>
            {produit.prixVenteTtc && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(produit.prixVenteTtc)}
                </span>
                <span className="text-[10px] text-muted-foreground">TTC</span>
              </>
            )}
            {produit.tauxTva !== undefined && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">TVA {produit.tauxTva}%</span>
              </>
            )}
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 px-2 font-medium border-0",
              outOfStock
                ? "bg-rose-50 text-rose-600"
                : stock <= 5
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
            )}
          >
            {outOfStock ? 'Stock épuisé' : `Stock: ${stock}`}
          </Badge>
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
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sélectionner un produit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Sélectionner un produit
            </DialogTitle>
            <Badge variant="outline" className="text-xs bg-muted/50">
              {produits.length} produit(s)
            </Badge>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher par nom, référence ou marque..."
              className="pl-11 h-11 bg-muted/30 border-border/50 rounded-xl"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredProduits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted/30 rounded-2xl p-4 mb-3">
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchTerm
                    ? `Aucun produit trouvé pour "${searchTerm}"`
                    : "Aucun produit disponible"}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-xs text-primary hover:underline font-medium"
                  >
                    Effacer la recherche
                  </button>
                )}
              </div>
            ) : (
              filteredProduits.map((produit) => (
                <ProductCard
                  key={produit.id}
                  produit={produit}
                  onClick={() => handleSelect(produit)}
                  selected={selectedId === produit.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Selection Footer */}
        {selectedProduit && (
          <div className="border-t border-border/50 p-4 flex-shrink-0 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Selected Product Preview */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border">
                    {(selectedProduit.imageUrl || selectedProduit.image_url) ? (
                      <img
                        src={selectedProduit.imageUrl || selectedProduit.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedProduit.designation || selectedProduit.nom}
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                      {formatCurrency(selectedProduit.prixVenteHt)} HT
                    </p>
                  </div>
                </div>

                {/* Quantity Control */}
                <div className="border-l border-border pl-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Quantité</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setQuantite(Math.max(1, quantite - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantite}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantite(Math.max(1, Math.min(stock, val)));
                      }}
                      min={1}
                      max={stock}
                      className="w-16 h-9 text-center font-bold rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setQuantite(Math.min(stock, quantite + 1))}
                      disabled={quantite >= stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {stock <= 5 && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Stock limité: {stock} disponible(s)
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleConfirm}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-11 px-8 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
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
