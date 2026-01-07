import { useState } from 'react';
import { ShoppingCart, Search, Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders, useUpdateOrder } from '@/hooks/useOrders';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const { data: orders, isLoading } = useOrders();
  const updateOrder = useUpdateOrder();

  const handleStatusChange = async (orderId: string, status: string) => {
    const updates: any = { id: orderId, status };
    
    if (status === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    }
    
    await updateOrder.mutateAsync(updates);
  };

  const filteredOrders = orders?.filter(o => 
    o.order_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Orders
        </h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{order.order_items?.length || 0}</TableCell>
                  <TableCell className="font-medium">₹{order.total_amount}</TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[order.payment_status]}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <SelectTrigger className="w-[130px]">
                        <Badge className={statusColors[order.status]}>{order.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{format(new Date(selectedOrder.created_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  {typeof selectedOrder.shipping_address === 'object' ? (
                    <>
                      <p className="font-medium">{(selectedOrder.shipping_address as any).full_name}</p>
                      <p>{(selectedOrder.shipping_address as any).address_line1}</p>
                      {(selectedOrder.shipping_address as any).address_line2 && <p>{(selectedOrder.shipping_address as any).address_line2}</p>}
                      <p>{(selectedOrder.shipping_address as any).city}, {(selectedOrder.shipping_address as any).state} {(selectedOrder.shipping_address as any).pincode}</p>
                      <p>{(selectedOrder.shipping_address as any).phone}</p>
                    </>
                  ) : (
                    <p>Address not available</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_info && <p className="text-sm text-muted-foreground">{item.variant_info}</p>}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{item.total_price}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{selectedOrder.shipping_amount}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{selectedOrder.tax_amount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
