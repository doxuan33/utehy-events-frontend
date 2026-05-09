import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Check,
  X,
  Lock,
  Trash2,
  FileSpreadsheet,
  Loader2,
  Filter,
  Users,
  Calendar,
  Building2
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import * as XLSX from 'xlsx';

// Mock data for pending clubs
const mockPendingClubs = [
  {
    id: '1',
    name: 'Câu lạc bộ Trí tuệ nhân tạo',
    representative: 'Nguyễn Văn An',
    category: 'Công nghệ',
    submittedAt: '2026-05-01T10:30:00Z',
    description: 'Thành lập CLB AI để nghiên cứu và ứng dụng trí tuệ nhân tạo',
    email: 'ai@club.utehy.edu.vn',
    phone: '0912345678'
  },
  {
    id: '2',
    name: 'Câu lạc bộ Võ thuật',
    representative: 'Trần Thị Bình',
    category: 'Thể thao',
    submittedAt: '2026-05-03T14:20:00Z',
    description: 'Đào tạo võ thuật và rèn luyện thể chất cho sinh viên',
    email: 'vo-thuat@club.utehy.edu.vn',
    phone: '0987654321'
  },
  {
    id: '3',
    name: 'Câu lạc bộ Tình nguyện Xanh',
    representative: 'Lê Hoàng Cường',
    category: 'Tình nguyện',
    submittedAt: '2026-05-05T09:15:00Z',
    description: 'Hoạt động tình nguyện và bảo vệ môi trường',
    email: 'xanh@club.utehy.edu.vn',
    phone: '0909123456'
  }
];

// Mock data for active clubs
const mockActiveClubs = [
  {
    id: 'a1',
    name: 'Câu lạc bộ Lập trình',
    representative: 'Phạm Đức Dũng',
    category: 'Công nghệ',
    establishedAt: '2025-09-01T00:00:00Z',
    members: 85,
    events: 12,
    status: 'active',
    email: 'laptrinh@club.utehy.edu.vn'
  },
  {
    id: 'a2',
    name: 'Câu lạc bộ Âm nhạc',
    representative: 'Đỗ Thị Hà',
    category: 'Văn hóa',
    establishedAt: '2025-10-15T00:00:00Z',
    members: 62,
    events: 8,
    status: 'active',
    email: 'amnhac@club.utehy.edu.vn'
  },
  {
    id: 'a3',
    name: 'Câu lạc bộ Tiếng Anh',
    representative: 'Võ Minh Kiên',
    category: 'Ngôn ngữ',
    establishedAt: '2025-08-20T00:00:00Z',
    members: 120,
    events: 15,
    status: 'active',
    email: 'anh@club.utehy.edu.vn'
  },
  {
    id: 'a4',
    name: 'Câu lạc bộ Kinh tế',
    representative: 'Ngô Thị Lan',
    category: 'Học thuật',
    establishedAt: '2025-11-05T00:00:00Z',
    members: 48,
    events: 6,
    status: 'suspended',
    email: 'kinhte@club.utehy.edu.vn'
  }
];

type Club = typeof mockPendingClubs[0] | typeof mockActiveClubs[0];

