import { useState } from 'react';
import { useProductReviews, useProductRatingStats, useUserReview, useCanReview, useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Star, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const { data: stats } = useProductRatingStats(productId);
  const { data: userReview } = useUserReview(productId, user?.id);
  const { data: reviewAbility } = useCanReview(productId, user?.id);
  const createReview = useCreateReview();
  
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    createReview.mutate({
      product_id: productId,
      user_id: user.id,
      rating,
      title: title || null,
      comment: comment || null,
      is_verified_purchase: reviewAbility?.isVerifiedPurchase || false,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setTitle('');
        setComment('');
        setRating(5);
      }
    });
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          <div className="bg-secondary/30 rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2">{stats?.average.toFixed(1) || '0.0'}</div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-5 h-5",
                      star <= Math.round(stats?.average || 0)
                        ? "fill-primary text-primary"
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {stats?.count || 0} reviews
              </p>
            </div>
            
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats?.distribution[stars as keyof typeof stats.distribution] || 0;
                const percentage = stats?.count ? (count / stats.count) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm w-8">{stars} ★</span>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
            
            {user && !userReview && (
              <Button
                className="w-full mt-6"
                onClick={() => setShowForm(!showForm)}
              >
                Write a Review
              </Button>
            )}
            
            {!user && (
              <p className="text-sm text-muted-foreground text-center mt-6">
                Please login to write a review
              </p>
            )}
            
            {userReview && (
              <p className="text-sm text-muted-foreground text-center mt-6">
                You've already reviewed this product
              </p>
            )}
          </div>
        </div>
        
        {/* Reviews List */}
        <div className="lg:col-span-2">
          {/* Review Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-secondary/30 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold mb-4">Write Your Review</h3>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "w-8 h-8 transition-colors",
                          star <= (hoveredRating || rating)
                            ? "fill-primary text-primary"
                            : "text-muted hover:text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Review (Optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                />
              </div>
              
              {reviewAbility?.isVerifiedPurchase && (
                <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                  <CheckCircle className="w-4 h-4" />
                  Your review will be marked as a verified purchase
                </div>
              )}
              
              <div className="flex gap-3">
                <Button type="submit" disabled={createReview.isPending}>
                  {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          
          {/* Reviews */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={(review.profiles as any)?.avatar_url} />
                        <AvatarFallback>
                          {(review.profiles as any)?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {(review.profiles as any)?.full_name || 'Anonymous'}
                          </span>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
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
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                  )}
                  
                  {review.comment && (
                    <p className="text-muted-foreground">{review.comment}</p>
                  )}
                  
                  {review.admin_reply && (
                    <div className="mt-4 bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Response from Seller
                      </div>
                      <p className="text-sm text-muted-foreground">{review.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Reviews Yet</h3>
              <p className="text-muted-foreground">Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
