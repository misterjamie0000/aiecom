import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  Filter, 
  SlidersHorizontal, 
  X, 
  Star, 
  ChevronDown,
  Grid3X3,
  List,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSearch, SearchFilters, usePopularSearches } from '@/hooks/useSearch';
import { useCategories } from '@/hooks/useCategories';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    categoryId: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    inStock: false,
    sortBy: 'newest',
  });

  const { data: products, isLoading } = useSearch(filters);
  const { data: categories } = useCategories();
  const popularSearches = usePopularSearches();

  // Update filters when URL changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchInput(q);
    setFilters(prev => ({ ...prev, query: q }));
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchInput });
    setFilters(prev => ({ ...prev, query: searchInput }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: filters.query,
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      inStock: false,
      sortBy: 'newest',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.minRating !== undefined && filters.minRating > 0) count++;
    if (filters.inStock) count++;
    return count;
  }, [filters]);

  const FilterPanel = () => (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['categories', 'price', 'rating']} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div
                className={`cursor-pointer px-2 py-1.5 rounded text-sm transition-colors ${
                  !filters.categoryId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => handleFilterChange('categoryId', undefined)}
              >
                All Categories
              </div>
              {categories?.map((cat) => (
                <div
                  key={cat.id}
                  className={`cursor-pointer px-2 py-1.5 rounded text-sm transition-colors ${
                    filters.categoryId === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleFilterChange('categoryId', cat.id)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    placeholder="₹0"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    placeholder="₹10000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating */}
        <AccordionItem value="rating">
          <AccordionTrigger className="text-sm font-medium">Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <div
                  key={rating}
                  className={`cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    filters.minRating === rating ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleFilterChange('minRating', filters.minRating === rating ? undefined : rating)}
                >
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    ))}
                  </div>
                  <span>& Up</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability">
          <AccordionTrigger className="text-sm font-medium">Availability</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={(checked) => handleFilterChange('inStock', checked)}
              />
              <label htmlFor="in-stock" className="text-sm cursor-pointer">
                In Stock Only
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="px-8">
            Search
          </Button>
        </form>

        {/* Popular Searches */}
        {!filters.query && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <span className="text-sm text-muted-foreground">Popular:</span>
            {popularSearches.map((term) => (
              <Badge
                key={term}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => {
                  setSearchInput(term);
                  setSearchParams({ q: term });
                  setFilters(prev => ({ ...prev, query: term }));
                }}
              >
                {term}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </div>
            <FilterPanel />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Narrow down your search results</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>

              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  'Searching...'
                ) : (
                  <>
                    <span className="font-medium text-foreground">{products?.length || 0}</span> results
                    {filters.query && (
                      <> for "<span className="font-medium text-foreground">{filters.query}</span>"</>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Best Rated</SelectItem>
                  <SelectItem value="name_asc">Name: A-Z</SelectItem>
                  <SelectItem value="name_desc">Name: Z-A</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.categoryId && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categories?.find(c => c.id === filters.categoryId)?.name}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleFilterChange('categoryId', undefined)}
                  />
                </Badge>
              )}
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <Badge variant="secondary" className="gap-1">
                  Price: ₹{filters.minPrice || 0} - ₹{filters.maxPrice || '∞'}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => {
                      handleFilterChange('minPrice', undefined);
                      handleFilterChange('maxPrice', undefined);
                    }}
                  />
                </Badge>
              )}
              {filters.minRating !== undefined && filters.minRating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {filters.minRating}+ Stars
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleFilterChange('minRating', undefined)}
                  />
                </Badge>
              )}
              {filters.inStock && (
                <Badge variant="secondary" className="gap-1">
                  In Stock
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleFilterChange('inStock', false)}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Product Grid/List */}
          {isLoading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-4"
            }>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={viewMode === 'grid' ? 'space-y-3' : 'flex gap-4 border rounded-lg p-4'}>
                  <Skeleton className={viewMode === 'grid' ? 'aspect-square rounded-lg' : 'w-32 h-32 rounded-lg shrink-0'} />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
              }
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className={`group block border rounded-lg overflow-hidden hover:shadow-lg transition-all ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 shrink-0'} relative overflow-hidden bg-muted`}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {product.discount_percent && product.discount_percent > 0 && (
                        <Badge className="absolute top-2 left-2 bg-destructive">
                          -{product.discount_percent}%
                        </Badge>
                      )}
                    </div>
                    <div className={`p-3 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.categories?.name || 'Uncategorized'}
                      </p>
                      <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {viewMode === 'list' && product.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.short_description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {product.averageRating > 0 && (
                          <>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.round(product.averageRating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({product.reviewCount})
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-lg">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-sm text-muted-foreground line-through">₹{product.mrp}</span>
                        )}
                      </div>
                      {product.stock_quantity <= 0 && (
                        <Badge variant="secondary" className="mt-2">Out of Stock</Badge>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No products found</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {filters.query
                  ? `We couldn't find any products matching "${filters.query}". Try adjusting your search or filters.`
                  : 'Try searching for a product or adjusting your filters.'}
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