export const ClubManagement = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingClubs, setPendingClubs] = useState(mockPendingClubs);
  const [activeClubs, setActiveClubs] = useState(mockActiveClubs);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmContent, setConfirmContent] = useState({ title: '', description: '', confirmText: 'Xác nhận' });
  const [isActionLoading, setIsActionLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredActiveClubs = useMemo(() => {
    if (!searchQuery) return activeClubs;
    return activeClubs.filter(club =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeClubs, searchQuery]);

   const handleApproveClub = async (clubId: string) => {
     const club = pendingClubs.find(c => c.id === clubId);
     if (!club) return;

     setConfirmAction(() => async () => {
       setIsActionLoading(true);
       setPendingClubs(pendingClubs.filter(c => c.id !== clubId));
       setActiveClubs([...activeClubs, { ...club, establishedAt: new Date().toISOString(), members: 0, events: 0, status: 'active' }]);
       setIsActionLoading(false);
     });
    setConfirmContent({
      title: 'Xác nhận duyệt Câu lạc bộ',
      description: `Bạn có chắc chắn muốn chấp nhận yêu cầu thành lập của CLB "${club.name}"?`,
      confirmText: 'Duyệt ngay'
    });
    setShowConfirmDialog(true);
  };

   const handleRejectClub = async (clubId: string) => {
     const club = pendingClubs.find(c => c.id === clubId);
     if (!club) return;

     setConfirmAction(() => async () => {
       setIsActionLoading(true);
       setPendingClubs(pendingClubs.filter(c => c.id !== clubId));
       setIsActionLoading(false);
     });
    setConfirmContent({
      title: 'Xác nhận từ chối Câu lạc bộ',
      description: `Bạn có chắc chắn muốn từ chối yêu cầu thành lập của CLB "${club.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Từ chối'
    });
    setShowConfirmDialog(true);
  };

   const handleToggleClubStatus = async (clubId: string) => {
     const club = activeClubs.find(c => c.id === clubId);
     if (!club) return;

     setConfirmAction(() => async () => {
       setIsActionLoading(true);
       setActiveClubs(activeClubs.map(c =>
         c.id === clubId
           ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' }
           : c
       ));
       setIsActionLoading(false);
     });
    setConfirmContent({
      title: club.status === 'active' ? 'Khóa Câu lạc bộ' : 'Mở khóa Câu lạc bộ',
      description: `Bạn có chắc chắn muốn ${club.status === 'active' ? 'khóa' : 'mở khóa'} CLB "${club.name}"?`,
      confirmText: club.status === 'active' ? 'Khóa ngay' : 'Mở khóa'
    });
    setShowConfirmDialog(true);
  };

   const handleDeleteClub = async (clubId: string) => {
     const club = activeClubs.find(c => c.id === clubId);
     if (!club) return;

     setConfirmAction(() => async () => {
       setIsActionLoading(true);
       setActiveClubs(activeClubs.filter(c => c.id !== clubId));
       setIsActionLoading(false);
     });
    setConfirmContent({
      title: 'Xóa Câu lạc bộ',
      description: `Bạn có chắc chắn muốn xóa CLB "${club.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa vĩnh viễn'
    });
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    if (confirmAction) {
      await confirmAction();
    }
  };

  const exportToExcel = (data: any[], filename: string) => {
    // Note: Make sure to install xlsx library: npm install xlsx
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clubs");

    const colWidths = [
      { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPending = () => {
    const exportData = pendingClubs.map(c => ({
      'Tên CLB': c.name,
      'Người đại diện': c.representative,
      'Phân loại': c.category,
      'Ngày nộp đơn': formatDate(c.submittedAt),
      'Email': c.email,
      'Số điện thoại': c.phone,
      'Mô tả': c.description
    }));
    exportToExcel(exportData, 'CLB_ChoPheDuyet');
  };

  const handleExportActive = () => {
    const exportData = filteredActiveClubs.map(c => ({
      'Tên CLB': c.name,
      'Người đại diện': c.representative,
      'Phân loại': c.category,
      'Ngày thành lập': formatDate(c.establishedAt),
      'Thành viên': c.members,
      'Sự kiện': c.events,
      'Trạng thái': c.status === 'active' ? 'Hoạt động' : 'Bị khóa'
    }));
    exportToExcel(exportData, 'CLB_DangHoatDong');
  };

  const currentClubs = activeTab === 'pending' ? pendingClubs : filteredActiveClubs;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản lý Câu lạc bộ</h1>
          <p className="text-gray-500 font-medium">Phê duyệt và quản lý các CLB trên hệ thống.</p>
        </div>
        <Button
          onClick={activeTab === 'pending' ? handleExportPending : handleExportActive}
          className="rounded-2xl px-6 py-4 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
        >
          <FileSpreadsheet className="h-5 w-5" />
          <span className="font-bold">Xuất Báo Cáo Excel</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm inline-flex">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="h-5 w-5" />
          <span>Chờ phê duyệt ({pendingClubs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Building2 className="h-5 w-5" />
          <span>Đang hoạt động ({filteredActiveClubs.length})</span>
        </button>
      </div>

      {/* Search for Active Clubs Tab */}
      {activeTab === 'active' && (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên CLB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Clubs Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Tên CLB</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Người đại diện</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Phân loại</th>
                {activeTab === 'pending' ? (
                  <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Ngày nộp đơn</th>
                ) : (
                  <>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Thành viên</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Sự kiện</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                  </>
                )}
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentClubs.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 4 : 7} className="px-8 py-20 text-center text-gray-400 italic">
                    {activeTab === 'pending' ? 'Không có CLB nào chờ phê duyệt.' : 'Không tìm thấy CLB nào.'}
                  </td>
                </tr>
              ) : (
                currentClubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100 shadow-sm">
                          {club.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {club.name}
                          </p>
                          {activeTab === 'pending' && (
                            <p className="text-xs text-gray-400 line-clamp-1">{club.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-gray-700">{club.representative}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold">
                        {club.category}
                      </span>
                    </td>
                    {activeTab === 'pending' ? (
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-700">{formatDate(club.submittedAt)}</p>
                      </td>
                    ) : (
                      <>
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-bold text-gray-700">{(club as any).members}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-bold text-gray-700">{(club as any).events}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {(club as any).status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider">
                              Đình chỉ
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {activeTab === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveClub(club.id)}
                              disabled={isActionLoading}
                              className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50"
                              title="Duyệt CLB"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRejectClub(club.id)}
                              disabled={isActionLoading}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                              title="Từ chối"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleClubStatus(club.id)}
                              disabled={isActionLoading}
                              className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${
                                (club as any).status === 'active'
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={(club as any).status === 'active' ? 'Khóa CLB' : 'Mở khóa CLB'}
                            >
                              <Lock className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClub(club.id)}
                              disabled={isActionLoading}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                              title="Xóa CLB"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirm}
        title={confirmContent.title}
        description={confirmContent.description}
        confirmText={confirmContent.confirmText}
      />
    </div>
  );
};