
import React from 'react';
import { Resource, User } from '@/lib/types';
import ResourceCard from './ResourceCard';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ResourceGridProps {
  resources: Resource[];
  creators: Record<string, User>;
  completedResourceIds?: number[];
  onCompleteResource?: (resourceId: number) => void;
  onDeleteResource?: (resourceId: number) => void;
  onEditResource?: (resource: Resource) => void;
  emptyMessage?: string;
}

export function ResourceGrid({
  resources,
  creators,
  completedResourceIds = [],
  onCompleteResource,
  onDeleteResource,
  onEditResource,
  emptyMessage = "No resources found."
}: ResourceGridProps) {
  if (!resources.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="fading-in text-center p-6 rounded-lg bg-muted/30">
          <p className="text-muted-foreground">{emptyMessage}</p>
          <div className="mt-4 floating">
            <svg className="h-16 w-16 mx-auto text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 14A4.5 4.5 0 0 1 3.5 9.5V4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5.5A4.5 4.5 0 0 1 8 14Z" />
              <path d="M16 14a4.5 4.5 0 0 1-4.5-4.5V4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5.5A4.5 4.5 0 0 1 16 14Z" />
              <path d="M8 14v2a5 5 0 0 0 10 0v-2" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const handleComplete = (resourceId: number) => {
    if (onCompleteResource) {
      onCompleteResource(resourceId);
    } else {
      toast.success('Resource marked as complete!');
    }
  };
  
  // Enhanced delete functionality with direct API access for consistent behavior
  const handleDelete = async (resourceId: number) => {
    if (onDeleteResource) {
      try {
        console.log('Starting delete process for resource ID:', resourceId);
        
        // Using the same direct API approach as successful uploads
        const SUPABASE_URL = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';
        
        // 1. First delete any related completions
        const completionsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/completions?resource_id=eq.${resourceId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (!completionsResponse.ok && completionsResponse.status !== 404) {
          throw new Error(`Failed to delete completions: ${completionsResponse.statusText}`);
        }
        
        // 2. Delete any related comments
        const commentsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/comments?resource_id=eq.${resourceId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (!commentsResponse.ok && commentsResponse.status !== 404) {
          throw new Error(`Failed to delete comments: ${commentsResponse.statusText}`);
        }
        
        // 3. Now delete the resource itself
        const resourceResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/resources?id=eq.${resourceId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (!resourceResponse.ok) {
          throw new Error(`Failed to delete resource: ${resourceResponse.statusText}`);
        }
        
        console.log('Resource and all related data successfully deleted from database');
        
        // Only update the UI state if the database operations succeeded
        onDeleteResource(resourceId);
        
        toast.success('Resource deleted successfully!');
      } catch (error) {
        console.error('Complete error in delete process:', error);
        toast.error(`Error deleting resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      toast.success('Resource deleted successfully!');
    }
  };

  const handleEdit = (resource: Resource) => {
    if (onEditResource) {
      onEditResource(resource);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {resources.map((resource, index) => (
        <div key={resource.id} className={`sliding-in ${index % 2 === 0 ? 'from-left' : 'from-right'}`} style={{animationDelay: `${index * 0.1}s`}}>
          <ResourceCard
            resource={resource}
            user={creators[resource.user_id] || {
              id: 'unknown',
              admission_number: '',
              email: '',
              name: 'Unknown User',
              class_instance_id: 0,
              is_admin: false,
              is_super_admin: false,
              points: 0,
              rank: 0,
              created_at: ''
            }}
            completed={completedResourceIds.includes(resource.id)}
            onComplete={() => handleComplete(resource.id)}
            onDelete={() => handleDelete(resource.id)}
            onEdit={() => handleEdit(resource)}
          />
        </div>
      ))}
    </div>
  );
}

export default ResourceGrid;
