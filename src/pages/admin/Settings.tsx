import { useState, useEffect } from 'react';
import { Settings, Save, Store, Mail, Globe, Palette, CreditCard, Eye, EyeOff, AlertTriangle, CheckCircle2, ToggleRight, Info, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSiteSettings, useUpsertSetting } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const upsertSetting = useUpsertSetting();
  
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'My Store',
    tagline: 'Your one-stop shop',
    email: 'contact@store.com',
    phone: '+91 9876543210',
    address: '123 Main Street, City, State 123456',
    currency: 'INR',
    currency_symbol: '₹',
  });
  
  const [seoSettings, setSeoSettings] = useState({
    meta_title: 'My Store - Best Products Online',
    meta_description: 'Shop the best products at affordable prices.',
    meta_keywords: 'shop, ecommerce, products',
    google_analytics: '',
    facebook_pixel: '',
  });
  
  const [generalSettings, setGeneralSettings] = useState({
    maintenance_mode: false,
    allow_guest_checkout: true,
    show_out_of_stock: true,
    reviews_enabled: true,
    reviews_moderation: true,
  });

  const [featureSettings, setFeatureSettings] = useState({
    suppliers_enabled: true,
    purchase_orders_enabled: true,
  });

  const [noteLanguage, setNoteLanguage] = useState<'en' | 'hi'>('en');

  const [paymentSettings, setPaymentSettings] = useState({
    razorpay_enabled: true,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    cod_enabled: true,
    cod_min_order: 0,
    cod_max_order: 50000,
  });

  const [showSecrets, setShowSecrets] = useState({
    razorpay_key_secret: false,
  });
  
  // Load settings from database
  useEffect(() => {
    if (settings) {
      const storeSetting = settings.find(s => s.key === 'store_info');
      const seoSetting = settings.find(s => s.key === 'seo_settings');
      const generalSetting = settings.find(s => s.key === 'general_settings');
      const paymentSetting = settings.find(s => s.key === 'payment_gateway');
      const featureSetting = settings.find(s => s.key === 'feature_settings');
      
      if (storeSetting?.value) setStoreSettings(prev => ({ ...prev, ...(storeSetting.value as any) }));
      if (seoSetting?.value) setSeoSettings(prev => ({ ...prev, ...(seoSetting.value as any) }));
      if (generalSetting?.value) setGeneralSettings(prev => ({ ...prev, ...(generalSetting.value as any) }));
      if (paymentSetting?.value) setPaymentSettings(prev => ({ ...prev, ...(paymentSetting.value as any) }));
      if (featureSetting?.value) setFeatureSettings(prev => ({ ...prev, ...(featureSetting.value as any) }));
    }
  }, [settings]);
  
  const handleSaveStore = async () => {
    await upsertSetting.mutateAsync({ key: 'store_info', value: storeSettings, description: 'Store information' });
  };
  
  const handleSaveSeo = async () => {
    await upsertSetting.mutateAsync({ key: 'seo_settings', value: seoSettings, description: 'SEO settings' });
  };
  
  const handleSaveGeneral = async () => {
    await upsertSetting.mutateAsync({ key: 'general_settings', value: generalSettings, description: 'General settings' });
  };

  const handleSavePayment = async () => {
    await upsertSetting.mutateAsync({ 
      key: 'payment_gateway', 
      value: paymentSettings, 
      description: 'Payment gateway settings' 
    });
  };

  const handleSaveFeatures = async () => {
    await upsertSetting.mutateAsync({ key: 'feature_settings', value: featureSettings, description: 'Feature toggles' });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings and configuration</p>
      </div>
      
      <Tabs defaultValue="store" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            Store Info
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Gateway
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ToggleRight className="w-4 h-4" />
            Features
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input
                    id="store_name"
                    value={storeSettings.store_name}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={storeSettings.tagline}
                    onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={storeSettings.phone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Code</Label>
                  <Input
                    id="currency"
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency_symbol">Currency Symbol</Label>
                  <Input
                    id="currency_symbol"
                    value={storeSettings.currency_symbol}
                    onChange={(e) => setStoreSettings({ ...storeSettings, currency_symbol: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveStore} disabled={upsertSetting.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Store Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <div className="space-y-6">
            {/* Razorpay Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      Razorpay
                    </CardTitle>
                    <CardDescription>Accept payments via UPI, Cards, Net Banking & Wallets</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentSettings.razorpay_key_id ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                    <Switch
                      checked={paymentSettings.razorpay_enabled}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, razorpay_enabled: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Get your API keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">Razorpay Dashboard → Settings → API Keys</a>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razorpay_key_id">Key ID (Publishable)</Label>
                    <Input
                      id="razorpay_key_id"
                      value={paymentSettings.razorpay_key_id}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpay_key_id: e.target.value })}
                      placeholder="rzp_live_xxxxxxxxxx or rzp_test_xxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Starts with rzp_live_ (production) or rzp_test_ (sandbox)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razorpay_key_secret">Key Secret</Label>
                    <div className="relative">
                      <Input
                        id="razorpay_key_secret"
                        type={showSecrets.razorpay_key_secret ? 'text' : 'password'}
                        value={paymentSettings.razorpay_key_secret}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpay_key_secret: e.target.value })}
                        placeholder="Enter your Razorpay Key Secret"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowSecrets({ ...showSecrets, razorpay_key_secret: !showSecrets.razorpay_key_secret })}
                      >
                        {showSecrets.razorpay_key_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keep this secret - never share publicly
                    </p>
                  </div>
                </div>

                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> These keys are stored in your database settings. For production, 
                    the actual API secrets should be configured in environment variables through the cloud settings 
                    for enhanced security. Contact support if you need help with production setup.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* COD Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      Cash on Delivery
                    </CardTitle>
                    <CardDescription>Allow customers to pay when they receive their order</CardDescription>
                  </div>
                  <Switch
                    checked={paymentSettings.cod_enabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, cod_enabled: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cod_min_order">Minimum Order Value (₹)</Label>
                    <Input
                      id="cod_min_order"
                      type="number"
                      min="0"
                      value={paymentSettings.cod_min_order}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_min_order: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set to 0 for no minimum
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cod_max_order">Maximum Order Value (₹)</Label>
                    <Input
                      id="cod_max_order"
                      type="number"
                      min="0"
                      value={paymentSettings.cod_max_order}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_max_order: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set to 0 for no maximum
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSavePayment} disabled={upsertSetting.isPending} size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save Payment Settings
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Default Meta Title</Label>
                <Input
                  id="meta_title"
                  value={seoSettings.meta_title}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta_description">Default Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={seoSettings.meta_description}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={seoSettings.meta_keywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="google_analytics">Google Analytics ID</Label>
                <Input
                  id="google_analytics"
                  value={seoSettings.google_analytics}
                  onChange={(e) => setSeoSettings({ ...seoSettings, google_analytics: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facebook_pixel">Facebook Pixel ID</Label>
                <Input
                  id="facebook_pixel"
                  value={seoSettings.facebook_pixel}
                  onChange={(e) => setSeoSettings({ ...seoSettings, facebook_pixel: e.target.value })}
                  placeholder="XXXXXXXXXXXXXXXX"
                />
              </div>
              
              <Button onClick={handleSaveSeo} disabled={upsertSetting.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save SEO Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>General store configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable the store for visitors</p>
                </div>
                <Switch
                  checked={generalSettings.maintenance_mode}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenance_mode: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Guest Checkout</Label>
                  <p className="text-sm text-muted-foreground">Let users checkout without creating an account</p>
                </div>
                <Switch
                  checked={generalSettings.allow_guest_checkout}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, allow_guest_checkout: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Out of Stock Products</Label>
                  <p className="text-sm text-muted-foreground">Display products that are out of stock</p>
                </div>
                <Switch
                  checked={generalSettings.show_out_of_stock}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, show_out_of_stock: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Reviews</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to leave product reviews</p>
                </div>
                <Switch
                  checked={generalSettings.reviews_enabled}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, reviews_enabled: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Review Moderation</Label>
                  <p className="text-sm text-muted-foreground">Require approval before publishing reviews</p>
                </div>
                <Switch
                  checked={generalSettings.reviews_moderation}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, reviews_moderation: checked })}
                />
              </div>
              
              <Button onClick={handleSaveGeneral} disabled={upsertSetting.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable admin panel features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">
                      {noteLanguage === 'hi' ? 'इन Features का उपयोग कब करें?' : 'When to use these Features?'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNoteLanguage(noteLanguage === 'hi' ? 'en' : 'hi')}
                      className="gap-1 h-7 text-xs bg-white"
                    >
                      <Languages className="w-3 h-3" />
                      {noteLanguage === 'hi' ? 'English' : 'हिंदी'}
                    </Button>
                  </div>
                  
                  {noteLanguage === 'hi' ? (
                    <>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Suppliers Management:</strong> यदि आप अपने suppliers को track करना चाहते हैं - उनकी contact info, GST details, payment terms आदि।</li>
                        <li><strong>Purchase Orders:</strong> यदि आप suppliers से stock order करते हैं और inventory को automatically update करना चाहते हैं।</li>
                      </ul>
                      <p className="font-medium mt-3">कब ON रखें?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>जब आप multiple suppliers से products खरीदते हैं</li>
                        <li>जब inventory tracking और stock management जरूरी हो</li>
                        <li>जब आप purchase history maintain करना चाहते हैं</li>
                      </ul>
                      <p className="font-medium mt-3">कब OFF रखें?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>छोटे store जहाँ manual inventory update होता है</li>
                        <li>जब suppliers का record रखने की जरूरत नहीं है</li>
                        <li>Admin panel को simple और clutter-free रखने के लिए</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Suppliers Management:</strong> Track your suppliers - their contact info, GST details, payment terms, etc.</li>
                        <li><strong>Purchase Orders:</strong> Order stock from suppliers and automatically update inventory when received.</li>
                      </ul>
                      <p className="font-medium mt-3">When to keep ON?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>When you purchase products from multiple suppliers</li>
                        <li>When inventory tracking and stock management is essential</li>
                        <li>When you want to maintain purchase history records</li>
                      </ul>
                      <p className="font-medium mt-3">When to keep OFF?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Small stores with manual inventory updates</li>
                        <li>When supplier records aren't necessary</li>
                        <li>To keep the admin panel simple and clutter-free</li>
                      </ul>
                    </>
                  )}
                </AlertDescription>
              </Alert>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Suppliers Management</Label>
                  <p className="text-sm text-muted-foreground">Enable supplier management in admin panel</p>
                </div>
                <Switch
                  checked={featureSettings.suppliers_enabled}
                  onCheckedChange={(checked) => setFeatureSettings({ ...featureSettings, suppliers_enabled: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Purchase Orders</Label>
                  <p className="text-sm text-muted-foreground">Enable purchase order management in admin panel</p>
                </div>
                <Switch
                  checked={featureSettings.purchase_orders_enabled}
                  onCheckedChange={(checked) => setFeatureSettings({ ...featureSettings, purchase_orders_enabled: checked })}
                />
              </div>
              
              <Button onClick={handleSaveFeatures} disabled={upsertSetting.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Feature Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
