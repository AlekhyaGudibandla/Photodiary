import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import EntryModal from '../components/EntryModal';
import MediaCapture from '../components/MediaCapture';
import UpgradeModal from '../components/UpgradeModal';
import SearchModal from '../components/SearchModal';
import ShareModal from '../components/ShareModal';
import AddExistingToCollectionModal from '../components/AddExistingToCollectionModal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [sharedHash, setSharedHash] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraCallback, setCameraCallback] = useState(null);
  const [collectionContext, setCollectionContext] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  // New modal states
  const [shareData, setShareData] = useState(null); // { type, item, onUpdate }
  const [addExistingData, setAddExistingData] = useState(null); // { collectionId, onAdded }

  const openEntryModal = (entry = null, collectionId = null, hash = null) => {
    setEditingEntry(entry);
    setCollectionContext(collectionId);
    setSharedHash(hash);
    setIsEntryModalOpen(true);
  };
  const closeEntryModal = () => {
    setIsEntryModalOpen(false);
    setEditingEntry(null);
    setCollectionContext(null);
    setSharedHash(null);
  };

  const openCamera = (onCapture) => {
    setCameraCallback(() => onCapture);
    setIsCameraOpen(true);
  };
  const closeCamera = () => setIsCameraOpen(false);

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  const openShareModal = (type, item, onUpdate) => setShareData({ type, item, onUpdate });
  const closeShareModal = () => setShareData(null);

  const openAddExistingModal = (collectionId, onAdded) => setAddExistingData({ collectionId, onAdded });
  const closeAddExistingModal = () => setAddExistingData(null);

  return (
    <ModalContext.Provider value={{ 
      isEntryModalOpen, openEntryModal, closeEntryModal,
      isCameraOpen, openCamera, closeCamera,
      isUpgradeModalOpen, openUpgradeModal, closeUpgradeModal,
      isSearchModalOpen, openSearchModal, closeSearchModal,
      openShareModal, closeShareModal,
      openAddExistingModal, closeAddExistingModal,
      editingEntry
    }}>
      {children}
      {createPortal(
        <>
          {isEntryModalOpen && (
            <EntryModal 
              isOpen={isEntryModalOpen} 
              onClose={closeEntryModal} 
              editingEntry={editingEntry}
              collectionId={collectionContext}
              sharedHash={sharedHash}
              onEntryCreated={() => window.dispatchEvent(new CustomEvent('entryCreated'))}
            />
          )}
          {isCameraOpen && (
            <MediaCapture 
              onClose={closeCamera} 
              onCapture={(media) => {
                if (cameraCallback) cameraCallback(media);
                closeCamera();
              }} 
            />
          )}
          <UpgradeModal 
            isOpen={isUpgradeModalOpen} 
            onClose={closeUpgradeModal} 
          />
          <SearchModal 
            isOpen={isSearchModalOpen} 
            onClose={closeSearchModal} 
          />
          {shareData && (
            <ShareModal 
              isOpen={!!shareData}
              onClose={closeShareModal}
              type={shareData.type}
              item={shareData.item}
              onUpdate={shareData.onUpdate}
            />
          )}
          {addExistingData && (
            <AddExistingToCollectionModal 
              isOpen={!!addExistingData}
              onClose={closeAddExistingModal}
              collectionId={addExistingData.collectionId}
              onAdded={addExistingData.onAdded}
            />
          )}
        </>,
        document.body
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);


