import { useEffect, useState } from 'react';
import CommentsDropdown from './CommentsDropdown';

const formatTimeAgo = (date) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return postDate.toLocaleDateString();
};

function Post({
  post,
  isLiked,
  likesCount,
  onToggleLike,
  commentsCount,
  allComments = [],
  onAddComment,
  onReport,
  onCopyLink,
  isLoadingLike,
  onOpenComments,
  isLoadingComments,
  isHighlighted = false,
}) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const displayUsername =
    post?.authorId?.username || post?.author?.username || 'Anonymous';
  const displayBranch =
    post?.authorId?.branch || post?.author?.branch || '';

  const handleCommentClick = () => {
    if (!isCommentsOpen && onOpenComments) {
      onOpenComments(post._id);
    }
    setIsCommentsOpen(!isCommentsOpen);
  };

  const handleCopyLinkClick = async () => {
    const copied = await onCopyLink?.(post._id);

    if (copied) {
      setIsLinkCopied(true);
    }
  };

  useEffect(() => {
    if (!isLinkCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsLinkCopied(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isLinkCopied]);

  return (
    <div
      id={`post-${post._id}`}
      className={`border-4 border-black bg-white rounded-lg shadow-[8px_8px_0_black] p-6 mb-6 transition-all ${
        isHighlighted ? 'ring-4 ring-blue-400 ring-offset-4 ring-offset-[#f4f4f4]' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b-3 border-black">
        <div>
          <p className="font-black uppercase text-sm text-gray-700">{displayUsername}</p>
          {displayBranch && (
            <p className="text-xs text-purple-600 uppercase font-bold">{displayBranch}</p>
          )}
          {post.category && (
            <p className="text-xs text-gray-600 uppercase font-semibold">{post.category}</p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500">
          {formatTimeAgo(post.createdAt)}
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="font-black text-2xl mb-3 uppercase leading-tight">
          {post.title}
        </h2>
      )}

      {/* Image */}
      {post.image?.url && (
        <div className="mb-4 border-4 border-black rounded-lg overflow-hidden shadow-[6px_6px_0_black]">
          <img
            src={post.image.url}
            alt={post.title || 'Post image'}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <p className="text-base leading-relaxed mb-6 text-gray-800">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-3 py-1 bg-gray-200 border-2 border-black text-xs font-bold uppercase rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer - Actions */}
      <div className="flex items-center gap-4 pt-4 border-t-3 border-black">
        <button
          onClick={() => onToggleLike(post._id)}
          disabled={isLoadingLike}
          className={`flex items-center gap-2 px-4 py-2 border-3 border-black font-bold text-sm uppercase rounded-lg shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all disabled:opacity-50 ${
            isLiked
              ? 'bg-red-300 text-black'
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{likesCount}</span>
        </button>

        <div className="relative">
          <button
            onClick={handleCommentClick}
            className="flex items-center gap-2 px-4 py-2 border-3 border-black font-bold text-sm uppercase rounded-lg bg-[#00b4ff] shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{commentsCount}</span>
          </button>

          <CommentsDropdown
            postId={post._id}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
            comments={allComments}
            onAddComment={onAddComment}
            isLoading={isLoadingComments}
          />
        </div>

        <button
          onClick={handleCopyLinkClick}
          className="flex items-center gap-2 px-4 py-2 border-3 border-black font-bold text-sm uppercase rounded-lg bg-emerald-300 shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all"
          title="Copy post link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 1 0-7.07l1.41-1.41a5 5 0 0 1 7.07 7.07L17 13" />
            <path d="M14 11a5 5 0 0 1 0 7.07l-1.41 1.41a5 5 0 0 1-7.07-7.07L7 11" />
          </svg>
          <span>{isLinkCopied ? 'Copied!' : 'Copy link'}</span>
        </button>

        <button
          onClick={() => onReport(post._id)}
          className="flex items-center gap-2 px-4 py-2 border-3 border-black font-bold text-sm uppercase rounded-lg bg-yellow-300 shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all"
          title="Report post"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Post;
