import { Gift, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCustomerLoyalty, useCustomerStats } from '@/hooks/useCustomers';
import { format } from 'date-fns';

interface CustomerLoyaltyTabProps {
  customerId: string;
}

export default function CustomerLoyaltyTab({ customerId }: CustomerLoyaltyTabProps) {
  const { data: loyalty, isLoading: loyaltyLoading } = useCustomerLoyalty(customerId);
  const { data: stats, isLoading: statsLoading } = useCustomerStats(customerId);

  if (loyaltyLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const getTierInfo = () => {
    const totalSpent = stats?.totalSpent || 0;
    if (totalSpent >= 100000) return { name: 'Platinum', color: 'bg-slate-600', nextTier: null, pointsToNext: 0 };
    if (totalSpent >= 50000) return { name: 'Gold', color: 'bg-yellow-500', nextTier: 'Platinum', pointsToNext: 100000 - totalSpent };
    if (totalSpent >= 20000) return { name: 'Silver', color: 'bg-gray-400', nextTier: 'Gold', pointsToNext: 50000 - totalSpent };
    return { name: 'Bronze', color: 'bg-orange-600', nextTier: 'Silver', pointsToNext: 20000 - totalSpent };
  };

  const tier = getTierInfo();
  const earnedPoints = loyalty?.transactions?.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0) || 0;
  const redeemedPoints = Math.abs(loyalty?.transactions?.filter(t => t.points < 0).reduce((sum, t) => sum + t.points, 0) || 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loyalty?.balance || 0}</div>
            <p className="text-xs text-muted-foreground">points available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{earnedPoints}</div>
            <p className="text-xs text-muted-foreground">points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{redeemedPoints}</div>
            <p className="text-xs text-muted-foreground">points used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Tier</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={tier.color}>{tier.name}</Badge>
            {tier.nextTier && (
              <p className="text-xs text-muted-foreground mt-2">
                ₹{tier.pointsToNext.toLocaleString()} to {tier.nextTier}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loyalty?.transactions?.length ? (
            <p className="text-center py-8 text-muted-foreground">No loyalty transactions</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loyalty.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.transaction_type}</Badge>
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.points >= 0 ? '+' : ''}{transaction.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
