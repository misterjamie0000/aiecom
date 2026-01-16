import { useState } from 'react';
import { format } from 'date-fns';
import {
  MessageCircle,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  useWhatsAppTemplates,
  useCreateWhatsAppTemplate,
  useUpdateWhatsAppTemplate,
  useDeleteWhatsAppTemplate,
  WhatsAppTemplate,
} from '@/hooks/useWhatsAppMarketing';

export default function WhatsAppTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: templates, isLoading } = useWhatsAppTemplates();
  const createTemplate = useCreateWhatsAppTemplate();
  const updateTemplate = useUpdateWhatsAppTemplate();
  const deleteTemplate = useDeleteWhatsAppTemplate();

  const [formData, setFormData] = useState({
    name: '',
    template_name: '',
    content: '',
    template_type: 'promotional',
    language: 'en',
    header_type: 'text',
    header_content: '',
    footer_content: '',
    button_text: '',
    button_url: '',
    is_approved: false,
    is_active: true,
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      template_name: '',
      content: '',
      template_type: 'promotional',
      language: 'en',
      header_type: 'text',
      header_content: '',
      footer_content: '',
      button_text: '',
      button_url: '',
      is_approved: false,
      is_active: true,
    });
    setEditingTemplate(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (template: WhatsAppTemplate) => {
    setFormData({
      name: template.name,
      template_name: template.template_name,
      content: template.content,
      template_type: template.template_type,
      language: template.language,
      header_type: template.header_type || 'text',
      header_content: template.header_content || '',
      footer_content: template.footer_content || '',
      button_text: template.button_text || '',
      button_url: template.button_url || '',
      is_approved: template.is_approved,
      is_active: template.is_active,
    });
    setEditingTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplate.mutate({
        id: editingTemplate.id,
        ...formData,
      });
    } else {
      createTemplate.mutate(formData);
    }
    setIsCreateDialogOpen(false);
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
          <h3 className="text-lg font-medium">WhatsApp Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage pre-approved message templates for WhatsApp campaigns
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {templates?.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create message templates for your WhatsApp campaigns
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates?.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.is_approved ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(template)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {template.template_type} • {template.language.toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm line-clamp-3">{template.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {format(new Date(template.created_at), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Welcome Message"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template_name">Meta Template Name</Label>
                <Input
                  id="template_name"
                  placeholder="e.g., welcome_message"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Must match the name approved by Meta
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => setFormData({ ...formData, template_type: value })}
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
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="en_US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                rows={4}
                placeholder="Hi {{1}}! Welcome to our store..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{1}}"}, {"{{2}}"}, etc. for dynamic variables
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_content">Footer (Optional)</Label>
              <Input
                id="footer_content"
                placeholder="e.g., Reply STOP to unsubscribe"
                value={formData.footer_content}
                onChange={(e) => setFormData({ ...formData, footer_content: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Button Text (Optional)</Label>
                <Input
                  id="button_text"
                  placeholder="e.g., Shop Now"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_url">Button URL (Optional)</Label>
                <Input
                  id="button_url"
                  placeholder="https://yourstore.com/shop"
                  value={formData.button_url}
                  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_approved}
                  onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Approved by Meta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!formData.name || !formData.template_name || !formData.content || createTemplate.isPending || updateTemplate.isPending}
            >
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteTemplate.mutate(deleteConfirmId);
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
