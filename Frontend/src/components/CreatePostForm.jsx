import { useState, useRef } from 'react';

function CreatePostForm({ onSubmit, isLoading, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Content is required');
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      image: imageFile,
    });

    // Reset form
    setTitle('');
    setContent('');
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="border-4 border-black bg-white rounded-lg shadow-[10px_10px_0_black] p-6 mb-6">
      <h2 className="font-black text-2xl uppercase mb-6 border-b-4 border-black pb-4">
        Create New Post
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-bold text-sm uppercase mb-2">
            Title (Required) 
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a bold title..."
            maxLength={100}
            className="w-full px-4 py-3 border-4 border-black rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#ff4d00]"
          />
          <p className="text-xs text-gray-600 mt-1">{title.length}/100</p>
        </div>

        {/* Content */}
        <div>
          <label className="block font-bold text-sm uppercase mb-2">
            Content (Required)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your raw, unfiltered thoughts..."
            rows={6}
            maxLength={2000}
            className="w-full px-4 py-3 border-4 border-black rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#ff4d00] resize-none"
          />
          <p className="text-xs text-gray-600 mt-1">{content.length}/2000</p>
        </div>

        {/* Image */}
        <div>
          <label className="block font-bold text-sm uppercase mb-2">
            Image (Optional)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-black rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="mt-3 px-4 py-2 bg-red-300 border-3 border-black font-bold text-sm uppercase rounded-lg shadow-[4px_4px_0_black]"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <p className="font-black text-lg">📁</p>
                <p className="font-bold text-sm mb-1">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t-4 border-black">
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="flex-1 px-6 py-3 bg-[#ff4d00] text-white border-4 border-black font-black uppercase tracking-wide rounded-lg shadow-[6px_6px_0_black] hover:shadow-[4px_4px_0_black] disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Publishing…' : 'Publish Post'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-300 border-4 border-black font-black uppercase tracking-wide rounded-lg shadow-[6px_6px_0_black] hover:shadow-[4px_4px_0_black] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePostForm;
