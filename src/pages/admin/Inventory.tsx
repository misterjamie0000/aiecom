import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  History,
  Search,
  Plus,
  Minus,
  RefreshCw,
  PackageX,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { useInventorySummary, useStockMovements, useAdjustStock } from '@/hooks/useInventory';
import { format } from 'date-fns';

export default function AdminInventory() {
  const { data: inventoryData, isLoading: inventoryLoading } = useInventorySummary();
  const { data: movements, isLoading: movementsLoading } = useStockMovements();
  const adjustStock = useAdjustStock();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low' | 'in'>('all');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [movementType, setMovementType] = useState<'adjustment' | 'restock' | 'damage' | 'transfer'>('adjustment');

  const stats = inventoryData?.stats;
  const products = inventoryData?.products || [];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    switch (stockFilter) {
      case 'out':
        return product.stock_quantity === 0;
      case 'low':
        return product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
      case 'in':
        return product.stock_quantity > product.low_stock_threshold;
      default:
        return true;
    }
  });

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentType('add');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setMovementType('adjustment');
    setAdjustDialogOpen(true);
  };

  const handleSubmitAdjustment = () => {
    if (!selectedProduct || !adjustmentQuantity) return;
    
    const quantity = parseInt(adjustmentQuantity);
    const finalQuantity = adjustmentType === 'add' ? quantity : -quantity;
    
    adjustStock.mutate({
      productId: selectedProduct.id,
      quantity: finalQuantity,
      movementType,
      reason: adjustmentReason || `${adjustmentType === 'add' ? 'Added' : 'Removed'} ${quantity} units`,
    }, {
      onSuccess: () => {
        setAdjustDialogOpen(false);
      }
    });
  };

  const getStockBadge = (product: any) => {
    if (product.stock_quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.stock_quantity <= product.low_stock_threshold) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Low Stock</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const getMovementIcon = (type: string, quantity: number) => {
    if (quantity > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getMovementTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      adjustment: 'bg-blue-100 text-blue-800',
      order: 'bg-purple-100 text-purple-800',
      return: 'bg-green-100 text-green-800',
      restock: 'bg-emerald-100 text-emerald-800',
      damage: 'bg-red-100 text-red-800',
      transfer: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge variant="secondary" className={styles[type] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (inventoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">Track and manage your product stock levels</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUnits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.inStock || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.lowStock || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.outOfStock || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Stock Levels</TabsTrigger>
          <TabsTrigger value="history">Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Stock</CardTitle>
              <CardDescription>View and adjust stock levels for all products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="in">In Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                          <TableCell>{product.categories?.name || '-'}</TableCell>
                          <TableCell className="text-center font-semibold">{product.stock_quantity}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{product.low_stock_threshold}</TableCell>
                          <TableCell>{getStockBadge(product)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustStock(product)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Stock Movement History
              </CardTitle>
              <CardDescription>Recent changes to product stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">Previous</TableHead>
                      <TableHead className="text-center">New</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : movements?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No stock movements recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements?.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {movement.products?.name || 'Unknown Product'}
                          </TableCell>
                          <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`flex items-center justify-center gap-1 font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {getMovementIcon(movement.movement_type, movement.quantity)}
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {movement.previous_quantity}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {movement.new_quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {movement.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Update stock for: <strong>{selectedProduct?.name}</strong>
              <br />
              Current stock: <strong>{selectedProduct?.stock_quantity}</strong> units
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustmentType('add')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
              <Button
                variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustmentType('remove')}
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove Stock
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="damage">Damaged/Expired</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
              />
              {adjustmentQuantity && (
                <p className="text-sm text-muted-foreground">
                  New stock will be: <strong>
                    {selectedProduct?.stock_quantity + (adjustmentType === 'add' ? parseInt(adjustmentQuantity) || 0 : -(parseInt(adjustmentQuantity) || 0))}
                  </strong> units
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Enter reason for adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAdjustment}
              disabled={!adjustmentQuantity || adjustStock.isPending}
            >
              {adjustStock.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
