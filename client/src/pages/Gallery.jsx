import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { imageService } from '../services/api';
import { MdSearch, MdOpenInNew, MdContentCopy } from 'react-icons/md';

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
      <Toast 
        type={message.type} 
        message={message.text} 
        onClose={() => setMessage({ type: '', text: '' })}
      />
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="gradient-text text-4xl font-black leading-tight tracking-[-0.033em]">
            Image Gallery
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-2xl" />
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-card h-11 placeholder:text-text-secondary p-3 text-base font-normal leading-normal pl-11"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">
            Loading images...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {searchQuery ? 'No images found matching your search' : 'No images uploaded yet'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl bg-card border border-purple-neon/30 hover:border-primary/50 transition-all neon-glow hover:shadow-neon-pink"
              >
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url("${image.url}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-text-primary text-sm font-medium leading-tight truncate">
                    {image.name || image.original_filename}
                  </p>
                  {image.description && (
                    <p className="text-text-secondary text-xs mt-1 truncate">
                      {image.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/30 hover:bg-primary text-white backdrop-blur-sm transition-all"
                    >
                      <MdOpenInNew className="text-xl" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/30 hover:bg-primary text-white backdrop-blur-sm transition-all"
                    >
                      <MdContentCopy className="text-xl" />
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
