import { useState } from 'react';
import { Loader2, RotateCcw, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const REQUEST_REASONS = [
  { value: 'defective', label: 'Product is defective or damaged' },
  { value: 'wrong_item', label: 'Received wrong item' },
  { value: 'not_as_described', label: 'Product not as described' },
  { value: 'quality_issue', label: 'Quality not satisfactory' },
  { value: 'size_fit', label: 'Size/Fit issue' },
  { value: 'other', label: 'Other reason' },
];

interface ReturnReplaceRequestDialogProps {
  orderNumber: string;
  onSubmit: (requestType: 'return' | 'replace', reason: string, description: string) => Promise<void>;
  disabled?: boolean;
  existingRequest?: {
    request_type: string;
    status: string;
  } | null;
}

export default function ReturnReplaceRequestDialog({ 
  orderNumber, 
  onSubmit,
  disabled = false,
  existingRequest = null
}: ReturnReplaceRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<'return' | 'replace'>('return');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const reason = REQUEST_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(requestType, reason, description);
      setOpen(false);
      setSelectedReason('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingRequest) {
    const isReplace = existingRequest.request_type === 'replace';
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full"
        disabled
      >
        {isReplace ? (
          <RefreshCw className="w-4 h-4 mr-2" />
        ) : (
          <RotateCcw className="w-4 h-4 mr-2" />
        )}
        {isReplace ? 'Replace' : 'Return'} Requested
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full"
          disabled={disabled}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Return / Replace
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <AlertDialogTitle>Return or Replace</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Order #{orderNumber}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <Tabs value={requestType} onValueChange={(v) => setRequestType(v as 'return' | 'replace')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="return" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Return
              </TabsTrigger>
              <TabsTrigger value="replace" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Replace
              </TabsTrigger>
            </TabsList>
            <TabsContent value="return" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Get a refund for your order. The amount will be credited to your original payment method.
              </p>
            </TabsContent>
            <TabsContent value="replace" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Receive a replacement for your order. We'll ship a new item once we receive the original.
              </p>
            </TabsContent>
          </Tabs>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              Please select a reason
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {REQUEST_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={`request-${reason.value}`} />
                  <Label 
                    htmlFor={`request-${reason.value}`} 
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-description">Additional Details (Optional)</Label>
            <Textarea
              id="request-description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
              maxLength={1000}
            />
          </div>

          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Our team will review your request and get back to you within 2-3 business days.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit ${requestType === 'replace' ? 'Replace' : 'Return'} Request`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
