import React, { useState, useEffect } from 'react';
import { formatDistance } from 'date-fns';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase, getCommentsForResource, addCommentToResource } from '@/lib/supabase';

interface CommentListProps {
  comments?: Comment[];
  resourceId: number;
}

export function CommentList({ comments: initialComments, resourceId }: CommentListProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);
  
  useEffect(() => {
    const fetchComments = async () => {
      if (initialComments) {
        setComments(initialComments);
        return;
      }
      
      try {
        setLoading(true);
        const fetchedComments = await getCommentsForResource(resourceId);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [resourceId, initialComments]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      // Add the comment using our helper function
      const newComment = await addCommentToResource(resourceId, user.id, commentText);
      
      // Add the new comment to the list
      setComments([newComment, ...comments]);
      toast.success('Comment added successfully');
      setCommentText('');
      
      // Fetch user points to keep them updated
      const { data: updatedUserData } = await supabase
        .from('users')
        .select('points')
        .eq('id', user.id)
        .single();
      
      if (updatedUserData) {
        // We can't update the user context directly here, 
        // but the points will be updated the next time the user logs in or refreshes
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[350px] overflow-y-auto p-1">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center mb-1 gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.user?.profile_picture_url} />
                  <AvatarFallback className="text-xs">
                    {comment.user?.name.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{comment.user?.name || 'Unknown User'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistance(new Date(comment.created_at), new Date(), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm ml-8">{comment.content}</p>
            </div>
          ))
        )}
      </div>
      
      {user && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.profile_picture_url} />
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="resize-none min-h-[80px]"
              />
              <Button type="submit" size="icon" disabled={isSubmitting || !commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
