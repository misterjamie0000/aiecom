import { useState, useEffect } from 'react';
import { MessageCircle, Save, Eye, EyeOff, AlertTriangle, CheckCircle2, Info, Languages, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSiteSettings, useUpsertSetting } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';

export default function WhatsAppSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const upsertSetting = useUpsertSetting();
  
  const [whatsappSettings, setWhatsappSettings] = useState({
    whatsapp_enabled: false,
    phone_number_id: '',
    access_token: '',
    business_id: '',
    verify_token: '',
  });

  const [showSecrets, setShowSecrets] = useState({
    access_token: false,
    verify_token: false,
  });

  const [infoLang, setInfoLang] = useState<'hi' | 'en'>('hi');

  // Load settings from database
  useEffect(() => {
    if (settings) {
      const whatsappSetting = settings.find(s => s.key === 'whatsapp_api');
      if (whatsappSetting?.value) {
        setWhatsappSettings(prev => ({ ...prev, ...(whatsappSetting.value as any) }));
      }
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await upsertSetting.mutateAsync({
        key: 'whatsapp_api',
        value: whatsappSettings,
        description: 'WhatsApp Business API settings'
      });
      toast.success('WhatsApp settings saved successfully');
    } catch (error) {
      toast.error('Failed to save WhatsApp settings');
    }
  };

  const isConfigured = whatsappSettings.phone_number_id && whatsappSettings.access_token && whatsappSettings.business_id;

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="bg-green-50 border-green-200 text-green-800">
        <MessageCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">
              {infoLang === 'hi' ? 'WhatsApp Business API Setup' : 'WhatsApp Business API Setup'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInfoLang(infoLang === 'hi' ? 'en' : 'hi')}
              className="gap-1 h-7 text-xs bg-white"
            >
              <Languages className="w-3 h-3" />
              {infoLang === 'hi' ? 'English' : 'हिंदी'}
            </Button>
          </div>

          {infoLang === 'hi' ? (
            <>
              <p className="font-medium">WhatsApp Business API कैसे प्राप्त करें?</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Facebook Developer Account बनाएं: <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></li>
                <li>एक नया App बनाएं और "WhatsApp" product जोड़ें</li>
                <li>Meta Business Suite में अपना Business verify करें</li>
                <li>WhatsApp Business Phone Number जोड़ें और verify करें</li>
                <li>API Settings से Phone Number ID, Business ID और Access Token कॉपी करें</li>
              </ol>
              <p className="font-medium mt-3">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Business verification में 1-2 हफ्ते लग सकते हैं</li>
                <li>Promotional messages के लिए pre-approved templates जरूरी हैं</li>
                <li>Per conversation pricing लगभग ₹0.50-1.50 होती है</li>
              </ul>
            </>
          ) : (
            <>
              <p className="font-medium">How to get WhatsApp Business API?</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a Facebook Developer Account: <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></li>
                <li>Create a new App and add "WhatsApp" product</li>
                <li>Verify your Business in Meta Business Suite</li>
                <li>Add and verify a WhatsApp Business Phone Number</li>
                <li>Copy Phone Number ID, Business ID and Access Token from API Settings</li>
              </ol>
              <p className="font-medium mt-3">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Business verification can take 1-2 weeks</li>
                <li>Pre-approved templates are required for promotional messages</li>
                <li>Per conversation pricing is approximately ₹0.50-1.50</li>
              </ul>
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* WhatsApp API Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                WhatsApp Business API
              </CardTitle>
              <CardDescription>Configure your WhatsApp Business API credentials for marketing campaigns</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isConfigured ? (
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
                checked={whatsappSettings.whatsapp_enabled}
                onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, whatsapp_enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Get your API credentials from{' '}
              <a 
                href="https://developers.facebook.com/apps" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline font-medium inline-flex items-center gap-1"
              >
                Meta for Developers <ExternalLink className="w-3 h-3" />
              </a>
              {' '}→ Your App → WhatsApp → API Setup
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number_id">Phone Number ID</Label>
              <Input
                id="phone_number_id"
                value={whatsappSettings.phone_number_id}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phone_number_id: e.target.value })}
                placeholder="e.g., 123456789012345"
              />
              <p className="text-xs text-muted-foreground">
                Found in WhatsApp → API Setup → Phone Number ID
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_id">WhatsApp Business Account ID</Label>
              <Input
                id="business_id"
                value={whatsappSettings.business_id}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, business_id: e.target.value })}
                placeholder="e.g., 123456789012345"
              />
              <p className="text-xs text-muted-foreground">
                Found in WhatsApp → API Setup → WhatsApp Business Account ID
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token">Permanent Access Token</Label>
            <div className="relative">
              <Input
                id="access_token"
                type={showSecrets.access_token ? 'text' : 'password'}
                value={whatsappSettings.access_token}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, access_token: e.target.value })}
                placeholder="Enter your permanent access token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowSecrets({ ...showSecrets, access_token: !showSecrets.access_token })}
              >
                {showSecrets.access_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate a permanent token from Meta Business Settings → System Users
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify_token">Webhook Verify Token (Optional)</Label>
            <div className="relative">
              <Input
                id="verify_token"
                type={showSecrets.verify_token ? 'text' : 'password'}
                value={whatsappSettings.verify_token}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, verify_token: e.target.value })}
                placeholder="Custom token for webhook verification"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowSecrets({ ...showSecrets, verify_token: !showSecrets.verify_token })}
              >
                {showSecrets.verify_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A custom string used to verify webhook configuration (for delivery receipts)
            </p>
          </div>

          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Access tokens are sensitive credentials. These settings are stored in your database.
              For production use, consider storing the access token in environment variables for enhanced security.
            </AlertDescription>
          </Alert>

          <Button onClick={handleSave} disabled={upsertSetting.isPending} size="lg" className="mt-4">
            <Save className="w-4 h-4 mr-2" />
            Save WhatsApp Settings
          </Button>
        </CardContent>
      </Card>

      {/* Status Card */}
      {isConfigured && whatsappSettings.whatsapp_enabled && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-800">WhatsApp Marketing is Active</p>
                <p className="text-sm text-green-700">
                  You can now send WhatsApp campaigns and abandoned cart reminders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
