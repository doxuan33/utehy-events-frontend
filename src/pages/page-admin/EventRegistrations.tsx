import { useState, useEffect, useRef, useCallback } from 'react';
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
  RefreshCw,
  FileDown,
  X,
  Upload,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuthStore } from '@/store/auth.store';

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
  page_id: string; 
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { user } = useAuthStore();

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
      const eventData = eventRes.data.data;
      setEvent(eventData);

      const currentPageId = eventData.page_id;

      if (!currentPageId) {
        toast.error('Sự kiện này không thuộc Fanpage nào!');
        setIsLoading(false);
        return;
      }

      // Thêm limit: 1000 để lấy toàn bộ thay vì bị cắt ở 10 bản ghi mặc định
      const regRes = await registrationsApi.getEventRegistrations(eventId, currentPageId, { limit: 1000 });
      
      const rawPayload = regRes.data?.data;
      const registrationArray = Array.isArray(rawPayload) ? rawPayload : (rawPayload?.data || []);

      if (Array.isArray(registrationArray)) {
        const sortedReg = [...registrationArray].sort((a: Registration, b: Registration) =>
          new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
        );
        setRegistrations(sortedReg);
      } else {
        setRegistrations([]);
      }
    } catch (err: any) {
      console.error('Lỗi khi fetch dữ liệu registrations:', err);
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

  // Gọi trực tiếp API checkin (Cho phép checkin bù / walk-in)
  const handleCheckinByStudentId = async (studentId: string) => {
    if (!studentId.trim()) {
      toast.error('Vui lòng nhập MSSV');
      return;
    }

    setIsCheckingIn(studentId);
    try {
      // API checkinApi.manualCheckin chỉ cần event_id và student_id
      await checkinApi.manualCheckin({ event_id: eventId!, student_id: studentId.trim() });
      triggerConfetti();
      toast.success(`Điểm danh thành công: ${studentId}`);
      
      if (scannedStudentId === studentId) setScannedStudentId('');
      
      // Gọi lại API để lấy danh sách mới nhất (để hiển thị người vừa điểm danh bù)
      fetchInitialData();
      
      setShowSuccessModal({ name: "Sinh viên", id: studentId.trim() });
      setTimeout(() => setShowSuccessModal(null), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Điểm danh thất bại cho MSSV: ${studentId}`);
    } finally {
      setIsCheckingIn(null);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7'],
    });
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        console.error("Lỗi khi tắt scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const startScanner = useCallback(() => {
    setIsCameraOpen(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader-admin");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        toast.error('Vui lòng cho phép trình duyệt truy cập Camera!');
        setIsCameraOpen(false);
      }
    }, 200);
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    await stopScanner();
    // Gửi thẳng decodedText lên backend (Chấp nhận cả trường hợp checkin bù / chưa đăng ký)
    await handleCheckinByStudentId(decodedText);
  }, [stopScanner]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  useEffect(() => {
    if (activeTab !== 'scanner') stopScanner();
  }, [activeTab, stopScanner]);

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

  // Download Template Import
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'MSSV': 'SV001', 'Ghi chú': 'Nhập mã số sinh viên vào cột MSSV' },
      { 'MSSV': 'SV002', 'Ghi chú': '' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_import_danh_sach.xlsx`);
  };

  // Import mandatory students from file
  const handleImportMandatory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

      const studentIds: string[] = [];
      for (const row of jsonData) {
        const keys = Object.keys(row);
        const mssvKey = keys.find(
          (k) => k.trim().toLowerCase() === 'mssv' || k.trim().toLowerCase() === 'student_id'
        );
        if (mssvKey) {
          const val = row[mssvKey];
          if (val != null && val !== '') {
            studentIds.push(String(val).trim());
          }
        }
      }

      if (studentIds.length === 0) {
        toast.error('Không tìm thấy cột MSSV trong file (Vui lòng dùng file mẫu)');
        return;
      }

      toast.loading('Đang nhập danh sách sinh viên...', { id: 'import-loading' });
      const result = await eventsApi.importMandatoryStudents(eventId!, studentIds);
      toast.dismiss('import-loading');
      toast.success(result.data?.message || 'Import danh sách thành công!');

      fetchInitialData();

      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
    } catch (err: any) {
      toast.dismiss('import-loading');
      toast.error(err.response?.data?.message || 'Lỗi khi import danh sách');
    } finally {
      setIsImporting(false);
    }
  };

  // Trigger hidden file input
  const triggerFileImport = () => {
    importFileRef.current?.click();
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
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{event?.title}</h1>
          <p className="text-gray-500 text-sm">Quản lý người tham gia & điểm danh</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Giới hạn vé</p>
              <p className="text-2xl font-bold text-gray-900">{event?.max_slots || 'Không giới hạn'}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${checkinPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">{checkinPercent}% đã check-in</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã Check-in (Bao gồm điểm danh bù)</p>
              <p className="text-2xl font-bold text-emerald-600">{totalAttended}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Cụm công cụ (Action Buttons) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'PAGE_ADMIN' && event?.page_id && (
            <>
              <Button variant="primary" size="sm" onClick={triggerFileImport} disabled={isImporting} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Đang tải lên...' : 'Import Danh Sách SV'}
              </Button>
              <input
                ref={importFileRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleImportMandatory}
              />
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="text-gray-600">
                <Download className="h-4 w-4 mr-2" />
                Tải File Mẫu
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileDown className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline" size="sm" onClick={fetchInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
        </div>
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
          Quét mã QR / Điểm danh bù
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
            {/* Action Bar / Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              
              {/* Điểm danh bù nhanh */}
              <div className="flex items-center gap-2 w-full lg:w-auto bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 font-medium text-sm hidden sm:flex items-center whitespace-nowrap">
                  <UserCheck className="w-4 h-4 mr-2"/> Điểm danh bù:
                </span>
                <input
                  type="text"
                  placeholder="Nhập MSSV cần điểm danh..."
                  value={scannedStudentId}
                  onChange={(e) => setScannedStudentId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckinByStudentId(scannedStudentId)}
                  className="w-full lg:w-48 px-3 py-1.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Button 
                  size="sm" 
                  onClick={() => handleCheckinByStudentId(scannedStudentId)} 
                  disabled={isCheckingIn === scannedStudentId}
                  className="whitespace-nowrap"
                >
                  {isCheckingIn === scannedStudentId ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Xác nhận'}
                </Button>
              </div>

              {/* Tìm kiếm & Lọc */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm sinh viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="REGISTERED">Chưa điểm danh</option>
                  <option value="ATTENDED">Đã điểm danh</option>
                </select>
              </div>
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
                                onClick={() => handleCheckinByStudentId(reg.user.profile?.student_id || reg.user.id)}
                                disabled={isCheckingIn === (reg.user.profile?.student_id || reg.user.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Điểm danh"
                              >
                                {isCheckingIn === (reg.user.profile?.student_id || reg.user.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Chưa có dữ liệu hoặc không tìm thấy sinh viên</p>
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

                {/* Video/Camera preview */}
                <div id="qr-reader-admin" className={`w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full ${isCameraOpen ? '' : 'hidden'}`} />

                {/* Placeholder when camera is off */}
                {!isCameraOpen && (
                  <>
                    <motion.div
                      className="absolute w-4/5 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-lg shadow-emerald-500/50"
                      animate={{ y: [-100, 100, -100] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <QrCode className="h-24 w-24 text-gray-700 relative z-0" />
                  </>
                )}

                {/* Camera on overlay */}
                {isCameraOpen && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-emerald-500/50" />
                      <div className="absolute w-0.5 h-full bg-emerald-500/50" />
                      <div className="absolute w-3 h-3 border-2 border-emerald-500 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-center text-gray-600 mt-4 text-sm">
                Đưa mã QR của sinh viên vào khung hình. <br/> 
                <span className="text-xs text-emerald-600">*Hỗ trợ quét thẻ để điểm danh bù.</span>
              </p>

              {/* Camera Toggle Button */}
              {!isCameraOpen ? (
                <Button onClick={startScanner} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Camera className="h-4 w-4 mr-2" />
                  Bật Camera Quét QR
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="w-full mt-4">
                  <X className="h-4 w-4 mr-2" />
                  Tắt Camera
                </Button>
              )}
            </div>

            {/* Quick actions under scanner */}
            <div className="max-w-md mx-auto bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-sm text-emerald-800 font-medium mb-2 flex items-center">
                <UserCheck className="w-4 h-4 mr-2"/>
                Gõ tay điểm danh nhanh / Điểm danh bù
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập MSSV..."
                  value={scannedStudentId}
                  onChange={(e) => setScannedStudentId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckinByStudentId(scannedStudentId)}
                  className="flex-1 px-3 py-2 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <Button onClick={() => handleCheckinByStudentId(scannedStudentId)} disabled={isCheckingIn === scannedStudentId}>
                  {isCheckingIn === scannedStudentId ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Xác nhận'}
                </Button>
              </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center border-t-4 border-emerald-500">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Điểm danh thành công!</h3>
              <p className="text-gray-600 mt-2">
                MSSV: <span className="font-mono font-bold text-lg text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{showSuccessModal.id}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventRegistrations;