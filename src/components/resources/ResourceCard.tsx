
import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Resource, User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Download, ThumbsUp, ThumbsDown, MessageSquare, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Use the common supabase import
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CommentList } from './CommentList';

interface ResourceCardProps {
  resource: Resource;
  user: User;
  completed?: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
}

const ResourceCard: FC<ResourceCardProps> = ({
  resource,
  user,
  completed = false,
  onComplete,
  onDelete,
}) => {
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState(resource.likes || 0);
  const [dislikes, setDislikes] = useState(resource.dislikes || 0);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(completed);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);

  // Check if resource is overdue
  useEffect(() => {
    if (resource.deadline) {
      setIsOverdue(new Date(resource.deadline) < new Date());
    }
  }, [resource.deadline]);

  // Check if user has liked or disliked this resource before
  useEffect(() => {
    if (!currentUser) return;
    
    // Check user interaction from local storage to avoid additional DB queries
    const userInteractions = localStorage.getItem(`resource-interactions-${currentUser.id}`);
    if (userInteractions) {
      try {
        const interactions = JSON.parse(userInteractions);
        setHasLiked(interactions[`liked-${resource.id}`] || false);
        setHasDisliked(interactions[`disliked-${resource.id}`] || false);
      } catch (e) {
        console.error('Error parsing user interactions', e);
      }
    }
  }, [currentUser, resource.id]);

  const fetchComments = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to view comments');
      return;
    }
    
    try {
      console.log('Fetching comments for resource ID:', resource.id);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (
            id,
            name,
            admission_number,
            profile_picture_url
          )
        `)
        .eq('resource_id', resource.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Fetched comments:', data);
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Could not load comments. Please try again.');
    }
  };

  const handleDownload = () => {
    if (!resource.file_url) {
      toast.error('No file available for download');
      return;
    }
    
    // Open the file in a new tab
    window.open(resource.file_url, '_blank');
  };

  const updateUserInteraction = (interaction: 'liked' | 'disliked') => {
    if (!currentUser) return;
    
    try {
      // Store interaction in local storage
      const userInteractions = localStorage.getItem(`resource-interactions-${currentUser.id}`) || '{}';
      const interactions = JSON.parse(userInteractions);
      
      if (interaction === 'liked') {
        interactions[`liked-${resource.id}`] = true;
        interactions[`disliked-${resource.id}`] = false;
      } else {
        interactions[`disliked-${resource.id}`] = true;
        interactions[`liked-${resource.id}`] = false;
      }
      
      localStorage.setItem(`resource-interactions-${currentUser.id}`, JSON.stringify(interactions));
    } catch (e) {
      console.error('Error updating user interactions', e);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to like resources');
      return;
    }

    if (hasLiked) {
      toast.info('You have already liked this resource');
      return;
    }

    if (hasDisliked) {
      toast.error('You cannot like and dislike the same resource');
      return;
    }
    
    try {
      setLoading(true);
      
      // First get the current resource values to ensure we're updating with the latest
      const { data: currentResource, error: fetchError } = await supabase
        .from('resources')
        .select('likes')
        .eq('id', resource.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newLikes = (currentResource?.likes || 0) + 1;
      
      // Update the resource likes count
      const { error } = await supabase
        .from('resources')
        .update({ likes: newLikes })
        .eq('id', resource.id);
      
      if (error) throw error;
      
      // Add points to the creator (5 points per like)
      if (resource.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', resource.user_id)
          .single();
          
        if (userError) {
          console.warn('Could not fetch user points:', userError);
        } else {
          const currentPoints = userData?.points || 0;
          const newPoints = currentPoints + 5;
          
          const { error: pointsError } = await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', resource.user_id);
            
          if (pointsError) {
            console.warn('Could not update creator points:', pointsError);
          } else {
            toast.success('Resource liked! Creator awarded 5 points.');
          }
        }
      }
      
      setLikes(newLikes);
      setHasLiked(true);
      updateUserInteraction('liked');
      
    } catch (error) {
      console.error('Error liking resource:', error);
      toast.error('Failed to like resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to dislike resources');
      return;
    }

    if (hasDisliked) {
      toast.info('You have already disliked this resource');
      return;
    }

    if (hasLiked) {
      toast.error('You cannot like and dislike the same resource');
      return;
    }
    
    try {
      setLoading(true);
      
      // First get the current resource values to ensure we're updating with the latest
      const { data: currentResource, error: fetchError } = await supabase
        .from('resources')
        .select('dislikes')
        .eq('id', resource.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newDislikes = (currentResource?.dislikes || 0) + 1;
      
      // Update the resource dislikes count
      const { error } = await supabase
        .from('resources')
        .update({ dislikes: newDislikes })
        .eq('id', resource.id);
      
      if (error) throw error;
      
      // Subtract points from the creator (2 points per dislike)
      if (resource.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', resource.user_id)
          .single();
          
        if (userError) {
          console.warn('Could not fetch user points:', userError);
        } else {
          const currentPoints = userData?.points || 0;
          const newPoints = Math.max(0, currentPoints - 2); // Ensure points don't go below 0
          
          const { error: pointsError } = await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', resource.user_id);
            
          if (pointsError) {
            console.warn('Could not update creator points:', pointsError);
          } else {
            toast.info('Resource disliked. Creator lost 2 points.');
          }
        }
      }
      
      setDislikes(newDislikes);
      setHasDisliked(true);
      updateUserInteraction('disliked');
      
    } catch (error) {
      console.error('Error disliking resource:', error);
      toast.error('Failed to dislike resource');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!onComplete || !currentUser) {
      toast.error('You must be logged in to complete assignments');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if already completed
      const { data: existingCompletion, error: checkError } = await supabase
        .from('completions')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('resource_id', resource.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingCompletion) {
        toast.info('You have already completed this assignment');
        setIsCompleted(true);
        return;
      }
      
      // Apply points modification based on timeliness
      let pointsChange = isOverdue ? 3 : 10; // 10 points for on-time, 3 for late
      
      // First get the current user points
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('points')
        .eq('id', currentUser.id)
        .single();
      
      if (userError) {
        console.warn('Could not fetch user points:', userError);
      } else {
        const currentPoints = userData?.points || 0;
        const newPoints = currentPoints + pointsChange;
        
        // Update user points
        const { error: pointsError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', currentUser.id);
          
        if (pointsError) {
          console.warn('Could not update points:', pointsError);
        } else {
          // Also update local state in currentUser
          if (currentUser) {
            currentUser.points = newPoints;
          }
          
          if (isOverdue) {
            toast.info(`Assignment marked complete but overdue. +${pointsChange} points.`);
          } else {
            toast.success(`Assignment completed on time! +${pointsChange} points!`);
          }
        }
      }
      
      // Create a completion record
      const { error: completionError } = await supabase
        .from('completions')
        .insert({
          user_id: currentUser.id,
          resource_id: resource.id,
          completed_at: new Date().toISOString()
        });
      
      if (completionError) {
        if (completionError.code === '23505') { // Duplicate key violation
          toast.warning('You have already completed this assignment');
        } else {
          throw completionError;
        }
      } else {
        // Call the onComplete handler
        onComplete();
        setIsCompleted(true);
      }
    } catch (error: any) {
      console.error('Error marking resource as completed:', error);
      toast.error('Failed to mark resource as completed. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = () => {
    if (!currentUser) {
      toast.error('You must be logged in to view and add comments');
      return;
    }
    fetchComments();
    setCommentsOpen(true);
  };

  const handleAddComment = (newComment: any) => {
    setComments([newComment, ...comments]);
  };
  
  const cardClasses = `vibrant-card transform hover:-translate-y-1 h-full flex flex-col ${
    isOverdue && resource.type === 'assignment' && !isCompleted ? 'border-red-300' : ''
  }`;
  
  return (
    <Card className={cardClasses}>
      <CardHeader>
        <div className="flex justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Posted by {user?.name || 'Unknown User'} {resource.created_at && `• ${formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}`}
            </p>
          </div>
          <Badge variant={getVariantForType(resource.type)} className="pulsing">
            {formatResourceType(resource.type)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>
        
        {resource.deadline && (
          <div className="mt-2">
            <p className={`text-xs font-semibold flex items-center ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
              {isOverdue ? 'Overdue' : 'Deadline'}: {new Date(resource.deadline).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {isCompleted && (
          <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200 flex items-center w-fit">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )}
        
        {isOverdue && resource.type === 'assignment' && !isCompleted && (
          <Badge variant="outline" className="mt-2 bg-red-50 text-red-700 border-red-200 flex items-center w-fit">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
        {resource.file_url && (
          <Button size="sm" variant="outline" onClick={handleDownload} className="mobile-friendly-button">
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant={hasLiked ? "default" : "ghost"}
          onClick={handleLike}
          disabled={loading || hasLiked}
          className="mobile-friendly-button"
        >
          <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'mr-1' : 'mr-1'}`} />
          <span>{likes}</span>
        </Button>
        
        <Button 
          size="sm" 
          variant={hasDisliked ? "default" : "ghost"}
          onClick={handleDislike}
          disabled={loading || hasDisliked}
          className="mobile-friendly-button"
        >
          <ThumbsDown className={`h-4 w-4 ${hasDisliked ? 'mr-1' : 'mr-1'}`} />
          <span>{dislikes}</span>
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCommentClick}
          disabled={loading}
          className="mobile-friendly-button"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Comment</span>
        </Button>
        
        {resource.type === 'assignment' && !isCompleted && onComplete && !isOverdue && (
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
        
        {onDelete && currentUser && (currentUser.id === resource.user_id || currentUser.is_admin || currentUser.is_super_admin) && (
          <Button 
            size="sm" 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto"
            onClick={onDelete}
            disabled={loading}
          >
            Delete
          </Button>
        )}
      </CardFooter>

      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Comments on "{resource.title}"
            </DialogTitle>
            <DialogDescription>
              Discuss this resource with your classmates
            </DialogDescription>
          </DialogHeader>
          <CommentList 
            comments={comments} 
            resourceId={resource.id}
            onCommentAdded={handleAddComment}
          />
        </DialogContent>
      </Dialog>
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
