import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Post from '../components/Post.jsx';
import CreatePostForm from '../components/CreatePostForm.jsx';
import postService from '../services/post.service';
import likeService from '../services/like.service';
import commentService from '../services/comment.service';

function HomePage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [postLikes, setPostLikes] = useState({});
  const [postComments, setPostComments] = useState({});
  const [commentsCount, setCommentsCount] = useState({});
  const [isLoadingComments, setIsLoadingComments] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState(null);

  // Load posts on mount
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        setFetchError(null);
        // Load fewer posts initially (10 instead of 20) for faster rendering
        const response = await postService.getPosts({ page: 1, limit: 10 });
        
        if (!isMounted) return;
        
        console.log('Posts response:', response);
        
        const postsData = response.data?.posts || [];
        console.log('Posts data:', postsData);
        
        setPosts(postsData);
        setCurrentPage(1);
        setTotalPages(response.data?.pagination?.totalPages || 1);

        // Initialize comment maps with post's comment count
        const commentsMap = {};
        const countsMap = {};
        postsData.forEach((post) => {
          commentsMap[post._id] = [];
          countsMap[post._id] = post.commentsCount || 0;
        });
        setPostComments(commentsMap);
        setCommentsCount(countsMap);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        if (isMounted) {
          setFetchError('Failed to load posts. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreatePost = async (formData) => {
    try {
      setIsLoadingCreate(true);
      const response = await postService.createPost({
        title: formData.title,
        content: formData.content,
        category: 'general',
        image: formData.image,
      });

      // Post is submitted for moderation, show success message and close form
      alert('Post submitted for moderation! It will appear once reviewed by AI.');
      setShowCreateForm(false);
      
      // Optionally, you can refetch posts to see if any new ones were published
      // For now, just close the form and let user refresh if needed
    } catch (error) {
      console.error('Failed to create post:', error);
      
      // Handle rejection or moderation failure gracefully
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      const reason = errorData?.data?.reason || errorData?.message || error.message;
      
      if (statusCode === 500 || statusCode === 400 || statusCode === 403) {
        // Post was rejected by moderation
        alert(`⚠️ Post Rejected\n\nYour post could not be published.\n\nReason: ${reason}`);
      } else {
        alert('Failed to create post: ' + reason);
      }
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      setIsLoadingLike(prev => ({ ...prev, [postId]: true }));
      const response = await likeService.toggleLike(postId);

      if (response.data?.liked) {
        setLikedPosts(prev => new Set([...prev, postId]));
        setPostLikes(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1,
        }));
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPostLikes(prev => ({
          ...prev,
          [postId]: Math.max(0, (prev[postId] || 1) - 1),
        }));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLoadingLike(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId, content) => {
    try {
      const response = await commentService.createComment(postId, content);
      // Backend returns the comment directly in response.data (not response.data.comment)
      const newComment = response?.data ?? response;
      
      console.log('New comment response:', response);
      console.log('New comment:', newComment);

      if (newComment && newComment._id) {
        setPostComments(prev => ({
          ...prev,
          // Prepend to keep latest first like server sorting
          [postId]: [newComment, ...(prev[postId] || [])],
        }));
        setCommentsCount(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleOpenComments = async (postId) => {
    if (isLoadingComments[postId]) return;

    const loadedCount = postComments[postId]?.length || 0;
    const expectedCount = commentsCount[postId] || 0;
    const shouldFetch = loadedCount === 0 || loadedCount < expectedCount;

    if (!shouldFetch) return;

    setIsLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await commentService.getPostComments(postId, { page: 1, limit: 50 });
      const payload = response?.data || {};
      const fetchedComments = payload.comments || [];
      const totalFromServer = payload.pagination?.totalComments;

      setPostComments(prev => ({
        ...prev,
        [postId]: fetchedComments,
      }));

      if (typeof totalFromServer === 'number') {
        setCommentsCount(prev => ({ ...prev, [postId]: totalFromServer }));
      } else {
        setCommentsCount(prev => ({ ...prev, [postId]: fetchedComments.length }));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleReport = async (postId) => {
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;

    try {
      alert('Post reported. Thank you for helping keep the community safe.');
    } catch (error) {
      console.error('Failed to report post:', error);
    }
  };

  const handleLoadMore = async () => {
    if (currentPage >= totalPages) return;
    
    try {
      setIsLoadingPosts(true);
      const nextPage = currentPage + 1;
      const response = await postService.getPosts({ page: nextPage, limit: 10 });
      
      const newPosts = response.data?.posts || [];
      setPosts(prev => [...prev, ...newPosts]);
      setCurrentPage(nextPage);

      // Add comment maps for new posts
      const commentsMap = { ...postComments };
      const countsMap = { ...commentsCount };
      newPosts.forEach((post) => {
        commentsMap[post._id] = [];
        countsMap[post._id] = post.commentsCount || 0;
      });
      setPostComments(commentsMap);
      setCommentsCount(countsMap);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <Navbar onCreateClick={() => setShowCreateForm(!showCreateForm)} />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {showCreateForm && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm px-4 py-10"
            onClick={() => setShowCreateForm(false)}
          >
            <div
              className="w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CreatePostForm
                onSubmit={handleCreatePost}
                isLoading={isLoadingCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        )}

        {isLoadingPosts ? (
          <div className="text-center py-12">
            <p className="font-black text-2xl uppercase">Loading posts...</p>
          </div>
        ) : fetchError ? (
          <div className="border-4 border-black bg-red-100 rounded-lg shadow-[8px_8px_0_black] p-6 text-center">
            <p className="font-black text-2xl uppercase mb-3 text-red-600">⚠️ Error</p>
            <p className="text-gray-700 mb-4">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border-4 border-black bg-blue-300 font-black uppercase rounded-lg shadow-[6px_6px_0_black] hover:shadow-[4px_4px_0_black] transition-all"
            >
              Retry
            </button>
          </div>
        ) : posts && posts.length > 0 ? (
          <div>
            {posts.map((post) => (
              <Post
                key={post._id}
                post={post}
                isLiked={likedPosts.has(post._id)}
                likesCount={postLikes[post._id] !== undefined ? postLikes[post._id] : post.likesCount || 0}
                onToggleLike={handleToggleLike}
                commentsCount={commentsCount[post._id] || 0}
                allComments={postComments[post._id] || []}
                onAddComment={handleAddComment}
                onReport={handleReport}
                isLoadingLike={isLoadingLike[post._id]}
                onOpenComments={handleOpenComments}
                isLoadingComments={isLoadingComments[post._id]}
              />
            ))}

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="text-center py-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingPosts}
                  className="px-8 py-3 border-4 border-black bg-blue-300 font-black uppercase rounded-lg shadow-[6px_6px_0_black] hover:shadow-[4px_4px_0_black] disabled:opacity-50 transition-all"
                >
                  {isLoadingPosts ? 'Loading more...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="border-4 border-black bg-white rounded-lg shadow-[8px_8px_0_black] p-6 text-center">
            <p className="font-black text-2xl uppercase mb-3">No posts yet</p>
            <p className="text-gray-600">Be the first to share something bold!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
