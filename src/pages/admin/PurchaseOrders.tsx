import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Search, Plus, Eye, Package, Truck, CheckCircle, 
  XCircle, MoreHorizontal, FileText, ClipboardList, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  usePurchaseOrders, 
  usePurchaseOrder,
  useCreatePurchaseOrder, 
  useUpdatePurchaseOrder,
  useReceivePOItems,
  useDeletePurchaseOrder,
  POItemInput 
} from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  ordered: 'bg-blue-100 text-blue-800',
  partial: 'bg-yellow-100 text-yellow-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText className="w-3 h-3" />,
  ordered: <Truck className="w-3 h-3" />,
  partial: <Package className="w-3 h-3" />,
  received: <CheckCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

export default function AdminPurchaseOrders() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewPOId, setViewPOId] = useState<string | null>(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receivePOId, setReceivePOId] = useState<string | null>(null);

  const { data: purchaseOrders, isLoading } = usePurchaseOrders();
  const { data: viewPO } = usePurchaseOrder(viewPOId || undefined);
  const { data: receivePO } = usePurchaseOrder(receivePOId || undefined);
  const { data: suppliers } = useSuppliers(true);
  const { data: products } = useProducts();
  const createPO = useCreatePurchaseOrder();
  const updatePO = useUpdatePurchaseOrder();
  const receivePOItems = useReceivePOItems();
  const deletePO = useDeletePurchaseOrder();

  // Create PO form state
  const [newPO, setNewPO] = useState({
    supplier_id: '',
    notes: '',
    order_date: format(new Date(), 'yyyy-MM-dd'),
    expected_date: '',
    items: [] as (POItemInput & { product_name?: string })[],
  });

  // Receive items form state
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});

  const filteredPOs = purchaseOrders?.filter(po =>
    po.po_number.toLowerCase().includes(search.toLowerCase()) ||
    po.supplier?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePO = async () => {
    if (!newPO.supplier_id || newPO.items.length === 0) return;

    await createPO.mutateAsync({
      supplier_id: newPO.supplier_id,
      items: newPO.items,
      notes: newPO.notes || undefined,
      order_date: newPO.order_date || undefined,
      expected_date: newPO.expected_date || undefined,
    });

    setIsCreateOpen(false);
    setNewPO({
      supplier_id: '',
      notes: '',
      order_date: format(new Date(), 'yyyy-MM-dd'),
      expected_date: '',
      items: [],
    });
  };

  const handleAddItem = () => {
    setNewPO(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0 }],
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setNewPO(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      
      // If product changed, get default price
      if (field === 'product_id') {
        const product = products?.find(p => p.id === value);
        if (product) {
          items[index].unit_price = Number(product.price);
          items[index].product_name = product.name;
        }
      }
      
      return { ...prev, items };
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewPO(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updatePO.mutateAsync({ id, status });
  };

  const openReceiveDialog = (poId: string) => {
    setReceivePOId(poId);
    setReceiveQuantities({});
    setIsReceiveOpen(true);
  };

  const handleReceiveItems = async () => {
    if (!receivePOId || !receivePO) return;

    const items = receivePO.purchase_order_items?.map(item => ({
      id: item.id,
      received_quantity: receiveQuantities[item.id] ?? item.received_quantity,
    })) || [];

    await receivePOItems.mutateAsync({ poId: receivePOId, items });
    setIsReceiveOpen(false);
    setReceivePOId(null);
  };

  const calculateTotal = () => {
    return newPO.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground">Manage purchase orders and inventory receiving</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO number or supplier..."
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
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredPOs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No purchase orders found. Create your first PO to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredPOs?.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium font-mono">{po.po_number}</TableCell>
                  <TableCell>{po.supplier?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {po.order_date ? format(new Date(po.order_date), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>{po.purchase_order_items?.length || 0}</TableCell>
                  <TableCell className="font-medium">₹{po.total_amount}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[po.status]} gap-1`}>
                      {statusIcons[po.status]}
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewPOId(po.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {po.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'ordered')}>
                            <Truck className="w-4 h-4 mr-2" />
                            Mark as Ordered
                          </DropdownMenuItem>
                        )}
                        {(po.status === 'ordered' || po.status === 'partial') && (
                          <DropdownMenuItem onClick={() => openReceiveDialog(po.id)}>
                            <Package className="w-4 h-4 mr-2" />
                            Receive Items
                          </DropdownMenuItem>
                        )}
                        {po.status === 'draft' && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deletePO.mutateAsync(po.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create PO Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select
                  value={newPO.supplier_id}
                  onValueChange={(v) => setNewPO({ ...newPO, supplier_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={newPO.order_date}
                    onChange={(e) => setNewPO({ ...newPO, order_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Date</Label>
                  <Input
                    type="date"
                    value={newPO.expected_date}
                    onChange={(e) => setNewPO({ ...newPO, expected_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items</Label>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {newPO.items.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" to start.
                </p>
              ) : (
                <div className="space-y-3">
                  {newPO.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">Product</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(v) => handleItemChange(index, 'product_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 space-y-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-28 space-y-2">
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-28 space-y-2">
                        <Label className="text-xs">Total</Label>
                        <div className="h-10 flex items-center font-medium">
                          ₹{(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {newPO.items.length > 0 && (
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-2xl font-bold">₹{calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newPO.notes}
                onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePO} 
              disabled={!newPO.supplier_id || newPO.items.length === 0 || createPO.isPending}
            >
              {createPO.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={!!viewPOId} onOpenChange={() => setViewPOId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Order - {viewPO?.po_number}</DialogTitle>
          </DialogHeader>
          
          {viewPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{viewPO.supplier?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[viewPO.status]}>{viewPO.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {viewPO.order_date ? format(new Date(viewPO.order_date), 'PPP') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Date</p>
                  <p className="font-medium">
                    {viewPO.expected_date ? format(new Date(viewPO.expected_date), 'PPP') : '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-semibold mb-3">Items</p>
                <div className="border rounded-lg divide-y">
                  {viewPO.purchase_order_items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ₹{item.unit_price}
                          {item.received_quantity > 0 && (
                            <span className="text-green-600 ml-2">
                              (Received: {item.received_quantity})
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="font-medium">₹{item.total_price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{viewPO.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{viewPO.tax_amount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{viewPO.total_amount}</span>
                </div>
              </div>

              {viewPO.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{viewPO.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Items Dialog */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Receive Items - {receivePO?.po_number}</DialogTitle>
          </DialogHeader>
          
          {receivePO && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the quantity received for each item. Inventory will be automatically updated.
              </p>

              <div className="space-y-3">
                {receivePO.purchase_order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {item.quantity} | Already received: {item.received_quantity}
                      </p>
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Receive Qty</Label>
                      <Input
                        type="number"
                        min={item.received_quantity}
                        max={item.quantity}
                        value={receiveQuantities[item.id] ?? item.received_quantity}
                        onChange={(e) => setReceiveQuantities({
                          ...receiveQuantities,
                          [item.id]: parseInt(e.target.value) || 0,
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceiveItems} disabled={receivePOItems.isPending}>
              {receivePOItems.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
