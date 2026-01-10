import { useState, useEffect } from 'react';
import { CreditCard, Save, Edit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentSettings, useUpdatePaymentSettings, PaymentMethod } from '@/hooks/usePaymentSettings';

export default function AdminPayments() {
  const { data: settings, isLoading } = usePaymentSettings();
  const updateSettings = useUpdatePaymentSettings();
  
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [codLimit, setCodLimit] = useState(10000);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'online' as PaymentMethod['type'],
    processingFee: 0,
    instructions: '',
    isActive: true,
  });
  
  useEffect(() => {
    if (settings) {
      setMethods(settings.methods);
      setCodLimit(settings.codLimit);
      setGstEnabled(settings.gstEnabled);
      setGstPercentage(settings.gstPercentage);
    }
  }, [settings]);
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'online',
      processingFee: 0,
      instructions: '',
      isActive: true,
    });
    setEditingMethod(null);
  };
  
  const handleEdit = (method: PaymentMethod) => {
    setFormData({
      name: method.name,
      type: method.type,
      processingFee: method.processingFee || 0,
      instructions: method.instructions || '',
      isActive: method.isActive,
    });
    setEditingMethod(method);
    setIsDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMethod: PaymentMethod = {
      id: editingMethod?.id || Date.now().toString(),
      name: formData.name,
      type: formData.type,
      processingFee: formData.processingFee || undefined,
      instructions: formData.instructions || undefined,
      isActive: formData.isActive,
    };
    
    if (editingMethod) {
      setMethods(methods.map(m => m.id === editingMethod.id ? newMethod : m));
    } else {
      setMethods([...methods, newMethod]);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };
  
  const toggleMethod = (id: string) => {
    setMethods(methods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };
  
  const handleSave = async () => {
    await updateSettings.mutateAsync({
      methods,
      codLimit,
      gstEnabled,
      gstPercentage,
    });
  };
  
  const getTypeLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cod': return 'Cash on Delivery';
      case 'upi': return 'UPI';
      case 'online': return 'Online';
      case 'wallet': return 'Wallet';
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Configure payment methods and settings</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>COD Limit</CardTitle>
            <CardDescription>Maximum order value for Cash on Delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">₹</span>
              <Input
                type="number"
                value={codLimit}
                onChange={(e) => setCodLimit(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>GST Settings</CardTitle>
            <CardDescription>Goods and Services Tax configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable GST</Label>
              <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
            </div>
            {gstEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(Number(e.target.value))}
                />
                <span className="text-muted-foreground">%</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Methods</CardTitle>
            <CardDescription>Payment options available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold">{methods.filter(m => m.isActive).length}</div>
              <div className="text-sm text-muted-foreground">of {methods.length} total</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Configure available payment options</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <CreditCard className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Processing Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(method.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    {method.processingFee ? `₹${method.processingFee}` : 'Free'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={method.isActive}
                      onCheckedChange={() => toggleMethod(method.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(method)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Method Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Credit Card"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: PaymentMethod['type']) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="online">Online (Card/Net Banking)</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="processingFee">Processing Fee (₹)</Label>
              <Input
                id="processingFee"
                type="number"
                value={formData.processingFee}
                onChange={(e) => setFormData({ ...formData, processingFee: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Instructions shown to customers"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMethod ? 'Update Method' : 'Add Method'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
