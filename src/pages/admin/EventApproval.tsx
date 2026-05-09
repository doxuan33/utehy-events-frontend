import { useState, useEffect } from 'react';
import { adminApi } from '@/api/admin.api';
import { eventsApi } from '@/api/events.api';
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
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
          alert('Đã phê duyệt sự kiện thành công!');
        } catch (err) {
          console.error('Failed to approve event', err);
          alert('Phê duyệt thất bại.');
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
          alert('Đã phê duyệt tất cả sự kiện thành công!');
        } catch (err) {
          console.error('Failed to approve all events', err);
          alert('Có lỗi xảy ra trong quá trình phê duyệt hàng loạt. Vui lòng kiểm tra lại.');
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
      alert('Đã từ chối sự kiện.');
    } catch (err) {
      console.error('Failed to reject event', err);
      alert('Từ chối thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Duyệt sự kiện</h1>
          <p className="text-gray-500 font-medium">Xem xét và phê duyệt các sự kiện mới từ các Câu lạc bộ.</p>
        </div>
        <div className="flex items-center gap-4">
          {events.length > 1 && (
            <Button 
              onClick={handleApproveAll}
              disabled={isBulkLoading || isLoading}
              className="rounded-2xl px-6 py-3 bg-green-600 hover:bg-green-700 font-bold shadow-lg shadow-green-100 flex items-center gap-2"
            >
              {isBulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Phê duyệt tất cả
            </Button>
          )}
          <div className="bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100">
            <span className="text-orange-600 font-bold text-sm">
              {events.length} sự kiện đang chờ duyệt
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
          <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900">Tuyệt vời!</h3>
          <p className="text-gray-500 font-medium mt-2">Hiện tại không có sự kiện nào đang chờ phê duyệt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {events.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              <div className="h-24 w-40 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                {event.banner_url ? (
                  <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Calendar className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                    {event.category?.name || 'Sự kiện'}
                  </span>
                  <span className="text-[10px] font-black text-gray-400">
                    Đăng bởi: {event.page?.name}
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 truncate">{event.title}</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                    {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    +{event.training_points} điểm
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenPreview(event)}
                  className="flex-1 md:flex-none rounded-xl border-gray-200 font-bold"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </Button>
                <Button 
                  onClick={() => handleApprove(event.id)}
                  className="flex-1 md:flex-none rounded-xl bg-green-600 hover:bg-green-700 font-bold shadow-lg shadow-green-100"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Phê duyệt
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEvent && (
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
              className="relative w-full max-w-3xl bg-white rounded-[48px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Chi tiết sự kiện</h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">Xem xét kỹ nội dung trước khi phê duyệt.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {/* Banner */}
                <div className="h-64 w-full rounded-[32px] bg-gray-100 overflow-hidden shadow-inner">
                  {selectedEvent.banner_url ? (
                    <img src={selectedEvent.banner_url} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Calendar className="h-16 w-16" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedEvent.title}</h3>
                      <div className="flex items-center space-x-4 mt-4">
                        <div className="flex items-center text-sm font-bold text-gray-600">
                          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center mr-2">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          {selectedEvent.page?.name}
                        </div>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                          {selectedEvent.category?.name}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Mô tả sự kiện
                      </h4>
                      <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-[32px] p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Thời gian</p>
                            <p className="text-sm font-bold text-gray-900">
                              {format(new Date(selectedEvent.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Địa điểm</p>
                            <p className="text-sm font-bold text-gray-900">{selectedEvent.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Award className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Điểm rèn luyện</p>
                            <p className="text-sm font-bold text-gray-900">+{selectedEvent.training_points} điểm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isRejecting && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-red-50 rounded-[32px] border border-red-100 space-y-4"
                  >
                    <label className="text-sm font-black text-red-700 ml-1">Lý do từ chối</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all resize-none"
                      placeholder="Nhập lý do để CLB điều chỉnh..."
                      rows={3}
                    />
                  </motion.div>
                )}
              </div>

              <div className="p-8 border-t border-gray-50 flex items-center space-x-4 flex-shrink-0">
                {!isRejecting ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRejecting(true)}
                      className="flex-1 py-4 rounded-2xl font-bold border-red-100 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Từ chối
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedEvent.id)}
                      disabled={isActionLoading}
                      className="flex-2 py-4 rounded-2xl font-bold bg-green-600 hover:bg-green-700 shadow-xl shadow-green-500/20"
                    >
                      {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                      Phê duyệt ngay
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRejecting(false)}
                      className="flex-1 py-4 rounded-2xl font-bold"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleReject}
                      disabled={isActionLoading || !rejectReason.trim()}
                      className="flex-2 py-4 rounded-2xl font-bold bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20"
                    >
                      {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5 mr-2" />}
                      Xác nhận từ chối
                    </Button>
                  </>
                )}
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