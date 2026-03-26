import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

export function useReviews(productId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reviews = [], ...query } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get likes and comments counts
      const reviewIds = (data || []).map((r: any) => r.id);
      let likesMap: Record<string, number> = {};
      let commentsMap: Record<string, number> = {};
      let userLikesSet = new Set<string>();

      if (reviewIds.length > 0) {
        const { data: likes } = await supabase
          .from('review_likes' as any)
          .select('review_id, user_id')
          .in('review_id', reviewIds);
        for (const l of (likes || []) as any[]) {
          likesMap[l.review_id] = (likesMap[l.review_id] || 0) + 1;
          if (user && l.user_id === user.id) userLikesSet.add(l.review_id);
        }

        const { data: comments } = await supabase
          .from('review_comments' as any)
          .select('review_id')
          .in('review_id', reviewIds);
        for (const c of (comments || []) as any[]) {
          commentsMap[c.review_id] = (commentsMap[c.review_id] || 0) + 1;
        }
      }

      return (data || []).map((r: any) => ({
        ...r,
        profile: r.profiles,
        likes_count: likesMap[r.id] || 0,
        comments_count: commentsMap[r.id] || 0,
        user_liked: userLikesSet.has(r.id),
      })) as Review[];
    },
    enabled: !!productId,
  });

  const myReview = reviews.find(r => r.user_id === user?.id) || null;

  const submitReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user || !productId) throw new Error('Missing data');
      if (myReview) {
        const { error } = await supabase
          .from('avaliacoes')
          .update({ rating, comment, is_approved: true })
          .eq('id', myReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avaliacoes')
          .insert({ user_id: user.id, product_id: productId, rating, comment, is_approved: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['rating', productId] });
      queryClient.invalidateQueries({ queryKey: ['my-rating', productId] });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async () => {
      if (!myReview) throw new Error('No review');
      const { error } = await supabase.from('avaliacoes').delete().eq('id', myReview.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['rating', productId] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error('Not authenticated');
      const review = reviews.find(r => r.id === reviewId);
      if (review?.user_liked) {
        await supabase.from('review_likes' as any).delete().eq('review_id', reviewId).eq('user_id', user.id);
      } else {
        await supabase.from('review_likes' as any).insert({ review_id: reviewId, user_id: user.id } as any);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', productId] }),
  });

  return { reviews, myReview, submitReview, deleteReview, toggleLike, isLoading: query.isLoading };
}

export function useReviewComments(reviewId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['review-comments', reviewId],
    queryFn: async () => {
      if (!reviewId) return [];
      const { data, error } = await supabase
        .from('review_comments' as any)
        .select('*, profiles:user_id(display_name, avatar_url)')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!reviewId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !reviewId) throw new Error('Missing data');
      const { error } = await supabase
        .from('review_comments' as any)
        .insert({ review_id: reviewId, user_id: user.id, content } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-comments', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('review_comments' as any).delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-comments', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  return { comments, addComment, deleteComment };
}
