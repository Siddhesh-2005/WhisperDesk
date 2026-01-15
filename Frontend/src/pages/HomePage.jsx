import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  const dispatch = useDispatch();

  // Load posts on mount
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const response = await postService.getPosts({ page: 1, limit: 20 });
        
        if (!isMounted) return;
        
        const postsData = response.data?.posts || [];
        setPosts(postsData);

        // Load comments for all posts
        const commentsPromises = postsData.map((post) =>
          commentService
            .getPostComments(post._id, { limit: 10 })
            .then((res) => ({
              postId: post._id,
              comments: res.data?.comments || [],
              count: res.data?.commentCount || 0,
            }))
            .catch(() => ({
              postId: post._id,
              comments: [],
              count: 0,
            }))
        );

        const comments = await Promise.all(commentsPromises);

        if (!isMounted) return;

        const commentsMap = {};
        const countsMap = {};
        comments.forEach(({ postId, comments: c, count }) => {
          commentsMap[postId] = c;
          countsMap[postId] = count;
        });
        setPostComments(commentsMap);
        setCommentsCount(countsMap);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
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

      // Add new post to the beginning of the list
      setPosts([response.data?.post, ...posts]);
      setPostComments(prev => ({ ...prev, [response.data?.post._id]: [] }));
      setCommentsCount(prev => ({ ...prev, [response.data?.post._id]: 0 }));
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post: ' + (error.response?.data?.message || error.message));
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
      const newComment = response.data?.comment;

      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentsCount(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleReport = async (postId) => {
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;

    try {
      // Report API would be called here
      alert('Post reported. Thank you for helping keep the community safe.');
    } catch (error) {
      console.error('Failed to report post:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <Navbar onCreateClick={() => setShowCreateForm(!showCreateForm)} />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {showCreateForm && (
          <CreatePostForm
            onSubmit={handleCreatePost}
            isLoading={isLoadingCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {isLoadingPosts ? (
          <div className="text-center py-12">
            <p className="font-black text-2xl uppercase">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="border-4 border-black bg-white rounded-lg shadow-[8px_8px_0_black] p-6 text-center">
            <p className="font-black text-2xl uppercase mb-3">No posts yet</p>
            <p className="text-gray-600">Be the first to share something bold!</p>
          </div>
        ) : (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
