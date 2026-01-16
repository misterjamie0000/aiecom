import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Mail,
  ShoppingCart,
  Send,
  Plus,
  MoreVertical,
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Trash2,
  Edit,
  IndianRupee,
  BarChart3,
  Info,
  Languages,
  HelpCircle,
  Settings,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useEmailCampaigns,
  useAbandonedCarts,
  useEmailTemplates,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useSendCampaign,
  useSendCartReminder,
  useMarketingStats,
  EmailCampaign,
} from '@/hooks/useMarketing';
import { useCustomerSegments } from '@/hooks/useCustomerSegments';
import CampaignAnalytics from '@/components/admin/CampaignAnalytics';
import WhatsAppSettings from '@/components/admin/WhatsAppSettings';

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showFeatureInfo, setShowFeatureInfo] = useState(false);
  const [featureInfoLang, setFeatureInfoLang] = useState<'hi' | 'en'>('hi');

  const { data: campaigns, isLoading: campaignsLoading } = useEmailCampaigns();
  const { data: abandonedCarts, isLoading: cartsLoading } = useAbandonedCarts();
  const { data: templates } = useEmailTemplates();
  const { data: segments } = useCustomerSegments();
  const { data: stats, isLoading: statsLoading } = useMarketingStats();

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();
  const sendCartReminder = useSendCartReminder();

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    campaign_type: 'promotional',
    target_segment_id: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      campaign_type: 'promotional',
      target_segment_id: '',
    });
    setEditingCampaign(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (campaign: EmailCampaign) => {
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      campaign_type: campaign.campaign_type,
      target_segment_id: campaign.target_segment_id || '',
    });
    setEditingCampaign(campaign);
    setIsCreateDialogOpen(true);
  };

  const handleSaveCampaign = () => {
    if (editingCampaign) {
      updateCampaign.mutate({
        id: editingCampaign.id,
        ...formData,
        target_segment_id: formData.target_segment_id || null,
      });
    } else {
      createCampaign.mutate({
        ...formData,
        target_segment_id: formData.target_segment_id || null,
      });
    }
    setIsCreateDialogOpen(false);
  };

  const handleUseTemplate = (templateType: string) => {
    const template = templates?.find(t => t.template_type === templateType && t.is_default);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content,
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'outline', icon: <FileText className="w-3 h-3" /> },
      scheduled: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      sending: { variant: 'default', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      sent: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (campaignsLoading || cartsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">
            Manage email & WhatsApp campaigns and recover abandoned carts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('settings')}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFeatureInfo(!showFeatureInfo)}
            className="gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Use of this feature
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Feature Info */}
      {showFeatureInfo && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">
                {featureInfoLang === 'hi' ? 'Marketing Feature का उपयोग क्यों करें?' : 'Why use the Marketing Feature?'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeatureInfoLang(featureInfoLang === 'hi' ? 'en' : 'hi')}
                className="gap-1 h-7 text-xs bg-white"
              >
                <Languages className="w-3 h-3" />
                {featureInfoLang === 'hi' ? 'English' : 'हिंदी'}
              </Button>
            </div>

            {featureInfoLang === 'hi' ? (
              <>
                <p className="font-medium">यह Feature क्या है?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Email Campaigns:</strong> अपने customers को promotional emails भेजें - नए products, offers, discounts के बारे में बताएं</li>
                  <li><strong>Abandoned Cart Recovery:</strong> जो customers cart में items छोड़कर चले गए, उन्हें reminder email भेजें ताकि वो purchase complete करें</li>
                  <li><strong>Customer Segmentation:</strong> VIP, New, Inactive customers को अलग-अलग campaigns भेजें</li>
                  <li><strong>Analytics:</strong> देखें कितने emails open हुए, कितने पर click हुआ - campaign performance track करें</li>
                </ul>
                <p className="font-medium mt-3">कब उपयोग करें?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>नया product launch करते समय customers को inform करने के लिए</li>
                  <li>Festival या special offer के दौरान promotional emails भेजने के लिए</li>
                  <li>Abandoned carts recover करके lost sales वापस पाने के लिए</li>
                  <li>Inactive customers को re-engage करने के लिए</li>
                </ul>
                <p className="font-medium mt-3">इसे कैसे उपयोग करें?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Step 1:</strong> "Create Campaign" बटन पर click करें</li>
                  <li><strong>Step 2:</strong> Campaign का नाम, subject line और content लिखें</li>
                  <li><strong>Step 3:</strong> Campaign type चुनें (Promotional, Newsletter, Welcome, etc.)</li>
                  <li><strong>Step 4:</strong> Target segment चुनें (VIP Customers, New Users, All Customers)</li>
                  <li><strong>Step 5:</strong> "Create Campaign" पर click करके save करें</li>
                  <li><strong>Step 6:</strong> Campaign list में जाकर "Send" बटन दबाएं</li>
                  <li><strong>Abandoned Carts के लिए:</strong> "Abandoned Carts" tab में जाकर "Send Reminder" बटन पर click करें</li>
                  <li><strong>Analytics देखने के लिए:</strong> "Analytics" tab पर जाकर performance charts देखें</li>
                </ul>
                <p className="font-medium mt-3">फायदे:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Sales बढ़ाएं targeted email campaigns से</li>
                  <li>Lost revenue recover करें abandoned cart reminders से</li>
                  <li>Customer engagement improve करें</li>
                  <li>ROI track करें analytics से</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-medium">What is this Feature?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Email Campaigns:</strong> Send promotional emails to your customers - inform them about new products, offers, and discounts</li>
                  <li><strong>Abandoned Cart Recovery:</strong> Send reminder emails to customers who left items in their cart to help them complete their purchase</li>
                  <li><strong>Customer Segmentation:</strong> Send different campaigns to VIP, New, and Inactive customers</li>
                  <li><strong>Analytics:</strong> Track how many emails were opened, clicked - monitor campaign performance</li>
                </ul>
                <p className="font-medium mt-3">When to use?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>To inform customers when launching a new product</li>
                  <li>To send promotional emails during festivals or special offers</li>
                  <li>To recover lost sales by reminding about abandoned carts</li>
                  <li>To re-engage inactive customers</li>
                </ul>
                <p className="font-medium mt-3">How to Use?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Step 1:</strong> Click on the "Create Campaign" button</li>
                  <li><strong>Step 2:</strong> Enter campaign name, subject line, and content</li>
                  <li><strong>Step 3:</strong> Select campaign type (Promotional, Newsletter, Welcome, etc.)</li>
                  <li><strong>Step 4:</strong> Choose target segment (VIP Customers, New Users, All Customers)</li>
                  <li><strong>Step 5:</strong> Click "Create Campaign" to save</li>
                  <li><strong>Step 6:</strong> Go to the campaign list and click "Send" button</li>
                  <li><strong>For Abandoned Carts:</strong> Go to "Abandoned Carts" tab and click "Send Reminder" button</li>
                  <li><strong>To View Analytics:</strong> Go to "Analytics" tab to see performance charts</li>
                </ul>
                <p className="font-medium mt-3">Benefits:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Increase sales with targeted email campaigns</li>
                  <li>Recover lost revenue with abandoned cart reminders</li>
                  <li>Improve customer engagement</li>
                  <li>Track ROI with analytics</li>
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.sentCampaigns} sent
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalOpened} opened / {stats?.totalSent} sent
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abandoned Carts</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.abandonedCarts}</div>
              <p className="text-xs text-muted-foreground">
                ₹{stats?.totalAbandonedValue?.toLocaleString()} potential revenue
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recoveryRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.recoveredCarts} carts recovered
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <Mail className="w-4 h-4" />
            Campaigns ({campaigns?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="abandoned" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Abandoned Carts ({abandonedCarts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp Settings
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns?.length === 0 ? (
            <Card className="py-12 text-center">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email campaign to reach your customers
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns?.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <CardDescription>{campaign.subject}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'draft' && (
                            <>
                              <DropdownMenuItem onClick={() => handleOpenEdit(campaign)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendCampaign.mutate(campaign.id)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send Now
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteConfirmId(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {campaign.segment && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${campaign.segment.color}20`,
                                borderColor: campaign.segment.color,
                              }}
                            >
                              {campaign.segment.name}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {campaign.total_recipients} recipients
                        </div>
                        {campaign.status === 'sent' && (
                          <>
                            <div className="flex items-center gap-1">
                              <Send className="w-4 h-4" />
                              {campaign.total_sent} sent
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {campaign.total_opened} opened
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointer className="w-4 h-4" />
                              {campaign.total_clicked} clicked
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {campaign.sent_at
                            ? `Sent ${formatDistanceToNow(new Date(campaign.sent_at), { addSuffix: true })}`
                            : `Created ${formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Abandoned Carts Tab */}
        <TabsContent value="abandoned" className="space-y-4">
          {abandonedCarts?.length === 0 ? (
            <Card className="py-12 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No abandoned carts</h3>
              <p className="text-muted-foreground">
                When customers leave items in their cart, they'll appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {abandonedCarts?.map((cart, idx) => (
                <motion.div
                  key={cart.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-lg">
                          {cart.customer?.full_name || 'Unknown Customer'}
                        </CardTitle>
                        <CardDescription>
                          {cart.customer?.email || 'No email'}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendCartReminder.mutate(cart.id)}
                        disabled={sendCartReminder.isPending}
                      >
                        {sendCartReminder.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Reminder
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <ShoppingCart className="w-4 h-4" />
                          {cart.total_items} items
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          <IndianRupee className="w-4 h-4" />
                          {Number(cart.total_value).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Abandoned {formatDistanceToNow(new Date(cart.last_activity_at), { addSuffix: true })}
                        </div>
                        {cart.reminder_count > 0 && (
                          <Badge variant="secondary">
                            {cart.reminder_count} reminder{cart.reminder_count > 1 ? 's' : ''} sent
                          </Badge>
                        )}
                      </div>

                      {cart.cart_items && cart.cart_items.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                          {cart.cart_items.slice(0, 5).map((item: any, i: number) => (
                            <div
                              key={i}
                              className="flex-shrink-0 w-20"
                            >
                              <img
                                src={item.product?.image_url || '/placeholder.svg'}
                                alt={item.product?.name}
                                className="w-20 h-20 object-cover rounded-lg border"
                              />
                              <p className="text-xs truncate mt-1">{item.product?.name}</p>
                            </div>
                          ))}
                          {cart.cart_items.length > 5 && (
                            <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">
                                +{cart.cart_items.length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <CampaignAnalytics campaigns={campaigns || []} />
        </TabsContent>

        {/* WhatsApp Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <WhatsAppSettings />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Sale Announcement"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, campaign_type: value });
                    handleUseTemplate(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    <SelectItem value="segment_campaign">Segment Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Segment (Optional)</Label>
                <Select
                  value={formData.target_segment_id || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, target_segment_id: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All customers</SelectItem>
                    {segments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          {segment.name} ({segment.member_count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Don't miss our biggest sale!"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Email Content (HTML)</Label>
              <Textarea
                id="content"
                placeholder="<h1>Hello {{customer_name}}</h1>..."
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{{customer_name}}'}, {'{{shop_url}}'}, {'{{cart_url}}'}, {'{{cart_items}}'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCampaign}
              disabled={!formData.name || !formData.subject || !formData.content}
            >
              {editingCampaign ? 'Update' : 'Create'} Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The campaign and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteCampaign.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
