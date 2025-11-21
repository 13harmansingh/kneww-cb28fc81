import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Database, Shield, AlertTriangle, TrendingUp, Globe } from "lucide-react";
import { LoadingScreen } from "@/components/skeletons/LoadingScreen";

interface TelemetryStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimitHits: number;
  authFailures: number;
  avgResponseTime: number;
  topEndpoints: { endpoint: string; count: number }[];
  topCountries: { country: string; count: number }[];
  requestsByHour: { hour: string; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Telemetry() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TelemetryStats | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    if (session?.user?.app_metadata?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchTelemetryData();
  }, [session, authLoading, navigate]);

  const fetchTelemetryData = async () => {
    try {
      setLoading(true);

      // Fetch telemetry logs from last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process stats
      const totalRequests = logs?.length || 0;
      const cacheHits = logs?.filter(l => l.event_type.includes('cache.hit')).length || 0;
      const cacheMisses = logs?.filter(l => l.event_type.includes('cache.miss')).length || 0;
      const rateLimitHits = logs?.filter(l => l.event_type.includes('rate_limit')).length || 0;
      const authFailures = logs?.filter(l => l.event_type.includes('auth.fail')).length || 0;

      // Top endpoints
      const endpointCounts: Record<string, number> = {};
      logs?.forEach(log => {
        if (log.endpoint) {
          endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
        }
      });
      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top countries from metadata
      const countryCounts: Record<string, number> = {};
      logs?.forEach(log => {
        const country = (log.metadata as any)?.country || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      const topCountries = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Requests by hour
      const hourCounts: Record<string, number> = {};
      logs?.forEach(log => {
        const hour = new Date(log.created_at!).getHours();
        const hourStr = `${hour}:00`;
        hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
      });
      const requestsByHour = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      setStats({
        totalRequests,
        cacheHits,
        cacheMisses,
        rateLimitHits,
        authFailures,
        avgResponseTime: 0, // Placeholder
        topEndpoints,
        topCountries,
        requestsByHour,
      });
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen message="Loading telemetry data..." />;
  }

  if (!stats) {
    return <div className="p-8 text-center">No data available</div>;
  }

  const cacheHitRate = stats.cacheHits + stats.cacheMisses > 0 
    ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Telemetry Dashboard</h1>
          <p className="text-muted-foreground">Last 24 hours</p>
        </div>
        <button
          onClick={fetchTelemetryData}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">{stats.totalRequests}</p>
            </div>
            <Activity className="h-10 w-10 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
              <p className="text-3xl font-bold">{cacheHitRate}%</p>
            </div>
            <Database className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rate Limits</p>
              <p className="text-3xl font-bold">{stats.rateLimitHits}</p>
            </div>
            <Shield className="h-10 w-10 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Auth Failures</p>
              <p className="text-3xl font-bold">{stats.authFailures}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache Hits</p>
              <p className="text-3xl font-bold">{stats.cacheHits}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache Misses</p>
              <p className="text-3xl font-bold">{stats.cacheMisses}</p>
            </div>
            <Globe className="h-10 w-10 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList>
          <TabsTrigger value="endpoints">Top Endpoints</TabsTrigger>
          <TabsTrigger value="countries">Top Countries</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Endpoints</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topEndpoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="endpoint" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.topCountries}
                  dataKey="count"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.topCountries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hourly Request Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.requestsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
