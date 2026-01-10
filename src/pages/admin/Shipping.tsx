import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useShippingSettings, useUpdateShippingSettings, ShippingZone } from '@/hooks/useShippingSettings';

export default function AdminShipping() {
  const { data: settings, isLoading } = useShippingSettings();
  const updateSettings = useUpdateShippingSettings();
  
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [defaultRate, setDefaultRate] = useState(80);
  const [freeThreshold, setFreeThreshold] = useState(999);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    regions: '',
    rate: 0,
    freeAbove: 0,
    estimatedDays: '',
    isActive: true,
  });
  
  useEffect(() => {
    if (settings) {
      setZones(settings.zones);
      setDefaultRate(settings.defaultRate);
      setFreeThreshold(settings.freeShippingThreshold);
    }
  }, [settings]);
  
  const resetForm = () => {
    setFormData({
      name: '',
      regions: '',
      rate: 0,
      freeAbove: 0,
      estimatedDays: '',
      isActive: true,
    });
    setEditingZone(null);
  };
  
  const handleEdit = (zone: ShippingZone) => {
    setFormData({
      name: zone.name,
      regions: zone.regions.join(', '),
      rate: zone.rate,
      freeAbove: zone.freeAbove || 0,
      estimatedDays: zone.estimatedDays,
      isActive: zone.isActive,
    });
    setEditingZone(zone);
    setIsDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newZone: ShippingZone = {
      id: editingZone?.id || Date.now().toString(),
      name: formData.name,
      regions: formData.regions.split(',').map(r => r.trim()),
      rate: formData.rate,
      freeAbove: formData.freeAbove || undefined,
      estimatedDays: formData.estimatedDays,
      isActive: formData.isActive,
    };
    
    if (editingZone) {
      setZones(zones.map(z => z.id === editingZone.id ? newZone : z));
    } else {
      setZones([...zones, newZone]);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleDelete = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };
  
  const handleSave = async () => {
    await updateSettings.mutateAsync({
      zones,
      defaultRate,
      freeShippingThreshold: freeThreshold,
    });
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
          <h1 className="text-3xl font-bold">Shipping</h1>
          <p className="text-muted-foreground">Configure shipping zones and rates</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Default Settings</CardTitle>
            <CardDescription>Fallback shipping configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultRate">Default Shipping Rate (₹)</Label>
              <Input
                id="defaultRate"
                type="number"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeThreshold">Free Shipping Above (₹)</Label>
              <Input
                id="freeThreshold"
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Shipping zones overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{zones.length}</div>
                <div className="text-sm text-muted-foreground">Total Zones</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{zones.filter(z => z.isActive).length}</div>
                <div className="text-sm text-muted-foreground">Active Zones</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shipping Zones</CardTitle>
            <CardDescription>Define shipping rates by region</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone Name</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Free Above</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No shipping zones configured
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {zone.regions.join(', ')}
                    </TableCell>
                    <TableCell>₹{zone.rate}</TableCell>
                    <TableCell>{zone.freeAbove ? `₹${zone.freeAbove}` : '-'}</TableCell>
                    <TableCell>{zone.estimatedDays} days</TableCell>
                    <TableCell>
                      <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Zone' : 'Add New Zone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Metro Cities"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regions">Regions (comma separated) *</Label>
              <Input
                id="regions"
                value={formData.regions}
                onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                required
                placeholder="Mumbai, Delhi, Bangalore"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Shipping Rate (₹) *</Label>
                <Input
                  id="rate"
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeAbove">Free Shipping Above (₹)</Label>
                <Input
                  id="freeAbove"
                  type="number"
                  value={formData.freeAbove}
                  onChange={(e) => setFormData({ ...formData, freeAbove: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedDays">Estimated Delivery *</Label>
              <Input
                id="estimatedDays"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                required
                placeholder="2-3"
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
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
