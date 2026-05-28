import { 
  PostKomunikasi, 
  PostComment, 
  CreatePostRequest, 
  CreateCommentRequest, 
  PageResponse,
  ReactionSummary 
} from '@/types/komunikasi';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class KomunikasiApi {
  private async fetchApi(endpoint: string, options?: RequestInit) {
    const url = `${BASE_URL}/komunikasi${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ========== POST OPERATIONS ==========
  
  async getFeedPosts(page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/feed?${params}`);
  }

  async getPopularPosts(page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/popular?${params}`);
  }

  async getTrendingPosts(page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/trending?${params}`);
  }

  async searchPosts(keyword: string, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      keyword,
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/search?${params}`);
  }
  async getPostsByUser(biografiId: number, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/user/${biografiId}?${params}`);
  }

  async getUserPosts(biografiId: number, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    return this.getPostsByUser(biografiId, page, size, currentUserId);
  }

  async getPostById(postId: number, currentUserId?: number): Promise<PostKomunikasi> {
    const params = new URLSearchParams();
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/post/${postId}?${params}`);
  }

  async createPost(request: CreatePostRequest, biografiId: number): Promise<PostKomunikasi> {
    return this.fetchApi(`/post?biografiId=${biografiId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deletePost(postId: number, biografiId: number): Promise<{ message: string }> {
    return this.fetchApi(`/post/${postId}?biografiId=${biografiId}`, {
      method: 'DELETE',
    });
  }

  // ========== REACTION OPERATIONS ==========
  
  async togglePostReaction(postId: number, reactionType: string, biografiId: number): Promise<PostKomunikasi> {
    return this.fetchApi(`/post/${postId}/reaction?reactionType=${reactionType}&biografiId=${biografiId}`, {
      method: 'POST',
    });
  }

  async getPostReactions(postId: number): Promise<ReactionSummary[]> {
    return this.fetchApi(`/post/${postId}/reactions`);
  }

  // ========== COMMENT OPERATIONS ==========
  
  async getPostComments(postId: number, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/post/${postId}/comments?${params}`);
  }

  async getCommentReplies(commentId: number, currentUserId?: number): Promise<PostComment[]> {
    const params = new URLSearchParams();
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return this.fetchApi(`/comment/${commentId}/replies?${params}`);
  }

  async createComment(postId: number, request: CreateCommentRequest, biografiId: number): Promise<PostComment> {
    return this.fetchApi(`/post/${postId}/comment?biografiId=${biografiId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deleteComment(commentId: number, biografiId: number): Promise<{ message: string }> {
    return this.fetchApi(`/comment/${commentId}?biografiId=${biografiId}`, {
      method: 'DELETE',
    });
  }

  async toggleCommentReaction(commentId: number, reactionType: string, biografiId: number): Promise<PostComment> {
    return this.fetchApi(`/comment/${commentId}/reaction?reactionType=${reactionType}&biografiId=${biografiId}`, {
      method: 'POST',
    });
  }  // ========== MEDIA OPERATIONS ==========
  async uploadMedia(file: File): Promise<{ filename: string; url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    // Use the existing fetchApi method but without JSON content-type for file upload
    const url = `${BASE_URL}/komunikasi/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData, let browser handle it
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ========== UTILITY OPERATIONS ==========
  
  async getReactionTypes(): Promise<Record<string, string>> {
    return this.fetchApi('/reactions/types');
  }

  async getStats(): Promise<{
    totalPosts: number;
    activeMembers: number;
    todayPosts: number;
    onlineNow: number;
  }> {
    return this.fetchApi('/stats');
  }

  async getTrendingTopics(): Promise<string[]> {
    return this.fetchApi('/trending-topics');
  }
}

export const komunikasiApi = new KomunikasiApi();
