import { useState, useEffect } from 'react';
import { postsApi } from '@/api/posts.api';
import { pagesApi } from '@/api/pages.api';
import { BASE_URL } from '@/api/client';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Edit2, Trash2, Image as ImageIcon, MessageSquare, Heart, Loader2,
  AlertCircle, X, Send, Calendar, Upload, Sparkles, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/store/auth.store';

export const PostManagement = () => {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({ content: '' });

  // Multi-image state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
    return () => { previewUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      setPreviewUrls(prev => { prev.forEach(url => URL.revokeObjectURL(url)); return []; });
      setSelectedFiles([]); setExistingImageUrls([]);
    }
  }, [isModalOpen]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const { user } = useAuthStore.getState();
      const managedPageId = user?.managed_pages?.[0]?.page?.id || user?.managed_pages?.[0]?.page_id;
      
      if (!managedPageId) {
        setIsLoading(false);
        return;
      }

      // [TỐI ƯU HIỆU SUẤT]: Chạy song song 2 API lấy thông tin Page và Post
      const [pageRes, postsRes] = await Promise.all([
        pagesApi.getById(managedPageId),
        postsApi.getNewsfeed({ page_id: managedPageId, limit: 50 })
      ]);

      const managedPage = pageRes.data.data;
      if (!managedPage) {
        setIsLoading(false); return;
      }
      setPage(managedPage);

      const rawPosts = postsRes.data.data.data || [];
      const sortedPosts = rawPosts.sort((a: any, b: any) => {
        return new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime();
      });
      setPosts(sortedPosts);

    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPost(null); setFormData({ content: '' });
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]); setPreviewUrls([]); setExistingImageUrls([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: any) => {
    setEditingPost(post); setFormData({ content: post.content });
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]); setPreviewUrls([]); setExistingImageUrls(post.image_urls || []);
    setIsModalOpen(true);
  };

  const handleDeletePost = (id: string) => { setDeleteId(id); setShowConfirmDialog(true); };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setShowConfirmDialog(false);
    try {
      setIsActionLoading(true);
      await postsApi.delete(deleteId);
      setPosts(posts.filter(p => p.id !== deleteId));
      toast.success('Đã xóa bài viết');
    } catch (err) { toast.error('Xóa bài viết thất bại.'); } 
    finally { setIsActionLoading(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const newFiles = Array.from(files);
    if (newFiles.filter(f => !f.type.startsWith('image/')).length > 0) return toast.error('Chỉ chấp nhận file ảnh');
    if (selectedFiles.length + newFiles.length > 10) return toast.error('Tối đa 10 ảnh mỗi bài viết');

    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (url: string) => { setExistingImageUrls(prev => prev.filter(u => u !== url)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !token) return toast.error('Vui lòng đăng nhập lại');

    try {
      setIsActionLoading(true);
      toast.loading('Đang xử lý...', { id: 'post-submit' });

      const formPayload = new FormData();
      formPayload.append('page_id', page.id);
      formPayload.append('content', formData.content);
      selectedFiles.forEach(file => { formPayload.append('images', file); });

      const url = editingPost ? `${BASE_URL}/posts/${editingPost.id}` : `${BASE_URL}/posts`;
      const method = editingPost ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: formPayload, headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || (editingPost ? 'Cập nhật thất bại' : 'Đăng bài thất bại'));

      if (editingPost) {
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...data.data } : p));
        toast.success('Cập nhật thành công!', { id: 'post-submit' });
      } else {
        setPosts([data.data, ...posts]);
        toast.success('Đăng bài thành công!', { id: 'post-submit' });
      }

      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]); setPreviewUrls([]); setExistingImageUrls([]);
      setIsModalOpen(false);
    } catch (err: any) { toast.error(err.message || 'Lưu thất bại.', { id: 'post-submit' }); } 
    finally { setIsActionLoading(false); }
  };

  const filteredPosts = posts.filter(post => post.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 space-y-6 rounded-2xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-teal-600 tracking-tight flex items-center gap-2">
            Quản lý Bài viết <Sparkles className="h-6 w-6 text-green-500" />
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Quản trị và lan tỏa thông điệp trên không gian mạng của <span className="text-green-700 font-bold">{page?.name || 'Fanpage'}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={fetchInitialData} disabled={isLoading} className="rounded-lg p-3 border-green-200 text-green-600 hover:bg-green-50 shadow-sm">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleOpenCreateModal} className="group flex items-center space-x-2 rounded-lg px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-sm transition-all hover:scale-105 border-none">
            <Plus className="h-5 w-5" /> <span>Tạo bài viết mới</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
        </div>
      ) : !page ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-green-100 shadow-sm">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy Fanpage</h3>
          <p className="text-gray-500">Hệ thống chưa ghi nhận Fanpage nào dưới quyền quản lý của bạn.</p>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 relative z-10 transition-all hover:shadow-md">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-green-500" />
              <input type="text" placeholder="Khám phá và tìm kiếm nội dung bài viết..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-green-100 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, index) => (
                <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.4 }} key={post.id} className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex-1 relative z-10">
                    {/* Header: Author & Time */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center text-teal-700 font-black text-lg border border-white shadow-sm overflow-hidden flex-shrink-0">
                          {post.page?.avatar_url ? <img src={post.page.avatar_url} className="w-full h-full object-cover" /> : post.page?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{post.page?.name || 'UTEHY'}</p>
                          <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium mt-0.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(post.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button onClick={() => handleOpenEditModal(post)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Chỉnh sửa"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeletePost(post.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 mb-5 whitespace-pre-wrap font-medium">
                      {post.content}
                    </p>

                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className={`grid gap-2 mb-5 ${post.image_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {post.image_urls.slice(0, 4).map((url: string, idx: number) => (
                          <div key={idx} className="relative aspect-video overflow-hidden rounded-xl bg-gray-50 border border-gray-100 group/img">
                            <img src={url} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                            {idx === 3 && post.image_urls.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{post.image_urls.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-sm font-bold pt-4 border-t border-green-50">
                      <div className="flex items-center text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                        <Heart className="h-4 w-4 mr-1.5 fill-current" />
                        <span>{post._count?.likes || 0}</span>
                      </div>
                      <div className="flex items-center text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        <span>{post._count?.comments || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl p-16 text-center border border-dashed border-green-200">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                  <ImageIcon className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có bài viết nào</h3>
                <p className="text-gray-500">Hãy là người đầu tiên chia sẻ thông tin trên bảng tin.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-green-50 flex items-center justify-between bg-green-50/50 flex-shrink-0">
                <h2 className="text-xl font-bold text-green-800">
                  {editingPost ? 'Cập nhật nội dung' : 'Sáng tạo bài viết'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 shadow-sm"><X className="h-5 w-5 text-gray-500" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">Nội dung <Sparkles className="h-3 w-3 text-green-500" /></label>
                  <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={5} className="w-full px-4 py-3 bg-gray-50 border border-green-100 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none shadow-sm" placeholder="Bạn đang nghĩ gì? Chia sẻ thông tin..." required />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">Đính kèm Media</label>
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-100">Tối đa 10 ảnh</span>
                  </div>

                  <input type="file" id="post-images-input" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />

                  <label htmlFor="post-images-input" className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-green-200 rounded-xl bg-green-50/30 cursor-pointer hover:bg-green-50 transition-colors group">
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-2 group-hover:scale-105 transition-transform"><Upload className="h-5 w-5 text-green-500" /></div>
                    <span className="font-bold text-green-700 text-sm">Tải ảnh lên</span>
                    <span className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG</span>
                  </label>

                  {(previewUrls.length > 0 || existingImageUrls.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                      {previewUrls.map((url, idx) => (
                        <div key={`preview-${idx}`} className="relative aspect-square group rounded-xl overflow-hidden shadow-sm border border-gray-100">
                          <img src={url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => handleRemoveFile(idx)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                      {existingImageUrls.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative aspect-square group rounded-xl overflow-hidden shadow-sm border border-gray-100">
                          <img src={url} alt="Existing" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => handleRemoveExistingImage(url)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-shrink-0 border-t border-green-50">
                <Button type="button" variant="outline" onClick={() => { previewUrls.forEach(url => URL.revokeObjectURL(url)); setIsModalOpen(false); }} className="px-6 py-2.5 rounded-lg border-green-200 text-green-700 bg-white hover:bg-green-50 font-medium">Hủy bỏ</Button>
                <Button type="submit" form="post-form" onClick={handleSubmit} disabled={isActionLoading} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                  {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {editingPost ? 'Lưu thay đổi' : 'Phát sóng'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} onConfirm={handleConfirmDelete} title="Xóa bài viết?" description="Bài viết và bình luận sẽ bị xóa vĩnh viễn khỏi hệ thống." />
    </div>
  );
};