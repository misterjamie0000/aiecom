import { useState } from 'react';
import { Plus, Edit, Trash2, Zap, Clock, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureGuide } from '@/components/admin/FeatureGuide';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useFlashSales, 
  useCreateFlashSale, 
  useUpdateFlashSale, 
  useDeleteFlashSale,
  useFlashSaleProducts,
  useAddFlashSaleProduct,
  useRemoveFlashSaleProduct,
  FlashSale 
} from '@/hooks/useFlashSales';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';

export default function AdminFlashSales() {
  const { data: flashSales, isLoading } = useFlashSales();
  const { data: products } = useProducts();
  const createFlashSale = useCreateFlashSale();
  const updateFlashSale = useUpdateFlashSale();
  const deleteFlashSale = useDeleteFlashSale();
  const addProduct = useAddFlashSaleProduct();
  const removeProduct = useRemoveFlashSaleProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: saleProducts } = useFlashSaleProducts(selectedSaleId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    starts_at: '',
    ends_at: '',
    max_uses: '',
    is_active: true,
  });

  const [productForm, setProductForm] = useState({
    product_id: '',
    special_price: '',
    max_quantity_per_user: '1',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      starts_at: '',
      ends_at: '',
      max_uses: '',
      is_active: true,
    });
    setEditingSale(null);
  };

  const handleEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setFormData({
      name: sale.name,
      description: sale.description || '',
      discount_type: sale.discount_type,
      discount_value: sale.discount_value.toString(),
      starts_at: sale.starts_at.slice(0, 16),
      ends_at: sale.ends_at.slice(0, 16),
      max_uses: sale.max_uses?.toString() || '',
      is_active: sale.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: new Date(formData.ends_at).toISOString(),
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      is_active: formData.is_active,
    };

    if (editingSale) {
      await updateFlashSale.mutateAsync({ id: editingSale.id, ...payload });
    } else {
      await createFlashSale.mutateAsync(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleAddProduct = async () => {
    if (!selectedSaleId || !productForm.product_id) return;
    await addProduct.mutateAsync({
      flash_sale_id: selectedSaleId,
      product_id: productForm.product_id,
      special_price: productForm.special_price ? parseFloat(productForm.special_price) : undefined,
      max_quantity_per_user: parseInt(productForm.max_quantity_per_user),
    });
    setProductForm({ product_id: '', special_price: '', max_quantity_per_user: '1' });
  };

  const getStatus = (sale: FlashSale) => {
    const now = new Date();
    const starts = new Date(sale.starts_at);
    const ends = new Date(sale.ends_at);

    if (!sale.is_active) return { label: 'Inactive', color: 'secondary' as const };
    if (now < starts) return { label: 'Scheduled', color: 'outline' as const };
    if (now > ends) return { label: 'Ended', color: 'secondary' as const };
    return { label: 'Active', color: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Flash Sales
          </h1>
          <p className="text-muted-foreground">Create time-limited offers with countdown timers</p>
        </div>
        <div className="flex gap-2">
          <FeatureGuide feature="flash-sales" />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Flash Sale</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sale Name</Label>
                  <Input
                    placeholder="e.g., Weekend Mega Sale"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the sale..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      placeholder={formData.discount_type === 'percentage' ? '20' : '500'}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starts At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Uses (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                  <Label>Active</Label>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={createFlashSale.isPending || updateFlashSale.isPending}>
                  {editingSale ? 'Update Flash Sale' : 'Create Flash Sale'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{flashSales?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {flashSales?.filter(s => getStatus(s).label === 'Active').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {flashSales?.filter(s => getStatus(s).label === 'Scheduled').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Uses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {flashSales?.reduce((sum, s) => sum + s.current_uses, 0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flash Sales Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale Name</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : flashSales?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No flash sales created yet
                  </TableCell>
                </TableRow>
              ) : (
                flashSales?.map((sale) => {
                  const status = getStatus(sale);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.name}</p>
                          {sale.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{sale.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {sale.discount_type === 'percentage' ? `${sale.discount_value}%` : `₹${sale.discount_value}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(sale.starts_at), 'dd MMM, HH:mm')} - {format(new Date(sale.ends_at), 'dd MMM, HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {sale.current_uses}{sale.max_uses ? `/${sale.max_uses}` : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedSaleId(sale.id); setProductsDialogOpen(true); }}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(sale.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Sale Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={productForm.product_id} onValueChange={(v) => setProductForm({ ...productForm, product_id: v })}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Special Price"
                className="w-32"
                value={productForm.special_price}
                onChange={(e) => setProductForm({ ...productForm, special_price: e.target.value })}
              />
              <Button onClick={handleAddProduct} disabled={!productForm.product_id}>Add</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleProducts?.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell className="flex items-center gap-2">
                      {sp.product?.image_url && (
                        <img src={sp.product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      {sp.product?.name}
                    </TableCell>
                    <TableCell>₹{sp.product?.price}</TableCell>
                    <TableCell className="text-green-600">₹{sp.special_price || sp.product?.price}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct.mutate({ id: sp.id, flash_sale_id: sp.flash_sale_id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flash Sale?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteFlashSale.mutate(deleteId!); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
