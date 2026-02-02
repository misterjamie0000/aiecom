import { Clock, Star, RotateCcw, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerRecentlyViewed, useCustomerReviews, useCustomerReturns } from '@/hooks/useCustomers';
import { format } from 'date-fns';

interface CustomerActivityTabProps {
  customerId: string;
}

export default function CustomerActivityTab({ customerId }: CustomerActivityTabProps) {
  const { data: recentlyViewed, isLoading: viewedLoading } = useCustomerRecentlyViewed(customerId);
  const { data: reviews, isLoading: reviewsLoading } = useCustomerReviews(customerId);
  const { data: returns, isLoading: returnsLoading } = useCustomerReturns(customerId);

  if (viewedLoading || reviewsLoading || returnsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recently Viewed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recently Viewed Products ({recentlyViewed?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentlyViewed?.length ? (
            <p className="text-center py-6 text-muted-foreground">No recently viewed products</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.map((item) => (
                <div key={item.id} className="text-center">
                  <img
                    src={item.products?.image_url || '/placeholder.svg'}
                    alt={item.products?.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-sm font-medium mt-2 truncate">{item.products?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.viewed_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Reviews ({reviews?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!reviews?.length ? (
            <p className="text-center py-6 text-muted-foreground">No reviews written</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="flex gap-4 border-b pb-4 last:border-0">
                  <img
                    src={review.products?.image_url || '/placeholder.svg'}
                    alt={review.products?.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{review.products?.name}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-medium text-sm">{review.title}</p>}
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM dd, yyyy')}
                      </span>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                      <Badge variant={review.is_approved ? 'default' : 'outline'} className="text-xs">
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Return/Replace Requests ({returns?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!returns?.length ? (
            <p className="text-center py-6 text-muted-foreground">No return requests</p>
          ) : (
            <div className="space-y-4">
              {returns.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Order #{request.orders?.order_number}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{request.request_type}</Badge>
                      <Badge className={
                        request.status === 'approved' ? 'bg-green-500' :
                        request.status === 'rejected' ? 'bg-red-500' :
                        request.status === 'completed' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {request.reason}</p>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
