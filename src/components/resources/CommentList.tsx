
import { useState } from 'react';
import { Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CommentListProps {
  comments: Comment[];
  resourceId: number;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentList({ comments, resourceId, onCommentAdded }: CommentListProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      
      // Using the addCommentToResource function from supabase.ts
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          resource_id: resourceId,
          user_id: user.id
        })
        .select(`
          *,
          user:user_id (
            id,
            name,
            admission_number,
            profile_picture_url
          )
        `)
        .single();
      
      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }
      
      // Award points for commenting
      try {
        await supabase.rpc('increment_points', { 
          user_id: user.id, 
          amount: 1 
        });
        toast.success('+1 point for commenting!');
      } catch (pointsError) {
        console.warn('Could not update points for comment (non-critical):', pointsError);
      }
      
      console.log('Comment added successfully:', data);
      onCommentAdded(data);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comments ({comments.length})</h3>
      
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
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.profile_picture_url || undefined} />
                <AvatarFallback>
                  {comment.user?.name.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.user?.name || 'Unknown User'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
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
