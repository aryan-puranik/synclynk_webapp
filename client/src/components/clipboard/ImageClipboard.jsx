import React, { useState, useRef, useEffect } from 'react';
import { FiImage, FiCopy, FiUpload, FiDownload, FiTrash2, FiX, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usePairing } from '../../hooks/usePairing';

const ImageClipboard = ({ clipboard, onUpdateClipboard, autoSyncEnabled, onAutoSyncToggle }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const { roomId, isConnected } = usePairing();

  useEffect(() => {
    if (clipboard && clipboard.type === 'image') {
      const newImage = {
        id: clipboard.id || Date.now(),
        data: clipboard.fullContent || clipboard.content,
        timestamp: clipboard.timestamp,
        size: clipboard.size
      };
      setImages(prev => [newImage, ...prev.filter(img => img.data !== newImage.data)].slice(0, 20));
    }
  }, [clipboard]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target.result;
          const newImage = {
            id: Date.now(),
            data: imageData,
            timestamp: Date.now(),
            size: file.size,
            name: file.name
          };
          
          setImages(prev => [newImage, ...prev].slice(0, 20));
          
          // Auto-sync if enabled
          if (autoSyncEnabled && roomId && isConnected) {
            onUpdateClipboard('image', imageData);
            toast.success('Image auto-synced to mobile', { icon: '🔄' });
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    });
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        for (const type of imageTypes) {
          const blob = await clipboardItem.getType(type);
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target.result;
            const newImage = {
              id: Date.now(),
              data: imageData,
              timestamp: Date.now(),
              size: blob.size,
              name: 'pasted-image.png'
            };
            
            setImages(prev => [newImage, ...prev].slice(0, 20));
            
            if (autoSyncEnabled && roomId && isConnected) {
              onUpdateClipboard('image', imageData);
              toast.success('Image auto-synced to mobile', { icon: '🔄' });
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    } catch (error) {
      toast.error('Failed to paste image. Please upload manually');
    }
  };

  const handleSyncImage = (imageData) => {
    onUpdateClipboard('image', imageData);
    toast.success('Image synced to mobile');
  };

  const handleDeleteImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    toast.success('Image removed');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="flex space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current.click()}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <FiUpload className="w-5 h-5" />
          <span>Upload Image</span>
        </button>
        
        <button
          onClick={handlePaste}
          className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
        >
          <FiCopy className="w-5 h-5" />
          <span>Paste Image</span>
        </button>
      </div>
      
      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No images yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Upload or paste an image to share with your mobile device
          </p>
          {autoSyncEnabled && (
            <p className="text-xs text-green-500 dark:text-green-400 mt-2">
              Auto-sync is ON • Images will sync automatically
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id || index}
                className="group relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.data}
                  alt={`Clipboard ${index}`}
                  className="w-full h-40 object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSyncImage(image.data);
                      }}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      title="Sync to mobile"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = image.data;
                        link.download = `image-${Date.now()}.png`;
                        link.click();
                        toast.success('Image downloaded');
                      }}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      title="Download"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(index);
                      }}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Auto-Sync Badge */}
                {autoSyncEnabled && index === 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                    <FiZap className="w-2 h-2" />
                    <span>Auto</span>
                  </div>
                )}
                
                {/* Info Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1">
                  {formatFileSize(image.size)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Auto-Sync Status */}
          {autoSyncEnabled && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-center space-x-1">
                <FiZap className="w-3 h-3" />
                <span>Auto-sync active - New images will sync automatically to your mobile device</span>
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            <img
              src={selectedImage.data}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              <button
                onClick={() => handleSyncImage(selectedImage.data)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <FiCopy className="w-4 h-4" />
                <span>Sync to Mobile</span>
              </button>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedImage.data;
                  link.download = `image-${Date.now()}.png`;
                  link.click();
                  toast.success('Image downloaded');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <FiDownload className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          {autoSyncEnabled 
            ? '✨ Auto-sync is ON: Images will automatically sync to your mobile device when uploaded or pasted.'
            : '💡 Tip: Enable auto-sync in the top right corner to automatically share images with your mobile device.'}
        </p>
      </div>
    </div>
  );
};

export default ImageClipboard;