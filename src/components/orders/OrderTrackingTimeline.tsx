import { motion } from 'framer-motion';
import { Check, Clock, Package, Truck, Home, XCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface OrderTrackingTimelineProps {
  status: string;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
}

const normalSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

const statusOrder: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
};

export default function OrderTrackingTimeline({
  status,
  createdAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
}: OrderTrackingTimelineProps) {
  const isCancelled = status === 'cancelled';
  const isReturned = status === 'returned';
  const isRefunded = status === 'refunded';
  const isNegativeStatus = isCancelled || isReturned || isRefunded;

  const currentStepIndex = statusOrder[status] ?? -1;

  const getStepDate = (stepKey: string): string | null => {
    switch (stepKey) {
      case 'pending':
        return createdAt;
      case 'confirmed':
        return currentStepIndex >= 1 ? createdAt : null;
      case 'shipped':
        return shippedAt || null;
      case 'delivered':
        return deliveredAt || null;
      default:
        return null;
    }
  };

  if (isNegativeStatus) {
    const NegativeIcon = isCancelled ? XCircle : isReturned ? RotateCcw : RefreshCw;
    const negativeLabel = isCancelled ? 'Cancelled' : isReturned ? 'Returned' : 'Refunded';
    const negativeColor = isCancelled ? 'text-red-500' : isReturned ? 'text-orange-500' : 'text-gray-500';
    const negativeBg = isCancelled ? 'bg-red-500' : isReturned ? 'bg-orange-500' : 'bg-gray-500';

    return (
      <div className="py-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full ${negativeBg}`}
          >
            <NegativeIcon className="w-6 h-6 text-white" />
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`absolute inset-0 rounded-full ${negativeBg}`}
            />
          </motion.div>
          <div>
            <p className={`font-semibold ${negativeColor}`}>{negativeLabel}</p>
            {cancelledAt && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(cancelledAt), 'PPP')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-muted rounded-full" />
        
        {/* Animated progress line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / (normalSteps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="absolute top-6 left-6 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-full"
          style={{ maxWidth: 'calc(100% - 48px)' }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {normalSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const stepDate = getStepDate(step.key);
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex flex-col items-center"
              >
                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1 + 0.3,
                  }}
                  className="relative"
                >
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    <StepIcon className="w-5 h-5" strokeWidth={isCompleted ? 2.5 : 2} />
                  </div>

                  {/* Current step pulse effect */}
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-emerald-500"
                    />
                  )}

                  {/* Completed checkmark */}
                  {isCompleted && index < currentStepIndex && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.5, type: 'spring' }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.div>

                {/* Step label */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                  className={`
                    mt-3 text-xs font-medium text-center max-w-[80px]
                    ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                  `}
                >
                  {step.label}
                </motion.p>

                {/* Step date */}
                {stepDate && isCompleted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="mt-1 text-[10px] text-muted-foreground text-center"
                  >
                    {format(new Date(stepDate), 'MMM d')}
                  </motion.p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
