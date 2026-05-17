import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationsApi } from '@/api/registrations.api';
import { checkinApi } from '@/api/checkin.api';
import { eventsApi } from '@/api/events.api';
import * as XLSX from 'xlsx';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, Users, CheckCircle2, Loader2, QrCode,
  Camera, UserCheck, RefreshCw, FileDown, X, Upload, Download,
  ClipboardList
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
  
  // [STATE MỚI] State cho nút Điểm danh tất cả
  const [isCheckinAllLoading, setIsCheckinAllLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'list' | 'scanner'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATTENDED' | 'REGISTERED'>('ALL');
  const [scannedStudentId, setScannedStudentId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState<{ name: string; id: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  const importMandatoryRef = useRef<HTMLInputElement>(null);
  const importCheckinRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { user } = useAuthStore();

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
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchQuery === '' ||
      reg.user.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.user.profile?.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ATTENDED' && reg.status === 'ATTENDED') ||
      (statusFilter === 'REGISTERED' && reg.status !== 'ATTENDED' && reg.status !== 'CANCELLED');
    return matchesSearch && matchesStatus;
  });

  const handleCheckinByStudentId = async (studentId: string) => {
    if (!studentId.trim()) return toast.error('Vui lòng nhập MSSV');

    setIsCheckingIn(studentId);
    try {
      await checkinApi.manualCheckin({ event_id: eventId!, student_id: studentId.trim() });
      triggerConfetti();
      toast.success(`Điểm danh thành công: ${studentId}`);
      
      if (scannedStudentId === studentId) setScannedStudentId('');
      fetchInitialData();
      
      setShowSuccessModal({ name: "Sinh viên", id: studentId.trim() });
      setTimeout(() => setShowSuccessModal(null), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Điểm danh thất bại cho MSSV: ${studentId}`);
    } finally {
      setIsCheckingIn(null);
    }
  };

  // [HÀM MỚI] Xử lý Điểm danh tất cả
  const handleCheckinAll = async () => {
    // 1. Lọc ra những bạn chưa điểm danh và có mã sinh viên
    const pendingStudents = registrations.filter(
      reg => reg.status !== 'ATTENDED' && reg.status !== 'CANCELLED' && reg.user.profile?.student_id
    );

    if (pendingStudents.length === 0) {
      toast.info('Không có sinh viên nào cần điểm danh lúc này.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn điểm danh cho toàn bộ ${pendingStudents.length} sinh viên chưa check-in không?`)) {
      return;
    }

    // 2. Tạo mảng student_id
    const studentIds = pendingStudents.map(reg => reg.user.profile!.student_id);

    setIsCheckinAllLoading(true);
    toast.loading('Đang xử lý điểm danh hàng loạt...', { id: 'checkin-all' });
    
    try {
      // 3. Tái sử dụng API import điểm danh bù
      await checkinApi.importCheckin(eventId!, { studentIds });
      
      toast.dismiss('checkin-all');
      triggerConfetti();
      toast.success(`Đã điểm danh thành công cho ${studentIds.length} sinh viên!`);
      
      // 4. Load lại dữ liệu
      fetchInitialData();
    } catch (err: any) {
      toast.dismiss('checkin-all');
      toast.error(err.response?.data?.message || 'Lỗi khi điểm danh hàng loạt');
    } finally {
      setIsCheckinAllLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150, spread: 100, origin: { y: 0.6 },
      colors: ['#10b981', '#14b8a6', '#047857', '#34d399', '#6ee7b7'],
    });
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {}
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
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => onScanSuccess(decodedText),
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
    await handleCheckinByStudentId(decodedText);
  }, [stopScanner]);

  useEffect(() => { return () => { stopScanner(); }; }, [stopScanner]);
  useEffect(() => { if (activeTab !== 'scanner') stopScanner(); }, [activeTab, stopScanner]);

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
    XLSX.writeFile(wb, `DS_Suki_en_${eventId}.xlsx`);
    toast.success('Xuất Excel thành công!');
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 'MSSV': 'SV001', 'Ghi chú': 'Nhập mã số sinh viên vào cột MSSV' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Template_Import_MSSV.xlsx`);
  };

  const readStudentIdsFromFile = async (file: File): Promise<string[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

    const studentIds: string[] = [];
    for (const row of jsonData) {
      const keys = Object.keys(row);
      const mssvKey = keys.find((k) => k.trim().toLowerCase() === 'mssv' || k.trim().toLowerCase() === 'student_id');
      if (mssvKey && row[mssvKey]) {
        studentIds.push(String(row[mssvKey]).trim());
      }
    }
    return studentIds;
  };

  const handleImportMandatory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const studentIds = await readStudentIdsFromFile(file);
      if (studentIds.length === 0) return toast.error('Không tìm thấy cột MSSV trong file');

      toast.loading('Đang nhập danh sách Đăng ký...', { id: 'import-reg' });
      const result = await eventsApi.importMandatoryStudents(eventId!, studentIds);
      toast.dismiss('import-reg');
      toast.success(result.data?.message || 'Import danh sách đăng ký thành công!');
      fetchInitialData();
    } catch (err: any) {
      toast.dismiss('import-reg');
      toast.error(err.response?.data?.message || 'Lỗi khi import');
    } finally {
      setIsImporting(false);
      if (importMandatoryRef.current) importMandatoryRef.current.value = '';
    }
  };

  const handleImportCheckin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const studentIds = await readStudentIdsFromFile(file);
      if (studentIds.length === 0) return toast.error('Không tìm thấy cột MSSV trong file');

      toast.loading('Đang điểm danh bù hàng loạt...', { id: 'import-checkin' });
      const result = await checkinApi.importCheckin(eventId!, { studentIds });
      toast.dismiss('import-checkin');
      toast.success(result.data?.message || 'Import điểm danh bù thành công!');
      fetchInitialData();
    } catch (err: any) {
      toast.dismiss('import-checkin');
      toast.error(err.response?.data?.message || 'Lỗi khi import điểm danh bù');
    } finally {
      setIsImporting(false);
      if (importCheckinRef.current) importCheckinRef.current.value = '';
    }
  };

  const totalRegistered = registrations.length;
  const totalAttended = registrations.filter(r => r.status === 'ATTENDED').length;
  const checkinPercent = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50"><Loader2 className="w-12 h-12 animate-spin text-green-500" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 space-y-6 rounded-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mb-3 border-green-200 text-green-700 hover:bg-green-50 rounded-lg">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
          </Button>
          <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight">{event?.title}</h1>
          <p className="text-gray-500 font-medium mt-1">Quản lý người tham gia & điểm danh</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Giới hạn vé</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{event?.max_slots || '∞'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl"><Users className="h-6 w-6 text-green-600" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Đã đăng ký</p>
              <p className="text-3xl font-black text-gray-800 mt-1">{totalRegistered}</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-xl"><UserCheck className="h-6 w-6 text-teal-600" /></div>
          </div>
          <div className="w-full bg-green-50 rounded-full h-2 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${checkinPercent}%` }} className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full transition-all" />
          </div>
          <p className="text-xs font-bold text-green-600 mt-2 text-right">{checkinPercent}% đã check-in</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-500 p-6 rounded-2xl shadow-md border border-green-400 text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10"><CheckCircle2 className="w-32 h-32" /></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-100 uppercase tracking-wider">Tổng điểm danh</p>
              <p className="text-4xl font-black text-white mt-1">{totalAttended}</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl"><CheckCircle2 className="h-6 w-6 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {user?.role === 'PAGE_ADMIN' && event?.page_id && (
            <>
              {/* Nút 1: Import Đăng Ký */}
              <Button variant="outline" size="sm" onClick={() => importMandatoryRef.current?.click()} disabled={isImporting} className="rounded-lg border-green-200 text-green-700 hover:bg-green-50 font-medium">
                <Upload className="h-4 w-4 mr-2" /> Nhập DS Đăng ký
              </Button>
              <input ref={importMandatoryRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportMandatory} />

              {/* Nút 2: Import Điểm danh bù */}
              <Button size="sm" onClick={() => importCheckinRef.current?.click()} disabled={isImporting} className="rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-sm font-medium">
                <ClipboardList className="h-4 w-4 mr-2" /> Nhập Điểm danh bù
              </Button>
              <input ref={importCheckinRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportCheckin} />

              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="text-teal-600 hover:bg-teal-50 font-medium rounded-lg">
                <Download className="h-4 w-4 mr-1.5" /> File Mẫu
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="rounded-lg border-teal-200 text-teal-700 hover:bg-teal-50 font-medium w-full sm:w-auto">
            <FileDown className="h-4 w-4 mr-2" /> Xuất Excel
          </Button>
          <Button variant="outline" size="sm" onClick={fetchInitialData} className="rounded-lg border-green-200 text-green-600 hover:bg-green-50 w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" /> Tải lại
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white p-1.5 rounded-xl w-fit shadow-sm border border-green-100">
        <button onClick={() => setActiveTab('list')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-500 hover:bg-gray-50'}`}>
          Danh sách Sinh viên
        </button>
        <button onClick={() => setActiveTab('scanner')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'scanner' ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-500 hover:bg-gray-50'}`}>
          <QrCode className="h-4 w-4" /> Quét mã QR
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'list' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            
            {/* Thanh công cụ: Điểm danh nhanh, Tìm kiếm, Lọc & ĐIỂM DANH TẤT CẢ */}
            <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
              
              {/* Điểm danh bù nhanh */}
              <div className="flex items-center gap-2 w-full xl:w-auto bg-green-50 px-4 py-2.5 rounded-xl border border-green-200">
                <span className="text-green-800 font-bold text-sm hidden sm:flex items-center whitespace-nowrap"><UserCheck className="w-4 h-4 mr-2"/> Gõ MSSV:</span>
                <input type="text" placeholder="Nhập mã sinh viên..." value={scannedStudentId} onChange={(e) => setScannedStudentId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCheckinByStudentId(scannedStudentId)} className="w-full lg:w-56 px-3 py-1.5 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium" />
                <Button size="sm" onClick={() => handleCheckinByStudentId(scannedStudentId)} disabled={isCheckingIn === scannedStudentId} className="bg-green-600 hover:bg-green-700 rounded-lg">
                  {isCheckingIn === scannedStudentId ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Lưu'}
                </Button>
              </div>

              {/* TÌM KIẾM, LỌC & ĐIỂM DANH TẤT CẢ */}
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
                  <input type="text" placeholder="Tìm sinh viên..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all" />
                </div>
                
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 bg-gray-50 border border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold text-gray-700 outline-none cursor-pointer">
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="REGISTERED">Chưa điểm danh</option>
                  <option value="ATTENDED">Đã điểm danh</option>
                </select>

                {/* [NÚT MỚI] ĐIỂM DANH TẤT CẢ */}
                <Button 
                  onClick={handleCheckinAll}
                  disabled={isCheckinAllLoading}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-sm flex items-center justify-center whitespace-nowrap rounded-lg"
                >
                  {isCheckinAllLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                  Điểm danh tất cả
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-green-50/50 border-b border-green-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase">STT</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase">Sinh viên</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase">Lớp</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase">Thời gian ĐK</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase">Trạng thái</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-green-800 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg, index) => (
                        <tr key={reg.id} className="hover:bg-green-50/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex-shrink-0 flex items-center justify-center text-green-600 font-bold overflow-hidden border border-green-200">
                                {reg.user.profile?.avatar_url ? <img src={reg.user.profile.avatar_url} className="w-full h-full object-cover" /> : reg.user.profile?.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{reg.user.profile?.full_name || 'N/A'}</p>
                                <p className="text-xs font-mono font-medium text-gray-500">{reg.user.profile?.student_id || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">{reg.user.profile?.class_name || '-'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-500">{format(new Date(reg.registered_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${reg.status === 'ATTENDED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                              {reg.status === 'ATTENDED' ? 'Đã điểm danh' : 'Chờ điểm danh'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {reg.status !== 'ATTENDED' && (
                              <Button size="sm" onClick={() => handleCheckinByStudentId(reg.user.profile?.student_id || reg.user.id)} disabled={isCheckingIn === (reg.user.profile?.student_id || reg.user.id)} className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-sm">
                                {isCheckingIn === (reg.user.profile?.student_id || reg.user.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium italic">Không tìm thấy sinh viên nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'scanner' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex flex-col items-center">
            <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-sm border border-green-100">
              <div className="relative bg-gray-900 rounded-2xl p-1 aspect-square flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-green-500 rounded-tl-xl z-10" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-green-500 rounded-tr-xl z-10" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-green-500 rounded-bl-xl z-10" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-green-500 rounded-br-xl z-10" />
                
                <div id="qr-reader-admin" className={`w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full rounded-xl overflow-hidden ${isCameraOpen ? '' : 'hidden'}`} />
                
                {!isCameraOpen && (
                  <>
                    <motion.div className="absolute w-4/5 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent shadow-lg shadow-green-500/50" animate={{ y: [-100, 100, -100] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                    <QrCode className="h-24 w-24 text-gray-600 relative z-0" />
                  </>
                )}
              </div>
              
              <p className="text-center text-gray-600 mt-5 text-sm font-medium">Đưa mã QR vào khung hình.<br/><span className="text-xs text-green-600">*Hỗ trợ quét thẻ SV điểm danh bù.</span></p>
              
              {!isCameraOpen ? (
                <Button onClick={startScanner} className="w-full mt-5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl py-3 font-bold shadow-sm">
                  <Camera className="h-5 w-5 mr-2" /> Bật Camera
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="w-full mt-5 border-green-200 text-green-700 hover:bg-green-50 rounded-xl py-3 font-bold">
                  <X className="h-5 w-5 mr-2" /> Tắt Camera
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center border-t-8 border-green-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="h-10 w-10 text-green-600" /></div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">Thành công!</h3>
              <p className="text-gray-500 font-medium mt-2">MSSV: <span className="font-mono font-bold text-xl text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 block mt-2">{showSuccessModal.id}</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventRegistrations;