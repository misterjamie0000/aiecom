import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Revenue', value: '₹0', icon: TrendingUp, change: '+0%' },
    { label: 'Total Orders', value: '0', icon: ShoppingCart, change: '+0%' },
    { label: 'Total Customers', value: '0', icon: Users, change: '+0%' },
    { label: 'Total Products', value: '0', icon: Package, change: '+0%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your store is ready! Start by adding categories and products from the sidebar menu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
