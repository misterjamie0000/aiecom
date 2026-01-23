import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HeroBanner from '@/components/home/HeroBanner';
import FlashSaleBanner from '@/components/home/FlashSaleBanner';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import TrendingProducts from '@/components/home/TrendingProducts';
import { FeatureStrip, PromoBanner, CTASection } from '@/components/home/PromoBanner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['home-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (bannersLoading) {
    return (
      <div className="min-h-screen">
        <div className="relative min-h-[500px] lg:min-h-[600px] bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const featuredProducts = products?.filter(p => p.is_featured) || [];
  const allProducts = products || [];

  return (
    <div className="min-h-screen">
      <FlashSaleBanner />
      
      <HeroBanner banners={banners || []} />
      
      <FeatureStrip />
      
      <CategoryShowcase categories={categories || []} />
      
      <FeaturedProducts 
        products={featuredProducts.length > 0 ? featuredProducts : allProducts}
        title={featuredProducts.length > 0 ? "Featured Products" : "Latest Products"}
        subtitle={featuredProducts.length > 0 ? "Handpicked just for you" : "Fresh arrivals to explore"}
      />
      
      <PromoBanner />
      
      <TrendingProducts products={allProducts} />
      
      <CTASection />
    </div>
  );
}
