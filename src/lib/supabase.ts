
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Use the provided Supabase credentials
const supabaseUrl = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';

// Create the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user details from our users table
export const getUserDetails = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
  
  return data;
};

// Helper function to get units for a specific class instance
export const getUnitsForClassInstance = async (classInstanceId: number) => {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('class_instance_id', classInstanceId)
    .order('name');
  
  if (error) {
    console.error('Error fetching units:', error);
    throw error;
  }
  
  return data;
};

// Helper function to get resources for a specific unit
export const getResourcesForUnit = async (unitId: number, type: 'assignment' | 'note' | 'past_paper') => {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      user:user_id (
        name, 
        profile_picture_url,
        admission_number
      )
    `)
    .eq('unit_id', unitId)
    .eq('type', type)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`Error fetching ${type}s:`, error);
    throw error;
  }
  
  return data;
};

// Helper function to get marketing content
export const getMarketingContent = async () => {
  const { data, error } = await supabase
    .from('marketing_content')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching marketing content:', error);
    throw error;
  }
  
  return data;
};

// Helper function to get student rankings for a unit
export const getStudentRankingsForUnit = async (unitId: number) => {
  // This would typically involve complex queries that join completions and resources
  // For now, we'll use a simplified approach
  const { data, error } = await supabase
    .from('completions')
    .select(`
      user_id,
      user:user_id (
        name,
        admission_number,
        points,
        profile_picture_url
      ),
      resource:resource_id (
        unit_id,
        type,
        created_at
      ),
      completed_at
    `)
    .eq('resource.unit_id', unitId)
    .eq('resource.type', 'assignment');
  
  if (error) {
    console.error('Error fetching rankings:', error);
    throw error;
  }
  
  // Process the data to calculate average completion times
  // This would typically be handled by more complex database queries
  // but for demonstration, we'll process it client-side
  const rankings: Record<string, any> = {};
  
  if (data) {
    data.forEach(completion => {
      const userId = completion.user_id;
      if (completion.resource && completion.resource.created_at) {
        const resourceCreatedAt = new Date(completion.resource.created_at);
        const completedAt = new Date(completion.completed_at);
        const timeDiffMs = completedAt.getTime() - resourceCreatedAt.getTime();
        
        if (!rankings[userId]) {
          rankings[userId] = {
            user: completion.user,
            totalTime: 0,
            count: 0,
            points: 0
          };
        }
        
        rankings[userId].totalTime += timeDiffMs;
        rankings[userId].count += 1;
      }
    });
  }
  
  const result = Object.values(rankings)
    .map((ranking: any) => ({
      id: ranking.user.id,
      name: ranking.user.name,
      admission: ranking.user.admission_number,
      profile_picture_url: ranking.user.profile_picture_url,
      avgTime: ranking.count > 0 ? formatTime(ranking.totalTime / ranking.count) : 'N/A',
      avgTimeMs: ranking.count > 0 ? ranking.totalTime / ranking.count : Infinity,
      completion: Math.min(ranking.count * 10, 100), // Simple calculation
      points: ranking.user.points
    }))
    .sort((a, b) => a.avgTimeMs - b.avgTimeMs)
    .slice(0, 10);
  
  return result;
};

// Helper function to format milliseconds to a readable time format
function formatTime(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0) result += `${seconds}s`;
  
  return result.trim() || '0s';
}
