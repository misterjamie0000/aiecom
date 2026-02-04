import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const { data: orders } = useOrders();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();

  // Calculate current period (last 30 days) and previous period (31-60 days ago)
  const now = new Date();
  const currentPeriodStart = subDays(now, 30);
  const previousPeriodStart = subDays(now, 60);
  const previousPeriodEnd = subDays(now, 31);

  // Current period orders
  const currentPeriodOrders = orders?.filter(order => 
    new Date(order.created_at) >= currentPeriodStart
  ) || [];
  
  // Previous period orders
  const previousPeriodOrders = orders?.filter(order => {
    const date = new Date(order.created_at);
    return date >= previousPeriodStart && date <= previousPeriodEnd;
  }) || [];

  // Current period customers (created in last 30 days)
  const currentPeriodCustomers = customers?.filter(customer => 
    new Date(customer.created_at) >= currentPeriodStart
  ) || [];
  
  // Previous period customers
  const previousPeriodCustomers = customers?.filter(customer => {
    const date = new Date(customer.created_at);
    return date >= previousPeriodStart && date <= previousPeriodEnd;
  }) || [];

  // Current period products
  const currentPeriodProducts = products?.filter(product => 
    new Date(product.created_at) >= currentPeriodStart
  ) || [];
  
  // Previous period products
  const previousPeriodProducts = products?.filter(product => {
    const date = new Date(product.created_at);
    return date >= previousPeriodStart && date <= previousPeriodEnd;
  }) || [];

  // Calculate totals
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalCustomers = customers?.length || 0;
  const totalProducts = products?.length || 0;

  // Calculate period-specific values
  const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  
  const currentOrderCount = currentPeriodOrders.length;
  const previousOrderCount = previousPeriodOrders.length;
  
  const currentCustomerCount = currentPeriodCustomers.length;
  const previousCustomerCount = previousPeriodCustomers.length;
  
  const currentProductCount = currentPeriodProducts.length;
  const previousProductCount = previousPeriodProducts.length;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): { change: string; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) {
      if (current === 0) return { change: '0%', trend: 'neutral' };
      return { change: '+100%', trend: 'up' };
    }
    const changePercent = ((current - previous) / previous) * 100;
    const formatted = changePercent >= 0 
      ? `+${changePercent.toFixed(1)}%` 
      : `${changePercent.toFixed(1)}%`;
    return { 
      change: formatted, 
      trend: changePercent >= 0 ? 'up' : 'down' 
    };
  };

  const revenueChange = calculateChange(currentRevenue, previousRevenue);
  const ordersChange = calculateChange(currentOrderCount, previousOrderCount);
  const customersChange = calculateChange(currentCustomerCount, previousCustomerCount);
  const productsChange = calculateChange(currentProductCount, previousProductCount);

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `₹${totalRevenue.toLocaleString()}`, 
      icon: IndianRupee, 
      change: revenueChange.change,
      trend: revenueChange.trend
    },
    { 
      label: 'Total Orders', 
      value: totalOrders.toString(), 
      icon: ShoppingCart, 
      change: ordersChange.change,
      trend: ordersChange.trend
    },
    { 
      label: 'Total Customers', 
      value: totalCustomers.toString(), 
      icon: Users, 
      change: customersChange.change,
      trend: customersChange.trend
    },
    { 
      label: 'Total Products', 
      value: totalProducts.toString(), 
      icon: Package, 
      change: productsChange.change,
      trend: productsChange.trend
    },
  ];

  // Last 7 days revenue trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dayStart && orderDate <= dayEnd;
    }) || [];
    
    const revenue = dayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    
    return {
      date: format(date, 'EEE'),
      revenue,
      orders: dayOrders.length,
    };
  });

  // Order status distribution
  const ordersByStatus = orders?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statusData = [
    { status: 'Pending', count: ordersByStatus['pending'] || 0, color: 'hsl(var(--warning))' },
    { status: 'Confirmed', count: ordersByStatus['confirmed'] || 0, color: 'hsl(var(--primary))' },
    { status: 'Shipped', count: ordersByStatus['shipped'] || 0, color: 'hsl(var(--secondary))' },
    { status: 'Delivered', count: ordersByStatus['delivered'] || 0, color: 'hsl(var(--accent))' },
  ];

  // Recent orders
  const recentOrders = orders?.slice(0, 5) || [];

  // Low stock products
  const lowStockProducts = products?.filter(p => p.stock_quantity <= p.low_stock_threshold).slice(0, 5) || [];

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig;

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
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : stat.trend === 'down' ? (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                ) : null}
                <span className={`text-xs ${
                  stat.trend === 'up' ? 'text-green-500' : 
                  stat.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs last 30 days</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Overview (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Order Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="status" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(order.total_amount).toLocaleString()}</p>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                        <img
                          src={(product as any).image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[150px]">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={product.stock_quantity === 0 ? 'destructive' : 'secondary'}>
                      {product.stock_quantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">All products are well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
