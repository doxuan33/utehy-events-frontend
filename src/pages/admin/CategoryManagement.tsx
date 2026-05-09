import { useState, useEffect } from 'react';
import { eventsApi } from '@/api/events.api';
import { adminApi } from '@/api/admin.api';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  X, 
  Award,
  FileText,
  CheckCircle2
} from 'lucide-react';

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_points: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await eventsApi.getCategories();
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', default_points: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      default_points: category.default_points || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id.toString(), formData);
      } else {
        await adminApi.createCategory(formData as any);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      alert('Lưu danh mục thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setShowConfirmDialog(false);
    try {
      await adminApi.deleteCategory(deleteId.toString());
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      alert('Xóa danh mục thất bại.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản lý Danh mục</h1>
          <p className="text-gray-500 font-medium">Thiết lập các loại hình hoạt động và khung điểm rèn luyện mặc định.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="rounded-2xl px-8 py-4 flex items-center space-x-2 shadow-xl shadow-blue-500/20">
          <Plus className="h-5 w-5" />
          <span className="font-bold">Thêm danh mục mới</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <motion.div
              layout
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Tag className="h-7 w-7" />
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleOpenEditModal(category)}
                    className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(category.id)}
                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500 font-medium line-clamp-2 min-h-[40px]">
                  {category.description || 'Không có mô tả cho danh mục này.'}
                </p>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                    <Award className="h-4 w-4 mr-2" />
                    <span className="text-sm font-black">+{category.default_points} điểm</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mặc định</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                  </h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">Thiết lập thông tin và điểm rèn luyện.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 ml-1">Tên danh mục</label>
                  <div className="relative">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="VD: Tình nguyện, Học thuật..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 ml-1">Điểm rèn luyện mặc định</label>
                  <div className="relative">
                    <Award className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={isNaN(formData.default_points) ? '' : formData.default_points}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormData({ ...formData, default_points: isNaN(val) ? 0 : val });
                      }}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 ml-1">Mô tả chi tiết</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    placeholder="Mô tả về các hoạt động thuộc danh mục này..."
                  />
                </div>

                <div className="pt-4 flex space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold">
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-2 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingCategory ? 'Cập nhật ngay' : 'Tạo danh mục')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa danh mục"
        description="Bạn có chắc chắn muốn xóa danh mục này? Các sự kiện thuộc danh mục này có thể bị ảnh hưởng."
        confirmText="Xóa danh mục"
      />
    </div>
  );
};
