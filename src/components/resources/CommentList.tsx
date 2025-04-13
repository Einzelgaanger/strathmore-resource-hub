
import { useState } from 'react';
import { Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Trash2, MoreVertical } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CommentListProps {
  comments: Comment[];
  resourceId: number;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentList({ comments, resourceId, onCommentAdded }: CommentListProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setSubmitting(true);
    
    try {
      console.log('Submitting comment to resource:', resourceId);
      console.log('Current user ID:', user.id);
      
      // Use direct REST API for consistent functionality
      const SUPABASE_URL = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';
      
      // Create the comment data using same approach as upload
      const commentData = {
        content: newComment,
        resource_id: resourceId,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      console.log('Comment data to be inserted:', commentData);
      
      // Direct insert through REST API with proper headers
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(commentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log('Comment added via API successfully:', data);
      
      // Fetch the user data for the comment
      const userResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}&select=id,name,admission_number,profile_picture_url`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      let userData = null;
      if (userResponse.ok) {
        const userDataArray = await userResponse.json();
        if (userDataArray.length > 0) {
          userData = userDataArray[0];
        }
      }
      
      // Update user points directly via REST API
      try {
        const pointsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              points: user.points + 1
            })
          }
        );
        
        if (pointsResponse.ok) {
          // Update local user state
          if (user) {
            user.points += 1;
          }
          toast.success('+1 point for commenting!');
        }
      } catch (pointsError) {
        console.warn('Could not update points for comment (non-critical):', pointsError);
      }
      
      // Convert the returned data to match the Comment type
      const commentWithUser: Comment = {
        ...data[0],
        user: userData || {
          id: user.id,
          name: user.name || 'Unknown User',
          admission_number: user.admission_number || '',
          email: user.email || '',
          class_instance_id: user.class_instance_id || 0,
          is_admin: user.is_admin || false,
          is_super_admin: user.is_super_admin || false,
          points: user.points || 0,
          rank: user.rank || 0,
          created_at: '',
          profile_picture_url: user.profile_picture_url
        }
      };
      
      setLocalComments([commentWithUser, ...localComments]);
      onCommentAdded(commentWithUser);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) {
      toast.error('You must be logged in to delete comments');
      return;
    }
    
    try {
      const SUPABASE_URL = 'https://zsddctqjnymmtzxbrkvk.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY';
      
      // Get the comment to check ownership
      const fetchResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}&select=user_id`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch comment: ${fetchResponse.statusText}`);
      }
      
      const commentData = await fetchResponse.json();
      if (commentData.length === 0) {
        throw new Error('Comment not found');
      }
      
      // Check if user is authorized to delete
      if (commentData[0].user_id !== user.id && !user.is_admin && !user.is_super_admin) {
        toast.error('You can only delete your own comments');
        return;
      }
      
      // Delete using direct REST API call to ensure it works
      const deleteResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.text();
        throw new Error(`API error: ${errorData}`);
      }
      
      // Update local state only after successful database deletion
      setLocalComments(localComments.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comments ({localComments.length})</h3>
      
      {user && (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </form>
      )}
      
      <div className="space-y-4">
        {localComments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
        ) : (
          localComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.profile_picture_url || undefined} />
                <AvatarFallback>
                  {comment.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user?.name || 'Unknown User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {user && (comment.user_id === user.id || user.is_admin || user.is_super_admin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
