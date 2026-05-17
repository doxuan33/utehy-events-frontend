import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState, useEffect } from 'react';
import { pagesApi } from '@/api/pages.api';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Lock, 
  Unlock, 
  UserPlus, 
  Loader2,
  AlertCircle,
  X,
  Globe,
  Mail,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export const PageManagement = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmLockAction, setConfirmLockAction] = useState<(() => void) | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [accountData, setAccountData] = useState({
    full_name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      const res = await pagesApi.getAll({ search: searchQuery });
      setPages(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pages', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPage(null);
    setFormData({ name: '', slug: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (page: any) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      slug: page.slug,
      description: page.description || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenAccountModal = (page: any) => {
    setSelectedPage(page);
    setAccountData({ full_name: '', email: '', password: '' });
    setIsAccountModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingPage) {
        await pagesApi.update(editingPage.id, formData);
      } else {
        await pagesApi.create(formData);
      }
      setIsModalOpen(false);
      fetchPages();
    } catch (err) {
      console.error('Failed to save page', err);
      alert('Lưu thông tin thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // 1. Tạo tài khoản
      const res = await authApi.register({
        ...accountData,
        student_id: `ADMIN_${Date.now()}`
      });
      
      const responseData = res.data?.data;
      const userId = responseData?.user?.id || responseData?.id;
      
      if (!userId) {
        toast.error("Tạo tài khoản thành công nhưng không lấy được ID!");
        return; 
      }

      // 3. Gán tài khoản vào CLB
      await pagesApi.addMember(selectedPage.id, {
        user_id: userId,
        is_owner: true
      });

      toast.success(`Đã cấp tài khoản quản trị cho CLB thành công!`);
      setIsAccountModalOpen(false);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error(`Lỗi hệ thống: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLock = async (page: any) => {
    const action = page.is_verified ? 'khóa' : 'mở khóa';
    setConfirmLockAction(() => async () => {
      setShowConfirmDialog(false);
      try {
        await pagesApi.update(page.id, { is_verified: !page.is_verified });
        fetchPages();
      } catch (err) {
        console.error('Failed to toggle lock', err);
        alert('Thao tác thất bại.');
      }
    });
    setShowConfirmDialog(true);
  };

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 rounded-2xl">
      
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight">Quản lý Câu lạc bộ</h1>
          <p className="text-gray-500 font-medium mt-1">Thêm mới, cập nhật và quản lý quyền truy cập cho các tổ chức.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Nút Refresh Mới */}
          <Button 
            variant="outline" 
            onClick={fetchPages} 
            disabled={isLoading} 
            className="rounded-lg p-2.5 border-green-200 text-green-600 hover:bg-green-50 transition-all"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button 
            onClick={handleOpenCreateModal} 
            className="rounded-lg px-6 py-2.5 flex items-center space-x-2 shadow-sm bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            <span>Thêm CLB mới</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
          <input
            type="text"
            placeholder="Tìm kiếm CLB theo tên hoặc slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPages()}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-green-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      {/* Pages Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pages.map((page) => (
            <motion.div
              layout
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden ${!page.is_verified ? 'opacity-75' : ''}`}
            >
               {!page.is_verified && (
                <div className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-lg shadow-sm">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-5">
                <div className="h-16 w-16 rounded-2xl bg-green-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-green-600 font-black text-2xl group-hover:scale-105 transition-transform">
                  {page.avatar_url ? (
                    <img src={page.avatar_url} alt={page.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : page.name.charAt(0)}
                </div>
                <div className="flex space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenEditModal(page)}
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleLock(page)}
                    className={`p-2 rounded-lg transition-colors ${page.is_locked ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                    title={page.is_locked ? 'Mở khóa' : 'Khóa'}
                  >
                    {page.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-1">{page.name}</h3>
                  <p className="text-xs font-bold text-green-600/70">@{page.slug}</p>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed min-h-[40px]">
                  {page.description || 'Chưa có mô tả cho Câu lạc bộ này.'}
                </p>

                <div className="pt-4 border-t border-green-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-600">
                        +
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenAccountModal(page)}
                    className="rounded-lg border-green-200 text-green-700 hover:bg-green-50 font-medium text-xs px-3 py-1.5"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Cấp tài khoản
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          {pages.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-gray-500">
              Không tìm thấy Câu lạc bộ nào.
            </div>
          )}
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-green-50 flex items-center justify-between bg-green-50/30 sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-green-800">
                    {editingPage ? 'Cập nhật CLB' : 'Thêm Câu lạc bộ mới'}
                  </h2>
                  <p className="text-xs font-medium text-gray-500 mt-1">Điền đầy đủ thông tin định danh cho CLB.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Tên Câu lạc bộ</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                        placeholder="VD: CLB Tin học"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Đường dẫn (Slug)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">@</span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                        placeholder="clb-tin-hoc"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Mô tả giới thiệu</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-green-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none resize-none shadow-sm"
                    placeholder="Giới thiệu sơ lược về CLB..."
                  />
                </div>

                <div className="pt-4 flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border-green-200 text-green-700 hover:bg-green-50 font-medium">
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-sm transition-all transform hover:-translate-y-0.5">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (editingPage ? 'Cập nhật ngay' : 'Tạo CLB mới')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Admin Account Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100"
            >
              <div className="p-6 border-b border-green-50 bg-green-50/30 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-green-800">Cấp tài khoản Admin</h2>
                  <p className="text-xs font-medium text-gray-500 mt-1">Đại diện: {selectedPage?.name}</p>
                </div>
                <button onClick={() => setIsAccountModalOpen(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateAdminAccount} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Họ và tên đại diện</label>
                  <input
                    type="text"
                    required
                    value={accountData.full_name}
                    onChange={(e) => setAccountData({ ...accountData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email đăng nhập</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    <input
                      type="email"
                      required
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                      placeholder="admin@clb.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mật khẩu khởi tạo</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    <input
                      type="password"
                      required
                      value={accountData.password}
                      onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-2.5 border-green-200 text-green-700 hover:bg-green-50 font-medium rounded-lg">
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 font-medium shadow-sm rounded-lg transition-all transform hover:-translate-y-0.5">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Cấp tài khoản'}
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
        onConfirm={() => confirmLockAction && confirmLockAction()}
        title="Xác nhận thao tác"
        description="Bạn có chắc chắn muốn thực hiện thao tác này với Câu lạc bộ này?"
        confirmText="Xác nhận"
      />
    </div>
  );
};