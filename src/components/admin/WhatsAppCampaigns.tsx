import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  Send,
  Plus,
  MoreVertical,
  CheckCircle,
  Loader2,
  FileText,
  Trash2,
  Edit,
  Clock,
  AlertCircle,
  Users,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
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
  useWhatsAppCampaigns,
  useWhatsAppTemplates,
  useCreateWhatsAppCampaign,
  useUpdateWhatsAppCampaign,
  useDeleteWhatsAppCampaign,
  useSendWhatsAppCampaign,
  WhatsAppCampaign,
} from '@/hooks/useWhatsAppMarketing';
import { useCustomerSegments } from '@/hooks/useCustomerSegments';

export default function WhatsAppCampaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<WhatsAppCampaign | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useWhatsAppCampaigns();
  const { data: templates } = useWhatsAppTemplates();
  const { data: segments } = useCustomerSegments();

  const createCampaign = useCreateWhatsAppCampaign();
  const updateCampaign = useUpdateWhatsAppCampaign();
  const deleteCampaign = useDeleteWhatsAppCampaign();
  const sendCampaign = useSendWhatsAppCampaign();

  const [formData, setFormData] = useState({
    name: '',
    message_content: '',
    campaign_type: 'promotional',
    target_segment_id: '',
    template_id: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      message_content: '',
      campaign_type: 'promotional',
      target_segment_id: '',
      template_id: '',
    });
    setEditingCampaign(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (campaign: WhatsAppCampaign) => {
    setFormData({
      name: campaign.name,
      message_content: campaign.message_content,
      campaign_type: campaign.campaign_type,
      target_segment_id: campaign.target_segment_id || '',
      template_id: campaign.template_id || '',
    });
    setEditingCampaign(campaign);
    setIsCreateDialogOpen(true);
  };

  const handleSaveCampaign = () => {
    if (editingCampaign) {
      updateCampaign.mutate({
        id: editingCampaign.id,
        name: formData.name,
        message_content: formData.message_content,
        campaign_type: formData.campaign_type,
        target_segment_id: formData.target_segment_id || null,
        template_id: formData.template_id || null,
      });
    } else {
      createCampaign.mutate({
        name: formData.name,
        message_content: formData.message_content,
        campaign_type: formData.campaign_type,
        target_segment_id: formData.target_segment_id || null,
      });
    }
    setIsCreateDialogOpen(false);
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        message_content: template.content,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">WhatsApp Campaigns</h3>
          <p className="text-sm text-muted-foreground">
            Create and send WhatsApp marketing campaigns
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create WhatsApp Campaign
        </Button>
      </div>

      {campaigns?.length === 0 ? (
        <Card className="py-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No WhatsApp campaigns yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first WhatsApp campaign to reach customers
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns?.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{campaign.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(campaign.status)}
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {campaign.segment?.name || 'All Customers'}
                    </div>
                    {campaign.status === 'sent' && (
                      <>
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4 text-blue-500" />
                          {campaign.total_sent} sent
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {campaign.total_delivered} delivered
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-purple-500" />
                          {campaign.total_read} read
                        </div>
                      </>
                    )}
                    {campaign.sent_at && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Sent {formatDistanceToNow(new Date(campaign.sent_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm line-clamp-2">{campaign.message_content}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit WhatsApp Campaign' : 'Create WhatsApp Campaign'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Diwali Sale Announcement"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Segment</Label>
                <Select
                  value={formData.target_segment_id}
                  onValueChange={(value) => setFormData({ ...formData, target_segment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Customers</SelectItem>
                    {segments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Use Template (Optional)</Label>
              <Select
                value={formData.template_id}
                onValueChange={handleUseTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.filter(t => t.is_active).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_content">Message Content</Label>
              <Textarea
                id="message_content"
                rows={5}
                placeholder="Hi {{1}}! Check out our new offers..."
                value={formData.message_content}
                onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{1}}"} for customer name. Keep message under 1024 characters.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCampaign}
              disabled={!formData.name || !formData.message_content || createCampaign.isPending || updateCampaign.isPending}
            >
              {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
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
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
