-- =============================================
-- 1. FLASH SALES / TIME-LIMITED OFFERS
-- =============================================
CREATE TABLE public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  banner_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flash sale products (many-to-many)
CREATE TABLE public.flash_sale_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id UUID NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  special_price NUMERIC(10,2), -- Override price during flash sale
  max_quantity_per_user INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flash_sale_id, product_id)
);

-- =============================================
-- 2. BUNDLE / COMBO PRODUCTS
-- =============================================
CREATE TABLE public.product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  bundle_price NUMERIC(10,2) NOT NULL, -- Special bundle price
  original_price NUMERIC(10,2), -- Sum of individual prices
  discount_percent NUMERIC(5,2), -- Calculated savings
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_purchases INTEGER, -- Limit total bundle sales
  current_purchases INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bundle items (products in bundle)
CREATE TABLE public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bundle_id, product_id)
);

-- =============================================
-- 3. BUY X GET Y OFFERS
-- =============================================
CREATE TABLE public.bxgy_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- Buy conditions
  buy_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buy_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  buy_quantity INTEGER NOT NULL DEFAULT 1,
  -- Get conditions
  get_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  get_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  get_quantity INTEGER NOT NULL DEFAULT 1,
  get_discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (get_discount_type IN ('percentage', 'fixed', 'free')),
  get_discount_value NUMERIC(10,2) DEFAULT 100, -- 100% = free
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  usage_per_customer INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. PRODUCT RECOMMENDATIONS
-- =============================================
CREATE TABLE public.product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL DEFAULT 'frequently_bought' CHECK (recommendation_type IN ('frequently_bought', 'similar', 'complementary', 'upsell', 'cross_sell')),
  score NUMERIC(5,2) DEFAULT 0, -- Relevance score
  is_manual BOOLEAN DEFAULT FALSE, -- Manual vs auto-generated
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, recommended_product_id, recommendation_type)
);

-- User purchase history for recommendations
CREATE TABLE public.user_product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Flash Sales
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active flash sales" ON public.flash_sales
  FOR SELECT USING (is_active = true AND starts_at <= now() AND ends_at > now());
CREATE POLICY "Admins can manage flash sales" ON public.flash_sales
  FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view flash sale products" ON public.flash_sale_products
  FOR SELECT USING (EXISTS (SELECT 1 FROM flash_sales WHERE id = flash_sale_id AND is_active = true));
CREATE POLICY "Admins can manage flash sale products" ON public.flash_sale_products
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Product Bundles
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active bundles" ON public.product_bundles
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins can manage bundles" ON public.product_bundles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bundle items" ON public.bundle_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM product_bundles WHERE id = bundle_id AND is_active = true));
CREATE POLICY "Admins can manage bundle items" ON public.bundle_items
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- BXGY Offers
ALTER TABLE public.bxgy_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active BXGY offers" ON public.bxgy_offers
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins can manage BXGY offers" ON public.bxgy_offers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Product Recommendations
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recommendations" ON public.product_recommendations
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage recommendations" ON public.product_recommendations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User Product Views
ALTER TABLE public.user_product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own views" ON public.user_product_views
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all product views" ON public.user_product_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_flash_sales_active ON flash_sales(is_active, starts_at, ends_at);
CREATE INDEX idx_flash_sale_products_sale ON flash_sale_products(flash_sale_id);
CREATE INDEX idx_bundles_active ON product_bundles(is_active, starts_at, ends_at);
CREATE INDEX idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX idx_bxgy_active ON bxgy_offers(is_active, starts_at, ends_at);
CREATE INDEX idx_recommendations_product ON product_recommendations(product_id);
CREATE INDEX idx_user_views_user ON user_product_views(user_id);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_flash_sales_updated_at
  BEFORE UPDATE ON flash_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON product_bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bxgy_updated_at
  BEFORE UPDATE ON bxgy_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON product_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();