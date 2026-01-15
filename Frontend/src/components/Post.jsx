import { useState } from 'react';
import CommentsDropdown from './CommentsDropdown';

const generateRandomUsername = () => {
  const adjectives = ['Silent', 'Quiet', 'Dark', 'Bold', 'Swift', 'Keen', 'Wise', 'Curious'];
  const nouns = ['Writer', 'Thinker', 'Voice', 'Mind', 'Echo', 'Shadow', 'Light', 'Soul'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${Math.floor(Math.random() * 999)}`;
};

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
  isLoadingLike,
}) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [randomUsername] = useState(() => generateRandomUsername());

  const handleCommentClick = () => {
    setIsCommentsOpen(!isCommentsOpen);
  };

  return (
    <div className="border-4 border-black bg-white rounded-lg shadow-[8px_8px_0_black] p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b-3 border-black">
        <div>
          <p className="font-black uppercase text-sm text-gray-700">{randomUsername}</p>
          <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          ID: {post._id?.slice(0, 8)}...
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="font-black text-2xl mb-3 uppercase leading-tight">
          {post.title}
        </h2>
      )}

      {/* Image */}
      {post.image && (
        <div className="mb-4 border-4 border-black rounded-lg overflow-hidden shadow-[6px_6px_0_black]">
          <img
            src={post.image}
            alt={post.title || 'Post image'}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <p className="text-base leading-relaxed mb-6 text-gray-800">
        {post.content}
      </p>

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
          <span>♥</span>
          <span>{likesCount}</span>
        </button>

        <div className="relative">
          <button
            onClick={handleCommentClick}
            className="flex items-center gap-2 px-4 py-2 border-3 border-black font-bold text-sm uppercase rounded-lg bg-[#00b4ff] shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all"
          >
            <span>💬</span>
            <span>{commentsCount}</span>
          </button>

          <CommentsDropdown
            postId={post._id}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
            comments={allComments}
            onAddComment={onAddComment}
          />
        </div>

        <button
          onClick={() => onReport(post._id)}
          className="flex items-center gap-2 px-4 py-2 border-3 border-black font-bold text-sm uppercase rounded-lg bg-yellow-300 shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all"
        >
          <span>🚩</span>
          <span>Report</span>
        </button>
      </div>
    </div>
  );
}

export default Post;
