import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Upload, 
  ChevronRight, 
  Folder, 
  Image as ImageIcon, 
  MoreVertical,
  Search,
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [items, setItems] = useState<{ folders: any[]; images: any[] }>({ folders: [], images: [] });
  const [loading, setLoading] = useState(true);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchContent(currentFolder?._id);
    setMenuOpenId(null);
  }, [currentFolder]);

  // Click outside to close menu
  useEffect(() => {
    const handleClick = () => setMenuOpenId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/folders', { 
        name: newFolderName, 
        parentId: currentFolder?._id 
      });
      setIsFolderModalOpen(false);
      setNewFolderName('');
      fetchContent(currentFolder?._id);
    } catch (err) {
      console.error('Failed to create folder', err);
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('name', uploadName || uploadFile.name);
    formData.append('folderId', currentFolder?._id || '');

    try {
      await api.post('/images/upload', formData);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadName('');
      fetchContent(currentFolder?._id);
    } catch (err) {
      console.error('Failed to upload image', err);
    }
  };

  const fetchContent = async (folderId?: string) => {
    setLoading(true);
    try {
      const foldersRes = await api.get('/folders' + (folderId ? `?parentId=${folderId}` : ''));
      const imagesRes = await api.get('/images' + (folderId ? `?folderId=${folderId}` : ''));
      setItems({ 
        folders: Array.isArray(foldersRes.data) ? foldersRes.data : [], 
        images: Array.isArray(imagesRes.data) ? imagesRes.data : [] 
      });
    } catch (err) {
      console.error('Failed to fetch content', err);
      // Ensure state is at least empty arrays on error to prevent map crashes
      setItems({ folders: [], images: [] });
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: any) => {
    if (folder === null) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      setCurrentFolder(folder);
      setBreadcrumbs(prev => [...prev, folder]);
    }
  };

  const navigateUp = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const lastFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(lastFolder);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) return;
    try {
      await api.delete(`/folders/${id}`);
      fetchContent(currentFolder?._id);
    } catch (err) {
      console.error('Failed to delete folder', err);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await api.delete(`/images/${id}`);
      fetchContent(currentFolder?._id);
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ImageIcon className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Dobby Drive</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all w-64"
              />
            </div>
            
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-2 text-sm text-slate-400 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => navigateToFolder(null)}
              className="hover:text-white whitespace-nowrap"
            >
              My Files
            </button>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb._id}>
                <ChevronRight className="w-4 h-4 shrink-0" />
                <button 
                  onClick={() => navigateUp(i)}
                  className="hover:text-white whitespace-nowrap"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isFolderModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFolderModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-4">Create New Folder</h3>
                <form onSubmit={handleCreateFolder}>
                  <input 
                    autoFocus
                    type="text"
                    required
                    placeholder="Folder Name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button"
                      onClick={() => setIsFolderModalOpen(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-all"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-4">Upload Image</h3>
                <form onSubmit={handleUploadImage}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Display Name (optional)</label>
                      <input 
                        type="text"
                        placeholder="Image Name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Select Image</label>
                      <input 
                        type="file"
                        accept="image/*"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600/20"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-all"
                    >
                      Upload
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-slate-400 animate-pulse">Loading files...</p>
          </div>
        ) : (items.folders?.length === 0 && items.images?.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl">
            <div className="bg-slate-800 p-4 rounded-full mb-4">
              <Folder className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">This folder is empty</h3>
            <p className="text-slate-400">Create a folder or upload an image to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Folder Grid */}
            {items.folders.map((folder) => (
              <motion.div 
                key={folder._id}
                whileHover={{ y: -4 }}
                className="group bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 transition-all cursor-pointer relative"
                onClick={() => navigateToFolder(folder)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <Folder className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === folder._id ? null : folder._id);
                      }}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpenId === folder._id && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 overflow-hidden">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder._id);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h4 className="font-medium text-white truncate mb-1">{folder.name}</h4>
                <p className="text-xs text-slate-500">{folder.sizeFormatted || '0 KB'}</p>
              </motion.div>
            ))}

            {/* Image Grid */}
            {items.images.map((image) => (
              <motion.div 
                key={image._id}
                whileHover={{ y: -4 }}
                className="group bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-800">
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-white truncate text-sm">{image.name}</h4>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === image._id ? null : image._id);
                        }}
                        className="text-slate-500 hover:text-white p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === image._id && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 overflow-hidden">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image._id);
                              setMenuOpenId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{image.sizeFormatted}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
