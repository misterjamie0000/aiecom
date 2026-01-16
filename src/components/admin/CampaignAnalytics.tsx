import { useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailCampaign } from '@/hooks/useMarketing';

interface CampaignAnalyticsProps {
  campaigns: EmailCampaign[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
  // Calculate daily metrics over the last 30 days
  const dailyMetrics = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Find campaigns sent on this day
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

  // Campaign performance comparison
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

  // Status distribution
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

  // Aggregate stats
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

  if (campaigns.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <p className="text-muted-foreground">
            No campaign data available yet. Create and send campaigns to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Emails Sent</p>
            <p className="text-2xl font-bold">{aggregateStats.totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Opens</p>
            <p className="text-2xl font-bold">{aggregateStats.totalOpened.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg Open Rate</p>
            <p className="text-2xl font-bold">{aggregateStats.avgOpenRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg Click Rate</p>
            <p className="text-2xl font-bold">{aggregateStats.avgClickRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Campaign Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emails Sent Over Time</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="sent"
                        name="Sent"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="opened"
                        name="Opened"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicked"
                        name="Clicked"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Open & Click Rates</CardTitle>
                <CardDescription>Percentage over last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="openRate"
                        name="Open Rate"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clickRate"
                        name="Click Rate"
                        stroke="hsl(var(--chart-5))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Performance Comparison</CardTitle>
              <CardDescription>Open and click rates by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {campaignPerformance.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No sent campaigns to compare yet.
                </p>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
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
                      <Bar 
                        dataKey="openRate" 
                        name="Open Rate %" 
                        fill="hsl(var(--chart-2))" 
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar 
                        dataKey="clickRate" 
                        name="Click Rate %" 
                        fill="hsl(var(--chart-3))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Status Distribution</CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Engagement Funnel</CardTitle>
                <CardDescription>From sent to clicked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Sent', value: aggregateStats.totalSent, fill: 'hsl(var(--primary))' },
                        { name: 'Opened', value: aggregateStats.totalOpened, fill: 'hsl(var(--chart-2))' },
                        { name: 'Clicked', value: aggregateStats.totalClicked, fill: 'hsl(var(--chart-3))' },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Emails" radius={[4, 4, 0, 0]}>
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
