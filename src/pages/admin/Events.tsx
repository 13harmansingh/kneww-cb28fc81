import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Filter, AlertTriangle, Info, AlertCircle, XCircle } from "lucide-react";

interface SystemEvent {
  id: string;
  type: string;
  data: any;
  severity: 'info' | 'warn' | 'error' | 'critical';
  user_id?: string;
  created_at: string;
}

export default function Events() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  useEffect(() => {
    fetchEvents();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('events-page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
        },
        (payload) => {
          setEvents(prev => [payload.new as SystemEvent, ...prev].slice(0, 100));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('system_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }
      
      if (filterSeverity !== 'all') {
        query = query.eq('severity', filterSeverity);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setEvents((data as SystemEvent[]) || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, [filterType, filterSeverity]);
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'border-blue-500';
      case 'warn':
        return 'border-yellow-500';
      case 'error':
        return 'border-orange-500';
      case 'critical':
        return 'border-destructive';
      default:
        return 'border-border';
    }
  };
  
  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(e => e.type)));
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">System Events</h1>
        <p className="text-muted-foreground">
          Real-time event timeline and system activity
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Timeline
          </CardTitle>
          <CardDescription>
            Showing last {events.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`border-l-4 ${getSeverityColor(event.severity)} pl-4 py-3 bg-card/50 rounded-r-lg`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{event.type}</p>
                          <Badge variant="outline" className="text-xs">
                            {event.severity}
                          </Badge>
                        </div>
                        {event.data && Object.keys(event.data).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No events found</p>
                  <p className="text-xs mt-1">Events will appear here as they occur</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
