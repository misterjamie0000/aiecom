import { useState } from 'react';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Sparkles,
  Edit,
  Trash2,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useCustomerSegments, 
  useSegmentMembers, 
  useCustomersWithStats,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
  useAddCustomerToSegment,
  useRemoveCustomerFromSegment,
  useRefreshSegments,
  CustomerSegment 
} from '@/hooks/useCustomerSegments';
import { format } from 'date-fns';

export default function AdminSegments() {
  const { data: segments, isLoading: segmentsLoading } = useCustomerSegments();
  const { data: customers, isLoading: customersLoading } = useCustomersWithStats();
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const { data: segmentMembers, isLoading: membersLoading } = useSegmentMembers(selectedSegment?.id || null);
  
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();
  const addCustomer = useAddCustomerToSegment();
  const removeCustomer = useRemoveCustomerFromSegment();
  const refreshSegments = useRefreshSegments();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    is_active: true,
  });

  const handleCreateSegment = async () => {
    await createSegment.mutateAsync({
      ...formData,
      segment_type: 'manual',
    });
    setIsCreateDialogOpen(false);
    setFormData({ name: '', description: '', color: '#6366f1', is_active: true });
  };

  const handleUpdateSegment = async () => {
    if (!editingSegment) return;
    await updateSegment.mutateAsync({
      id: editingSegment.id,
      ...formData,
    });
    setIsEditDialogOpen(false);
    setEditingSegment(null);
  };

  const handleDeleteSegment = async (segment: CustomerSegment) => {
    if (confirm(`Delete segment "${segment.name}"?`)) {
      await deleteSegment.mutateAsync(segment.id);
      if (selectedSegment?.id === segment.id) {
        setSelectedSegment(null);
      }
    }
  };

  const handleAddCustomer = async (customerId: string) => {
    if (!selectedSegment) return;
    await addCustomer.mutateAsync({ customerId, segmentId: selectedSegment.id });
  };

  const handleRemoveCustomer = async (customerId: string) => {
    if (!selectedSegment) return;
    await removeCustomer.mutateAsync({ customerId, segmentId: selectedSegment.id });
  };

  const openEditDialog = (segment: CustomerSegment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      color: segment.color,
      is_active: segment.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const filteredCustomers = customers?.filter(c => {
    if (!customerSearch) return true;
    const search = customerSearch.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.phone?.includes(search)
    );
  });

  const getSegmentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'vip': return <Crown className="w-4 h-4" />;
      case 'new': return <UserPlus className="w-4 h-4" />;
      case 'inactive': return <UserMinus className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (segmentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customer Segments</h1>
          <p className="text-muted-foreground">Group and target customers based on behavior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refreshSegments.mutate()} disabled={refreshSegments.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshSegments.isPending ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button onClick={() => {
            setFormData({ name: '', description: '', color: '#6366f1', is_active: true });
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Segment
          </Button>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments?.map((segment) => (
          <Card 
            key={segment.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSegment?.id === segment.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedSegment(segment)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: segment.color }}
                  >
                    {getSegmentIcon(segment.name)}
                  </div>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  {segment.segment_type === 'auto' && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Auto
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{segment.member_count || 0}</p>
              <p className="text-sm text-muted-foreground">customers</p>
              {segment.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{segment.description}</p>
              )}
              <div className="flex gap-1 mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); openEditDialog(segment); }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                {segment.segment_type !== 'auto' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteSegment(segment); }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedSegment.color }}
                >
                  {getSegmentIcon(selectedSegment.name)}
                </div>
                <div>
                  <CardTitle>{selectedSegment.name} Customers</CardTitle>
                  <CardDescription>{selectedSegment.description}</CardDescription>
                </div>
              </div>
              {selectedSegment.segment_type !== 'auto' && (
                <Button variant="outline" onClick={() => setIsAddCustomerDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : segmentMembers && segmentMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.customer?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{member.customer?.email || '-'}</TableCell>
                      <TableCell>{member.customer?.phone || '-'}</TableCell>
                      <TableCell>{format(new Date(member.assigned_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={member.assigned_by === 'system' ? 'secondary' : 'default'}>
                          {member.assigned_by}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.assigned_by === 'manual' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCustomer(member.customer_id)}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No customers in this segment
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Segment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Segment</DialogTitle>
            <DialogDescription>Create a manual segment to group customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Buyers"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this segment..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input 
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSegment} disabled={!formData.name || createSegment.isPending}>
              Create Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Segment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
            <DialogDescription>Update segment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={editingSegment?.segment_type === 'auto'}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input 
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSegment} disabled={updateSegment.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Customer to {selectedSegment?.name}</DialogTitle>
            <DialogDescription>Search and select customers to add</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {customersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Segments</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => {
                      const isInSegment = customer.segments.some(s => s.id === selectedSegment?.id);
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{customer.total_orders}</TableCell>
                          <TableCell>₹{customer.total_spent.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {customer.segments.slice(0, 2).map(s => (
                                <Badge 
                                  key={s.id} 
                                  variant="outline" 
                                  style={{ borderColor: s.color, color: s.color }}
                                  className="text-xs"
                                >
                                  {s.name}
                                </Badge>
                              ))}
                              {customer.segments.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{customer.segments.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={isInSegment ? 'outline' : 'default'}
                              disabled={isInSegment || addCustomer.isPending}
                              onClick={() => handleAddCustomer(customer.id)}
                            >
                              {isInSegment ? 'Added' : 'Add'}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCustomerDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
