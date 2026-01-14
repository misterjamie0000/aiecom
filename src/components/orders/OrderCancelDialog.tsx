import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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

const CANCEL_REASONS = [
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'found_better_price', label: 'Found a better price elsewhere' },
  { value: 'ordered_by_mistake', label: 'Ordered by mistake' },
  { value: 'delivery_too_long', label: 'Delivery time is too long' },
  { value: 'other', label: 'Other reason' },
];

interface OrderCancelDialogProps {
  orderNumber: string;
  onCancel: (reason: string) => Promise<void>;
  disabled?: boolean;
}

export default function OrderCancelDialog({ 
  orderNumber, 
  onCancel,
  disabled = false 
}: OrderCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    const reason = selectedReason === 'other' 
      ? otherReason 
      : CANCEL_REASONS.find(r => r.value === selectedReason)?.label || '';
    
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onCancel(reason);
      setOpen(false);
      setSelectedReason('');
      setOtherReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedReason && (selectedReason !== 'other' || otherReason.trim());

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          className="rounded-full"
          disabled={disabled}
        >
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Order #{orderNumber}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Please select a reason for cancellation
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {CANCEL_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label 
                    htmlFor={reason.value} 
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="other-reason">Please specify</Label>
              <Textarea
                id="other-reason"
                placeholder="Enter your reason..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Once cancelled, this action cannot be undone. If you've already paid, a refund will be initiated.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={!isValid || isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
