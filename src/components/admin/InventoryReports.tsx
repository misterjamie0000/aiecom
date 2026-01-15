import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, RotateCcw, Package, AlertTriangle } from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { StockMovement } from '@/hooks/useInventory';

interface InventoryReportsProps {
  movements: StockMovement[];
  products: any[];
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function InventoryReports({ movements, products, dateRange }: InventoryReportsProps) {
  // Filter movements by date range
  const filteredMovements = useMemo(() => {
    const startDate = subDays(new Date(), dateRange);
    return movements.filter(m => new Date(m.created_at) >= startDate);
  }, [movements, dateRange]);

  // Stock movement trends over time
  const movementTrends = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), dateRange),
      end: new Date()
    });

    return days.map(date => {
      const dayMovements = filteredMovements.filter(m => 
        format(new Date(m.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const additions = dayMovements
        .filter(m => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const removals = dayMovements
        .filter(m => m.quantity < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

      return {
        date: format(date, 'MMM dd'),
        additions,
        removals,
        net: additions - removals,
      };
    });
  }, [filteredMovements, dateRange]);

  // Movement type distribution
  const movementTypeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    filteredMovements.forEach(m => {
      types[m.movement_type] = (types[m.movement_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [filteredMovements]);

  // Product turnover analysis (products with most movement activity)
  const productTurnover = useMemo(() => {
    const turnover: Record<string, { 
      name: string; 
      additions: number; 
      removals: number; 
      movements: number;
      currentStock: number;
    }> = {};
    
    filteredMovements.forEach(m => {
      const productName = m.products?.name || 'Unknown';
      if (!turnover[m.product_id]) {
        const product = products.find(p => p.id === m.product_id);
        turnover[m.product_id] = { 
          name: productName, 
          additions: 0, 
          removals: 0, 
          movements: 0,
          currentStock: product?.stock_quantity || 0
        };
      }
      turnover[m.product_id].movements += 1;
      if (m.quantity > 0) {
        turnover[m.product_id].additions += m.quantity;
      } else {
        turnover[m.product_id].removals += Math.abs(m.quantity);
      }
    });

    return Object.values(turnover)
      .sort((a, b) => b.movements - a.movements)
      .slice(0, 10);
  }, [filteredMovements, products]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalAdditions = filteredMovements
      .filter(m => m.quantity > 0)
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalRemovals = filteredMovements
      .filter(m => m.quantity < 0)
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

    const netChange = totalAdditions - totalRemovals;
    
    const avgDailyMovement = filteredMovements.length / Math.max(dateRange, 1);

    return {
      totalAdditions,
      totalRemovals,
      netChange,
      totalMovements: filteredMovements.length,
      avgDailyMovement: avgDailyMovement.toFixed(1),
    };
  }, [filteredMovements, dateRange]);

  // Low stock products needing attention
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0)
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .slice(0, 5);
  }, [products]);

  // Out of stock products
  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stock_quantity === 0).slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Added</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{summaryMetrics.totalAdditions}</div>
            <p className="text-xs text-muted-foreground">units in last {dateRange} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Removed</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{summaryMetrics.totalRemovals}</div>
            <p className="text-xs text-muted-foreground">units in last {dateRange} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryMetrics.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryMetrics.netChange >= 0 ? '+' : ''}{summaryMetrics.netChange}
            </div>
            <p className="text-xs text-muted-foreground">net units change</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalMovements}</div>
            <p className="text-xs text-muted-foreground">~{summaryMetrics.avgDailyMovement}/day avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Trends</CardTitle>
          <CardDescription>Daily stock additions and removals over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="additions" 
                  name="Stock Added"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="removals" 
                  name="Stock Removed"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Movement Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Movement Type Distribution</CardTitle>
            <CardDescription>Breakdown by movement type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {movementTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={movementTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {movementTypeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No movement data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Net Stock Change Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Net Stock Change</CardTitle>
            <CardDescription>Daily net inventory change</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    name="Net Change"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Turnover Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Product Turnover Analysis</CardTitle>
          <CardDescription>Products with highest movement activity</CardDescription>
        </CardHeader>
        <CardContent>
          {productTurnover.length > 0 ? (
            <>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productTurnover} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="additions" name="Added" fill="#10b981" stackId="a" />
                    <Bar dataKey="removals" name="Removed" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Movements</TableHead>
                    <TableHead className="text-center">Added</TableHead>
                    <TableHead className="text-center">Removed</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productTurnover.map((product, index) => (
                    <TableRow key={product.name}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>#{index + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">{product.movements}</TableCell>
                      <TableCell className="text-center text-green-600">+{product.additions}</TableCell>
                      <TableCell className="text-center text-red-600">-{product.removals}</TableCell>
                      <TableCell className="text-center font-semibold">{product.currentStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No product movement data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Products approaching minimum threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {product.low_stock_threshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No products with low stock
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              Out of Stock
            </CardTitle>
            <CardDescription>Products requiring immediate restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outOfStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categories?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                All products are in stock
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
