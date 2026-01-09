import { useState } from 'react';
import { useAllReviews, useUpdateReview, useDeleteReview } from '@/hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { Star, CheckCircle, XCircle, MessageSquare, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminReviews() {
  const { data: reviews, isLoading } = useAllReviews();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const filteredReviews = reviews?.filter(review => 
    (review.profiles as any)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (review.products as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = (id: string) => {
    updateReview.mutate({ id, is_approved: true });
  };

  const handleReject = (id: string) => {
    updateReview.mutate({ id, is_approved: false });
  };

  const handleReply = () => {
    if (!selectedReview) return;
    updateReview.mutate({ id: selectedReview.id, admin_reply: replyText }, {
      onSuccess: () => {
        setSelectedReview(null);
        setReplyText('');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      deleteReview.mutate(id);
    }
  };

  const pendingCount = reviews?.filter(r => !r.is_approved).length || 0;
  const approvedCount = reviews?.filter(r => r.is_approved).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Manage customer product reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredReviews && filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {(review.products as any)?.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{(review.profiles as any)?.full_name || 'Anonymous'}</span>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-4 h-4",
                              star <= review.rating
                                ? "fill-primary text-primary"
                                : "text-muted"
                            )}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {review.title && <div className="font-medium truncate">{review.title}</div>}
                      <div className="text-sm text-muted-foreground truncate">
                        {review.comment || 'No comment'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.is_approved ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Approved</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {!review.is_approved && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => handleApprove(review.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {review.is_approved && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-yellow-600"
                            onClick={() => handleReject(review.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReview(review);
                            setReplyText(review.admin_reply || '');
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No reviews found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{(selectedReview?.profiles as any)?.full_name}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-3 h-3",
                        star <= (selectedReview?.rating || 0)
                          ? "fill-primary text-primary"
                          : "text-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
              {selectedReview?.title && (
                <div className="font-medium mb-1">{selectedReview.title}</div>
              )}
              <p className="text-sm text-muted-foreground">{selectedReview?.comment || 'No comment'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Your Reply</label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                Cancel
              </Button>
              <Button onClick={handleReply} disabled={updateReview.isPending}>
                {updateReview.isPending ? 'Saving...' : 'Save Reply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
