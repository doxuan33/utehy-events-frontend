import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { checkinApi } from '@/api/checkin.api';
import { eventsApi } from '@/api/events.api';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  QrCode, 
  Users, 
  History, 
  Search, 
  UserPlus, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const EventCheckin = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fetchEventAndHistory = async () => {
    if (!eventId) return;
    try {
      const [eventRes, historyRes] = await Promise.all([
        eventsApi.getById(eventId),
        checkinApi.getHistory(eventId)
      ]);
      setEvent(eventRes.data.data);
      setHistory(historyRes.data.data.checkins || []);
    } catch (err) {
      console.error('Failed to fetch event checkin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndHistory();
  }, [eventId]);

  const handleStartCheckin = async () => {
    if (!eventId) return;
    setIsProcessing(true);
    try {
      await checkinApi.startCheckin(eventId);
      await fetchEventAndHistory();
      alert('Đã bắt đầu điểm danh!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bắt đầu điểm danh.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndCheckin = async () => {
    if (!eventId) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmEndCheckin = async () => {
    if (!eventId) return;
    setShowConfirmDialog(false);
    setIsProcessing(true);
    try {
      await checkinApi.endCheckin(eventId);
      await fetchEventAndHistory();
      alert('Đã kết thúc điểm danh!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể kết thúc điểm danh.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !manualStudentId) return;
    
    setIsProcessing(true);
    try {
      const res = await checkinApi.manualCheckin({
        event_id: eventId,
        student_id: manualStudentId
      });
      alert(res.data.message);
      setManualStudentId('');
      await fetchEventAndHistory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Điểm danh thủ công thất bại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.student.student_id.includes(searchQuery)
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Đang tải dữ liệu điểm danh...</p>
    </div>
  );

  if (!event) return <div className="p-8 text-center">Không tìm thấy sự kiện.</div>;

  const isOngoing = event.status === 'ONGOING';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{event.title}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <Badge variant={isOngoing ? 'success' : 'primary'}>
                {isOngoing ? 'Đang điểm danh' : event.status}
              </Badge>
              <span className="text-xs text-gray-400 font-medium flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isOngoing ? (
            <>
              <Link to={`/page-admin/events/${eventId}/qr-display`} target="_blank">
                <Button variant="outline" className="rounded-xl">
                  <QrCode className="h-4 w-4 mr-2" />
                  Mở màn hình QR
                </Button>
              </Link>
              <Button 
                variant="danger" 
                className="rounded-xl"
                onClick={handleEndCheckin}
                isLoading={isProcessing}
              >
                <Square className="h-4 w-4 mr-2 fill-current" />
                Kết thúc
              </Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              className="rounded-xl shadow-lg shadow-blue-100"
              onClick={handleStartCheckin}
              isLoading={isProcessing}
              disabled={event.status === 'CLOSED'}
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Bắt đầu điểm danh
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Manual Checkin */}
        <div className="space-y-8">
          {/* Stats Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Thống kê điểm danh
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-2xl font-black text-blue-700">{history.length}</div>
                <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Đã đến</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-2xl font-black text-gray-700">{event.current_slots - history.length}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chưa đến</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">Tổng đăng ký</span>
                <span className="font-bold text-gray-900">{event.current_slots}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500" 
                  style={{ width: `${(history.length / event.current_slots) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Manual Checkin Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-green-600" />
              Điểm danh thủ công
            </h3>
            <form onSubmit={handleManualCheckin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mã số sinh viên</label>
                <input 
                  type="text"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  placeholder="Nhập MSSV (8 chữ số)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!isOngoing}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full py-4 rounded-xl"
                disabled={!isOngoing || !manualStudentId}
                isLoading={isProcessing}
              >
                Xác nhận điểm danh
              </Button>
              {!isOngoing && (
                <p className="text-[10px] text-red-500 font-medium text-center">
                  Vui lòng bật chế độ điểm danh để thực hiện thao tác này.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Column - History List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <History className="h-5 w-5 mr-2 text-indigo-600" />
                Lịch sử điểm danh
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm sinh viên, MSSV..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Sinh viên</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Phương thức</th>
                    <th className="px-6 py-4 text-right">Điểm cộng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-400 font-medium">
                        Chưa có dữ liệu điểm danh nào.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar src={item.student.avatar_url} name={item.student.full_name} size="sm" />
                            <div>
                              <div className="text-sm font-bold text-gray-900">{item.student.full_name}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{item.student.student_id} • {item.student.class_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 font-medium">
                            {format(new Date(item.checked_in_at), 'HH:mm:ss')}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {format(new Date(item.checked_in_at), 'dd/MM/yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={item.method === 'QR_SCAN' ? 'primary' : 'warning'} className="text-[10px]">
                            {item.method === 'QR_SCAN' ? 'Quét mã QR' : 'Thủ công'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-blue-600">+{item.points_awarded}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
</div>
       </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmEndCheckin}
        title="Xác nhận kết thúc điểm danh"
        description="Bạn có chắc chắn muốn kết thúc điểm danh? Thao tác này sẽ đóng cổng điểm danh và cập nhật trạng thái vắng mặt cho những người chưa đến."
        confirmText="Kết thúc điểm danh"
      />
    </div>
  );
};
