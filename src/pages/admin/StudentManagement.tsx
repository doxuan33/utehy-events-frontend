import { useState, useEffect } from 'react';
import { usersApi } from '@/api/users.api';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Upload, 
  Download,
  Lock, 
  Unlock, 
  Eye, 
  Loader2, 
  AlertCircle,
  X,
  Mail,
  Phone,
  GraduationCap,
  History,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DragDropZone } from '@/components/ui/DragDropZone';
import { apiClient } from '@/api/client';

export const StudentManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await usersApi.getAll({ 
        search: searchQuery,
        limit: 50 
      });
      // Filter only students if the API returns all roles
      const allUsers = res.data.data?.data || res.data.data || [];
      setStudents(allUsers.filter((u: any) => u.role === 'STUDENT'));
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStudentData = (data: any) => {
    const errors: string[] = [];
    
    if (!data.studentId || !/^\d{8}$/.test(data.studentId)) {
      errors.push('MSSV phải gồm đúng 8 chữ số (VD: 10120001)');
    }
    
    if (!data.fullName || data.fullName.trim().length < 2) {
      errors.push('Họ tên phải có ít nhất 2 ký tự');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email không hợp lệ (VD: sv@student.utehy.edu.vn)');
    }
    
    if (data.phone && !/^(0|\+84)[0-9]{9}$/.test(data.phone)) {
      errors.push('Số điện thoại không hợp lệ (phải đủ 10 số, bắt đầu bằng 0 hoặc +84)');
    }
    
    return errors;
  };

  const faculties = ['all', ...new Set(students.map(s => s.profile?.faculty).filter(Boolean))];
  const classes = ['all', ...new Set(students.map(s => s.profile?.class_name).filter(Boolean))];

  const filteredStudents = students.filter(student => {
    const matchesFaculty = selectedFaculty === 'all' || student.profile?.faculty === selectedFaculty;
    const matchesClass = selectedClass === 'all' || student.profile?.class_name === selectedClass;
    return matchesFaculty && matchesClass;
  });

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsImporting(true);
    setImportErrors([]);

    try {
      const res = await apiClient.post('/users/import-students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { errors = [], success = 0 } = res.data?.data || {};
      
      if (errors && errors.length > 0) {
        setImportErrors(errors.map((err: any) => ({
          row: err.row || err.line,
          studentId: err.studentId || err.mssv || 'N/A',
          message: err.message || err.error || 'Lỗi không xác định'
        })));
        
        if (success > 0) {
          toast.success(`Đã import ${success} sinh viên thành công!`);
          fetchStudents();
        }
      } else {
        toast.success('Import thành công! Tất cả sinh viên đã được tạo tài khoản.');
        setIsImportModalOpen(false);
        setSelectedFile(null);
        fetchStudents();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi import file';
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmContent, setConfirmContent] = useState({ title: '', description: '', confirmText: 'Xác nhận' });

  const handleToggleActive = async (student: any) => {
    const action = student.is_active ? 'khóa' : 'mở khóa';
    setConfirmAction(() => async () => {
      try {
        setIsActionLoading(true);
        await usersApi.toggleActive(student.id);
        setStudents(students.map(s => s.id === student.id ? { ...s, is_active: !s.is_active } : s));
        if (selectedStudent?.id === student.id) {
          setSelectedStudent({ ...selectedStudent, is_active: !student.is_active });
        }
      } catch (err) {
        console.error('Failed to toggle active', err);
        alert('Thao tác thất bại.');
      } finally {
        setIsActionLoading(false);
      }
    });
    setConfirmContent({
      title: `Xác nhận ${action} tài khoản`,
      description: `Bạn có chắc chắn muốn ${action} tài khoản của sinh viên ${student.profile?.full_name}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1)
    });
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    if (confirmAction) {
      await confirmAction();
    }
  };

  const handleViewDetails = async (student: any) => {
    try {
      setIsActionLoading(true);
      const res = await usersApi.getById(student.id);
      setSelectedStudent(res.data.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch student details', err);
      alert('Không thể tải thông tin chi tiết.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản lý Sinh viên</h1>
          <p className="text-gray-500 font-medium">Tra cứu hồ sơ, theo dõi hoạt động và quản lý tài khoản sinh viên.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="rounded-2xl px-6 py-4 flex items-center space-x-2 border-blue-100 text-blue-600 hover:bg-blue-50"
          >
            <Upload className="h-5 w-5" />
            <span className="font-bold">Nhập từ Excel</span>
          </Button>
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                const { adminApi } = await import('@/api/admin.api');
                const res = await adminApi.getTrainingPointsReport({ limit: 1000 });
                const studentsData = res.data.data?.data || res.data.data || [];
                if (studentsData.length === 0) return alert('Không có dữ liệu');
                const exportData = studentsData.map((s: any) => ({
                  'MSSV': s.profile?.student_id || 'N/A',
                  'Họ và tên': s.profile?.full_name || 'N/A',
                  'Lớp': s.profile?.class_name || 'N/A',
                  'Khoa': s.profile?.faculty || 'N/A',
                  'Điểm RL': s.profile?.training_points || 0
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "DiemRenLuyen");
                XLSX.writeFile(wb, `DiemRenLuyen_${format(new Date(), 'ddMMyyyy')}.xlsx`);
              } catch (e) {
                alert('Lỗi xuất file');
              }
            }}
            className="rounded-2xl px-6 py-4 flex items-center space-x-2 border-green-100 text-green-600 hover:bg-green-50"
          >
            <Download className="h-5 w-5" />
            <span className="font-bold">Xuất báo cáo</span>
          </Button>
          <Button className="rounded-2xl px-8 py-4 flex items-center space-x-2 shadow-xl shadow-blue-500/20">
            <UserPlus className="h-5 w-5" />
            <span className="font-bold">Thêm sinh viên</span>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, MSSV hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <span className="text-xs font-black text-gray-400 uppercase">Khoa:</span>
              <select 
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer min-w-[120px]"
              >
                <option value="all">Tất cả khoa</option>
                {faculties.filter(f => f !== 'all').map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <span className="text-xs font-black text-gray-400 uppercase">Lớp:</span>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer min-w-[120px]"
              >
                <option value="all">Tất cả lớp</option>
                {classes.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Button 
              onClick={fetchStudents}
              className="rounded-2xl px-6 py-4"
            >
              Lọc dữ liệu
            </Button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Sinh viên</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">MSSV / Lớp</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Điểm RL</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                    Không tìm thấy sinh viên nào.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg border border-blue-100 shadow-sm">
                          {student.profile?.avatar_url ? (
                            <img src={student.profile.avatar_url} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                          ) : student.profile?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                            {student.profile?.full_name}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-gray-700">{student.profile?.student_id}</p>
                      <p className="text-xs text-gray-400 font-medium">{student.profile?.class_name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-black">
                        {student.profile?.training_points || 0}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {student.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewDetails(student)}
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Xem hồ sơ"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(student)}
                          className={`p-2.5 rounded-xl transition-all ${student.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={student.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {student.is_active ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedStudent && (
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
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-2xl border-4 border-white shadow-lg">
                    {selectedStudent.avatar_url ? (
                      <img src={selectedStudent.avatar_url} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                    ) : selectedStudent.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedStudent.full_name}</h2>
                    <p className="text-sm font-bold text-gray-400">MSSV: {selectedStudent.student_id}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Info Cards */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Thông tin học vấn
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Lớp học</p>
                        <p className="text-sm font-bold text-gray-900">{selectedStudent.class_name || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Khoa</p>
                        <p className="text-sm font-bold text-gray-900">{selectedStudent.faculty || 'N/A'}</p>
                      </div>
                    </div>

                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center pt-4">
                      <Phone className="h-4 w-4 mr-2" />
                      Liên hệ
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-3" />
                        <p className="text-sm font-bold text-gray-900">{selectedStudent.email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-3" />
                        <p className="text-sm font-bold text-gray-900">{selectedStudent.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>

                  {/* History & Stats */}
                  <div className="md:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-100">
                        <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Điểm rèn luyện</p>
                        <p className="text-4xl font-black mt-1">{selectedStudent.training_points}</p>
                      </div>
                      <div className="p-6 bg-gray-900 rounded-[32px] text-white shadow-xl shadow-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sự kiện tham gia</p>
                        <p className="text-4xl font-black mt-1">{selectedStudent.attended_events_count}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <History className="h-4 w-4 mr-2" />
                        Lịch sử tham gia gần đây
                      </h3>
                      <div className="space-y-4">
                        {selectedStudent.recent_events?.length > 0 ? (
                          selectedStudent.recent_events.map((event: any) => (
                            <div key={event.id} className="flex items-center p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-100">
                              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 mr-4 shadow-sm">
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{event.title}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">
                                  {format(new Date(event.start_time), 'dd/MM/yyyy')} • {event.page?.name}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-xs font-black text-blue-600">+{event.training_points}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Điểm</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 italic">Chưa tham gia sự kiện nào.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 border-t border-gray-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <span className={`h-3 w-3 rounded-full ${selectedStudent.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-bold text-gray-500">
                    Tài khoản đang {selectedStudent.is_active ? 'hoạt động' : 'bị khóa'}
                  </span>
                </div>
                <Button 
                  onClick={() => handleToggleActive(selectedStudent)}
                  variant={selectedStudent.is_active ? 'outline' : 'primary'}
                  className={`rounded-2xl px-8 py-4 font-bold ${selectedStudent.is_active ? 'border-red-100 text-red-600 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {selectedStudent.is_active ? <Lock className="h-5 w-5 mr-2" /> : <Unlock className="h-5 w-5 mr-2" />}
                  {selectedStudent.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
        <AnimatePresence>
          {isImportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isImporting && setIsImportModalOpen(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-10 border-b border-gray-50 text-center flex-shrink-0">
                  <div className="h-20 w-20 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <FileSpreadsheet className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Nhập danh sách sinh viên</h2>
                  <p className="text-sm font-bold text-gray-400 mt-2">Tải lên file Excel để import hàng loạt qua API Backend.</p>
                </div>

                <div className="p-10 space-y-6 overflow-y-auto flex-1">
                  {/* Drag & Drop Zone */}
                  <DragDropZone
                    onFileSelect={(file) => setSelectedFile(file)}
                    selectedFile={selectedFile}
                    onClear={() => {
                      setSelectedFile(null);
                      setImportErrors([]);
                    }}
                    disabled={isImporting}
                  />

                  {/* Error Display (Glassmorphism) */}
                  {importErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="glassmorphism border-l-4 border-l-yellow-500">
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                            <h3 className="text-sm font-black text-yellow-700 uppercase tracking-wider">
                              {importErrors.length} dòng bị lỗi
                            </h3>
                          </div>
                          
                          {/* Error summary */}
                          <div className="bg-yellow-50/50 backdrop-blur-sm rounded-xl p-3 mb-3">
                            <p className="text-xs font-bold text-yellow-700">
                              Tổng cộng {importErrors.length} sinh viên có lỗi cần kiểm tra
                            </p>
                          </div>

                          {/* Error table */}
                          <div className="max-h-48 overflow-y-auto border border-yellow-100/50 rounded-xl">
                            <table className="w-full text-xs">
                              <thead className="bg-yellow-100/50 border-b border-yellow-100/50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left font-black text-yellow-800">Dòng</th>
                                  <th className="px-3 py-2 text-left font-black text-yellow-800">MSSV</th>
                                  <th className="px-3 py-2 text-left font-black text-yellow-800">Lỗi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-yellow-100/30">
                                {importErrors.map((err, idx) => (
                                  <tr key={idx} className="hover:bg-yellow-50/30 transition-colors">
                                    <td className="px-3 py-2 font-bold text-gray-700">
                                      {err.row || idx + 1}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {err.studentId || 'N/A'}
                                    </td>
                                    <td className="px-3 py-2 text-red-600 font-bold">
                                      {err.message}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedFile && !isImporting && importErrors.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl"
                    >
                      <p className="text-xs font-bold text-blue-700 mb-1">
                        <FileSpreadsheet className="h-3 w-3 inline mr-1" />
                        File đã chọn
                      </p>
                      <p className="text-sm font-black text-blue-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs font-bold text-blue-500">
                        Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="p-10 border-t border-gray-50 flex-shrink-0 space-y-3">
                  <Button
                    onClick={handleImportSubmit}
                    disabled={!selectedFile || isImporting}
                    className="w-full py-5 rounded-2xl font-black text-lg relative overflow-hidden group"
                    variant="primary"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isImporting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Xác nhận Import</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-emerald-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setSelectedFile(null);
                      setImportErrors([]);
                    }}
                    disabled={isImporting}
                    className="w-full py-3 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
