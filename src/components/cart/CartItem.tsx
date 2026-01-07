import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItemWithProduct, useUpdateCartItem, useRemoveFromCart } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemWithProduct;
}

export default function CartItem({ item }: CartItemProps) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateItem.mutate({ id: item.id, quantity: newQuantity });
  };

  const handleRemove = () => {
    removeItem.mutate(item.id);
  };

  const product = item.product;
  const itemTotal = product.price * item.quantity;
  const mrpTotal = (product.mrp || product.price) * item.quantity;
  const savings = mrpTotal - itemTotal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex gap-4 p-4 bg-card rounded-xl border"
    >
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
        <img
          src={`https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop`}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium line-clamp-2">{product.name}</h3>
        
        {product.short_description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {product.short_description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold">₹{product.price}</span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-sm text-muted-foreground line-through">₹{product.mrp}</span>
              <span className="text-xs text-green-600 font-medium">
                {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updateItem.isPending}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updateItem.isPending || item.quantity >= product.stock_quantity}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold">₹{itemTotal}</p>
              {savings > 0 && (
                <p className="text-xs text-green-600">Save ₹{savings}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={removeItem.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
