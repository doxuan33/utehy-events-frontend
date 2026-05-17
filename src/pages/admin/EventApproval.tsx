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
    <div className="relative space-y-6 min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 rounded-2xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight">
            Duyệt sự kiện
          </h1>
          <p className="text-gray-500 font-medium mt-1 flex items-center">
            <Sparkles className="h-4 w-4 mr-1.5 text-green-500" />
            Hệ thống AI hỗ trợ phân tích và phê duyệt thông minh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100">
            <span className="text-green-700 font-bold text-sm flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {events.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              {events.length} sự kiện chờ duyệt
            </span>
          </div>
          {events.length > 1 && (
            <Button 
              onClick={handleApproveAll}
              disabled={isBulkLoading || isLoading}
              className="rounded-lg px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-sm flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {isBulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Duyệt hàng loạt
            </Button>
          )}
        </div>
      </div>

      {/* List Events Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-green-500" />
        </div>
      ) : events.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-16 text-center border border-green-100 shadow-sm relative overflow-hidden"
        >
          <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Tuyệt vời!</h3>
          <p className="text-gray-500 font-medium mt-2">Đã hoàn thành công việc. Không có sự kiện nào đang chờ duyệt.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 relative z-10">
          {events.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-green-100 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-5 group"
            >
              <div className="h-24 w-40 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 relative">
                {event.banner_url ? (
                  <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Calendar className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded border border-green-100 uppercase tracking-wider">
                    {event.category?.name || 'Sự kiện'}
                  </span>
                  <span className="text-xs font-medium text-gray-500 flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {event.page?.name}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-green-700 transition-colors">{event.title}</h3>
                <div className="flex flex-wrap gap-3 mt-2.5">
                  <div className="flex items-center text-xs text-gray-600 font-medium">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </div>
                  <div className="flex items-center text-xs text-gray-600 font-medium">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    +{event.training_points} điểm
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenPreview(event)}
                  className="flex-1 md:flex-none rounded-lg border-green-200 text-green-700 hover:bg-green-50 font-medium transition-all"
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  Chi tiết
                </Button>
                <Button 
                  onClick={() => handleApprove(event.id)}
                  className="flex-1 md:flex-none rounded-lg bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium shadow-sm transition-all transform hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Duyệt
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modern Preview Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEvent && (
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
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col border border-green-100"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-green-50 flex items-center justify-between bg-white z-20">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-green-500" />
                    Kiểm duyệt nội dung
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                
                {/* Banner */}
                <div className="h-56 w-full rounded-xl bg-gray-50 overflow-hidden border border-gray-100 relative group">
                  {selectedEvent.banner_url ? (
                    <img src={selectedEvent.banner_url} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Calendar className="h-12 w-12" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Content */}
                  <div className="lg:col-span-2 space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 leading-tight">{selectedEvent.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                          <Users className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                          {selectedEvent.page?.name}
                        </div>
                        <div className="text-sm font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg">
                          {selectedEvent.category?.name}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                        <Info className="h-4 w-4 mr-1.5" />
                        Mô tả chi tiết
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Meta Dashboard */}
                  <div className="space-y-5">
                    <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Thông tin đăng ký</h4>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="p-2 bg-green-50 rounded-lg mr-3">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Thời gian</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {format(new Date(selectedEvent.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="p-2 bg-green-50 rounded-lg mr-3">
                            <MapPin className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Địa điểm</p>
                            <p className="text-sm font-semibold text-gray-800">{selectedEvent.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg mr-3">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Điểm rèn luyện</p>
                            <p className="text-sm font-bold text-green-600">+{selectedEvent.training_points} điểm</p>
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
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 bg-red-50 rounded-xl border border-red-100 overflow-hidden"
                    >
                      <label className="text-sm font-bold text-red-800 flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 mr-1.5" /> Lý do yêu cầu chỉnh sửa / Từ chối
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
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
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                     className="px-6 py-4 bg-gray-900 border-t border-gray-800 z-10"
                   >
                     {aiResult.isSafe ? (
                       <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-xl">
                         <div className="flex items-center gap-2 mb-1">
                           <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                           <span className="text-xs font-bold text-green-400 font-mono">
                             AI ANALYSIS: SAFE (SCORE: {aiResult.score}/100)
                           </span>
                         </div>
                         <p className="text-sm text-green-200/80 pl-4 font-mono">
                           {`> ${aiResult.reason}`}
                         </p>
                       </div>
                     ) : (
                       <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
                         <div className="flex items-center gap-2 mb-1">
                           <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                           <span className="text-xs font-bold text-red-400 font-mono">
                             AI WARNING: HIGH RISK
                           </span>
                         </div>
                         <p className="text-sm text-red-200/80 pl-4 font-mono">
                           {`> ${aiResult.reason}`}
                         </p>
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Modal Footer Controls */}
               <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap-reverse items-center justify-between gap-3 flex-shrink-0 z-20">
                 
                 {/* Left Action (AI) */}
                 <div className="w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleAnalyzeAI}
                      disabled={isAnalyzing}
                      className="w-full md:w-auto py-2.5 px-4 rounded-lg font-medium border-green-200 text-green-700 hover:bg-green-50 bg-white flex items-center justify-center gap-2 transition-all"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      ) : (
                        <Wand2 className="h-4 w-4 text-green-600" />
                      )}
                      {isAnalyzing ? 'AI đang phân tích...' : 'Phân tích tự động AI'}
                    </Button>
                 </div>

                 {/* Right Actions (Approve/Reject) */}
                 <div className="flex w-full md:w-auto items-center gap-2">
                   {!isRejecting ? (
                     <>
                       <Button 
                         variant="outline" 
                         onClick={() => setIsRejecting(true)}
                         className="flex-1 md:flex-none py-2.5 px-5 rounded-lg font-medium border-red-200 text-red-600 hover:bg-red-50 transition-all bg-white"
                       >
                         <XCircle className="h-4 w-4 mr-1.5" />
                         Từ chối
                       </Button>
                       <Button 
                         onClick={() => handleApprove(selectedEvent.id)}
                         disabled={isActionLoading}
                         className="flex-1 md:flex-none py-2.5 px-6 rounded-lg font-medium bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-sm transition-all transform hover:-translate-y-0.5"
                       >
                         {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                         Phê duyệt
                       </Button>
                     </>
                   ) : (
                     <>
                       <Button 
                         variant="outline" 
                         onClick={() => setIsRejecting(false)}
                         className="flex-1 md:flex-none py-2.5 px-5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 bg-white"
                       >
                         Hủy bỏ
                       </Button>
                       <Button 
                         onClick={handleReject}
                         disabled={isActionLoading || !rejectReason.trim()}
                         className="flex-1 md:flex-none py-2.5 px-6 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all"
                       >
                         {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
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
    </div>
  );
};