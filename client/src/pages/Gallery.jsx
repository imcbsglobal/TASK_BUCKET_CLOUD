import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { imageService } from '../services/api';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await imageService.listImages();
      setImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setMessage({ type: 'error', text: 'Failed to load images' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const filteredImages = images.filter((image) => {
    const query = searchQuery.toLowerCase();
    return (
      (image.name && image.name.toLowerCase().includes(query)) ||
      (image.original_filename && image.original_filename.toLowerCase().includes(query)) ||
      (image.description && image.description.toLowerCase().includes(query))
    );
  });

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Image Gallery
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 !text-2xl">
                search
              </span>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-[#1c2127] h-11 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] p-3 text-base font-normal leading-normal pl-11"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading images...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {searchQuery ? 'No images found matching your search' : 'No images uploaded yet'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl bg-white dark:bg-[#1c2127] shadow-sm border border-slate-200 dark:border-slate-800"
              >
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url("${image.url}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-medium leading-tight truncate">
                    {image.name || image.original_filename}
                  </p>
                  {image.description && (
                    <p className="text-white/80 text-xs mt-1 truncate">
                      {image.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined !text-xl">open_in_new</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined !text-xl">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;
