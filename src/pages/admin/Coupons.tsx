import { useState } from 'react';
import { Tag, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@/hooks/useCoupons';
import { format } from 'date-fns';

export default function AdminCoupons() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: coupons, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '',
    max_discount: '',
    usage_limit: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_value: '',
      max_discount: '',
      usage_limit: '',
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_value: coupon.min_order_value?.toString() || '',
      max_discount: coupon.max_discount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      is_active: coupon.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      is_active: formData.is_active,
    };

    if (editingCoupon) {
      await updateCoupon.mutateAsync({ id: editingCoupon.id, ...couponData });
    } else {
      await createCoupon.mutateAsync(couponData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCoupon.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const filteredCoupons = coupons?.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6" />
            Coupons
          </h1>
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Value *</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order">Min Order Value</Label>
                  <Input
                    id="min_order"
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max Discount</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="200"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCoupon.isPending || updateCoupon.isPending}>
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
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
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCoupons?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons?.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono font-bold">{coupon.code}</p>
                      {coupon.description && <p className="text-sm text-muted-foreground">{coupon.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value}`}
                    {coupon.max_discount && (
                      <p className="text-sm text-muted-foreground">Max: ₹{coupon.max_discount}</p>
                    )}
                  </TableCell>
                  <TableCell>{coupon.min_order_value ? `₹${coupon.min_order_value}` : '-'}</TableCell>
                  <TableCell>
                    {coupon.usage_count} / {coupon.usage_limit || '∞'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(coupon)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(coupon.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
