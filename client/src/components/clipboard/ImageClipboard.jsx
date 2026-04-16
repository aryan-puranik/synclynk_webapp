import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiImage, FiCopy, FiUpload, FiDownload, FiTrash2,
  FiX, FiZap, FiShield, FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useClipboard } from '../../hooks/useClipboard';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// ─── component ──────────────────────────────────────────────────────────────

const ImageClipboard = () => {
  const {
    clipboard,
    updateClipboard,
    permissionGranted,
    requestPermission,
  } = useClipboard();

  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [syncedId, setSyncedId] = useState(null); // id of last successfully synced image
  const fileInputRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  /** Push an image to the local list and immediately sync it over the socket */
  const addAndSync = useCallback(
    (dataUrl, meta = {}) => {
      const newImage = {
        id: Date.now() + Math.random(),
        data: dataUrl,
        timestamp: Date.now(),
        ...meta,
      };

      setImages((prev) =>
        [newImage, ...prev.filter((img) => img.data !== dataUrl)].slice(0, 20)
      );

      // Auto-send over websocket immediately — zero extra clicks
      updateClipboard('image', dataUrl, {
        size: meta.size,
        mimeType: meta.mimeType,
      }).then((ok) => {
        if (ok) setSyncedId(newImage.id);
      });

      return newImage;
    },
    [updateClipboard]
  );

  // ── receive images from other device via socket ───────────────────────────

  useEffect(() => {
    if (clipboard?.type !== 'image') return;

    const dataUrl = clipboard.fullContent || clipboard.content;
    if (!dataUrl) return;

    setImages((prev) => {
      // Deduplicate by raw data
      if (prev.some((img) => img.data === dataUrl)) return prev;
      const incoming = {
        id: clipboard.id || Date.now(),
        data: dataUrl,
        timestamp: clipboard.timestamp || Date.now(),
        size: clipboard.size,
        name: 'received-image',
      };
      return [incoming, ...prev].slice(0, 20);
    });
  }, [clipboard]);

  // ── file upload ───────────────────────────────────────────────────────────

  const handleImageUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          addAndSync(event.target.result, {
            size: file.size,
            mimeType: file.type,
            name: file.name,
          });
          // toast.success('Image synced to mobile 🔄');
        };
        reader.readAsDataURL(file);
      });
      // Reset so the same file can be re-uploaded
      e.target.value = '';
    },
    [addAndSync]
  );

  // ── paste from system clipboard ───────────────────────────────────────────

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      let found = false;

      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          found = true;
          const blob = await item.getType(imageType);
          const dataUrl = await blobToDataUrl(blob);
          addAndSync(dataUrl, { size: blob.size, mimeType: imageType, name: 'pasted-image' });
          // toast.success('Image pasted and synced to mobile 🔄');
          break;
        }
      }

      if (!found) {
        toast.error('No image found in clipboard');
      }
    } catch {
      toast.error('Failed to paste — please upload manually');
    }
  }, [addAndSync]);

  // ── keyboard paste listener (Ctrl/Cmd + V) ────────────────────────────────

  useEffect(() => {
    const onKeyDown = async (e) => {
      const isCtrlV = (e.ctrlKey || e.metaKey) && e.key === 'v';
      if (!isCtrlV) return;

      // Avoid intercepting paste in regular text inputs
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            e.preventDefault();
            const blob = await item.getType(imageType);
            const dataUrl = await blobToDataUrl(blob);
            addAndSync(dataUrl, { size: blob.size, mimeType: imageType, name: 'pasted-image' });
            // toast.success('Image pasted and synced to mobile 🔄');
            break;
          }
        }
      } catch {
        // Silently ignore — user may have pasted text
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addAndSync]);

  // ── manual re-sync ────────────────────────────────────────────────────────

  const handleManualSync = useCallback(
    async (image) => {
      const ok = await updateClipboard('image', image.data, {
        size: image.size,
        mimeType: image.mimeType,
      });
      if (ok) {
        setSyncedId(image.id);
        // toast.success('Image re-synced to mobile');
        setTimeout(() => setSyncedId(null), 2000);
      }
    },
    [updateClipboard]
  );

  // ── delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    // toast.success('Image removed');
  }, []);

  // ── download ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback((image) => {
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name || `clipboard-image-${Date.now()}.png`;
    link.click();
    // toast.success('Downloaded');
  }, []);

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <FiUpload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button
            onClick={handlePaste}
            className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2"
          >
            <FiCopy className="w-4 h-4" />
            <span>Paste Image</span>
          </button>
        </div>

        {/* Permission / Sync status */}
        {!permissionGranted ? (
          <button
            onClick={requestPermission}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
          >
            <FiShield className="w-4 h-4" />
            <span className="text-sm font-medium">Enable Auto-Sync</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
            <FiZap className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-Sync Active</span>
          </div>
        )}
      </div>

      {/* ── Live status pill ── */}
      <div className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
        <FiZap className="w-3.5 h-3.5" />
        Images sync instantly on paste or upload
      </div>

      {/* ── Hint: Ctrl+V anywhere ── */}
      {permissionGranted && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          💡 Copy an image anywhere, then press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘V</kbd> to auto-sync it.
        </p>
      )}

      {/* ── Image grid or empty state ── */}
      {images.length === 0 ? (
        <div
          className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No images yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Upload, paste, or copy an image — it syncs to mobile instantly
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.data}
                alt="Clipboard"
                className="w-full h-40 object-cover"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleManualSync(image); }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    title="Re-sync to mobile"
                  >
                    {syncedId === image.id
                      ? <FiCheck className="w-4 h-4" />
                      : <FiCopy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    title="Download"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* "Synced" badge on the most recent image */}
              {image.id === images[0]?.id && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                  <FiZap className="w-2 h-2" />
                  <span>Synced</span>
                </div>
              )}

              {/* Size badge */}
              {image.size && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                  {formatFileSize(image.size)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Full-screen preview modal ── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
            >
              <FiX className="w-5 h-5" />
            </button>

            <img
              src={selectedImage.data}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              <button
                onClick={() => handleManualSync(selectedImage)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <FiCopy className="w-4 h-4" />
                <span>Re-sync to Mobile</span>
              </button>

              <button
                onClick={() => handleDownload(selectedImage)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <FiDownload className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tips ── */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          ✨ Images sync to your mobile device the moment you upload or paste them — no extra button needed.
        </p>
      </div>
    </div>
  );
};

export default ImageClipboard;