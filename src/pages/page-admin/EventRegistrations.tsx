import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationsApi } from '@/api/registrations.api';
import { checkinApi } from '@/api/checkin.api';
import { eventsApi } from '@/api/events.api';
import * as XLSX from 'xlsx';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  Loader2,
  QrCode,
  Camera,
  UserCheck,
  Filter,
  RefreshCw,
  FileDown,
  CornerDownRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import confetti from 'canvas-confetti';

type Registration = {
  id: string;
  user: {
    id: string;
    profile?: {
      full_name: string;
      student_id: string;
      class_name: string;
      avatar_url?: string;
    };
  };
  status: 'REGISTERED' | 'APPROVED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED' | 'REJECTED';
  registered_at: string;
};

type Event = {
  id: string;
  title: string;
  max_slots?: number;
  _count?: {
    registrations: number;
  };
};

export const EventRegistrations = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // States
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'scanner'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATTENDED' | 'REGISTERED'>('ALL');
  const [scannedStudentId, setScannedStudentId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState<{ name: string; id: string } | null>(null);

  // Fetch data
  useEffect(() => {
    if (!eventId) return;
    fetchInitialData();
  }, [eventId]);

  const fetchInitialData = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const eventRes = await eventsApi.getById(eventId);
      setEvent(eventRes.data.data);

      const regRes = await registrationsApi.getEventRegistrations(eventId, '');
      // Sort by registration date (newest first) - FRONTEND SORTING
      const sortedReg = [...regRes.data.data].sort((a: Registration, b: Registration) =>
        new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
      );
      setRegistrations(sortedReg);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchQuery === '' ||
      reg.user.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.user.profile?.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ATTENDED' && reg.status === 'ATTENDED') ||
      (statusFilter === 'REGISTERED' && reg.status !== 'ATTENDED' && reg.status !== 'CANCELLED');
    return matchesSearch && matchesStatus;
  });

  // Manual check-in
  const handleManualCheckin = async (registrationId: string, studentId: string) => {
    setIsCheckingIn(registrationId);
    try {
      await checkinApi.manualCheckin({ event_id: eventId!, student_id: studentId });
      setRegistrations(prev => prev.map(r =>
        r.id === registrationId ? { ...r, status: 'ATTENDED' } : r
      ));
      triggerConfetti();
      toast.success('Điểm danh thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Điểm danh thất bại');
    } finally {
      setIsCheckingIn(null);
    }
  };

  // Trigger confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7'],
    });
  };

  // Mock QR scan
  const handleMockScan = async () => {
    if (!scannedStudentId.trim()) {
      toast.error('Vui lòng nhập MSSV');
      return;
    }

    const reg = registrations.find(r =>
      r.user.profile?.student_id === scannedStudentId.trim() && r.status !== 'ATTENDED'
    );

    if (!reg) {
      toast.error('Không tìm thấy sinh viên chưa điểm danh');
      return;
    }

    const studentName = reg.user.profile?.full_name || '';
    await handleManualCheckin(reg.id, scannedStudentId.trim());
    setScannedStudentId('');
    setShowSuccessModal({ name: studentName, id: scannedStudentId.trim() });
    setTimeout(() => setShowSuccessModal(null), 3000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = registrations.map((reg, idx) => ({
      'STT': idx + 1,
      'MSSV': reg.user.profile?.student_id || '',
      'Họ tên': reg.user.profile?.full_name || '',
      'Lớp': reg.user.profile?.class_name || '',
      'Thời gian đăng ký': format(new Date(reg.registered_at), 'dd/MM/yyyy HH:mm'),
      'Trạng thái': reg.status === 'ATTENDED' ? 'Đã check-in' : 'Chưa check-in',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đăng ký');
    XLSX.writeFile(wb, `event-${eventId}-registrations.xlsx`);
    toast.success('Xuất Excel thành công!');
  };

  // Stats
  const totalRegistered = registrations.length;
  const totalAttended = registrations.filter(r => r.status === 'ATTENDED').length;
  const checkinPercent = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{event?.title}</h1>
          <p className="text-gray-500 text-sm">Quản lý đăng ký & điểm danh</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Tickets */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng vé phát ra</p>
              <p className="text-2xl font-bold text-gray-900">{event?.max_slots || 'Không giới hạn'}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Registered */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Đã đăng ký</p>
              <p className="text-2xl font-bold text-gray-900">{totalRegistered}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          {/* Progress bar: Check-in / Registered */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${checkinPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">{checkinPercent}% đã check-in</p>
        </div>

        {/* Attended */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã Check-in</p>
              <p className="text-2xl font-bold text-emerald-600">{totalAttended}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileDown className="h-4 w-4 mr-2" />
          Xuất Excel
        </Button>
        <Button variant="outline" size="sm" onClick={fetchInitialData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tải lại dữ liệu
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'list'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Danh sách Sinh viên
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
            activeTab === 'scanner'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <QrCode className="h-4 w-4" />
          Quét mã QR
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo MSSV, Tên sinh viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="REGISTERED">Chưa điểm danh</option>
                <option value="ATTENDED">Đã điểm danh</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thông tin SV</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian ĐK</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg, index) => (
                        <tr key={reg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                                {reg.user.profile?.avatar_url ? (
                                  <img
                                    src={reg.user.profile.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-5 w-5 m-auto text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{reg.user.profile?.full_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{reg.user.profile?.student_id || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.user.profile?.class_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(new Date(reg.registered_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              reg.status === 'ATTENDED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {reg.status === 'ATTENDED' ? 'Đã điểm danh' : 'Chờ điểm danh'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {reg.status !== 'ATTENDED' && (
                              <Button
                                size="sm"
                                onClick={() => handleManualCheckin(reg.id, reg.user.profile?.student_id || reg.user.id)}
                                disabled={isCheckingIn === reg.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {isCheckingIn === reg.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Không tìm thấy sinh viên nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'scanner' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* QR Scanner UI */}
            <div className="max-w-md mx-auto">
              <div className="relative bg-gray-950 rounded-3xl p-1 aspect-square flex items-center justify-center overflow-hidden shadow-2xl">
                {/* Corner markers */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-emerald-500 rounded-tl-lg z-10" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-emerald-500 rounded-tr-lg z-10" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-emerald-500 rounded-bl-lg z-10" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-emerald-500 rounded-br-lg z-10" />

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 border-2 border-emerald-500/30 rounded-lg" />
                  <div className="absolute w-1 h-12 bg-emerald-500/50" />
                  <div className="absolute w-12 h-1 bg-emerald-500/50" />
                </div>

                {/* Laser scanning line */}
                <motion.div
                  className="absolute w-4/5 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-lg shadow-emerald-500/50"
                  animate={{ y: [-100, 100, -100] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* QR Icon placeholder */}
                <QrCode className="h-24 w-24 text-gray-700 relative z-0" />
              </div>

              <p className="text-center text-gray-600 mt-4">
                Đưa mã QR trên vé điện tử của sinh viên vào khung hình
              </p>
            </div>

            {/* Mock Scan Input */}
            <div className="max-w-md mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Giả lập quét mã (nhập MSSV):</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập MSSV..."
                  value={scannedStudentId}
                  onChange={(e) => setScannedStudentId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMockScan()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button onClick={handleMockScan}>
                  <Camera className="h-4 w-4 mr-2" />
                  Quét
                </Button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveTab('list')}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Xem danh sách
              </Button>
              <Button
                variant="outline"
                onClick={fetchInitialData}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm mx-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Điểm danh thành công!</h3>
              <p className="text-gray-600">
                {showSuccessModal.name} <span className="font-mono">({showSuccessModal.id})</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Điểm danh thành công!</h3>
              <p className="text-gray-600 break-words">
                {showSuccessModal.name} <span className="font-mono text-sm bg-gray-100 px-1 rounded">{showSuccessModal.id}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventRegistrations;
