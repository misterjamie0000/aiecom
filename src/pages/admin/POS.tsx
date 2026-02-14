import { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  X,
  Package,
  Printer,
  CheckCircle2,
  ReceiptText,
  ScanBarcode,
  History,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedOrder {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  date: Date;
  amountReceived: number;
  change: number;
}

export default function AdminPOS() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('new-sale');
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch POS orders (orders with 'POS' in notes)
  const { data: posOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['pos-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .like('notes', 'POS Order%')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!search.trim() || !products) return [];
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [search, products]);

  // Cart logic
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error('Insufficient stock');
          return prev;
        }
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearch('');
    searchRef.current?.focus();
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty > i.product.stock_quantity) {
            toast.error('Insufficient stock');
            return i;
          }
          return { ...i, quantity: newQty };
        })
        .filter(i => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercent(0);
    setAmountReceived('');
  }, []);

  // Calculations
  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const taxAmount = cart.reduce((sum, i) => {
    const itemTotal = i.product.price * i.quantity;
    return sum + (itemTotal * i.product.gst_percent) / 100;
  }, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, parseFloat(amountReceived || '0') - total) : 0;

  // Generate order number
  const generateOrderNumber = () => {
    const prefix = 'POS';
    const date = format(new Date(), 'yyMMdd');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${rand}`;
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived || '0');
      if (received < total) {
        toast.error('Insufficient amount received');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const orderNumber = generateOrderNumber();

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user!.id,
          status: 'delivered',
          payment_status: 'paid',
          payment_method: paymentMethod === 'cash' ? 'cod' : 'razorpay',
          subtotal,
          tax_amount: taxAmount,
          cgst_amount: taxAmount / 2,
          sgst_amount: taxAmount / 2,
          shipping_amount: 0,
          discount_amount: discountAmount,
          total_amount: total,
          shipping_address: {
            full_name: customerName || 'Walk-in Customer',
            phone: customerPhone || 'N/A',
            address_line1: 'POS - In Store',
            city: 'In Store',
            state: 'In Store',
            pincode: '000000',
          },
          notes: `POS Order | Payment: ${paymentMethod.toUpperCase()}${customerName ? ` | Customer: ${customerName}` : ''}`,
          delivered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.product.price,
        gst_percent: item.product.gst_percent,
        total_price: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Build completed order for receipt
      const completed: CompletedOrder = {
        orderNumber,
        items: [...cart],
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        paymentMethod,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        date: new Date(),
        amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived || '0') : total,
        change: changeAmount,
      };

      setCompletedOrder(completed);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
      toast.success('Payment processed successfully!');
    } catch (error: any) {
      toast.error('Failed to process order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${completedOrder?.orderNumber}</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: 12px; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-lg { font-size: 16px; }
                .text-sm { font-size: 11px; }
                .text-xs { font-size: 10px; }
                .mt-2 { margin-top: 8px; }
                .mt-4 { margin-top: 16px; }
                .mb-2 { margin-bottom: 8px; }
                .py-2 { padding: 8px 0; }
                .flex { display: flex; justify-content: space-between; }
                .border-t { border-top: 1px dashed #333; }
                .border-b { border-bottom: 1px dashed #333; }
              </style>
            </head>
            <body>${printContent}</body>
            <script>window.print(); window.close();</script>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-fit mb-4 shrink-0">
          <TabsTrigger value="new-sale" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            New Sale
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <History className="w-4 h-4" />
            POS Orders
            {posOrders?.length ? (
              <Badge variant="secondary" className="ml-1 text-xs">{posOrders.length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-sale" className="flex-1 overflow-hidden mt-0">
          <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Left: Product Search & Grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ReceiptText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Point of Sale</h1>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search by product name, SKU or barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 h-12 text-base rounded-xl bg-card border-border"
            autoFocus
          />
          {search && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1">
          {search.trim() ? (
            filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(product)}
                    className="bg-card rounded-xl border border-border p-3 text-left hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-secondary/50 mb-2">
                      <img
                        src={product.image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">₹{product.price}</span>
                      <Badge variant="secondary" className="text-xs">
                        Stock: {product.stock_quantity}
                      </Badge>
                    </div>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-40" />
                <p className="font-medium">No products found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ScanBarcode className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-medium text-lg">Search for Products</p>
              <p className="text-sm">Type a product name, SKU, or scan a barcode</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-full lg:w-[400px] xl:w-[440px] bg-card rounded-2xl border border-border flex flex-col overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Cart</h2>
            {cart.length > 0 && (
              <Badge className="bg-primary text-primary-foreground">{cart.length}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Customer Info */}
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <User className="w-4 h-4" />
            <span>Customer (Optional)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="Phone"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm">Search & add products</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <AnimatePresence>
                {cart.map(item => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 bg-background rounded-xl p-3 border border-border"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary/50 shrink-0">
                      <img
                        src={item.product.image_url || '/placeholder.svg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
                      <p className="text-sm text-primary font-semibold">₹{item.product.price}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Cart Summary & Pay */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Discount %</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={discountPercent || ''}
                onChange={e => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="h-8 w-20 text-sm text-center"
                placeholder="0"
              />
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (GST)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              className="w-full h-12 text-base font-semibold rounded-xl gap-2"
              onClick={() => setShowPayment(true)}
            >
              <CreditCard className="w-5 h-5" />
              Charge ₹{total.toFixed(2)}
            </Button>
          </div>
        )}
      </div>
          </div>
        </TabsContent>

        {/* POS Orders Tab */}
        <TabsContent value="orders" className="flex-1 overflow-hidden mt-0">
          <div className="bg-card rounded-2xl border border-border h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Recent POS Orders</h2>
              </div>
              <Badge variant="secondary">{posOrders?.length || 0} orders</Badge>
            </div>
            <ScrollArea className="flex-1">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !posOrders?.length ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Receipt className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No POS orders yet</p>
                  <p className="text-sm">Orders created from POS will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posOrders.map(order => {
                      const shippingAddr = order.shipping_address as any;
                      const custName = shippingAddr?.full_name || 'Walk-in';
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium font-mono text-sm">{order.order_number}</TableCell>
                          <TableCell className="text-sm">{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                          <TableCell className="text-sm">{custName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.order_items?.length || 0} items</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {order.payment_method === 'cod' ? 'Cash' : order.payment_method || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">₹{Number(order.total_amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/10 text-green-600 border-green-200">
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setViewingOrder(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Order #{viewingOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{format(new Date(viewingOrder.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <p className="font-medium">{(viewingOrder.shipping_address as any)?.full_name || 'Walk-in'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment</span>
                  <p className="font-medium capitalize">{viewingOrder.payment_method === 'cod' ? 'Cash' : viewingOrder.payment_method}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-medium capitalize">{viewingOrder.payment_status}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium text-sm">Items</p>
                {viewingOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p>{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} × ₹{item.unit_price}</p>
                    </div>
                    <span className="font-medium">₹{Number(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(viewingOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{Number(viewingOrder.tax_amount).toFixed(2)}</span>
                </div>
                {Number(viewingOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{Number(viewingOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">₹{Number(viewingOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="text-center py-4 bg-secondary/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
              <p className="text-4xl font-bold text-primary">₹{total.toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'cash', icon: Banknote, label: 'Cash' },
                  { value: 'upi', icon: Smartphone, label: 'UPI' },
                  { value: 'card', icon: CreditCard, label: 'Card' },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <method.icon className={`w-6 h-6 ${paymentMethod === method.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${paymentMethod === method.value ? 'text-primary' : ''}`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Received</label>
                <Input
                  type="number"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder={`Min ₹${total.toFixed(2)}`}
                  className="h-12 text-lg text-center font-semibold"
                  autoFocus
                />
                <div className="flex gap-2">
                  {[Math.ceil(total), Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
                    .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                    .slice(0, 4)
                    .map(amount => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmountReceived(String(amount))}
                        className="flex-1 rounded-lg"
                      >
                        ₹{amount}
                      </Button>
                    ))}
                </div>
                {parseFloat(amountReceived || '0') >= total && (
                  <div className="text-center py-2 bg-accent/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Change: </span>
                    <span className="font-bold text-accent-foreground">
                      ₹{(parseFloat(amountReceived || '0') - total).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-12 text-base font-semibold rounded-xl gap-2"
              onClick={processPayment}
              disabled={isProcessing || (paymentMethod === 'cash' && parseFloat(amountReceived || '0') < total)}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Receipt
            </DialogTitle>
          </DialogHeader>

          {completedOrder && (
            <>
              <div ref={receiptRef} className="space-y-3 py-2">
                <div className="text-center">
                  <h3 className="font-bold text-lg">GlowMart</h3>
                  <p className="text-xs text-muted-foreground">Beauty & Wellness Store</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(completedOrder.date, 'dd/MM/yyyy hh:mm a')}
                  </p>
                  <p className="text-xs font-medium mt-1">#{completedOrder.orderNumber}</p>
                </div>

                <Separator className="border-dashed" />

                <div className="text-sm">
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-medium">{completedOrder.customerName}</span>
                  {completedOrder.customerPhone && (
                    <span className="text-muted-foreground ml-2">({completedOrder.customerPhone})</span>
                  )}
                </div>

                <Separator className="border-dashed" />

                <div className="space-y-2">
                  {completedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ₹{item.product.price}
                        </p>
                      </div>
                      <span className="font-medium ml-2">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="border-dashed" />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{completedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (GST)</span>
                    <span>₹{completedOrder.tax.toFixed(2)}</span>
                  </div>
                  {completedOrder.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span>-₹{completedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>₹{completedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Paid ({completedOrder.paymentMethod.toUpperCase()})
                    </span>
                    <span>₹{completedOrder.amountReceived.toFixed(2)}</span>
                  </div>
                  {completedOrder.change > 0 && (
                    <div className="flex justify-between text-sm font-medium">
                      <span>Change</span>
                      <span>₹{completedOrder.change.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator className="border-dashed" />

                <p className="text-center text-xs text-muted-foreground">
                  Thank you for shopping with us! 🌿
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl gap-2"
                  onClick={printReceipt}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  className="flex-1 rounded-xl gap-2"
                  onClick={() => {
                    setShowReceipt(false);
                    setCompletedOrder(null);
                    searchRef.current?.focus();
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Sale
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
