import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Post from '../components/Post.jsx';
import CreatePostForm from '../components/CreatePostForm.jsx';
import Toast from '../components/Toast.jsx';
import { useToast } from '../hooks/useToast.js';
import postService from '../services/post.service';
import likeService from '../services/like.service';
import commentService from '../services/comment.service';
import reportService from '../services/report.service';

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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoadingPosts(true);
        setFetchError(null);
        
        const [postsResponse, likesResponse] = await Promise.all([
          postService.getPosts({ page: 1, limit: 5 }), // Optimized limit to 5 for faster initial load
          likeService.getUserLikes({ page: 1, limit: 100 }).catch(() => ({ data: { likes: [] } }))
        ]);
        
        if (!isMounted) return;
        
        const postsData = postsResponse.data?.posts || [];
        const likedPostsData = likesResponse.data?.likes || [];
        
        const likedPostIds = new Set(likedPostsData.map(post => post._id));
        setLikedPosts(likedPostIds);
        
        setPosts(postsData);
        setCurrentPage(1);
        setTotalPages(postsResponse.data?.pagination?.totalPages || 1);

        const likesMap = {};
        const commentsMap = {};
        const countsMap = {};
        postsData.forEach((post) => {
          likesMap[post._id] = post.likesCount || 0;
          commentsMap[post._id] = [];
          countsMap[post._id] = post.commentsCount || 0;
        });
        setPostLikes(likesMap);
        setPostComments(commentsMap);
        setCommentsCount(countsMap);
      } catch (error) {
        if (isMounted) {
          setFetchError('Failed to load posts. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    };

    fetchData();

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

      showToast('Post submitted for moderation! It will appear once reviewed by AI.', 'success');
      setShowCreateForm(false);
    } catch (error) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      const reason = errorData?.data?.reason || errorData?.message || error.message;
      
      if (statusCode === 500 || statusCode === 400 || statusCode === 403) {
        showToast(`⚠️ Post Rejected\n\nYour post could not be published.\n\nReason: ${reason}`, 'error', 6000);
      } else {
        showToast('Failed to create post: ' + reason, 'error');
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
    } finally {
      setIsLoadingLike(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId, content) => {
    try {
      const response = await commentService.createComment(postId, content);
      const newComment = response?.data ?? response;

      if (newComment && newComment._id) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [newComment, ...(prev[postId] || [])],
        }));
        setCommentsCount(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1,
        }));
      }
    } catch (error) {
      showToast('Failed to add comment', 'error');
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
    } finally {
      setIsLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleReport = async (postId) => {
    setReportPostId(postId);
    setShowReportModal(true);
  };

  const submitReport = async (reason) => {
    try {
      await reportService.createReport({
        targetType: 'POST',
        targetId: reportPostId,
        reason: reason
      });
      showToast('Post reported. Thank you for helping keep the community safe.', 'success');
      setShowReportModal(false);
      setReportPostId(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to report post';
      showToast(errorMessage, 'error');
    }
  };

  const handleLoadMore = async () => {
    if (currentPage >= totalPages) return;
    
    try {
      setIsLoadingPosts(true);
      const nextPage = currentPage + 1;
      const response = await postService.getPosts({ page: nextPage, limit: 5 }); // Keep consistent with initial load limit
      
      const newPosts = response.data?.posts || [];
      setPosts(prev => [...prev, ...newPosts]);
      setCurrentPage(nextPage);

      const likesMap = { ...postLikes };
      const commentsMap = { ...postComments };
      const countsMap = { ...commentsCount };
      newPosts.forEach((post) => {
        likesMap[post._id] = post.likesCount || 0;
        commentsMap[post._id] = [];
        countsMap[post._id] = post.commentsCount || 0;
      });
      setPostLikes(likesMap);
      setPostComments(commentsMap);
      setCommentsCount(countsMap);
    } catch (error) {
    } finally {
      setIsLoadingPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <Navbar onCreateClick={() => setShowCreateForm(!showCreateForm)} />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Report Modal */}
        {showReportModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => {
              setShowReportModal(false);
              setReportPostId(null);
            }}
          >
            <div
              className="w-full max-w-md border-4 border-black bg-white rounded-lg shadow-[8px_8px_0_black] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-black text-2xl uppercase mb-4 text-center">
                Report Post
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Select a reason for reporting this post:
              </p>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => submitReport('SPAM')}
                  className="w-full text-left px-4 py-3 border-3 border-black bg-yellow-200 rounded-lg font-bold uppercase text-sm shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Spam or misleading content
                </button>
                
                <button
                  onClick={() => submitReport('ABUSE')}
                  className="w-full text-left px-4 py-3 border-3 border-black bg-red-200 rounded-lg font-bold uppercase text-sm shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Abusive or harmful language
                </button>
                
                <button
                  onClick={() => submitReport('HATE')}
                  className="w-full text-left px-4 py-3 border-3 border-black bg-orange-200 rounded-lg font-bold uppercase text-sm shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Hate speech or discrimination
                </button>
                
                <button
                  onClick={() => submitReport('OTHER')}
                  className="w-full text-left px-4 py-3 border-3 border-black bg-purple-200 rounded-lg font-bold uppercase text-sm shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Other violations
                </button>
              </div>

              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportPostId(null);
                }}
                className="w-full px-4 py-3 border-3 border-black bg-gray-200 rounded-lg font-bold uppercase text-sm shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                  className="px-8 py-3 border-4 border-black bg-blue-300 font-black uppercase rounded-lg shadow-[6px_6px_0_black] hover:shadow-[4px_4px_0_black] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isLoadingPosts ? 'Loading...' : 'Reveal More Whispers'}
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

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default HomePage;
