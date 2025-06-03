import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Resource, User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Download, ThumbsUp, ThumbsDown, MessageSquare, Check, AlertTriangle, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CommentList } from './CommentList';

interface ResourceCardProps {
  resource: Resource;
  user: User;
  completed?: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const ResourceCard: FC<ResourceCardProps> = ({
  resource,
  user,
  completed = false,
  onComplete,
  onDelete,
  onEdit
}) => {
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(completed);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Fetch current likes/dislikes and comments from database on component mount
  useEffect(() => {
    const fetchResourceData = async () => {
      try {
        const SUPABASE_URL = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';
        
        // Fetch current resource data for likes/dislikes
        const resourceResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/resources?id=eq.${resource.id}&select=likes,dislikes`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (resourceResponse.ok) {
          const resourceData = await resourceResponse.json();
          if (resourceData.length > 0) {
            setLikes(resourceData[0].likes || 0);
            setDislikes(resourceData[0].dislikes || 0);
          }
        }

        // Fetch comment count
        const commentResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/comments?resource_id=eq.${resource.id}&select=id`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (commentResponse.ok) {
          const commentData = await commentResponse.json();
          setCommentCount(commentData.length);
        }
      } catch (error) {
        console.error('Error fetching resource data:', error);
        // Fallback to resource props
        setLikes(resource.likes || 0);
        setDislikes(resource.dislikes || 0);
      }
    };

    fetchResourceData();
  }, [resource.id, resource.likes, resource.dislikes]);

  useEffect(() => {
    if (resource.deadline) {
      setIsOverdue(new Date(resource.deadline) < new Date());
    }
  }, [resource.deadline]);

  useEffect(() => {
    if (!currentUser) return;
    
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
      
      const SUPABASE_URL = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?resource_id=eq.${resource.id}&order=created_at.desc&select=*,user:user_id(id,name,admission_number,profile_picture_url)`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched comments:', data);
      setComments(data || []);
      setCommentCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Could not load comments. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!resource.file_url) {
      toast.error('No file available for download');
      return;
    }
    
    try {
      // Handle both blob URLs and regular URLs
      if (resource.file_url.startsWith('blob:')) {
        // For blob URLs, try to open directly
        window.open(resource.file_url, '_blank');
      } else {
        // For regular URLs, fetch and download
        const response = await fetch(resource.file_url);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resource.title || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file. The file may no longer be available.');
    }
  };

  const updateUserInteraction = (interaction: 'liked' | 'disliked') => {
    if (!currentUser) return;
    
    try {
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
      
      const { data: currentResource, error: fetchError } = await supabase
        .from('resources')
        .select('likes')
        .eq('id', resource.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newLikes = (currentResource?.likes || 0) + 1;
      
      const { error } = await supabase
        .from('resources')
        .update({ likes: newLikes })
        .eq('id', resource.id);
      
      if (error) throw error;
      
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
      
      const { data: currentResource, error: fetchError } = await supabase
        .from('resources')
        .select('dislikes')
        .eq('id', resource.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newDislikes = (currentResource?.dislikes || 0) + 1;
      
      const { error } = await supabase
        .from('resources')
        .update({ dislikes: newDislikes })
        .eq('id', resource.id);
      
      if (error) throw error;
      
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
          const newPoints = Math.max(0, currentPoints - 2);
          
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
      
      const SUPABASE_URL = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';
      
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/completions?user_id=eq.${currentUser.id}&resource_id=eq.${resource.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!checkResponse.ok) {
        throw new Error(`Failed to check completion status: ${checkResponse.statusText}`);
      }
      
      const existingCompletions = await checkResponse.json();
      
      if (existingCompletions && existingCompletions.length > 0) {
        toast.info('You have already completed this assignment');
        setIsCompleted(true);
        return;
      }
      
      let pointsChange = isOverdue ? 3 : 10;
      
      const userResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${currentUser.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            points: currentUser.points + pointsChange
          })
        }
      );
      
      if (!userResponse.ok) {
        console.warn('Could not update points, but completion was recorded');
      } else {
        if (currentUser) {
          currentUser.points += pointsChange;
        }
        
        if (isOverdue) {
          toast.info(`Assignment marked complete but overdue. +${pointsChange} points.`);
        } else {
          toast.success(`Assignment completed on time! +${pointsChange} points!`);
        }
      }
      
      const completionResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            resource_id: resource.id,
            completed_at: new Date().toISOString()
          })
        }
      );
      
      if (!completionResponse.ok) {
        const errorData = await completionResponse.json();
        if (errorData.code === '23505') {
          toast.warning('You have already completed this assignment');
          setIsCompleted(true);
          return;
        }
        throw new Error(`Failed to create completion: ${JSON.stringify(errorData)}`);
      }
      
      onComplete();
      setIsCompleted(true);
      
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
    setCommentCount(commentCount + 1);
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
          className="mobile-friendly-button relative"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Comment</span>
          {commentCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {commentCount}
            </span>
          )}
        </Button>
        
        {onEdit && currentUser && (currentUser.id === resource.user_id || currentUser.is_admin || currentUser.is_super_admin) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={loading}
            className="mobile-friendly-button"
          >
            <Edit className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
        
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
