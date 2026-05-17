import { useState, useEffect, useRef } from 'react';
import { usersApi } from '@/api/users.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  FileSpreadsheet,
  Users,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const StudentManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [activeViewClass, setActiveViewClass] = useState<string | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchStudents();
  }, []);

   const fetchStudents = async () => {
     try {
       setIsLoading(true);
       const res = await usersApi.getAll({ 
         search: searchQuery,
         limit: 50,
         role: 'STUDENT'
       });
       const allUsers = res.data.data?.data || res.data.data || [];
       setStudents(allUsers);
     } catch (err) {
       console.error('Failed to fetch students', err);
       toast.error('Không thể tải danh sách sinh viên');
     } finally {
       setIsLoading(false);
     }
   };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

    if (!isValidType) {
      toast.error('Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn. Giới hạn 5MB');
      return;
    }

try {
       const rawData = await readExcelFile(file);
       const mappedStudents = mapStudentData(rawData);
       if (mappedStudents.length === 0) return;
       setParsedStudents(mappedStudents);
       setSelectedFile(file);
       setImportErrors([]);
       setIsImportModalOpen(true);
     } catch (err: any) {
      console.error('Failed to parse Excel file', err);
      toast.error('Không thể đọc file Excel: ' + (err.message || 'Lỗi không xác định'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Không thể đọc file'));
      reader.readAsBinaryString(file);
    });
  };

   const mapStudentData = (rawData: any[]): any[] => {
     const mappedStudents = rawData.map((row: any) => {
       const getVal = (keys: string[]) => {
         const foundKey = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
         return foundKey ? row[foundKey] : '';
       };

       let phoneStr = String(getVal(['sodienthoai', 'số điện thoại', 'phone', 'so dien thoai']) || '').trim();
       if (phoneStr && phoneStr.length === 9 && !phoneStr.startsWith('0')) {
         phoneStr = '0' + phoneStr; 
       }

       return {
         student_id: String(getVal(['mssv', 'mã sv', 'student_id']) || '').trim(),
         full_name: String(getVal(['hoten', 'họ tên', 'họ và tên', 'full_name']) || '').trim(),
         class_name: String(getVal(['lop', 'lớp', 'class_name']) || '').trim(),
         faculty: String(getVal(['khoa', 'faculty']) || '').trim(),
         phone: phoneStr,
         email: String(getVal(['email']) || '').trim()
       };
     }).filter((s: any) => s.student_id && s.full_name); 

     if (mappedStudents.length === 0) {
       toast.error('Lỗi file: Không tìm thấy dữ liệu sinh viên hợp lệ. Đảm bảo file có ít nhất cột MSSV và Họ Tên.');
       return [];
     }

     return mappedStudents;
   };

  const faculties = ['all', ...new Set(students.map((s: any) => s.profile?.faculty).filter(Boolean))];
  const classes = ['all', ...new Set(students.map((s: any) => s.profile?.class_name).filter(Boolean))];

  const filteredStudents = students.filter((student: any) => {
    const matchesFaculty = selectedFaculty === 'all' || student.profile?.faculty === selectedFaculty;
    const matchesClass = selectedClass === 'all' || student.profile?.class_name === selectedClass;
    return matchesFaculty && matchesClass;
  });

  const handleImportSubmit = async () => {
    if (parsedStudents.length === 0) return;

    setIsImporting(true);
    setImportErrors([]);

    try {
      const response = await usersApi.importStudents(
        parsedStudents.map((s: any) => ({
          student_id: s.student_id,
          full_name: s.full_name,
          class_name: s.class_name || undefined,
          faculty: s.faculty || undefined,
          email: s.email || undefined,
          phone: s.phone || undefined,
        }))
      );

      const result = response.data?.data;
      const successCount = result?.success || 0;
      const failedCount = result?.failed || 0;
      const errors = result?.errors || [];

      if (errors && errors.length > 0) {
        setImportErrors(errors.map((err: any) => ({
          row: err.row || err.line,
          studentId: err.student_id || 'N/A',
          message: err.message || err.error || 'Lỗi không xác định',
        })));

        if (successCount > 0) {
          toast.success(`Import hoàn tất. Thành công: ${successCount}, Lỗi: ${failedCount}`);
          fetchStudents();
        } else {
          toast.error(`Import thất bại. Tất cả ${failedCount} dòng đều lỗi.`);
        }
      } else {
        toast.success(`Import thành công! Đã thêm ${successCount} sinh viên.`);
        handleCloseImportModal();
        fetchStudents();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi import';
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParsedStudents([]);
    setImportErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

   const handleDownloadTemplate = () => {
     try {
       const wb = XLSX.utils.book_new();
       const headers = ['MSSV', 'HoTen', 'Lop', 'Khoa', 'SoDienThoai', 'Email'];
       const sampleData = [
         ['10125001', 'Nguyễn Văn An', 'TK25.1', 'Công nghệ Thông tin', '0901234001', 'an@student.utehy.edu.vn'],
         ['10125002', 'Trần Thị Bình', 'TK25.2', 'Quản trị Kinh doanh', '0901234002', 'binh@student.utehy.edu.vn'],
       ];
       const wsData = [headers, ...sampleData];
       const ws = XLSX.utils.aoa_to_sheet(wsData);
       ws['!cols'] = [
         { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
       ];
       XLSX.utils.book_append_sheet(wb, ws, 'SinhVien');
       XLSX.writeFile(wb, 'Template_Import_SinhVien.xlsx');
       toast.success('Đã tải xuống file mẫu');
     } catch (err) {
       console.error('Failed to download template', err);
       toast.error('Không thể tải file mẫu');
     }
   };

   const handleCloseImportModal = () => {
    handleClearFile();
    setIsImportModalOpen(false);
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmContent, setConfirmContent] = useState({ title: '', description: '', confirmText: 'Xác nhận' });

   const handleToggleActive = async (student: any) => {
     const action = student.is_active ? 'khóa' : 'mở khóa';
     setConfirmAction(() => async () => {
       try {
         setIsActionLoading(true);
         const res = await usersApi.toggleActive(student.id);
         toast.success(res.data?.message || `Đã ${action} tài khoản`);
         setStudents(students.map((s: any) => s.id === student.id ? { ...s, is_active: !s.is_active } : s));
         if (selectedStudent?.id === student.id) {
           setSelectedStudent({ ...selectedStudent, is_active: !student.is_active });
         }
       } catch (err: any) {
         console.error('Failed to toggle active', err);
         const errorMessage = err.response?.data?.message || 'Không thể thực hiện thao tác';
         toast.error(errorMessage);
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
       setIsDetailModalOpen(true);
     } catch (err) {
       console.error('Failed to fetch student details', err);
       toast.error('Không thể tải thông tin chi tiết');
     } finally {
       setIsActionLoading(false);
     }
   };

  // Nhóm học sinh theo lớp
  const groupedByClass = filteredStudents.reduce((acc: Record<string, any[]>, student: any) => {
    const className = student.profile?.class_name || 'Chưa xếp lớp';
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const classNames = Object.keys(groupedByClass).sort();
  const totalPages = Math.max(1, Math.ceil(classNames.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const currentClasses = classNames.slice(
    (safeCurrentPage - 1) * itemsPerPage, 
    safeCurrentPage * itemsPerPage
  );

  const studentsInView = activeViewClass ? groupedByClass[activeViewClass] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30 p-4 md:p-8 space-y-8 rounded-[40px]">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-teal-600 tracking-tight">
            Quản lý Sinh viên
          </h1>
          <p className="text-green-700/70 font-medium mt-2">
            Tra cứu hồ sơ, theo dõi hoạt động và quản lý tài khoản sinh viên.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl px-6 py-3.5 flex items-center space-x-2 border-green-200 text-green-700 bg-white hover:bg-green-50 hover:border-green-300 transition-all shadow-sm"
          >
            <Upload className="h-5 w-5" />
            <span className="font-bold">Nhập từ Excel</span>
          </Button>
          
          <button
            onClick={handleDownloadTemplate}
            className="text-teal-600 hover:text-teal-700 hover:underline text-sm font-semibold flex items-center space-x-1 px-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Tải file mẫu tại đây</span>
          </button>
          
           <Button 
             variant="outline"
             onClick={async () => {
               try {
                 const { adminApi } = await import('@/api/admin.api');
                 const res = await adminApi.getTrainingPointsReport({ semester: undefined });
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
            className="rounded-2xl px-6 py-3.5 flex items-center space-x-2 border-teal-200 text-teal-700 bg-white hover:bg-teal-50 transition-all shadow-sm"
          >
            <Download className="h-5 w-5" />
            <span className="font-bold">Xuất báo cáo</span>
          </Button>
          
          <Button className="rounded-2xl px-8 py-3.5 flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-0.5 border-none">
            <UserPlus className="h-5 w-5" />
            <span>Thêm sinh viên</span>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm hover:shadow-md transition-shadow border border-green-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, MSSV hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
              className="w-full pl-14 pr-6 py-4 bg-green-50/30 border border-green-100 rounded-2xl text-sm font-medium text-green-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-green-50/50 px-4 py-2.5 rounded-2xl border border-green-100 hover:border-green-300 transition-colors">
              <span className="text-xs font-black text-green-600 uppercase tracking-wider">Khoa:</span>
              <select 
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-green-800 focus:ring-0 cursor-pointer min-w-[120px] outline-none"
              >
                <option value="all">Tất cả khoa</option>
                {faculties.filter((f: any) => f !== 'all').map((f: any) => (
                  <option key={f as string} value={f as string}>{f as string}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-green-50/50 px-4 py-2.5 rounded-2xl border border-green-100 hover:border-green-300 transition-colors">
              <span className="text-xs font-black text-green-600 uppercase tracking-wider">Lớp:</span>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-green-800 focus:ring-0 cursor-pointer min-w-[120px] outline-none"
              >
                <option value="all">Tất cả lớp</option>
                {classes.filter((c: any) => c !== 'all').map((c: any) => (
                  <option key={c as string} value={c as string}>{c as string}</option>
                ))}
              </select>
            </div>

            <Button 
              onClick={fetchStudents}
              className="rounded-2xl px-6 py-3.5 bg-green-100 text-green-800 hover:bg-green-200 font-bold border-none transition-colors"
            >
              Lọc dữ liệu
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex justify-center items-center py-20"
          >
            <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          </motion.div>
        ) : !activeViewClass ? (
          /* ==========================================
             VIEW 1: DANH SÁCH LỚP HỌC (GRID + PHÂN TRANG)
             ========================================== */
          <motion.div
            key="class-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-green-900 flex items-center">
                <LayoutGrid className="mr-2 h-6 w-6 text-green-500" /> 
                Danh sách Lớp học ({classNames.length})
              </h2>
            </div>

            {classNames.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-green-100 text-center shadow-sm">
                <Users className="h-16 w-16 text-green-200 mx-auto mb-4" />
                <p className="text-green-600 font-medium">Không tìm thấy dữ liệu phù hợp.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentClasses.map((cls: string) => (
                    <div 
                      key={cls}
                      onClick={() => setActiveViewClass(cls)}
                      className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-green-100 hover:border-green-300 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-green-50 to-teal-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 group-hover:text-green-800 transition-colors">
                          {cls}
                        </h3>
                        <div className="mt-2 flex items-center text-sm font-semibold text-green-600/70">
                          <Users className="h-4 w-4 mr-1.5" />
                          {groupedByClass[cls].length} Sinh viên
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 pt-6">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-2 rounded-xl bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-green-800 bg-white px-4 py-2 rounded-xl border border-green-100 shadow-sm">
                      Trang {safeCurrentPage} / {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-2 rounded-xl bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          /* ==========================================
             VIEW 2: CHI TIẾT DANH SÁCH SINH VIÊN TRONG LỚP
             ========================================== */
          <motion.div
            key="student-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-green-100">
              <button 
                onClick={() => setActiveViewClass(null)}
                className="flex items-center text-green-600 hover:text-green-800 font-bold px-4 py-2 rounded-xl hover:bg-green-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Quay lại danh sách lớp
              </button>
              <div className="flex items-center pr-4">
                <span className="text-gray-500 font-medium mr-2">Lớp:</span>
                <span className="text-lg font-black text-green-800 px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                  {activeViewClass}
                </span>
                <span className="ml-4 text-sm font-bold text-teal-600">({studentsInView.length} Sinh viên)</span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-50/80 to-teal-50/80 border-b border-green-100/50">
                      <th className="px-6 py-5 text-xs font-black text-green-800 uppercase tracking-widest">MSSV</th>
                      <th className="px-6 py-5 text-xs font-black text-green-800 uppercase tracking-widest">Họ Tên</th>
                      <th className="px-6 py-5 text-xs font-black text-green-800 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-5 text-xs font-black text-green-800 uppercase tracking-widest">Trạng thái</th>
                      <th className="px-6 py-5 text-xs font-black text-green-800 uppercase tracking-widest text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {studentsInView.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-green-600/60 font-medium italic">
                          Không có sinh viên nào trong lớp này.
                        </td>
                      </tr>
                    ) : (
                      studentsInView.map((student: any) => (
                        <tr key={student.id} className="hover:bg-green-50/40 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-sm font-mono font-bold text-gray-700">{student.profile?.student_id || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center text-teal-700 font-black text-sm border border-white shadow-sm flex-shrink-0">
                                {student.profile?.avatar_url ? (
                                  <img src={student.profile.avatar_url} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                                ) : (student.profile?.full_name?.charAt(0) || '?')}
                              </div>
                              <p className="text-sm font-bold text-gray-800 group-hover:text-green-600 transition-colors truncate max-w-[200px]" title={student.profile?.full_name || ''}>
                                {student.profile?.full_name || 'Chưa cập nhật'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 font-medium truncate max-w-[220px]" title={student.email}>
                              {student.email}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {student.is_active ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black bg-green-50 text-green-600 border border-green-200 uppercase tracking-wider shadow-sm">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider shadow-sm">
                                Đã khóa
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => handleViewDetails(student)}
                                className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-teal-100"
                                title="Xem hồ sơ"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleActive(student)}
                                className={`p-2 rounded-xl transition-all shadow-sm border border-transparent ${student.is_active ? 'text-orange-500 hover:bg-orange-50 hover:border-orange-100' : 'text-green-600 hover:bg-green-50 hover:border-green-100'}`}
                                title={student.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                              >
                                {student.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-green-100"
            >
              <div className="p-8 bg-gradient-to-r from-green-50/50 to-white border-b border-green-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center text-teal-600 font-black text-4xl border-4 border-white shadow-lg">
                    {selectedStudent.avatar_url ? (
                      <img src={selectedStudent.avatar_url} className="w-full h-full object-cover rounded-[28px]" referrerPolicy="no-referrer" />
                    ) : (selectedStudent.full_name?.charAt(0) || '?')}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-800">{selectedStudent.full_name}</h2>
                    <p className="text-sm font-bold text-gray-500 mt-1">MSSV: <span className="text-green-700">{selectedStudent.student_id}</span></p>
                    <p className="text-xs font-bold mt-2 inline-flex items-center px-3 py-1 rounded-lg bg-white border shadow-sm">
                      {selectedStudent.is_active ? (
                        <span className="text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Hoạt động</span>
                      ) : (
                        <span className="text-red-600 flex items-center"><Lock className="w-3 h-3 mr-1"/> Đã khóa</span>
                      )}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-3 bg-white border border-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-colors shadow-sm">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-gray-50/30">
                <div>
                  <h3 className="text-sm font-black text-green-700 uppercase tracking-widest mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Thông tin cá nhân
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-green-50 rounded-3xl shadow-sm">
                      <p className="text-xs font-black text-green-400 uppercase tracking-wider">Lớp học</p>
                      <p className="text-lg font-bold text-gray-800 mt-1">{selectedStudent.class_name || 'N/A'}</p>
                    </div>
                    <div className="p-5 bg-white border border-green-50 rounded-3xl shadow-sm">
                      <p className="text-xs font-black text-green-400 uppercase tracking-wider">Khoa</p>
                      <p className="text-lg font-bold text-gray-800 mt-1">{selectedStudent.faculty || 'N/A'}</p>
                    </div>
                    <div className="p-5 bg-white border border-green-50 rounded-3xl shadow-sm flex items-center">
                      <div className="p-3 bg-green-50 rounded-xl mr-4"><Mail className="h-5 w-5 text-green-600" /></div>
                      <p className="text-sm font-bold text-gray-800 truncate">{selectedStudent.email}</p>
                    </div>
                    <div className="p-5 bg-white border border-green-50 rounded-3xl shadow-sm flex items-center">
                      <div className="p-3 bg-teal-50 rounded-xl mr-4"><Phone className="h-5 w-5 text-teal-600" /></div>
                      <p className="text-sm font-bold text-gray-800">{selectedStudent.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-green-700 uppercase tracking-widest mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Lịch sử tham gia sự kiện
                  </h3>

                  {selectedStudent.participated_events && selectedStudent.participated_events.length > 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-green-50/50">
                          <tr>
                            <th className="px-5 py-4 font-black text-green-800 uppercase text-xs">Tên sự kiện</th>
                            <th className="px-5 py-4 font-black text-green-800 uppercase text-xs">Ngày tổ chức</th>
                            <th className="px-5 py-4 font-black text-green-800 uppercase text-xs">Điểm rèn luyện</th>
                            <th className="px-5 py-4 font-black text-green-800 uppercase text-xs">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50">
                          {selectedStudent.participated_events.map((item: any) => (
                            <tr key={item.registration_id} className="hover:bg-green-50/30 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center space-x-3">
                                  {item.event.banner_url && (
                                    <img src={item.event.banner_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-gray-100" referrerPolicy="no-referrer" />
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-gray-800 truncate max-w-[250px]" title={item.event.title}>
                                      {item.event.title}
                                    </p>
                                    <p className="text-xs font-bold text-green-600 mt-0.5">{item.event.page?.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-sm font-bold text-gray-600">
                                  {format(new Date(item.event.start_time), 'dd/MM/yyyy')}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black bg-teal-50 text-teal-700 border border-teal-100">
                                  +{item.event.training_points}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-green-50 text-green-600 border border-green-200 uppercase tracking-wider">
                                  Đã tham gia
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-green-200">
                      <History className="h-12 w-12 text-green-200 mx-auto mb-3" />
                      <p className="text-sm text-green-500 font-medium italic">Sinh viên chưa tham gia sự kiện nào</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-[32px] text-white shadow-lg shadow-green-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><CheckCircle2 className="w-24 h-24"/></div>
                    <div className="relative z-10">
                      <p className="text-sm font-black text-green-100 uppercase tracking-widest">Điểm rèn luyện</p>
                      <p className="text-5xl font-black mt-2">{selectedStudent.training_points}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-white border border-green-100 rounded-[32px] text-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-green-900"><History className="w-24 h-24"/></div>
                    <div className="relative z-10">
                      <p className="text-sm font-black text-green-600 uppercase tracking-widest">Sự kiện đã tham gia</p>
                      <p className="text-5xl font-black mt-2">{selectedStudent.attended_events_count}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-green-50 flex items-center justify-end flex-shrink-0">
                <Button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-2xl px-8 py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold border-none"
                >
                  Đóng
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isImporting && handleCloseImportModal()}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-green-100"
              >
                {isImporting && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-green-50 rounded-full"><Loader2 className="h-10 w-10 animate-spin text-green-500" /></div>
                      <p className="text-sm font-black text-green-800">Đang import sinh viên...</p>
                    </div>
                  </div>
                )}
              <div className="p-10 bg-gradient-to-b from-green-50/50 to-white border-b border-green-50 text-center flex-shrink-0">
                <div className="h-24 w-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-teal-600 shadow-inner">
                  <FileSpreadsheet className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-black text-gray-800">Nhập danh sách sinh viên</h2>
                <p className="text-sm font-bold text-gray-500 mt-2">Chọn file Excel hoặc CSV chứa danh sách sinh viên.</p>
              </div>

                <div className="p-10 space-y-6 overflow-y-auto flex-1 bg-gray-50/30">
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-white border border-green-200 rounded-3xl cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
                      onClick={() => !isImporting && fileInputRef.current?.click()}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100">
                          <FileSpreadsheet className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-gray-800 truncate">{selectedFile.name}</p>
                          <p className="text-sm font-bold text-green-600 mt-1">
                            {parsedStudents.length} sinh viên sẵn sàng import • Nhấn để đổi file
                          </p>
                        </div>
                        {!isImporting && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFile();
                            }}
                            className="p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
                          >
                            <X className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                {parsedStudents.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center">
                      <Eye className="w-4 h-4 mr-2" /> Xem trước ({Math.min(parsedStudents.length, 5)}/{parsedStudents.length} dòng)
                    </p>
                    <div className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-green-50/50 border-b border-green-100">
                          <tr>
                            <th className="px-5 py-3 text-left font-black text-green-800 text-xs uppercase">MSSV</th>
                            <th className="px-5 py-3 text-left font-black text-green-800 text-xs uppercase">Họ tên</th>
                            <th className="px-5 py-3 text-left font-black text-green-800 text-xs uppercase">Lớp</th>
                            <th className="px-5 py-3 text-left font-black text-green-800 text-xs uppercase">Khoa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50">
                          {parsedStudents.slice(0, 5).map((student: any, idx: number) => (
                            <tr key={idx} className="hover:bg-green-50/30">
                              <td className="px-5 py-3 font-mono font-bold text-gray-700">{student.student_id}</td>
                              <td className="px-5 py-3 font-semibold text-gray-800">{student.full_name}</td>
                              <td className="px-5 py-3 text-gray-600">{student.class_name || '-'}</td>
                              <td className="px-5 py-3 text-gray-600">{student.faculty || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="rounded-3xl border border-red-200 bg-white shadow-sm overflow-hidden">
                      <div className="p-5 bg-red-50/50 border-b border-red-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          <h3 className="text-sm font-black text-red-800 uppercase tracking-wider">
                            {importErrors.length} dòng bị lỗi
                          </h3>
                        </div>
                        <p className="text-sm font-medium text-red-600">
                          Các dòng có lỗi sẽ không được import. Vui lòng kiểm tra lại dữ liệu.
                        </p>
                      </div>

                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white sticky top-0 border-b border-red-100">
                            <tr>
                              <th className="px-5 py-3 text-left font-black text-red-800 text-xs uppercase">Dòng</th>
                              <th className="px-5 py-3 text-left font-black text-red-800 text-xs uppercase">MSSV</th>
                              <th className="px-5 py-3 text-left font-black text-red-800 text-xs uppercase">Lỗi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-50">
                            {importErrors.map((err: any, idx: number) => (
                              <tr key={idx} className="hover:bg-red-50/30">
                                <td className="px-5 py-3 font-bold text-gray-800">{err.row}</td>
                                <td className="px-5 py-3 font-mono text-gray-600">{err.studentId}</td>
                                <td className="px-5 py-3 text-red-600 font-semibold">{err.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-green-50 flex-shrink-0 flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCloseImportModal}
                  disabled={isImporting}
                  className="rounded-2xl px-6 py-3.5 border-none bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleImportSubmit}
                  disabled={parsedStudents.length === 0 || isImporting}
                  className="rounded-2xl px-8 py-3.5 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold hover:from-green-600 hover:to-teal-600 shadow-lg shadow-green-500/30 border-none relative overflow-hidden transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center space-x-2">
                    {isImporting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang import...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Import {parsedStudents.length} sinh viên</span>
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

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