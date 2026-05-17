import { useState, useEffect } from 'react';
import { eventsApi } from '@/api/events.api';
import { adminApi } from '@/api/admin.api';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Plus, Edit2, Trash2, Loader2, X, Award, Search, RefreshCw } from 'lucide-react';

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // [TÍNH NĂNG MỚI] Thanh tìm kiếm Client-side
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({ name: '', description: '', default_points: 0 });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await eventsApi.getCategories();
      setCategories(res.data.data || []);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleOpenCreateModal = () => { setEditingCategory(null); setFormData({ name: '', description: '', default_points: 0 }); setIsModalOpen(true); };
  const handleOpenEditModal = (category: any) => { setEditingCategory(category); setFormData({ name: category.name, description: category.description || '', default_points: category.default_points || 0 }); setIsModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingCategory) await adminApi.updateCategory(editingCategory.id.toString(), formData);
      else await adminApi.createCategory(formData as any);
      setIsModalOpen(false); fetchCategories();
    } catch (err) { alert('Lưu thất bại.'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = (id: number) => { setDeleteId(id); setShowConfirmDialog(true); };
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setShowConfirmDialog(false);
    try { await adminApi.deleteCategory(deleteId.toString()); fetchCategories(); } catch (err) { alert('Xóa thất bại.'); }
  };

  // Lọc category theo từ khóa
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight">Quản lý Danh mục</h1>
          <p className="text-gray-500 font-medium mt-1">Thiết lập các loại hình hoạt động và khung điểm rèn luyện mặc định.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* [TÍNH NĂNG MỚI] Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            <input 
              type="text" 
              placeholder="Tìm danh mục..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-full md:w-64"
            />
          </div>
          {/* [TÍNH NĂNG MỚI] Refresh Button */}
          <Button variant="outline" onClick={fetchCategories} disabled={isLoading} className="rounded-lg p-2.5 border-green-200 text-green-600 hover:bg-green-50">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleOpenCreateModal} className="rounded-lg px-6 py-2.5 flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-sm transform hover:-translate-y-0.5 transition-all">
            <Plus className="h-5 w-5" /><span>Thêm danh mục</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-green-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <motion.div layout key={category.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><Tag className="h-6 w-6" /></div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditModal(category)} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{category.description || 'Không có mô tả.'}</p>
                <div className="pt-5 border-t border-green-50 flex items-center justify-between">
                  <div className="flex items-center text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                    <Award className="h-4 w-4 mr-2" /><span className="text-sm font-bold">+{category.default_points} điểm</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredCategories.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-500">Không tìm thấy danh mục nào phù hợp.</div>
          )}
        </div>
      )}

      {/* Modal giữ nguyên logic */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
              <div className="p-6 border-b border-green-50 flex items-center justify-between bg-green-50/30">
                <h2 className="text-xl font-bold text-green-800">{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-lg"><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Tên danh mục</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Điểm mặc định</label>
                  <input required type="number" value={formData.default_points} onChange={(e) => setFormData({ ...formData, default_points: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="pt-4 flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border-green-200 text-green-700 hover:bg-green-50">Hủy</Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm hover:-translate-y-0.5">{isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Lưu'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} onConfirm={handleConfirmDelete} title="Xóa danh mục" description="Chắc chắn muốn xóa?" confirmText="Xóa" />
    </div>
  );
}