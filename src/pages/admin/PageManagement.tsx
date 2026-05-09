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
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
      // 1. Register user with PAGE_ADMIN role
      const res = await authApi.register({
        ...accountData,
        role: 'PAGE_ADMIN'
      });
      
      const newUser = res.data.data;
      
      // 2. Add user as member (owner) of the page
      await pagesApi.addMember(selectedPage.id, {
        user_id: newUser.id,
        is_owner: true
      });

      alert(`Đã cấp tài khoản quản trị cho CLB ${selectedPage.name} thành công!`);
      setIsAccountModalOpen(false);
    } catch (err) {
      console.error('Failed to create admin account', err);
      alert('Cấp tài khoản thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLock = async (page: any) => {
    const action = page.is_locked ? 'mở khóa' : 'khóa';
    setConfirmLockAction(() => async () => {
      setShowConfirmDialog(false);
      try {
        if (page.is_locked) {
          await pagesApi.unlock(page.id);
        } else {
          await pagesApi.lock(page.id);
        }
        fetchPages();
      } catch (err) {
        console.error('Failed to toggle lock', err);
        alert('Thao tác thất bại.');
      }
    });
    setShowConfirmDialog(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản lý Câu lạc bộ</h1>
          <p className="text-gray-500 font-medium">Thêm mới, cập nhật và quản lý quyền truy cập cho các tổ chức.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="rounded-2xl px-8 py-4 flex items-center space-x-2 shadow-xl shadow-blue-500/20">
          <Plus className="h-5 w-5" />
          <span className="font-bold">Thêm CLB mới</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm CLB theo tên hoặc slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPages()}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Pages Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pages.map((page) => (
            <motion.div
              layout
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${page.is_locked ? 'opacity-75' : ''}`}
            >
              {page.is_locked && (
                <div className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div className="h-20 w-20 rounded-3xl bg-blue-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-blue-600 font-black text-2xl">
                  {page.avatar_url ? (
                    <img src={page.avatar_url} alt={page.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : page.name.charAt(0)}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleOpenEditModal(page)}
                    className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleToggleLock(page)}
                    className={`p-3 rounded-2xl transition-all ${page.is_locked ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                    title={page.is_locked ? 'Mở khóa' : 'Khóa'}
                  >
                    {page.is_locked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{page.name}</h3>
                  <p className="text-sm font-bold text-gray-400">@{page.slug}</p>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">
                  {page.description || 'Chưa có mô tả cho Câu lạc bộ này.'}
                </p>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        +
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenAccountModal(page)}
                    className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 font-bold"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Cấp tài khoản
                  </Button>
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
              className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingPage ? 'Cập nhật CLB' : 'Thêm Câu lạc bộ mới'}
                  </h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">Điền đầy đủ thông tin định danh cho CLB.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700 ml-1">Tên Câu lạc bộ</label>
                    <div className="relative">
                      <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="VD: CLB Tin học"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700 ml-1">Đường dẫn (Slug)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full pl-10 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="clb-tin-hoc"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 ml-1">Mô tả giới thiệu</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    placeholder="Giới thiệu sơ lược về CLB..."
                  />
                </div>

                <div className="pt-4 flex space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold">
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-2 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingPage ? 'Cập nhật ngay' : 'Tạo CLB mới')}
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-md bg-white rounded-[48px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-gray-50">
                <h2 className="text-2xl font-black text-gray-900">Cấp tài khoản Admin</h2>
                <p className="text-sm font-bold text-gray-400 mt-1">Cấp quyền quản trị cho đại diện CLB {selectedPage?.name}.</p>
              </div>

              <form onSubmit={handleCreateAdminAccount} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Họ và tên đại diện</label>
                  <input
                    type="text"
                    required
                    value={accountData.full_name}
                    onChange={(e) => setAccountData({ ...accountData, full_name: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Email đăng nhập</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="admin@clb.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Mật khẩu khởi tạo</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={accountData.password}
                      onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-6 flex space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold">
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-2 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Cấp tài khoản'}
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
        title="Xác nhận khóa/mở khóa"
        description="Bạn có chắc chắn muốn thực hiện thao tác này với Câu lạc bộ này?"
        confirmText="Xác nhận"
      />
    </div>
  );
};
