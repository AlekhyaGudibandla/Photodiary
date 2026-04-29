import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Edit2, Check, Lock, Camera, Image as ImageIcon, Users, Sparkles, X, Bell, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { fileUpload, apiRequest } from '../utils/api';
import EntryCard from '../components/EntryCard';
import AddExistingToCollectionModal from '../components/AddExistingToCollectionModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Toast notification component ──────────────────────────────
const CollabToast = ({ message, isVisible, onDismiss }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] max-w-md w-full mx-4"
      >
        <div className="bg-[#1A1A2E]/95 backdrop-blur-xl border border-primary/20 rounded-2xl px-5 py-4 shadow-2xl shadow-primary/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{message}</p>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Live Update</p>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SharedView = () => {
  const { type, hash } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket() || { socket: null };
  const { user } = useAuth();
  const { openEntryModal, openCamera } = useModal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [uploading, setUploading] = useState(false);
  const [showAddExisting, setShowAddExisting] = useState(false);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 5000);
  }, []);

  const fetchSharedData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/shared/${type}/${hash}`);
      if (!res.ok) {
        throw new Error('This link is invalid, expired, or has been made private.');
      }
      const json = await res.json();
      setData(json);
      setEditTitle(json.title || '');
      setEditContent(type === 'entry' ? json.content || '' : json.description || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, hash]);

  useEffect(() => {
    fetchSharedData();

    if (socket) {
      socket.emit('join_share_room', hash);

      const handleUpdate = (updateData) => {
        if (updateData.type === type) {
          // If full data included, use it directly for instant update
          if (updateData.data) {
            setData(updateData.data);
            setEditTitle(updateData.data.title || '');
            setEditContent(type === 'entry' ? updateData.data.content || '' : updateData.data.description || '');
          } else {
            fetchSharedData();
          }
          showToast('✨ A collaborator just updated this item');
        }
      };

      const handleViewerCount = ({ count }) => {
        setViewerCount(count);
      };

      socket.on('shared_item_updated', handleUpdate);
      socket.on('viewer_count', handleViewerCount);

      return () => {
        socket.emit('leave_share_room', hash);
        socket.off('shared_item_updated', handleUpdate);
        socket.off('viewer_count', handleViewerCount);
      };
    }
  }, [type, hash, socket, fetchSharedData, showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = type === 'entry' 
        ? { title: editTitle, content: editContent }
        : { title: editTitle, description: editContent };

      const res = await fetch(`${API_URL}/shared/${type}/${hash}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save. You might not have edit permissions.');
      
      const updated = await res.json();
      setData(updated);
      setEditing(false);
      showToast('Changes saved successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle opening the full EntryModal for rich editing (authenticated users)
  const handleOpenEditor = () => {
    if (data && type === 'entry') {
      openEntryModal(data, null, hash);
    }
  };

  // Handle adding a photo via camera capture
  const handleCameraCapture = () => {
    openCamera(async (capturedMedia) => {
      setUploading(true);
      try {
        const result = await fileUpload(`/shared/entry/${hash}/upload`, capturedMedia.file);
        // result should be the full updated entry
        if (result) {
          setData(result);
          showToast('📸 Photo added successfully');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to upload photo. Make sure you are logged in.');
      } finally {
        setUploading(false);
      }
    });
  };

  // Handle adding a photo via file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await fileUpload(`/shared/entry/${hash}/upload`, file);
      if (result) {
        setData(result);
        showToast('📸 Photo added successfully');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload photo. Make sure you are logged in.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4">Access Denied</h1>
        <p className="text-gray-400 max-w-md">{error}</p>
        <button onClick={() => navigate('/')} className="mt-8 text-primary hover:underline">
          Go to Homepage
        </button>
      </div>
    );
  }

  const canEdit = data.sharePermission === 'EDIT' || (user && user.id === data.user?.id);
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white p-6 md:p-12 overflow-y-auto">
      {/* Toast Notification */}
      <CollabToast
        message={toast.message}
        isVisible={toast.visible}
        onDismiss={() => setToast({ visible: false, message: '' })}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Lock size={20} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">
                Shared {type}
              </h2>
              <p className="text-xs text-gray-600 font-bold mt-1">
                Shared by {data.user?.email || 'a user'}
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Active Viewers Pill */}
            {viewerCount > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <Users size={14} className="text-green-400" />
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">
                  {viewerCount} viewers
                </span>
              </motion.div>
            )}

            {/* Permission Badge */}
            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
              canEdit 
                ? 'bg-primary/10 text-primary border-primary/20' 
                : 'bg-white/5 text-gray-500 border-white/5'
            }`}>
              {canEdit ? 'Can Edit' : 'View Only'}
            </div>
          </div>
        </div>

        {/* Action Toolbar (authenticated + edit permission) */}
        {canEdit && type === 'entry' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3 flex-wrap"
          >
            {isAuthenticated && (
              <>
                <button
                  onClick={handleOpenEditor}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-primary/20 hover:border-primary/30"
                >
                  <Sparkles size={14} />
                  Open in Editor
                </button>

                <button
                  onClick={handleCameraCapture}
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 disabled:opacity-50"
                >
                  <Camera size={14} />
                  {uploading ? 'Uploading...' : 'Snap Photo'}
                </button>

                <label className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 cursor-pointer">
                  <ImageIcon size={14} />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </>
            )}

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 ml-auto"
              >
                <Edit2 size={14} />
                Quick Edit
              </button>
            )}

            {editing && (
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save</>}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Collection edit toolbar */}
        {canEdit && type === 'collection' && !editing && (
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <Edit2 size={16} /> Edit
            </button>
          </div>
        )}
        {canEdit && type === 'collection' && editing && (
          <div className="mb-8 flex justify-end gap-3">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-black rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save</>}
            </button>
          </div>
        )}

        {/* Entry Content */}
        {type === 'entry' && (
          <>
            {editing ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-12 border border-white/5 space-y-6"
              >
                <input 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-transparent border-none text-4xl md:text-5xl font-heading font-black text-white focus:outline-none"
                  placeholder="Title..."
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full bg-transparent border-none text-lg text-gray-300 focus:outline-none min-h-[300px] resize-y"
                  placeholder="Content..."
                />
              </motion.div>
            ) : (
              <EntryCard
                entry={data}
                readOnly={!canEdit}
                onUpdate={() => {
                  fetchSharedData();
                }}
              />
            )}
          </>
        )}

        {/* Collection Content */}
        {type === 'collection' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-12 border border-white/5"
          >
            {editing ? (
              <input 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-transparent border-none text-4xl md:text-5xl font-heading font-black text-white focus:outline-none mb-8"
                placeholder="Title..."
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-8">
                {data.title || 'Untitled'}
              </h1>
            )}

            {editing ? (
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full bg-transparent border-none text-lg text-gray-300 focus:outline-none min-h-[300px] resize-y"
                placeholder="Description..."
              />
            ) : (
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {data.description}
                </p>
              </div>
            )}

            {!editing && (
              <div className="mt-12 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Collection Entries</h3>
                  {canEdit && isAuthenticated && (
                    <button
                      onClick={() => setShowAddExisting(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-primary/20"
                    >
                      <Plus size={14} />
                      Add Your Entries
                    </button>
                  )}
                </div>
                {data.entries?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {data.entries.map(entry => (
                      <EntryCard 
                        key={entry.id} 
                        entry={entry}
                        readOnly={true}
                        onUpdate={() => {
                          fetchSharedData();
                        }} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No entries in this collection yet.</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Media Gallery (for entries with media) */}
        {type === 'entry' && data.media?.length > 0 && !editing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">
              Attached Media ({data.media.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.media.map((m, idx) => (
                <motion.div
                  key={m.id || idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-white/5"
                >
                  <img src={m.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Existing Entries Modal for shared collections */}
      {showAddExisting && type === 'collection' && data && (
        <AddExistingToCollectionModal
          isOpen={showAddExisting}
          onClose={() => setShowAddExisting(false)}
          collectionId={data.id}
          sharedHash={hash}
          onAdded={() => fetchSharedData()}
        />
      )}
    </div>
  );
};

export default SharedView;
