import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState } from 'react';

export interface SearchFilters {
  query: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc' | 'rating';
}

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search-products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug),
          reviews:reviews(rating)
        `)
        .eq('is_active', true);

      // Text search across name, description, sku
      if (filters.query && filters.query.trim()) {
        const searchTerm = `%${filters.query.trim()}%`;
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},sku.ilike.${searchTerm},short_description.ilike.${searchTerm}`);
      }

      // Category filter
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Price range
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      // In stock filter
      if (filters.inStock) {
        query = query.gt('stock_quantity', 0);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Calculate average rating for each product
      const productsWithRating = data?.map(product => {
        const reviews = product.reviews || [];
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
          : 0;
        return {
          ...product,
          averageRating: avgRating,
          reviewCount: reviews.length,
        };
      }) || [];

      // Filter by rating if specified
      let filteredProducts = productsWithRating;
      if (filters.minRating !== undefined && filters.minRating > 0) {
        filteredProducts = productsWithRating.filter(p => p.averageRating >= filters.minRating!);
      }

      // Sort by rating if specified
      if (filters.sortBy === 'rating') {
        filteredProducts.sort((a, b) => b.averageRating - a.averageRating);
      }

      return filteredProducts;
    },
    enabled: true,
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, image_url, price')
        .eq('is_active', true)
        .ilike('name', searchTerm)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });
}

export function usePopularSearches() {
  // This could be enhanced with actual analytics data
  return useMemo(() => [
    'Shoes',
    'Electronics',
    'Fashion',
    'Home Decor',
    'Accessories',
  ], []);
}
