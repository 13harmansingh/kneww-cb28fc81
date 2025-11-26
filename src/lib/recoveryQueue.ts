import { useSystemStore, RecoveryTask } from "@/stores/systemStore";
import { errorSink } from "./errorSink";
import { supabase } from "@/integrations/supabase/client";

const MAX_RETRY_DELAY = 32000; // 32 seconds max
const BACKOFF_MULTIPLIER = 2;

class RecoveryQueue {
  private processing = false;
  
  addTask(
    type: RecoveryTask['type'],
    params: any,
    error?: string,
    maxRetries = 6
  ) {
    const task: RecoveryTask = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      params,
      retryCount: 0,
      nextRetryAt: Date.now() + 1000, // First retry after 1s
      maxRetries,
      error,
    };
    
    useSystemStore.getState().addToRecoveryQueue(task);
    
    // Emit system event
    supabase.from('system_events').insert({
      type: 'RECOVERY_TASK_ADDED',
      severity: 'warn',
      data: {
        task_id: task.id,
        task_type: type,
        retry_count: 0,
      },
    });
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  private async processQueue() {
    this.processing = true;
    useSystemStore.getState().setRecovering(true);
    
    while (useSystemStore.getState().recoveryQueue.length > 0) {
      const now = Date.now();
      const queue = useSystemStore.getState().recoveryQueue;
      
      // Find tasks ready to retry
      const readyTasks = queue.filter(task => task.nextRetryAt <= now);
      
      if (readyTasks.length === 0) {
        // Wait for next task
        const nextTask = queue.reduce((earliest, task) =>
          task.nextRetryAt < earliest.nextRetryAt ? task : earliest
        );
        
        const delay = Math.max(0, nextTask.nextRetryAt - now);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 1000)));
        continue;
      }
      
      // Process ready tasks
      for (const task of readyTasks) {
        await this.retryTask(task);
      }
    }
    
    this.processing = false;
    useSystemStore.getState().setRecovering(false);
  }
  
  private async retryTask(task: RecoveryTask) {
    const { removeFromRecoveryQueue, updateRecoveryTask } = useSystemStore.getState();
    
    try {
      console.log(`[RecoveryQueue] Retrying task: ${task.type} (attempt ${task.retryCount + 1}/${task.maxRetries})`);
      
      let success = false;
      
      // Execute the retry based on task type
      switch (task.type) {
        case 'fetch-news':
          success = await this.retryFetchNews(task.params);
          break;
        case 'analyze-news':
          success = await this.retryAnalyzeNews(task.params);
          break;
        case 'api-error':
          success = await this.retryAPICall(task.params);
          break;
        default:
          console.warn(`Unknown task type: ${task.type}`);
          success = false;
      }
      
      if (success) {
        console.log(`[RecoveryQueue] ✅ Task succeeded: ${task.id}`);
        removeFromRecoveryQueue(task.id);
        
        // Emit success event
        supabase.from('system_events').insert({
          type: 'RECOVERY_TASK_SUCCEEDED',
          severity: 'info',
          data: {
            task_id: task.id,
            task_type: task.type,
            retry_count: task.retryCount + 1,
          },
        });
      } else {
        // Increment retry count
        const newRetryCount = task.retryCount + 1;
        
        if (newRetryCount >= task.maxRetries) {
          console.error(`[RecoveryQueue] ❌ Task failed after ${task.maxRetries} attempts: ${task.id}`);
          removeFromRecoveryQueue(task.id);
          
          // Emit failure event
          supabase.from('system_events').insert({
            type: 'BACKGROUND_JOB_FAILED',
            severity: 'error',
            data: {
              task_id: task.id,
              task_type: task.type,
              retry_count: newRetryCount,
              error: task.error,
            },
          });
          
          errorSink.capture(`Recovery task failed: ${task.type}`, {
            severity: 'error',
            metadata: { task },
          });
        } else {
          // Schedule next retry with exponential backoff
          const delay = Math.min(
            1000 * Math.pow(BACKOFF_MULTIPLIER, newRetryCount),
            MAX_RETRY_DELAY
          );
          
          updateRecoveryTask(task.id, {
            retryCount: newRetryCount,
            nextRetryAt: Date.now() + delay,
          });
          
          console.log(`[RecoveryQueue] ⏰ Scheduling retry in ${delay}ms`);
        }
      }
    } catch (error) {
      console.error(`[RecoveryQueue] Error processing task:`, error);
      errorSink.capture(error as Error);
    }
  }
  
  private async retryFetchNews(params: any): Promise<boolean> {
    try {
      // Import dynamically to avoid circular dependencies
      const { fetchNews } = await import('@/api/news');
      const response = await fetchNews(params);
      return response.status === 'success' && !!response.data;
    } catch {
      return false;
    }
  }
  
  private async retryAnalyzeNews(params: any): Promise<boolean> {
    try {
      const { analyzeNews } = await import('@/api/analysis');
      const response = await analyzeNews(params);
      return response.status === 'success' && !!response.data;
    } catch {
      return false;
    }
  }
  
  private async retryAPICall(params: any): Promise<boolean> {
    try {
      const { url, options } = params;
      const response = await fetch(url, options);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const recoveryQueue = new RecoveryQueue();
