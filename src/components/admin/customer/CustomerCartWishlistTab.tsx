import { ShoppingCart, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerCart, useCustomerWishlist } from '@/hooks/useCustomers';

interface CustomerCartWishlistTabProps {
  customerId: string;
}

export default function CustomerCartWishlistTab({ customerId }: CustomerCartWishlistTabProps) {
  const { data: cartItems, isLoading: cartLoading } = useCustomerCart(customerId);
  const { data: wishlistItems, isLoading: wishlistLoading } = useCustomerWishlist(customerId);

  if (cartLoading || wishlistLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const cartTotal = cartItems?.reduce((sum, item) => {
    const price = item.products?.price || 0;
    return sum + (price * item.quantity);
  }, 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cartItems?.length || 0} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!cartItems?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Cart is empty
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                  <img
                    src={item.products?.image_url || '/placeholder.svg'}
                    alt={item.products?.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.products?.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium">₹{item.products?.price?.toLocaleString()}</p>
                  </div>
                  {item.products?.stock_quantity === 0 && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex justify-between font-medium">
                  <span>Cart Total:</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Wishlist ({wishlistItems?.length || 0} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!wishlistItems?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Wishlist is empty
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                  <img
                    src={item.products?.image_url || '/placeholder.svg'}
                    alt={item.products?.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.products?.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">₹{item.products?.price?.toLocaleString()}</span>
                      {item.products?.mrp && item.products.mrp > (item.products?.price || 0) && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{item.products.mrp.toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.products.discount_percent}% off
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {item.products?.stock_quantity === 0 && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
