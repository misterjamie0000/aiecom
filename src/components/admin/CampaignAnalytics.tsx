import { useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
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
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailCampaign } from '@/hooks/useMarketing';
import { useWhatsAppCampaigns, useWhatsAppStats } from '@/hooks/useWhatsAppMarketing';
import { 
  Mail, 
  MessageCircle, 
  Send, 
  Eye, 
  MousePointer, 
  CheckCircle2,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

interface CampaignAnalyticsProps {
  campaigns: EmailCampaign[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const WA_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
  const { data: whatsappCampaigns } = useWhatsAppCampaigns();
  const { data: whatsappStats } = useWhatsAppStats();

  // Calculate daily metrics over the last 30 days for Email
  const dailyMetrics = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayCampaigns = campaigns.filter(c => {
        if (!c.sent_at) return false;
        const sentDate = new Date(c.sent_at);
        return sentDate >= dayStart && sentDate < dayEnd;
      });

      const sent = dayCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
      const opened = dayCampaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
      const clicked = dayCampaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);

      return {
        date: format(day, 'MMM dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      };
    });
  }, [campaigns]);

  // WhatsApp daily metrics
  const whatsappDailyMetrics = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayCampaigns = (whatsappCampaigns || []).filter(c => {
        if (!c.sent_at) return false;
        const sentDate = new Date(c.sent_at);
        return sentDate >= dayStart && sentDate < dayEnd;
      });

      const sent = dayCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
      const delivered = dayCampaigns.reduce((sum, c) => sum + (c.total_delivered || 0), 0);
      const read = dayCampaigns.reduce((sum, c) => sum + (c.total_read || 0), 0);

      return {
        date: format(day, 'MMM dd'),
        sent,
        delivered,
        read,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
      };
    });
  }, [whatsappCampaigns]);

  // Email campaign performance comparison
  const campaignPerformance = useMemo(() => {
    return campaigns
      .filter(c => c.status === 'sent' && c.total_sent > 0)
      .slice(0, 10)
      .map(c => ({
        name: c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name,
        fullName: c.name,
        sent: c.total_sent,
        opened: c.total_opened,
        clicked: c.total_clicked,
        openRate: Math.round((c.total_opened / c.total_sent) * 100),
        clickRate: c.total_opened > 0 ? Math.round((c.total_clicked / c.total_opened) * 100) : 0,
      }));
  }, [campaigns]);

  // WhatsApp campaign performance comparison
  const whatsappCampaignPerformance = useMemo(() => {
    return (whatsappCampaigns || [])
      .filter(c => c.status === 'sent' && (c.total_sent || 0) > 0)
      .slice(0, 10)
      .map(c => ({
        name: c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name,
        fullName: c.name,
        sent: c.total_sent || 0,
        delivered: c.total_delivered || 0,
        read: c.total_read || 0,
        deliveryRate: c.total_sent ? Math.round(((c.total_delivered || 0) / c.total_sent) * 100) : 0,
        readRate: c.total_delivered ? Math.round(((c.total_read || 0) / c.total_delivered) * 100) : 0,
      }));
  }, [whatsappCampaigns]);

  // Email status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    campaigns.forEach(c => {
      distribution[c.status] = (distribution[c.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [campaigns]);

  // WhatsApp status distribution
  const whatsappStatusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    (whatsappCampaigns || []).forEach(c => {
      distribution[c.status] = (distribution[c.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [whatsappCampaigns]);

  // Email aggregate stats
  const aggregateStats = useMemo(() => {
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
    const totalOpened = sentCampaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
    const totalClicked = sentCampaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);

    return {
      totalCampaigns: campaigns.length,
      sentCampaigns: sentCampaigns.length,
      totalSent,
      totalOpened,
      totalClicked,
      avgOpenRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
      avgClickRate: totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0,
    };
  }, [campaigns]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name.includes('Rate') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Tabs defaultValue="email" className="space-y-4">
      <TabsList>
        <TabsTrigger value="email" className="gap-2">
          <Mail className="w-4 h-4" />
          Email Analytics
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          WhatsApp Analytics
        </TabsTrigger>
      </TabsList>

      {/* Email Analytics Tab */}
      <TabsContent value="email" className="space-y-6">
        {campaigns.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No email campaign data available yet. Create and send campaigns to see analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Email Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregateStats.totalSent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {aggregateStats.sentCampaigns} campaigns
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{aggregateStats.avgOpenRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {aggregateStats.totalOpened.toLocaleString()} opened
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <MousePointer className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{aggregateStats.avgClickRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {aggregateStats.totalClicked.toLocaleString()} clicked
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregateStats.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    {aggregateStats.sentCampaigns} sent
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Email Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Performance (Last 30 Days)</CardTitle>
                  <CardDescription>Sent, opened, and clicked over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyMetrics}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="sent" name="Sent" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="opened" name="Opened" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="clicked" name="Clicked" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                  <CardDescription>Breakdown by campaign status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Email Campaigns */}
            {campaignPerformance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Performing Email Campaigns</CardTitle>
                  <CardDescription>By open and click rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={campaignPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                                  <p className="font-medium mb-2">{data.fullName}</p>
                                  <p>Sent: {data.sent}</p>
                                  <p>Opened: {data.opened} ({data.openRate}%)</p>
                                  <p>Clicked: {data.clicked} ({data.clickRate}%)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="openRate" name="Open Rate %" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="clickRate" name="Click Rate %" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </TabsContent>

      {/* WhatsApp Analytics Tab */}
      <TabsContent value="whatsapp" className="space-y-6">
        {/* WhatsApp Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{whatsappStats?.totalSent?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                {whatsappStats?.sentCampaigns || 0} campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{whatsappStats?.deliveryRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {whatsappStats?.totalDelivered?.toLocaleString() || 0} delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{whatsappStats?.readRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {whatsappStats?.totalRead?.toLocaleString() || 0} read
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{whatsappStats?.totalCampaigns || 0}</div>
              <p className="text-xs text-muted-foreground">
                {whatsappStats?.sentCampaigns || 0} sent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Message Delivery Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message Delivery Funnel</CardTitle>
            <CardDescription>Track message journey from sent to read</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <Send className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{whatsappStats?.totalSent || 0}</div>
                <p className="text-sm text-green-600 dark:text-green-500">Messages Sent</p>
              </div>
              <TrendingUp className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{whatsappStats?.totalDelivered || 0}</div>
                <p className="text-sm text-blue-600 dark:text-blue-500">Delivered ({whatsappStats?.deliveryRate || 0}%)</p>
              </div>
              <TrendingUp className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{whatsappStats?.totalRead || 0}</div>
                <p className="text-sm text-purple-600 dark:text-purple-500">Read ({whatsappStats?.readRate || 0}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WhatsApp Performance (Last 30 Days)</CardTitle>
              <CardDescription>Sent, delivered, and read over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={whatsappDailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="sent" name="Sent" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="read" name="Read" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Distribution</CardTitle>
              <CardDescription>Breakdown by campaign status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {whatsappStatusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={whatsappStatusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {whatsappStatusDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={WA_COLORS[index % WA_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No WhatsApp campaigns yet</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top WhatsApp Campaigns */}
        {whatsappCampaignPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Performing WhatsApp Campaigns</CardTitle>
              <CardDescription>By delivery and read rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={whatsappCampaignPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                              <p className="font-medium mb-2">{data.fullName}</p>
                              <p>Sent: {data.sent}</p>
                              <p>Delivered: {data.delivered} ({data.deliveryRate}%)</p>
                              <p>Read: {data.read} ({data.readRate}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="deliveryRate" name="Delivery Rate %" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="readRate" name="Read Rate %" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}