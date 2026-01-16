import { useState } from 'react';
import { Plus, Edit, Trash2, Package, Gift, Percent } from 'lucide-react';
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
  useBundles, 
  useCreateBundle, 
  useUpdateBundle, 
  useDeleteBundle,
  useBundleItems,
  useAddBundleItem,
  useRemoveBundleItem,
  ProductBundle 
} from '@/hooks/useBundles';
import { useProducts } from '@/hooks/useProducts';

export default function AdminBundles() {
  const { data: bundles, isLoading } = useBundles();
  const { data: products } = useProducts();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();
  const addItem = useAddBundleItem();
  const removeItem = useRemoveBundleItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: bundleItems } = useBundleItems(selectedBundleId);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    bundle_price: '',
    image_url: '',
    is_active: true,
    starts_at: '',
    ends_at: '',
    max_purchases: '',
  });

  const [itemForm, setItemForm] = useState({
    product_id: '',
    quantity: '1',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      bundle_price: '',
      image_url: '',
      is_active: true,
      starts_at: '',
      ends_at: '',
      max_purchases: '',
    });
    setEditingBundle(null);
  };

  const handleEdit = (bundle: ProductBundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description || '',
      bundle_price: bundle.bundle_price.toString(),
      image_url: bundle.image_url || '',
      is_active: bundle.is_active,
      starts_at: bundle.starts_at?.slice(0, 16) || '',
      ends_at: bundle.ends_at?.slice(0, 16) || '',
      max_purchases: bundle.max_purchases?.toString() || '',
    });
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description || null,
      bundle_price: parseFloat(formData.bundle_price),
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      max_purchases: formData.max_purchases ? parseInt(formData.max_purchases) : null,
    };

    if (editingBundle) {
      await updateBundle.mutateAsync({ id: editingBundle.id, ...payload });
    } else {
      await createBundle.mutateAsync(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleAddItem = async () => {
    if (!selectedBundleId || !itemForm.product_id) return;
    await addItem.mutateAsync({
      bundle_id: selectedBundleId,
      product_id: itemForm.product_id,
      quantity: parseInt(itemForm.quantity),
    });
    setItemForm({ product_id: '', quantity: '1' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-500" />
            Product Bundles
          </h1>
          <p className="text-muted-foreground">Create combo offers with special pricing</p>
        </div>
        <div className="flex gap-2">
          <FeatureGuide feature="bundles" />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Bundle</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Create Bundle'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Bundle Name</Label>
                  <Input
                    placeholder="e.g., Skincare Starter Kit"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    placeholder="skincare-starter-kit"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the bundle..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="999"
                    value={formData.bundle_price}
                    onChange={(e) => setFormData({ ...formData, bundle_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starts At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Purchases (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.max_purchases}
                    onChange={(e) => setFormData({ ...formData, max_purchases: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                  <Label>Active</Label>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={createBundle.isPending || updateBundle.isPending}>
                  {editingBundle ? 'Update Bundle' : 'Create Bundle'}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bundles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bundles?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {bundles?.filter(b => b.is_active).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {bundles?.reduce((sum, b) => sum + b.current_purchases, 0) || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {bundles?.length ? Math.round(bundles.reduce((sum, b) => sum + (b.discount_percent || 0), 0) / bundles.length) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-40 w-full mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : bundles?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No bundles created yet. Click "Create Bundle" to get started.
            </CardContent>
          </Card>
        ) : (
          bundles?.map((bundle) => (
            <Card key={bundle.id} className="overflow-hidden">
              {bundle.image_url && (
                <img src={bundle.image_url} alt={bundle.name} className="w-full h-40 object-cover" />
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{bundle.name}</h3>
                    {bundle.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{bundle.description}</p>
                    )}
                  </div>
                  <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                    {bundle.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold">₹{bundle.bundle_price}</span>
                  {bundle.original_price && bundle.original_price > bundle.bundle_price && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">₹{bundle.original_price}</span>
                      <Badge variant="outline" className="text-green-600">
                        <Percent className="h-3 w-3 mr-1" />
                        {bundle.discount_percent}% off
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setSelectedBundleId(bundle.id); setItemsDialogOpen(true); }}
                  >
                    <Package className="h-4 w-4 mr-1" /> Items
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleEdit(bundle)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setDeleteId(bundle.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Items Dialog */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bundle Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={itemForm.product_id} onValueChange={(v) => setItemForm({ ...itemForm, product_id: v })}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Qty"
                className="w-20"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
              />
              <Button onClick={handleAddItem} disabled={!itemForm.product_id}>Add</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundleItems?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No items in this bundle
                    </TableCell>
                  </TableRow>
                ) : (
                  bundleItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="flex items-center gap-2">
                        {item.product?.image_url && (
                          <img src={item.product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        {item.product?.name}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.product?.price}</TableCell>
                      <TableCell>₹{(item.product?.price || 0) * item.quantity}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem.mutate({ id: item.id, bundle_id: item.bundle_id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {bundleItems && bundleItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Total Original Price:</span>
                  <span className="font-medium">
                    ₹{bundleItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bundle?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteBundle.mutate(deleteId!); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
