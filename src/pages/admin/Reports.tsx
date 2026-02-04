import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, Users, ShoppingCart, IndianRupee, Download, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminReports() {
  const [dateRange, setDateRange] = useState('30');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  
  const isLoading = ordersLoading || productsLoading || customersLoading;
  
  // Filter orders by date range
  const filteredOrders = orders?.filter(order => {
    const orderDate = new Date(order.created_at);
    const startDate = subDays(new Date(), parseInt(dateRange));
    return orderDate >= startDate;
  }) || [];
  
  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = filteredOrders.filter(o => o.status === 'delivered').length;
  const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0;
  
  // Revenue by day chart data
  const revenueByDay = eachDayOfInterval({
    start: subDays(new Date(), parseInt(dateRange)),
    end: new Date()
  }).map(date => {
    const dayOrders = filteredOrders.filter(order => 
      format(new Date(order.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      date: format(date, 'MMM dd'),
      fullDate: format(date, 'yyyy-MM-dd'),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      orders: dayOrders.length,
    };
  });
  
  // Orders by status
  const ordersByStatus = [
    { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length },
    { name: 'Confirmed', value: filteredOrders.filter(o => o.status === 'confirmed').length },
    { name: 'Shipped', value: filteredOrders.filter(o => o.status === 'shipped').length },
    { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length },
    { name: 'Cancelled', value: filteredOrders.filter(o => o.status === 'cancelled').length },
    { name: 'Refunded', value: filteredOrders.filter(o => o.status === 'refunded').length },
    { name: 'Returned', value: filteredOrders.filter(o => o.status === 'returned').length },
  ].filter(item => item.value > 0);
  
  // Top products by sales
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredOrders.forEach(order => {
    order.order_items?.forEach((item: any) => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity;
      productSales[item.product_name].revenue += Number(item.total_price || 0);
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Payment method distribution
  const paymentMethods = filteredOrders.reduce((acc: Record<string, number>, order) => {
    const method = order.payment_method || 'Unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});
  const paymentMethodData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));
  
  // Export to PDF
  const exportToPDF = async () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: Last ${dateRange} Days`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, 35, { align: 'center' });
      
      // Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 50);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
        ['Total Orders', totalOrders.toString()],
        ['Avg. Order Value', `₹${averageOrderValue.toFixed(0)}`],
        ['Completion Rate', `${conversionRate.toFixed(1)}%`],
      ];
      
      let yPos = 58;
      summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 14, yPos);
        doc.text(value, 80, yPos);
        yPos += 7;
      });
      
      // Order Status Distribution
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Status Distribution', 14, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Status', 14, yPos);
      doc.text('Count', 80, yPos);
      doc.text('Percentage', 120, yPos);
      
      doc.setFont('helvetica', 'normal');
      ordersByStatus.forEach(status => {
        yPos += 7;
        const percentage = totalOrders > 0 ? ((status.value / totalOrders) * 100).toFixed(1) : '0';
        doc.text(status.name, 14, yPos);
        doc.text(status.value.toString(), 80, yPos);
        doc.text(`${percentage}%`, 120, yPos);
      });
      
      // Top Products
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Products', 14, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('#', 14, yPos);
      doc.text('Product', 25, yPos);
      doc.text('Qty', 130, yPos);
      doc.text('Revenue', 155, yPos);
      
      doc.setFont('helvetica', 'normal');
      topProducts.forEach((product, index) => {
        yPos += 7;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}`, 14, yPos);
        doc.text(product.name.substring(0, 40), 25, yPos);
        doc.text(product.quantity.toString(), 130, yPos);
        doc.text(`₹${product.revenue.toLocaleString()}`, 155, yPos);
      });
      
      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
      }
      
      doc.save(`sales_report_last_${dateRange}_days.pdf`);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setExporting(null);
    }
  };
  
  // Export to Excel (CSV)
  const exportToExcel = async () => {
    setExporting('excel');
    try {
      let csvContent = '';
      
      // Header
      csvContent += `Sales Report - Last ${dateRange} Days\n`;
      csvContent += `Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}\n\n`;
      
      // Summary
      csvContent += 'SUMMARY\n';
      csvContent += `Total Revenue,₹${totalRevenue.toLocaleString()}\n`;
      csvContent += `Total Orders,${totalOrders}\n`;
      csvContent += `Avg. Order Value,₹${averageOrderValue.toFixed(0)}\n`;
      csvContent += `Completion Rate,${conversionRate.toFixed(1)}%\n\n`;
      
      // Daily Revenue
      csvContent += 'DAILY REVENUE\n';
      csvContent += 'Date,Revenue,Orders\n';
      revenueByDay.forEach(day => {
        csvContent += `${day.fullDate},${day.revenue},${day.orders}\n`;
      });
      csvContent += '\n';
      
      // Order Status
      csvContent += 'ORDER STATUS DISTRIBUTION\n';
      csvContent += 'Status,Count,Percentage\n';
      ordersByStatus.forEach(status => {
        const percentage = totalOrders > 0 ? ((status.value / totalOrders) * 100).toFixed(1) : '0';
        csvContent += `${status.name},${status.value},${percentage}%\n`;
      });
      csvContent += '\n';
      
      // Top Products
      csvContent += 'TOP SELLING PRODUCTS\n';
      csvContent += 'Rank,Product,Quantity,Revenue\n';
      topProducts.forEach((product, index) => {
        csvContent += `${index + 1},"${product.name}",${product.quantity},${product.revenue}\n`;
      });
      csvContent += '\n';
      
      // Payment Methods
      csvContent += 'PAYMENT METHODS\n';
      csvContent += 'Method,Count\n';
      paymentMethodData.forEach(method => {
        csvContent += `${method.name},${method.value}\n`;
      });
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sales_report_last_${dateRange}_days.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to generate Excel file');
    } finally {
      setExporting(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analytics and business insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={exportToPDF}
            disabled={exporting !== null}
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            disabled={exporting !== null}
          >
            {exporting === 'excel' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Excel
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">{completedOrders} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Orders delivered</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Daily revenue for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>Distribution of order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {ordersByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethodData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Products by revenue in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No sales data for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((product, index) => (
                      <TableRow key={product.name}>
                        <TableCell>
                          <Badge variant={index < 3 ? 'default' : 'secondary'}>#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">₹{product.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
