import { format } from 'date-fns';
import { RotateCcw, RefreshCw, Clock, CheckCircle, XCircle, Loader2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface RequestStatusCardProps {
  request: {
    id: string;
    request_type: string;
    reason: string;
    description?: string | null;
    status: string;
    refund_amount?: number | null;
    refund_status?: string | null;
    admin_notes?: string | null;
    created_at: string;
    updated_at: string;
  };
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10 border-yellow-500/20' },
  approved: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10 border-green-500/20' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10 border-red-500/20' },
  processing: { icon: Loader2, color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  completed: { icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-500/10 border-gray-500/20' },
};

const refundStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processed: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function RequestStatusCard({ request }: RequestStatusCardProps) {
  const isReplace = request.request_type === 'replace';
  const config = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card className={`border ${config.bgColor}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isReplace ? (
              <RefreshCw className="w-4 h-4 text-primary" />
            ) : (
              <RotateCcw className="w-4 h-4 text-primary" />
            )}
            <span className="font-medium text-sm">
              {isReplace ? 'Replace' : 'Return'} Request
            </span>
          </div>
          <Badge className={config.bgColor} variant="outline">
            <StatusIcon className={`w-3 h-3 mr-1 ${config.color} ${request.status === 'processing' ? 'animate-spin' : ''}`} />
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>

        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Reason:</span> {request.reason}
          </p>
          {request.description && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Details:</span> {request.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Submitted: {format(new Date(request.created_at), 'PPP')}</span>
          {request.refund_amount && request.request_type === 'return' && (
            <div className="flex items-center gap-2">
              <span>Refund: ₹{request.refund_amount}</span>
              {request.refund_status && (
                <Badge variant="outline" className={refundStatusColors[request.refund_status] || ''}>
                  {request.refund_status}
                </Badge>
              )}
            </div>
          )}
        </div>

        {request.admin_notes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Admin Response:</span> {request.admin_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
