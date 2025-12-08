import { useState, useEffect } from "react";
import { useAppSettings } from "@/hooks/system/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Activity, ListTodo, RotateCcw, AlertTriangle, TrendingUp } from "lucide-react";

export default function ControlCenter() {
  const { settings, updateSetting } = useAppSettings();
  const [apiStats, setApiStats] = useState<any>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchAPIStats();
    fetchRecentErrors();
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchAPIStats();
      fetchRecentErrors();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchAPIStats = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Get request counts by endpoint
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('event_type, endpoint, created_at')
        .gte('created_at', fiveMinutesAgo);
      
      if (error) throw error;
      
      // Calculate stats
      const total = data?.length || 0;
      const errors = data?.filter(log => 
        log.event_type.includes('error') || 
        log.event_type.includes('fail')
      ).length || 0;
      
      const endpointCounts: Record<string, number> = {};
      data?.forEach(log => {
        if (log.endpoint) {
          endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
        }
      });
      
      setApiStats({
        totalRequests: total,
        errorCount: errors,
        errorRate: total > 0 ? (errors / total * 100).toFixed(1) : 0,
        topEndpoints: Object.entries(endpointCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5),
        requestsPerSec: (total / 300).toFixed(2),
      });
    } catch (error) {
      console.error('Failed to fetch API stats:', error);
    }
  };
  
  const fetchRecentErrors = async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .or('event_type.ilike.%error%,event_type.ilike.%fail%')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setRecentErrors(data || []);
    } catch (error) {
      console.error('Failed to fetch recent errors:', error);
    }
  };
  
  const handleUpdateSetting = async (key: string, value: any) => {
    setLoading(true);
    const success = await updateSetting(key, value);
    if (success) {
      toast.success('Setting updated');
    } else {
      toast.error('Failed to update setting');
    }
    setLoading(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">KNEW Control Center</h1>
        <p className="text-muted-foreground">
          Global system configuration and monitoring
        </p>
      </div>
      
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            API Health
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <ListTodo className="h-4 w-4 mr-2" />
            Background Jobs
          </TabsTrigger>
        </TabsList>
        
        {/* Global Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure global behavior and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* News Refresh Interval */}
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">News Refresh Interval (ms)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  value={settings.news_refresh_interval || 300000}
                  onChange={(e) => handleUpdateSetting('news_refresh_interval', parseInt(e.target.value))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Current: {((settings.news_refresh_interval || 300000) / 60000).toFixed(1)} minutes
                </p>
              </div>
              
              {/* Feature Toggles */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Analysis</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable AI-powered article analysis
                  </p>
                </div>
                <Switch
                  checked={settings.enable_ai_analysis === true}
                  onCheckedChange={(checked) => handleUpdateSetting('enable_ai_analysis', checked)}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>World Map</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable interactive world map
                  </p>
                </div>
                <Switch
                  checked={settings.enable_world_map === true}
                  onCheckedChange={(checked) => handleUpdateSetting('enable_world_map', checked)}
                  disabled={loading}
                />
              </div>
              
              {/* Global Banner */}
              <div className="space-y-2">
                <Label htmlFor="banner-message">Global Banner Message</Label>
                <Textarea
                  id="banner-message"
                  value={settings.global_banner_message === 'null' ? '' : settings.global_banner_message || ''}
                  onChange={(e) => handleUpdateSetting('global_banner_message', e.target.value || 'null')}
                  placeholder="Leave empty to hide banner"
                  disabled={loading}
                  rows={2}
                />
              </div>
              
              {/* Maintenance Mode */}
              <div className="border border-destructive/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <Label>Maintenance Mode</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enabling this will show a maintenance screen to all users
                </p>
                <Switch
                  checked={settings.maintenance_mode === true}
                  onCheckedChange={(checked) => handleUpdateSetting('maintenance_mode', checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{apiStats?.totalRequests || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 5 minutes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{apiStats?.errorRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">{apiStats?.errorCount || 0} errors</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Requests/Sec</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {apiStats?.requestsPerSec || 0}
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
              <CardDescription>Most requested endpoints in the last 5 minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apiStats?.topEndpoints?.map(([endpoint, count]: [string, number]) => (
                  <div key={endpoint} className="flex items-center justify-between">
                    <span className="text-sm font-mono truncate flex-1">{endpoint}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
                {(!apiStats?.topEndpoints || apiStats.topEndpoints.length === 0) && (
                  <p className="text-sm text-muted-foreground">No recent requests</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Last 10 error events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentErrors.map((error) => (
                  <div key={error.id} className="border-l-2 border-destructive pl-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{error.event_type}</p>
                        <p className="text-xs text-muted-foreground truncate">{error.endpoint}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(error.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {recentErrors.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent errors</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Background Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Background Tasks</CardTitle>
              <CardDescription>
                Monitor and manage background operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Background job monitoring will be available soon. Check the Events page for task logs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
