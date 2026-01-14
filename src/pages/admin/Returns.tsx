import { useState } from 'react';
import { RotateCcw, RefreshCw, Search, Eye, CheckCircle, XCircle, Clock, Package, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useReturnRequests, useUpdateReturnRequest } from '@/hooks/useReturnRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
};

const refundStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const requestTypeColors: Record<string, string> = {
  return: 'bg-orange-100 text-orange-800',
  replace: 'bg-purple-100 text-purple-800',
};

export default function AdminReturns() {
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundStatus, setRefundStatus] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'return' | 'replace'>('all');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const { data: requests, isLoading } = useReturnRequests();
  const updateRequest = useUpdateReturnRequest();
  
  const filteredRequests = requests?.filter(r => {
    const matchesSearch = r.orders?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || (r as any).request_type === filterType;
    return matchesSearch && matchesType;
  });
  
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status);
    setRefundAmount(request.refund_amount || '');
    setRefundStatus(request.refund_status || '');
  };
  
  const handleUpdate = async () => {
    if (selectedRequest) {
      const oldStatus = selectedRequest.status;
      const statusChanged = oldStatus !== newStatus;
      
      await updateRequest.mutateAsync({
        id: selectedRequest.id,
        status: newStatus,
        admin_notes: adminNotes,
        refund_amount: refundAmount || null,
        refund_status: refundStatus || null,
      });

      // Send email notification if status changed and email is enabled
      if (statusChanged && sendEmailNotification) {
        const customerEmail = selectedRequest.profiles?.email;
        const customerName = selectedRequest.profiles?.full_name;
        const orderNumber = selectedRequest.orders?.order_number;
        
        if (customerEmail) {
          setIsSendingEmail(true);
          try {
            const { error } = await supabase.functions.invoke('send-request-status-email', {
              body: {
                email: customerEmail,
                customerName: customerName || 'Valued Customer',
                orderNumber: orderNumber || 'N/A',
                requestType: (selectedRequest as any).request_type || 'return',
                oldStatus,
                newStatus,
                adminNotes: adminNotes || undefined,
                refundAmount: refundAmount || undefined,
                refundStatus: refundStatus || undefined,
              },
            });
            
            if (error) {
              console.error('Failed to send email:', error);
              toast.error('Request updated but email notification failed');
            } else {
              toast.success('Email notification sent to customer');
            }
          } catch (err) {
            console.error('Error sending email:', err);
            toast.error('Request updated but email notification failed');
          } finally {
            setIsSendingEmail(false);
          }
        } else {
          toast.warning('Request updated but no customer email found');
        }
      }
      
      setSelectedRequest(null);
    }
  };
  
  const stats = {
    total: requests?.length || 0,
    returns: requests?.filter(r => (r as any).request_type === 'return' || !(r as any).request_type).length || 0,
    replaces: requests?.filter(r => (r as any).request_type === 'replace').length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    approved: requests?.filter(r => r.status === 'approved').length || 0,
    processing: requests?.filter(r => r.status === 'processing').length || 0,
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Returns & Replacements</h1>
        <p className="text-muted-foreground">Manage return and replacement requests</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Replacements</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.replaces}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by order or reason..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="return" className="gap-1">
                  <RotateCcw className="w-3 h-3" /> Returns
                </TabsTrigger>
                <TabsTrigger value="replace" className="gap-1">
                  <RefreshCw className="w-3 h-3" /> Replacements
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRequests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests?.map((request) => {
                  const requestType = (request as any).request_type || 'return';
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.orders?.order_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={requestTypeColors[requestType] || requestTypeColors.return}>
                          {requestType === 'replace' ? (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          ) : (
                            <RotateCcw className="w-3 h-3 mr-1" />
                          )}
                          {requestType.charAt(0).toUpperCase() + requestType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-muted-foreground">{request.user_id.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status] || ''}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.refund_amount ? (
                          <div>
                            <p>₹{request.refund_amount}</p>
                            {request.refund_status && (
                              <Badge variant="outline" className={refundStatusColors[request.refund_status] || ''}>
                                {request.refund_status}
                              </Badge>
                            )}
                          </div>
                        ) : requestType === 'replace' ? (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewRequest(request)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(selectedRequest as any)?.request_type === 'replace' ? (
                <>
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  Replacement Request Details
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                  Return Request Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">{selectedRequest.orders?.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Request Type</p>
                  <Badge className={requestTypeColors[(selectedRequest as any).request_type || 'return']}>
                    {((selectedRequest as any).request_type || 'return') === 'replace' ? 'Replacement' : 'Return'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedRequest.profiles?.full_name || 'N/A'}</p>
                  <p className="text-muted-foreground">{selectedRequest.profiles?.email || ''}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{format(new Date(selectedRequest.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm">Reason</p>
                <p className="font-medium">{selectedRequest.reason}</p>
              </div>
              
              {selectedRequest.description && (
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p>{selectedRequest.description}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(selectedRequest as any).request_type !== 'replace' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Refund Amount (₹)</Label>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Refund Status</Label>
                    <Select value={refundStatus} onValueChange={setRefundStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={`Internal notes about this ${(selectedRequest as any).request_type === 'replace' ? 'replacement' : 'return'}...`}
                  rows={3}
                />
              </div>

              {/* Email Notification Option */}
              {selectedRequest?.status !== newStatus && selectedRequest?.profiles?.email && (
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="send-email"
                    checked={sendEmailNotification}
                    onCheckedChange={(checked) => setSendEmailNotification(checked as boolean)}
                  />
                  <Label htmlFor="send-email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="w-4 h-4" />
                    Send email notification to customer
                  </Label>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateRequest.isPending || isSendingEmail}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
