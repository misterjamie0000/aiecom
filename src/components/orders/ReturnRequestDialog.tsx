import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
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

const RETURN_REASONS = [
  { value: 'defective', label: 'Product is defective or damaged' },
  { value: 'wrong_item', label: 'Received wrong item' },
  { value: 'not_as_described', label: 'Product not as described' },
  { value: 'quality_issue', label: 'Quality not satisfactory' },
  { value: 'size_fit', label: 'Size/Fit issue' },
  { value: 'other', label: 'Other reason' },
];

interface ReturnRequestDialogProps {
  orderNumber: string;
  onSubmit: (reason: string, description: string) => Promise<void>;
  disabled?: boolean;
  hasExistingRequest?: boolean;
}

export default function ReturnRequestDialog({ 
  orderNumber, 
  onSubmit,
  disabled = false,
  hasExistingRequest = false
}: ReturnRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const reason = RETURN_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason, description);
      setOpen(false);
      setSelectedReason('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasExistingRequest) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full"
        disabled
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Return Requested
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
          Request Return
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <AlertDialogTitle>Request Return</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Order #{orderNumber}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Please select a reason for return
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {RETURN_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={`return-${reason.value}`} />
                  <Label 
                    htmlFor={`return-${reason.value}`} 
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-description">Additional Details (Optional)</Label>
            <Textarea
              id="return-description"
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
              'Submit Request'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
