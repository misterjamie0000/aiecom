import { useState } from 'react';
import { Plus, Trash2, Sparkles, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureGuide } from '@/components/admin/FeatureGuide';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useAllRecommendations,
  useCreateRecommendation,
  useDeleteRecommendation,
  useGenerateRecommendations,
  ProductRecommendation
} from '@/hooks/useRecommendations';
import { useProducts } from '@/hooks/useProducts';

const RECOMMENDATION_TYPES = [
  { value: 'frequently_bought', label: 'Frequently Bought Together', color: 'bg-blue-500' },
  { value: 'similar', label: 'Similar Products', color: 'bg-purple-500' },
  { value: 'complementary', label: 'Complementary', color: 'bg-green-500' },
  { value: 'upsell', label: 'Upsell', color: 'bg-orange-500' },
  { value: 'cross_sell', label: 'Cross-sell', color: 'bg-pink-500' },
];

export default function AdminRecommendations() {
  const { data: recommendations, isLoading } = useAllRecommendations();
  const { data: products } = useProducts();
  const createRecommendation = useCreateRecommendation();
  const deleteRecommendation = useDeleteRecommendation();
  const generateRecommendations = useGenerateRecommendations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    recommended_product_id: '',
    recommendation_type: 'frequently_bought',
  });

  const resetForm = () => {
    setFormData({
      product_id: '',
      recommended_product_id: '',
      recommendation_type: 'frequently_bought',
    });
  };

  const handleSubmit = async () => {
    await createRecommendation.mutateAsync(formData);
    setDialogOpen(false);
    resetForm();
  };

  const getTypeInfo = (type: string) => {
    return RECOMMENDATION_TYPES.find(t => t.value === type) || RECOMMENDATION_TYPES[0];
  };

  // Group recommendations by source product
  const groupedRecommendations = recommendations?.reduce((acc, rec) => {
    const productId = rec.product_id;
    if (!acc[productId]) {
      acc[productId] = {
        product: rec.product,
        recommendations: [],
      };
    }
    acc[productId].recommendations.push(rec);
    return acc;
  }, {} as Record<string, { product: any; recommendations: ProductRecommendation[] }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Product Recommendations
          </h1>
          <p className="text-muted-foreground">Manage product recommendations for better conversions</p>
        </div>
        <div className="flex gap-2">
          <FeatureGuide feature="recommendations" />
          <Button
            variant="outline"
            onClick={() => generateRecommendations.mutate()}
            disabled={generateRecommendations.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generateRecommendations.isPending ? 'animate-spin' : ''}`} />
            Auto-Generate
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Recommendation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product Recommendation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Product</Label>
                  <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recommended Product</Label>
                  <Select value={formData.recommended_product_id} onValueChange={(v) => setFormData({ ...formData, recommended_product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                    <SelectContent>
                      {products?.filter(p => p.id !== formData.product_id).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recommendation Type</Label>
                  <Select value={formData.recommendation_type} onValueChange={(v) => setFormData({ ...formData, recommendation_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECOMMENDATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSubmit} 
                  disabled={createRecommendation.isPending || !formData.product_id || !formData.recommended_product_id}
                >
                  Add Recommendation
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recommendations?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products with Recs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {Object.keys(groupedRecommendations || {}).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {recommendations?.filter(r => r.is_manual).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {recommendations?.filter(r => !r.is_manual).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Type Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recommendation Types</CardTitle>
          <CardDescription>Different types of product recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {RECOMMENDATION_TYPES.map((type) => (
              <div key={type.value} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                <span className="text-sm">{type.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Product</TableHead>
                <TableHead></TableHead>
                <TableHead>Recommended Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : recommendations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No recommendations yet. Click "Auto-Generate" to create based on order history or add manually.
                  </TableCell>
                </TableRow>
              ) : (
                recommendations?.map((rec) => {
                  const typeInfo = getTypeInfo(rec.recommendation_type);
                  return (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rec.product?.image_url && (
                            <img src={rec.product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <span className="font-medium">{rec.product?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rec.recommended_product?.image_url && (
                            <img src={rec.recommended_product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                          )}
                          <span>{rec.recommended_product?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <div className={`w-2 h-2 rounded-full ${typeInfo.color}`} />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{rec.score}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rec.is_manual ? 'default' : 'secondary'}>
                          {rec.is_manual ? 'Manual' : 'Auto'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(rec.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recommendation?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteRecommendation.mutate(deleteId!); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
