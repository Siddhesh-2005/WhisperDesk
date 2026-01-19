import { useState } from 'react';

function CommentsDropdown({ postId, isOpen, onClose, comments = [], onAddComment, isLoading = false }) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(postId, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        role="presentation"
      />
      <div className="absolute top-12 right-0 w-96 bg-white border-4 border-black rounded-lg shadow-[10px_10px_0_black] z-50 max-h-96 overflow-y-auto">
        <div className="p-4 border-b-4 border-black">
          <h3 className="font-black uppercase text-sm mb-3">Comments ({comments.length})</h3>
          
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 border-3 border-black text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d00]"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="w-full px-3 py-2 bg-[#00b4ff] border-3 border-black font-bold text-xs uppercase rounded-lg shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        <div className="divide-y-2 divide-black">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-600">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-600">
              No comments yet. Be the first!
            </div>
          ) : (
            comments
              .filter((comment) => comment && comment._id)
              .map((comment) => (
                <div key={comment._id} className="p-3">
                  <p className="font-bold text-xs uppercase mb-1">
                    {comment.author?.username || comment.authorId?.username || 'Anon'}
                  </p>
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </>
  );
}

export default CommentsDropdown;
