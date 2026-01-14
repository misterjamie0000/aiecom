import { motion } from 'framer-motion';
import { Package, Eye, ChevronRight, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  returned: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  refunded: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export default function Orders() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Please login to view your orders.
          </p>
          <Button asChild>
            <Link to="/auth">Login</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <Link 
            to="/"
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
        </div>
        <p className="text-muted-foreground ml-12">Track and manage your orders</p>
      </motion.div>

      {!orders || orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't placed any orders yet. Start shopping to see your orders here!
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/products">Start Shopping</Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <OrderCard order={order} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const { data: orderItems } = useQuery({
    queryKey: ['order-items', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error) throw error;
      return data;
    },
  });

  const shippingAddress = order.shipping_address as {
    full_name?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Order Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Order Number</p>
              <p className="font-semibold text-sm md:text-base">{order.order_number}</p>
            </div>
            <Badge className={`${statusColors[order.status] || ''} font-medium`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
              <p className="font-medium text-sm">{format(new Date(order.created_at), 'PPP')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="font-bold text-primary text-lg">₹{order.total_amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              {orderItems?.length || 0} item(s) • {order.payment_method?.toUpperCase() || 'N/A'}
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-2">
                  <Eye className="w-4 h-4" />
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Order #{order.order_number}</DialogTitle>
                  <DialogDescription>
                    Placed on {format(new Date(order.created_at), 'PPP')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[order.status] || ''}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Badge variant="outline">
                      Payment: {order.payment_status}
                    </Badge>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold mb-3">Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.unit_price}</TableCell>
                            <TableCell className="text-right">₹{item.total_price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-semibold mb-2">Shipping Address</h4>
                    <p className="text-sm text-muted-foreground">
                      {shippingAddress?.full_name}<br />
                      {shippingAddress?.address_line1}<br />
                      {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₹{order.discount_amount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>₹{order.shipping_amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>₹{order.tax_amount}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Tracking */}
                  {order.tracking_number && (
                    <div>
                      <h4 className="font-semibold mb-2">Tracking</h4>
                      <p className="text-sm">
                        Tracking Number: {order.tracking_number}
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-primary hover:underline"
                          >
                            Track Package
                          </a>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
