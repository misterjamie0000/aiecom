import { useState } from 'react';
import { Settings, Save, Store, Mail, Globe, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  
  // Load settings from database
  useState(() => {
    if (settings) {
      const storeSetting = settings.find(s => s.key === 'store_info');
      const seoSetting = settings.find(s => s.key === 'seo_settings');
      const generalSetting = settings.find(s => s.key === 'general_settings');
      
      if (storeSetting?.value) setStoreSettings(prev => ({ ...prev, ...(storeSetting.value as any) }));
      if (seoSetting?.value) setSeoSettings(prev => ({ ...prev, ...(seoSetting.value as any) }));
      if (generalSetting?.value) setGeneralSettings(prev => ({ ...prev, ...(generalSetting.value as any) }));
    }
  });
  
  const handleSaveStore = async () => {
    await upsertSetting.mutateAsync({ key: 'store_info', value: storeSettings, description: 'Store information' });
  };
  
  const handleSaveSeo = async () => {
    await upsertSetting.mutateAsync({ key: 'seo_settings', value: seoSettings, description: 'SEO settings' });
  };
  
  const handleSaveGeneral = async () => {
    await upsertSetting.mutateAsync({ key: 'general_settings', value: generalSettings, description: 'General settings' });
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
        <TabsList>
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            Store Info
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            General
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
      </Tabs>
    </div>
  );
}
