
import { FC, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Resource } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResourceCardProps {
  resource: Resource;
  onMarkCompleted?: (resourceId: number) => Promise<void>;
  isCompleted?: boolean;
  showActions?: boolean;
  showFooter?: boolean;
}

const ResourceCard: FC<ResourceCardProps> = ({
  resource,
  onMarkCompleted,
  isCompleted = false,
  showActions = true,
  showFooter = true,
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(resource.likes || 0);
  const [dislikes, setDislikes] = useState(resource.dislikes || 0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  const handleDownload = () => {
    if (!resource.file_url) {
      toast.error('No file available for download');
      return;
    }
    
    // Open the file in a new tab
    window.open(resource.file_url, '_blank');
  };

  const handleLike = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('resources')
        .update({ likes: likes + 1 })
        .eq('id', resource.id);
      
      if (error) throw error;
      
      setLikes(prev => prev + 1);
    } catch (error) {
      console.error('Error liking resource:', error);
      toast.error('Failed to like resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('resources')
        .update({ dislikes: dislikes + 1 })
        .eq('id', resource.id);
      
      if (error) throw error;
      
      setDislikes(prev => prev + 1);
    } catch (error) {
      console.error('Error disliking resource:', error);
      toast.error('Failed to dislike resource');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!onMarkCompleted) return;
    try {
      setLoading(true);
      await onMarkCompleted(resource.id);
      setCompleted(true);
      toast.success('Resource marked as completed');
    } catch (error) {
      console.error('Error marking resource as completed:', error);
      toast.error('Failed to mark resource as completed');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = resource.deadline ? new Date(resource.deadline) < new Date() : false;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Posted by {resource.user?.name || 'Unknown'} {resource.created_at && `• ${formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}`}
            </p>
          </div>
          <Badge variant={getVariantForType(resource.type)}>
            {formatResourceType(resource.type)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>
        
        {resource.deadline && (
          <div className="mt-2">
            <p className={`text-xs font-semibold ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue ? 'Overdue' : 'Deadline'}: {new Date(resource.deadline).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {completed && (
          <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )}
        
        {isOverdue && resource.type === 'assignment' && !completed && (
          <Badge variant="outline" className="mt-2 bg-red-50 text-red-700 border-red-200">
            Overdue
          </Badge>
        )}
      </CardContent>
      
      {showFooter && (
        <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
          {resource.file_url && (
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
          
          {showActions && (
            <>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleLike}
                disabled={loading}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {likes}
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDislike}
                disabled={loading}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {dislikes}
              </Button>
              
              {resource.type === 'assignment' && !completed && onMarkCompleted && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto"
                  onClick={handleMarkCompleted}
                  disabled={loading}
                >
                  Mark as Done
                </Button>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ResourceCard;

// Helper functions
function getVariantForType(type: string) {
  switch (type) {
    case 'assignment':
      return 'default';
    case 'note':
      return 'secondary';
    case 'past_paper':
      return 'outline';
    default:
      return 'default';
  }
}

function formatResourceType(type: string) {
  switch (type) {
    case 'assignment':
      return 'Assignment';
    case 'note':
      return 'Note';
    case 'past_paper':
      return 'Past Paper';
    default:
      return type;
  }
}
