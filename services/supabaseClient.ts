
import { createClient } from '@supabase/supabase-js';

// Credentials for project: anisjeqcimstdornnxxv
const supabaseUrl = 'https://anisjeqcimstdornnxxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuaXNqZXFjaW1zdGRvcm5ueHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyMzUsImV4cCI6MjA4MjY3MTIzNX0.u3RP88yiGJSFcofiQ11wC3SYpVl8izK6twsiO1AXM_Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Syncs a single item to a Supabase table.
 * Requires table to have: id (text/PK), payload (jsonb), updated_at (timestamptz)
 */
export const syncItem = async (table: string, id: string | number, data: any) => {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from(table)
      .upsert({ 
        id: String(id), 
        payload: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (error) {
       // Ignore "Table not found" errors in sync
       if (error.code !== '42P01' && error.code !== 'PGRST116') {
         console.debug(`Supabase Sync Status [${table}]:`, error.message);
       }
    }
  } catch (e: any) {
    // Fail silently to allow offline operation
  }
};

/**
 * Fetches all items from a table and extracts the payload.
 * Gracefully handles missing tables or schema errors by returning an empty array.
 */
export const fetchAllFromSupabase = async <T>(table: string): Promise<T[]> => {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('payload');
        
        if (error) {
            // Suppress "Table not found" (42P01) or "PGRST116" (Schema Cache) errors
            // These are expected if the user hasn't created all tables in Supabase yet.
            if (error.code === '42P01' || error.message.includes('schema cache')) {
                console.info(`Supabase Backend: Table "${table}" is not available. Using local persistent storage.`);
            } else {
                console.warn(`Supabase fetch info [${table}]:`, error.message);
            }
            return [];
        }
        return (data || []).map(row => row.payload as T);
    } catch (e: any) {
        // Return empty array on fatal error to allow local storage logic to take over
        return [];
    }
};
