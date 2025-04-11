
import React, { useState } from 'react';
import { format, formatDistance } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageSquare, Download, Check, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Resource, User, Comment } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CommentList } from './CommentList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getCommentsForResource } from '@/lib/supabase';
import { toast } from 'sonner';

interface ResourceCardProps {
  resource: Resource;
  creator: User;
  completed?: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function ResourceCard({ resource, creator, completed = false, onComplete, onDelete, onEdit }: ResourceCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  
  const isOwner = user?.id === creator.id;
  const isAdmin = user?.is_admin || user?.is_super_admin;
  const canManage = isOwner || isAdmin;
  
  const handleLike = () => {
    if (disliked) setDisliked(false);
    setLiked(!liked);
  };

  const handleDislike = () => {
    if (liked) setLiked(false);
    setDisliked(!disliked);
  };

  const handleDownload = () => {
    // Check if the resource has a file URL
    if (!resource.file_url) {
      toast.error('No file available for download');
      return;
    }
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = resource.file_url;
    
    // Extract a filename from the URL
    const filename = resource.file_url.split('/').pop() || `${resource.title.replace(/\s+/g, '_')}.pdf`;
    link.setAttribute('download', filename);
    
    // Append to the document, click programmatically, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Let the user know the download has started
    toast.success('Download started!');
  };

  const handleComplete = () => {
    if (onComplete) onComplete();
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
  };
  
  const handleEdit = () => {
    if (onEdit) onEdit();
  };
  
  const handleOpenComments = async () => {
    try {
      setLoadingComments(true);
      const fetchedComments = await getCommentsForResource(resource.id);
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
      setShowComments(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const isOverdue = resource.type === 'assignment' && resource.deadline && new Date(resource.deadline) < new Date();
  
  const getResourceTypeColor = () => {
    switch (resource.type) {
      case 'assignment': return 'bg-blue-100 text-blue-800';
      case 'note': return 'bg-green-100 text-green-800';
      case 'past_paper': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="resource-card group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge className={cn(getResourceTypeColor(), "mb-2")}>
                {resource.type === 'past_paper' ? 'Past Paper' : resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
              </Badge>
              <h3 className="text-lg font-semibold leading-tight">{resource.title}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={creator.profile_picture_url} />
                  <AvatarFallback className="text-xs">{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{creator.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistance(new Date(resource.created_at), new Date(), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {canManage && (
              <div className="flex space-x-1">
                {isOwner && (
                  <Button variant="ghost" size="icon" onClick={handleEdit} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleDelete} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
          
          {resource.type === 'assignment' && resource.deadline && (
            <div className={cn(
              "text-sm rounded p-2 mb-3", 
              isOverdue ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
            )}>
              <span className="font-medium">
                {isOverdue ? 'Overdue' : 'Due'}:
              </span> {format(new Date(resource.deadline), 'PPpp')}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2 text-sm">
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleLike}>
              <ThumbsUp className={cn("h-4 w-4", liked ? "fill-current text-primary" : "")} />
              <span>{resource.likes + (liked ? 1 : 0)}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleDislike}>
              <ThumbsDown className={cn("h-4 w-4", disliked ? "fill-current text-primary" : "")} />
              <span>{resource.dislikes + (disliked ? 1 : 0)}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleOpenComments}>
              <MessageSquare className="h-4 w-4" />
              <span>{commentCount}</span>
              {loadingComments && (
                <span className="ml-1 animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
              )}
            </Button>
          </div>
          
          <div className="flex space-x-2">
            {resource.type === 'assignment' && !completed && !isOverdue && (
              <Button variant="outline" size="sm" className="gap-1" onClick={handleComplete}>
                <Check className="h-4 w-4" />
                <span>Mark Done</span>
              </Button>
            )}
            
            {resource.type === 'assignment' && completed && (
              <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 border-green-500 text-green-700">
                <Check className="h-3 w-3" />
                <span>Completed</span>
              </Badge>
            )}
            
            {resource.file_url && (
              <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Comments on {resource.title}</DialogTitle>
          </DialogHeader>
          <CommentList comments={comments} resourceId={resource.id} />
        </DialogContent>
      </Dialog>
    </>
  );
}
