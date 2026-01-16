import { useState } from 'react';
import { Plus, Edit, Trash2, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  useBxgyOffers, 
  useCreateBxgyOffer, 
  useUpdateBxgyOffer, 
  useDeleteBxgyOffer,
  BxgyOffer 
} from '@/hooks/useBxgyOffers';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';

export default function AdminBxgyOffers() {
  const { data: offers, isLoading } = useBxgyOffers();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createOffer = useCreateBxgyOffer();
  const updateOffer = useUpdateBxgyOffer();
  const deleteOffer = useDeleteBxgyOffer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BxgyOffer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buy_type: 'product',
    buy_product_id: '',
    buy_category_id: '',
    buy_quantity: '1',
    get_type: 'product',
    get_product_id: '',
    get_category_id: '',
    get_quantity: '1',
    get_discount_type: 'free',
    get_discount_value: '100',
    is_active: true,
    starts_at: '',
    ends_at: '',
    max_uses: '',
    usage_per_customer: '1',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      buy_type: 'product',
      buy_product_id: '',
      buy_category_id: '',
      buy_quantity: '1',
      get_type: 'product',
      get_product_id: '',
      get_category_id: '',
      get_quantity: '1',
      get_discount_type: 'free',
      get_discount_value: '100',
      is_active: true,
      starts_at: '',
      ends_at: '',
      max_uses: '',
      usage_per_customer: '1',
    });
    setEditingOffer(null);
  };

  const handleEdit = (offer: BxgyOffer) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name,
      description: offer.description || '',
      buy_type: offer.buy_product_id ? 'product' : 'category',
      buy_product_id: offer.buy_product_id || '',
      buy_category_id: offer.buy_category_id || '',
      buy_quantity: offer.buy_quantity.toString(),
      get_type: offer.get_product_id ? 'product' : 'category',
      get_product_id: offer.get_product_id || '',
      get_category_id: offer.get_category_id || '',
      get_quantity: offer.get_quantity.toString(),
      get_discount_type: offer.get_discount_type,
      get_discount_value: offer.get_discount_value.toString(),
      is_active: offer.is_active,
      starts_at: offer.starts_at?.slice(0, 16) || '',
      ends_at: offer.ends_at?.slice(0, 16) || '',
      max_uses: offer.max_uses?.toString() || '',
      usage_per_customer: offer.usage_per_customer.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      description: formData.description || null,
      buy_product_id: formData.buy_type === 'product' ? formData.buy_product_id : null,
      buy_category_id: formData.buy_type === 'category' ? formData.buy_category_id : null,
      buy_quantity: parseInt(formData.buy_quantity),
      get_product_id: formData.get_type === 'product' ? formData.get_product_id : null,
      get_category_id: formData.get_type === 'category' ? formData.get_category_id : null,
      get_quantity: parseInt(formData.get_quantity),
      get_discount_type: formData.get_discount_type,
      get_discount_value: parseFloat(formData.get_discount_value),
      is_active: formData.is_active,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      usage_per_customer: parseInt(formData.usage_per_customer),
    };

    if (editingOffer) {
      await updateOffer.mutateAsync({ id: editingOffer.id, ...payload });
    } else {
      await createOffer.mutateAsync(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const formatOffer = (offer: BxgyOffer) => {
    const buyItem = offer.buy_product?.name || offer.buy_category?.name || 'Any';
    const getItem = offer.get_product?.name || offer.get_category?.name || 'Any';
    const discount = offer.get_discount_type === 'free' 
      ? 'FREE' 
      : offer.get_discount_type === 'percentage' 
        ? `${offer.get_discount_value}% off` 
        : `₹${offer.get_discount_value} off`;

    return {
      buy: `Buy ${offer.buy_quantity} ${buyItem}`,
      get: `Get ${offer.get_quantity} ${getItem} ${discount}`,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-orange-500" />
            Buy X Get Y Offers
          </h1>
          <p className="text-muted-foreground">Create promotional BXGY deals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Offer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOffer ? 'Edit BXGY Offer' : 'Create BXGY Offer'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Offer Name</Label>
                <Input
                  placeholder="e.g., Buy 2 Get 1 Free"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the offer..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Buy Condition */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Buy Condition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={formData.buy_type} onValueChange={(v) => setFormData({ ...formData, buy_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Specific Product</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{formData.buy_type === 'product' ? 'Product' : 'Category'}</Label>
                      {formData.buy_type === 'product' ? (
                        <Select value={formData.buy_product_id} onValueChange={(v) => setFormData({ ...formData, buy_product_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={formData.buy_category_id} onValueChange={(v) => setFormData({ ...formData, buy_category_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.buy_quantity}
                        onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Get Condition */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Get Condition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={formData.get_type} onValueChange={(v) => setFormData({ ...formData, get_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Specific Product</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{formData.get_type === 'product' ? 'Product' : 'Category'}</Label>
                      {formData.get_type === 'product' ? (
                        <Select value={formData.get_product_id} onValueChange={(v) => setFormData({ ...formData, get_product_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={formData.get_category_id} onValueChange={(v) => setFormData({ ...formData, get_category_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.get_quantity}
                        onChange={(e) => setFormData({ ...formData, get_quantity: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={formData.get_discount_type} onValueChange={(v) => setFormData({ ...formData, get_discount_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free (100% off)</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.get_discount_type !== 'free' && (
                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          placeholder={formData.get_discount_type === 'percentage' ? '50' : '200'}
                          value={formData.get_discount_value}
                          onChange={(e) => setFormData({ ...formData, get_discount_value: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Validity */}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per Customer Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.usage_per_customer}
                    onChange={(e) => setFormData({ ...formData, usage_per_customer: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                <Label>Active</Label>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={createOffer.isPending || updateOffer.isPending}>
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{offers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {offers?.filter(o => o.is_active).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Uses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {offers?.reduce((sum, o) => sum + o.current_uses, 0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offer</TableHead>
                <TableHead>Condition</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : offers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No BXGY offers created yet
                  </TableCell>
                </TableRow>
              ) : (
                offers?.map((offer) => {
                  const formatted = formatOffer(offer);
                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <p className="font-medium">{offer.name}</p>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{offer.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{formatted.buy}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-green-600 font-medium">{formatted.get}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={offer.is_active ? 'default' : 'secondary'}>
                          {offer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {offer.current_uses}{offer.max_uses ? `/${offer.max_uses}` : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(offer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(offer.id)}>
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteOffer.mutate(deleteId!); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
