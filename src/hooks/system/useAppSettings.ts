import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSystemStore } from "@/stores/systemStore";

export function useAppSettings() {
  const { appSettings, updateAppSettings } = useSystemStore();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSettings();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('app-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(setting => {
          settingsMap[setting.key] = setting.value;
        });
        updateAppSettings(settingsMap);
      }
    } catch (error) {
      console.error('Failed to fetch app settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateSetting = async (key: string, value: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get current value for history
      const { data: current } = await supabase
        .from('app_settings')
        .select('value, version')
        .eq('key', key)
        .single();
      
      const { error } = await supabase
        .from('app_settings')
        .update({
          value,
          previous_value: current?.value,
          version: (current?.version || 0) + 1,
          updated_by: session?.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key);
      
      if (error) throw error;
      
      // Emit system event
      await supabase.from('system_events').insert({
        type: 'GLOBAL_SETTING_CHANGED',
        severity: 'info',
        user_id: session?.user?.id,
        data: {
          key,
          old_value: current?.value,
          new_value: value,
        },
      });
      
      return true;
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  };
  
  const maintenanceMode = appSettings.maintenance_mode === true;
  
  return {
    settings: appSettings,
    loading,
    updateSetting,
    maintenanceMode,
  };
}
