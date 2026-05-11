import { useState, useEffect } from 'react';
import { adminApi } from '@/api/admin.api';
import { eventsApi } from '@/api/events.api';
import { aiApi } from '@/api/ai.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Loader2, 
  AlertCircle,
  X,
  Award,
  Users,
  Info,
  Wand2,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export const EventApproval = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ isSafe: boolean; score: number; reason: string } | null>(null);

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPendingEvents();
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending events', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPreview = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setIsRejecting(false);
    setRejectReason('');
    setAiResult(null); // Reset AI result when opening new event
  };

  const handleApprove = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận phê duyệt',
      description: 'Bạn có chắc chắn muốn phê duyệt sự kiện này? Sau khi phê duyệt, sự kiện sẽ được công bố và mở đăng ký.',
      onConfirm: async () => {
        setConfirmDialog(c => ({ ...c, isOpen: false }));
        try {
          setIsActionLoading(true);
          await eventsApi.approve(id);
          setEvents(events.filter(e => e.id !== id));
          setIsModalOpen(false);
          toast.success('Đã phê duyệt sự kiện thành công!');
        } catch (err) {
          console.error('Failed to approve event', err);
          toast.error('Phê duyệt thất bại.');
        } finally {
          setIsActionLoading(false);
        }
      }
    });
  };

  const handleApproveAll = async () => {
    if (events.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận phê duyệt hàng loạt',
      description: `Bạn có chắc chắn muốn phê duyệt tất cả ${events.length} sự kiện này?`,
      onConfirm: async () => {
        setConfirmDialog(c => ({ ...c, isOpen: false }));
        try {
          setIsBulkLoading(true);
          await Promise.all(events.map(event => eventsApi.approve(event.id)));
          setEvents([]);
          toast.success('Đã phê duyệt tất cả sự kiện thành công!');
        } catch (err) {
          console.error('Failed to approve all events', err);
          toast.error('Có lỗi xảy ra trong quá trình phê duyệt hàng loạt. Vui lòng kiểm tra lại.');
          fetchPendingEvents();
        } finally {
          setIsBulkLoading(false);
        }
      }
    });
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    try {
      setIsActionLoading(true);
      await eventsApi.reject(selectedEvent.id, rejectReason);
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setIsModalOpen(false);
      toast.success('Đã từ chối sự kiện.');
    } catch (err) {
      console.error('Failed to reject event', err);
      toast.error('Từ chối thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAnalyzeAI = async () => {
    if (!selectedEvent) return;
    try {
      setIsAnalyzing(true);
      setAiResult(null);
      
      const payload = {
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        location: selectedEvent.location || '',
        organizer: selectedEvent.page?.name || '',
      };
      
      const result = await aiApi.analyzeEvent(payload);
      setAiResult(result.data.data);
    } catch (err: any) {
      console.error('AI analysis failed:', err);
      toast.error(err.response?.data?.message || 'Phân tích AI thất bại. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative space-y-8 min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60 p-4 md:p-8 rounded-[40px]">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10 mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl -z-10 mix-blend-multiply" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-emerald-500 drop-shadow-sm">
            Duyệt sự kiện
          </h1>
          <p className="text-gray-500 font-medium mt-2 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-emerald-500" />
            Hệ thống AI hỗ trợ phân tích và phê duyệt thông minh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-emerald-700 font-bold text-sm flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {events.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              {events.length} sự kiện chờ duyệt
            </span>
          </div>
          {events.length > 1 && (
            <Button 
              onClick={handleApproveAll}
              disabled={isBulkLoading || isLoading}
              className="rounded-2xl px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
            >
              {isBulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Duyệt hàng loạt
            </Button>
          )}
        </div>
      </div>

      {/* List Events Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
        </div>
      ) : events.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-xl rounded-[40px] p-20 text-center border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
        >
          <div className="h-24 w-24 bg-gradient-to-br from-emerald-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-900">Tuyệt vời!</h3>
          <p className="text-emerald-600/80 font-medium mt-2">Đã hoàn thành công việc. Không có sự kiện nào đang chờ duyệt.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 relative z-10">
          {events.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-emerald-50 hover:border-emerald-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-emerald-100/50 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 group"
            >
              <div className="h-28 w-48 rounded-2xl bg-gradient-to-br from-emerald-50 to-gray-100 overflow-hidden flex-shrink-0 shadow-inner relative">
                {event.banner_url ? (
                  <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-200">
                    <Calendar className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
                    {event.category?.name || 'Sự kiện'}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {event.page?.name}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-800 truncate group-hover:text-emerald-700 transition-colors">{event.title}</h3>
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                    {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <MapPin className="h-4 w-4 mr-2 text-rose-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <Award className="h-4 w-4 mr-1.5" />
                    +{event.training_points} điểm
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenPreview(event)}
                  className="flex-1 md:flex-none rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-bold transition-all"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </Button>
                <Button 
                  onClick={() => handleApprove(event.id)}
                  className="flex-1 md:flex-none rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Duyệt ngay
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modern Preview Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-gradient-to-b from-white to-emerald-50/30 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-emerald-100/50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
                <div>
                  <h2 className="text-2xl font-black text-emerald-950 flex items-center">
                    <Sparkles className="h-6 w-6 mr-2 text-emerald-500" />
                    Kiểm duyệt nội dung
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                
                {/* Banner */}
                <div className="h-64 w-full rounded-[32px] bg-gradient-to-tr from-emerald-100 to-gray-50 overflow-hidden shadow-inner relative group border border-emerald-50">
                  {selectedEvent.banner_url ? (
                    <img src={selectedEvent.banner_url} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-200">
                      <Calendar className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-gray-800 leading-tight">{selectedEvent.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <div className="flex items-center text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
                          <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                            <Users className="h-3 w-3 text-emerald-600" />
                          </div>
                          {selectedEvent.page?.name}
                        </div>
                        <div className="text-sm font-bold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-4 py-2 rounded-xl">
                          {selectedEvent.category?.name}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white/60 p-6 rounded-[24px] border border-emerald-50">
                      <h4 className="text-xs font-black text-emerald-600/70 uppercase tracking-widest flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Mô tả chi tiết
                      </h4>
                      <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Meta Dashboard */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50/80 to-white rounded-[32px] p-6 border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-6">Thông tin đăng ký</h4>
                      <div className="space-y-5">
                        <div className="flex items-start group">
                          <div className="p-2.5 bg-white rounded-xl shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            <Clock className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Thời gian</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">
                              {format(new Date(selectedEvent.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start group">
                          <div className="p-2.5 bg-white rounded-xl shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            <MapPin className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Địa điểm</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedEvent.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start group">
                          <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200 mr-4 group-hover:scale-110 transition-transform">
                            <Award className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Điểm rèn luyện</p>
                            <p className="text-sm font-bold text-emerald-600 mt-0.5">+{selectedEvent.training_points} điểm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reject Area */}
                <AnimatePresence>
                  {isRejecting && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="p-6 bg-rose-50/80 backdrop-blur-sm rounded-[32px] border border-rose-200 shadow-inner"
                    >
                      <label className="text-sm font-black text-rose-800 flex items-center mb-3">
                        <AlertCircle className="h-4 w-4 mr-2" /> Lý do yêu cầu chỉnh sửa / Từ chối
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-6 py-4 bg-white border border-rose-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none shadow-sm"
                        placeholder="Nhập chi tiết lý do để Ban tổ chức điều chỉnh lại nội dung..."
                        rows={3}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>

               {/* AI Analysis Terminal Result */}
               <AnimatePresence>
                 {aiResult && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                     className="px-6 md:px-8 py-5 bg-slate-900 border-t border-slate-800 z-10"
                   >
                     {aiResult.isSafe ? (
                       <div className="p-5 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10"><Wand2 className="h-16 w-16 text-emerald-400" /></div>
                         <div className="flex items-center gap-3 mb-2 relative z-10">
                           <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                           <span className="text-sm font-black text-emerald-400 font-mono">
                             AI ANALYSIS: SAFE (SCORE: {aiResult.score}/100)
                           </span>
                         </div>
                         <p className="text-sm text-emerald-200/80 leading-relaxed pl-5 font-mono relative z-10">
                           {`> ${aiResult.reason}`}
                         </p>
                       </div>
                     ) : (
                       <div className="p-5 bg-rose-950/50 border border-rose-500/30 rounded-2xl relative overflow-hidden">
                         <div className="flex items-center gap-3 mb-2 relative z-10">
                           <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                           <span className="text-sm font-black text-rose-400 font-mono">
                             AI WARNING: HIGH RISK
                           </span>
                         </div>
                         <p className="text-sm text-rose-200/80 leading-relaxed pl-5 font-mono relative z-10">
                           {`> ${aiResult.reason}`}
                         </p>
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Modal Footer Controls */}
               <div className="p-6 md:p-8 bg-white/80 backdrop-blur-xl border-t border-emerald-100 flex flex-wrap-reverse items-center justify-between gap-4 flex-shrink-0 z-20">
                 
                 {/* Left Action (AI) */}
                 <div className="w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleAnalyzeAI}
                      disabled={isAnalyzing}
                      className="w-full md:w-auto py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 hover:border-emerald-400 shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      ) : (
                        <Wand2 className="h-5 w-5 text-emerald-600" />
                      )}
                      {isAnalyzing ? 'AI đang phân tích...' : 'Phân tích tự động AI'}
                    </Button>
                 </div>

                 {/* Right Actions (Approve/Reject) */}
                 <div className="flex w-full md:w-auto items-center gap-3">
                   {!isRejecting ? (
                     <>
                       <Button 
                         variant="outline" 
                         onClick={() => setIsRejecting(true)}
                         className="flex-1 md:flex-none py-4 px-6 rounded-2xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all"
                       >
                         <XCircle className="h-5 w-5 mr-2" />
                         Từ chối
                       </Button>
                       <Button 
                         onClick={() => handleApprove(selectedEvent.id)}
                         disabled={isActionLoading}
                         className="flex-1 md:flex-none py-4 px-8 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                       >
                         {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                         Phê duyệt
                       </Button>
                     </>
                   ) : (
                     <>
                       <Button 
                         variant="outline" 
                         onClick={() => setIsRejecting(false)}
                         className="flex-1 md:flex-none py-4 px-6 rounded-2xl font-bold text-gray-500 hover:bg-gray-100"
                       >
                         Hủy bỏ
                       </Button>
                       <Button 
                         onClick={handleReject}
                         disabled={isActionLoading || !rejectReason.trim()}
                         className="flex-1 md:flex-none py-4 px-8 rounded-2xl font-bold bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xl shadow-rose-500/25 transition-all"
                       >
                         {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5 mr-2" />}
                         Xác nhận từ chối
                       </Button>
                     </>
                   )}
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(c => ({ ...c, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
      />
      
      {/* Global Style for Custom Scrollbar to keep UI super clean */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #10b981; }
      `}} />
    </div>
  );
};