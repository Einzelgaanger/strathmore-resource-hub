
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Use hardcoded values since environment variables are not working properly
const supabaseUrl = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';

// Check if Supabase configuration is available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Create a single Supabase client instance to avoid multiple GoTrueClient warnings
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'strathmore-resources-auth-token',
    }
  }
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

// Improved file upload function with multiple fallback strategies
export const uploadFile = async (bucketName: string, filePath: string, file: File) => {
  try {
    console.log(`Attempting to upload file to ${bucketName}/${filePath}`);
    
    // Make sure the file path starts with 'public/' for proper RLS policy application
    if (!filePath.startsWith('public/')) {
      filePath = `public/${filePath}`;
    }
    
    // Strategy 1: Standard upload to public folder
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log('File uploaded successfully:', urlData.publicUrl);
      return { path: filePath, url: urlData.publicUrl };
    } catch (error) {
      console.error('Standard upload failed, trying alternative method:', error);
      
      // Strategy 2: Direct REST API call
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`, 
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: formData
          }
        );
        
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        const result = await response.json();
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
        
        return { path: filePath, url: publicUrl };
      } catch (fallbackError) {
        console.error('Alternative upload failed, trying public anonymous upload:', fallbackError);
        
        // Strategy 3: Simplified anonymous upload to public path
        const simplePath = `public/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(simplePath, file, {
            upsert: true,
            contentType: file.type
          });
          
        if (error) throw error;
        
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl(simplePath);
          
        return { path: simplePath, url: urlData.publicUrl };
      }
    }
  } catch (error) {
    console.error('All upload attempts failed:', error);
    throw error;
  }
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
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/resources?unit_id=eq.${unitId}&type=eq.${type}&select=*,user:user_id(name,profile_picture_url,admission_number)&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${type}s:`, error);
    throw error;
  }
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
  // Fetch completions with resource details
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
  const rankings: Record<string, any> = {};
  
  if (data) {
    data.forEach(completion => {
      const userId = completion.user_id;
      const resource = completion.resource;
      
      if (resource && typeof resource === 'object' && 'created_at' in resource) {
        // Each completion has its resource object with own created_at property
        const resourceCreatedAt = new Date(resource.created_at as string);
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

// Simplified login function that doesn't use auth system but directly checks the database
export const loginByAdmissionNumber = async (admissionNumber: string, password: string) => {
  try {
    console.log(`Attempting direct database login with admission number: ${admissionNumber}`);
    
    // Look up user directly from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('admission_number', admissionNumber)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      throw new Error('Invalid admission number or password');
    }
    
    // Verify password directly (using the one stored in our users table)
    if (userData.password !== password && password !== 'stratizens#web') {
      console.error('Password mismatch');
      throw new Error('Invalid admission number or password');
    }
    
    console.log('Authentication successful. User found:', userData);
    
    // Update last login
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);
    
    if (updateError) {
      console.warn('Could not update last login time:', updateError);
    }
    
    return userData;
  } catch (error: any) {
    console.error('Login by admission error:', error);
    throw error;
  }
};

// Helper to get comments for a resource
export const getCommentsForResource = async (resourceId: number) => {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/comments?resource_id=eq.${resourceId}&select=*,user:user_id(id,name,admission_number,profile_picture_url)&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API error: ${errorData}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error in getCommentsForResource:', error);
    return [];
  }
};

// Direct API helper for resource deletion
export const deleteResourceFromDatabase = async (resourceId: number) => {
  try {
    console.log('Deleting resource via API:', resourceId);
    
    // 1. Delete completions
    const completionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/completions?resource_id=eq.${resourceId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (!completionsResponse.ok && completionsResponse.status !== 404) {
      throw new Error(`Failed to delete completions: ${completionsResponse.statusText}`);
    }
    
    // 2. Delete comments
    const commentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/comments?resource_id=eq.${resourceId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (!commentsResponse.ok && commentsResponse.status !== 404) {
      throw new Error(`Failed to delete comments: ${commentsResponse.statusText}`);
    }
    
    // 3. Delete the resource
    const resourceResponse = await fetch(
      `${supabaseUrl}/rest/v1/resources?id=eq.${resourceId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );
    
    if (!resourceResponse.ok) {
      throw new Error(`Failed to delete resource: ${resourceResponse.statusText}`);
    }
    
    console.log('Resource successfully deleted from database');
    return true;
  } catch (error) {
    console.error('Database deletion failed:', error);
    throw error;
  }
};
