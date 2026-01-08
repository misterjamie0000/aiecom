import { motion } from 'framer-motion';
import { Package, Eye, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          You haven't placed any orders yet. Start shopping to see your orders here!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-bold">My Orders</h2>
      
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </motion.div>
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
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-semibold">{order.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{format(new Date(order.created_at), 'PPP')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-semibold">₹{order.total_amount.toLocaleString()}</p>
          </div>
          <Badge className={statusColors[order.status] || ''}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {orderItems?.length || 0} item(s) • {order.payment_method?.toUpperCase() || 'N/A'}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Details
                <ChevronRight className="w-4 h-4 ml-2" />
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
      </CardContent>
    </Card>
  );
}
