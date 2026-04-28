import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Globe, Lock, Check, Copy, Shield, ShieldAlert, Edit2, Eye } from 'lucide-react';
import { apiRequest } from '../utils/api';

const ShareModal = ({ isOpen, onClose, type, item, onUpdate }) => {
  const [isPublic, setIsPublic] = useState(item?.isPublic || false);
  const [permission, setPermission] = useState(item?.sharePermission || 'VIEW');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setIsPublic(item.isPublic || false);
      setPermission(item.sharePermission || 'VIEW');
    }
  }, [item]);

  const handleTogglePublic = async () => {
    if (!item) return;
    const newValue = !isPublic;
    setIsPublic(newValue); // Optimistic update
    setSaving(true);
    try {
      const endpoint = type === 'entry' ? `/entries/${item.id}` : `/collections/${item.id}`;
      const res = await apiRequest(endpoint, 'PUT', { 
        isPublic: newValue,
        sharePermission: permission 
      });
      if (onUpdate) onUpdate(res);
    } catch (e) {
      setIsPublic(!newValue); // Rollback
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = async (p) => {
    setPermission(p);
    if (isPublic) {
      setSaving(true);
      try {
        const endpoint = type === 'entry' ? `/entries/${item.id}` : `/collections/${item.id}`;
        const res = await apiRequest(endpoint, 'PUT', { 
          isPublic,
          sharePermission: p 
        });
        if (onUpdate) onUpdate(res);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }
  };

  const shareUrl = `${window.location.origin}/shared/${type === 'collection' ? 'collection/' : ''}${item?.shareHash}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" 
          />
          <div className="fixed inset-0 grid place-items-center z-[9999] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-card p-8 border border-white/10 pointer-events-auto shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white">Share {type}</h2>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Public Toggle */}
                <div className={`p-4 rounded-2xl border transition-all ${isPublic ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPublic ? 'bg-primary text-black' : 'bg-white/10 text-gray-500'}`}>
                        {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{isPublic ? 'Public Access' : 'Private'}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Anyone with the link can {permission === 'EDIT' ? 'edit' : 'view'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleTogglePublic}
                      disabled={saving}
                      className={`w-12 h-6 rounded-full relative transition-all ${isPublic ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {isPublic && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Permission Selector */}
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Permissions</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handlePermissionChange('VIEW')}
                          className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${permission === 'VIEW' ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        >
                          <Eye size={18} />
                          <span className="text-xs font-bold">View Only</span>
                        </button>
                        <button 
                          onClick={() => handlePermissionChange('EDIT')}
                          className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${permission === 'EDIT' ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        >
                          <Edit2 size={18} />
                          <span className="text-xs font-bold">Collaborative Edit</span>
                        </button>
                      </div>
                    </div>

                    {/* Link Copy */}
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Shareable Link</label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
                          {shareUrl}
                        </div>
                        <button 
                          onClick={copyToClipboard}
                          className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        >
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Shield size={16} />
                    <p className="text-[10px] font-medium leading-relaxed">
                      Collaborative features allow you to build memories together. Anyone with the link can perform the actions allowed by the permission level.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
