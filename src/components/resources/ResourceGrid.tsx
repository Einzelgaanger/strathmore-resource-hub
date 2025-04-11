
import React from 'react';
import { Resource, User } from '@/lib/types';
import ResourceCard from './ResourceCard';
import { toast } from 'sonner';

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
        <p className="text-muted-foreground">{emptyMessage}</p>
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
  
  const handleDelete = (resourceId: number) => {
    if (onDeleteResource) {
      onDeleteResource(resourceId);
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
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
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
      ))}
    </div>
  );
}
