import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '@/api/events.api';
import { pagesApi } from '@/api/pages.api';
import { checkinApi } from '@/api/checkin.api';
import { uploadApi } from '@/api/upload.api';
import { aiApi } from '@/api/ai.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Calendar, MapPin, Users, Award, Loader2,
  AlertCircle, X, Send, Clock, Map as MapIcon, CheckCircle2,
  Timer, FileText, ChevronRight, Download, Upload, Edit2,
  Trash2, Maximize, Navigation, Target, Crosshair, LocateFixed,
  Image, QrCode, UserCheck, AlertTriangle, Wand2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface Event {
  id: string;
  title: string;
  description: string;
  category_id: number;
  location: string;
  latitude?: string;
  longitude?: string;
  start_time: string;
  end_time: string;
  registration_deadline?: string;
  max_slots?: number;
  training_points?: number;
  banner_url?: string;
  status: string;
  created_at?: string;
  _count?: { registrations: number };
}

interface Category {
  id: number;
  name: string;
}

interface Page {
  id: string;
  name: string;
}

// Map imports
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// MapClick handler component
const MapClickHandler = ({ onClick }: { onClick: (e: any) => void }) => {
  useMapEvents({ click: onClick });
  return null;
};

// ── Custom Confirm Dialog Component ──
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', isLoading }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-full h-2 ${type === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 transition-colors disabled:opacity-50
              ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'} shadow-lg`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Xác nhận
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── MapModal Component ──
const MapModal = ({ isOpen, onClose, latitude, longitude, onLocationSelect }: any) => {
  const hasCoords = latitude && longitude;
  const initialLat = hasCoords ? parseFloat(latitude) : 20.971137;
  const initialLng = hasCoords ? parseFloat(longitude) : 105.788646;
  const [markerPosition, setMarkerPosition] = useState([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (latitude && longitude) setMarkerPosition([parseFloat(latitude), parseFloat(longitude)]);
  }, [latitude, longitude]);

  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition([lat, lng] as [number, number]);
    onLocationSelect(lat.toString(), lng.toString());
  }, [onLocationSelect]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5&addressdetails=1`
      );
      const data = await response.json();
      if (data && data[0]) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setMarkerPosition([newLat, newLng] as [number, number]);
        onLocationSelect(newLat.toString(), newLng.toString());
      } else {
        toast.error('Không tìm thấy địa chỉ');
      }
    } catch (error) {
      toast.error('Không tìm thấy địa chỉ');
    }
  };

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) return toast.error('Trình duyệt không hỗ trợ định vị');
    toast.loading('Đang lấy vị trí của bạn...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMarkerPosition([pos.coords.latitude, pos.coords.longitude] as [number, number]);
        onLocationSelect(pos.coords.latitude.toString(), pos.coords.longitude.toString());
        toast.dismiss('geo');
      },
      (err) => {
        toast.error('Không thể lấy vị trí. Vui lòng chọn thủ công.');
        toast.dismiss('geo');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
          <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
            <MapIcon className="text-emerald-500" /> Chọn vị trí trên bản đồ
          </h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"><X size={20} /></button>
        </div>

        <div className="p-4 flex flex-col md:flex-row gap-3 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm địa chỉ (ví dụ: UTEHY)..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200">
              <Navigation size={16} />
            </button>
          </form>
          <button type="button" onClick={handleGetLocation} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 whitespace-nowrap text-sm font-medium">
            <LocateFixed size={18} /> Vị trí của tôi
          </button>
        </div>

        <div className="relative flex-1 bg-gray-100">
          <MapContainer center={markerPosition as L.LatLngExpression} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={markerPosition as L.LatLngExpression} icon={redIcon} />
            <MapClickHandler onClick={handleMapClick} />
          </MapContainer>
        </div>

        <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
          <div className="text-sm font-mono bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
            Lat: {markerPosition[0].toFixed(6)} | Lng: {markerPosition[1].toFixed(6)}
          </div>
          <button onClick={onClose} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all font-medium flex items-center gap-2">
            <CheckCircle2 size={18} /> Xác nhận vị trí
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Event Management Component ──
export const EventManagement = () => {
  const { token } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

   // Modals & Dialogs
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isMapModalOpen, setIsMapModalOpen] = useState(false);
   const [isAiModalOpen, setIsAiModalOpen] = useState(false);
   const [editingEventId, setEditingEventId] = useState<string | null>(null);
   const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger' as any });

    // AI Assistant states
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // AI Poster states
    const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
    const [posterImageUrl, setPosterImageUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '', description: '', category_id: '', location: '', latitude: '', longitude: '',
    start_time: '', end_time: '', registration_deadline: '', max_participants: '', training_points: '', banner_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

   useEffect(() => { return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]);
   useEffect(() => { if (!isModalOpen) { setImagePreview(prev => { if (prev) URL.revokeObjectURL(prev); return ''; }); setImageFile(null); setPosterImageUrl(''); } }, [isModalOpen]);

   useEffect(() => { fetchInitialData(); }, []);

   const fetchInitialData = async () => {
     try {
       setIsLoading(true);
       // Get managed page from auth store
       const { user } = useAuthStore();
       const managedPageId = user?.page_id || user?.managed_page?.id;
       let managedPage = null;
       if (managedPageId) {
         const pageRes = await pagesApi.getById(managedPageId);
         managedPage = pageRes.data.data;
       }
       if (!managedPage) {
         setIsLoading(false);
         return;
       }
       setPage(managedPage);
       const eventsRes = await eventsApi.getAll({ page_id: managedPage.id, limit: 50 });
       const rawEvents = eventsRes.data.data.data || [];
       const sortedEvents = rawEvents.sort((a: any, b: any) => new Date(b.created_at || b.start_time || b.id).getTime() - new Date(a.created_at || a.start_time || a.id).getTime());
       setEvents(sortedEvents);
       const catRes = await eventsApi.getCategories();
       setCategories(catRes.data.data);
     } catch (err) {
       console.error('Failed to fetch data', err);
     } finally {
       setIsLoading(false);
     }
   };

  const handleStartCheckin = async (eventId: string) => {
    try {
      setIsActionLoading(eventId);
      await checkinApi.startCheckin(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'ONGOING' } : e));
      navigate(`/page-admin/events/${eventId}/qr-display`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể bắt đầu điểm danh.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmEndCheckin = (eventId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kết thúc điểm danh',
      message: 'Bạn có chắc chắn muốn kết thúc điểm danh? Thao tác này sẽ đóng đăng ký và cập nhật vắng mặt cho những người chưa điểm danh.',
      type: 'warning',
      onConfirm: async () => {
        try {
          setIsActionLoading(eventId);
          await checkinApi.endCheckin(eventId);
          setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'CLOSED' } : e));
          toast.success('Đã kết thúc điểm danh và đóng sự kiện.');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Không thể kết thúc điểm danh.');
        } finally {
          setIsActionLoading(false);
        }
      }
    });
  };

  const confirmDeleteEvent = (eventId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa sự kiện',
      message: 'Bạn có chắc chắn muốn xóa sự kiện này? Toàn bộ dữ liệu liên quan sẽ bị xóa và không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        if (!page) return;
        try {
          setIsActionLoading(eventId);
          await eventsApi.delete(eventId, page.id);
          setEvents(prev => prev.filter(e => e.id !== eventId));
          toast.success('Đã xóa sự kiện thành công.');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Xóa sự kiện thất bại.');
        } finally {
          setIsActionLoading(false);
        }
      }
    });
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormData({ title: '', description: '', category_id: String(categories[0]?.id || ''), location: '', latitude: '', longitude: '', start_time: '', end_time: '', registration_deadline: '', max_participants: '', training_points: '', banner_url: '' });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(''); setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title || '', description: event.description || '', category_id: event.category_id?.toString() || '', location: event.location || '', latitude: event.latitude?.toString() || '', longitude: event.longitude?.toString() || '',
      start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : '', end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : '', registration_deadline: event.registration_deadline ? format(new Date(event.registration_deadline), "yyyy-MM-dd'T'HH:mm") : '',
      max_participants: (event.max_slots || '').toString(), training_points: (event.training_points || 0).toString(), banner_url: event.banner_url || ''
    });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(''); setIsModalOpen(true);
  };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return toast.error('Vui lòng chọn file ảnh hợp lệ');
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear AI poster if user manually uploads
      if (posterImageUrl) {
        setPosterImageUrl('');
        setFormData(prev => ({ ...prev, banner_url: '' }));
      }
    };

    const handleAiGenerate = async () => {
      if (!aiPrompt.trim()) {
        toast.error('Vui lòng nhập từ khóa hoặc chủ đề cho sự kiện');
        return;
      }
      try {
        setIsGenerating(true);
        const result = await aiApi.generateContent(aiPrompt);
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          title: result.data.data.title,
          description: result.data.data.description,
        }));
        setIsAiModalOpen(false);
        setAiPrompt('');
        toast.success('AI đã tạo nội dung thành công! Bạn có thể chỉnh sửa lại cho phù hợp.');
      } catch (err: any) {
        console.error('AI generate error:', err);
        toast.error(err.response?.data?.message || 'Lỗi khi tạo nội dung. Vui lòng thử lại.');
      } finally {
        setIsGenerating(false);
      }
    };

    const handleGeneratePoster = async () => {
      const description = formData.description.trim() || formData.title.trim();
      if (!description) {
        toast.error('Vui lòng nhập mô tả hoặc tiêu đề sự kiện');
        return;
      }

      try {
        setIsGeneratingPoster(true);
        setPosterImageUrl('');
        const result = await aiApi.generatePoster(description);

        if (result?.data?.data?.imageUrl) {
          setPosterImageUrl(result.data.data.imageUrl);
          setFormData(prev => ({ ...prev, banner_url: result.data.data.imageUrl }));
          setImageFile(null);
          setImagePreview('');
          toast.success('AI đã tạo poster thành công! Ảnh đã được thêm vào form.');
        } else {
          throw new Error('Không nhận được URL ảnh từ server');
        }
      } catch (err: any) {
        console.error('AI poster generate error:', err);
        toast.error(err.response?.data?.message || 'Lỗi khi tạo poster. Vui lòng thử lại.');
      } finally {
        setIsGeneratingPoster(false);
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !token) return toast.error('Vui lòng đăng nhập lại');
    try {
      setIsActionLoading(true);
      if (!formData.category_id) return toast.error('Vui lòng chọn danh mục sự kiện');
      if (!formData.title.trim() || !formData.description.trim() || !formData.start_time) return toast.error('Vui lòng điền đủ thông tin bắt buộc');

      let bannerUrl = formData.banner_url || '';
      if (imageFile) {
        toast.loading('Đang tải ảnh lên...', { id: 'upload-image' });
        try {
          const uploadRes = await uploadApi.uploadImage(imageFile);
          const resData = uploadRes?.data?.data || uploadRes?.data || {};
          bannerUrl = resData?.url || resData?.secure_url || resData?.banner_url || '';
          if (!bannerUrl) throw new Error("Không nhận được URL từ server");
          toast.dismiss('upload-image');
        } catch (err: any) {
          toast.error('Tải ảnh thất bại: ' + err.message);
          return setIsActionLoading(false);
        }
      }

      const categoryId = parseInt(formData.category_id.toString(), 10);
      const maxSlots = formData.max_participants ? parseInt(formData.max_participants.toString(), 10) : 0;
      const trainingPoints = formData.training_points ? parseInt(formData.training_points.toString(), 10) : 0;
      const latitude = formData.latitude ? parseFloat(formData.latitude.toString()) : null;
      const longitude = formData.longitude ? parseFloat(formData.longitude.toString()) : null;

      const startTime = new Date(formData.start_time);
      let endTime = formData.end_time ? new Date(formData.end_time) : new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
      const registrationDeadline = formData.registration_deadline ? new Date(formData.registration_deadline) : new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

      const payload: any = {
        page_id: page.id, title: formData.title.trim(), description: formData.description.trim(),
        category_id: categoryId, location: formData.location.trim(), start_time: startTime.toISOString(),
        end_time: endTime.toISOString(), registration_deadline: registrationDeadline.toISOString(),
        max_slots: maxSlots, training_points: trainingPoints, checkin_radius_m: 200, requires_approval: false, banner_url: bannerUrl || undefined,
      };
      if (latitude !== null && !isNaN(latitude)) payload.latitude = latitude;
      if (longitude !== null && !isNaN(longitude)) payload.longitude = longitude;

      if (editingEventId) {
        const res = await eventsApi.update(editingEventId, payload);
        setEvents(prev => prev.map(e => e.id === editingEventId ? res.data.data : e));
        toast.success('Cập nhật sự kiện thành công!');
      } else {
        const res = await eventsApi.create(payload);
        setEvents([res.data.data, ...events]);
        toast.success('Tạo sự kiện thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Lỗi: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Chờ duyệt', icon: <Timer size={14} /> },
      APPROVED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-100 shadow-sm', label: 'Đã duyệt', icon: <CheckCircle2 size={14} /> },
      REJECTED: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Từ chối', icon: <X size={14} /> },
      ONGOING: { color: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse', label: 'Đang diễn ra', icon: <Crosshair size={14} /> },
      CLOSED: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Đã kết thúc', icon: <FileText size={14} /> },
    };
    const { color, label, icon } = config[status] || { color: 'bg-gray-100 text-gray-700', label: status, icon: null };
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
        {icon} {label}
      </span>
    );
  };

  const filteredEvents = events.filter((event: any) => event.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-emerald-500" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-8">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">
              Quản lý Sự kiện
            </h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base flex items-center gap-2">
              <Target size={18} className="text-emerald-500" /> Tổ chức và theo dõi các hoạt động của {page?.name}.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="group flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-xl shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1 transition-all duration-300 font-semibold"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Tạo sự kiện mới
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="mt-8 relative max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-md border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-sm transition-all"
            placeholder="Tìm kiếm theo tên sự kiện..."
          />
        </div>
      </div>

      {/* ── Event Cards Grid ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event: any, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-100/50 hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Image Banner */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  {event.banner_url ? (
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                      <Image size={48} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium text-emerald-600/50">Không có ảnh</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {getStatusBadge(event.status)}
                    <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-emerald-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      <Award size={14} /> +{event.training_points} điểm
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-4 group-hover:text-emerald-600 transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><Clock size={16} /></div>
                      {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><MapPin size={16} /></div>
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><Users size={16} /></div>
                      <span>Tham gia: <strong className="text-emerald-600">{event._count?.registrations || 0}</strong> / {event.max_slots || 0}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-4 gap-2">
                    {/* Hành động chính tùy theo Status */}
                    <div className="col-span-2 flex gap-2">
                      {event.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStartCheckin(event.id)}
                          disabled={isActionLoading === event.id}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 text-sm font-medium disabled:opacity-50"
                        >
                          {isActionLoading === event.id ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={18} />}
                          Mở QR
                        </button>
                      )}

                      {event.status === 'ONGOING' && (
                        <button
                          onClick={() => confirmEndCheckin(event.id)}
                          disabled={isActionLoading === event.id}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md shadow-red-200 text-sm font-medium disabled:opacity-50"
                        >
                          {isActionLoading === event.id ? <Loader2 size={16} className="animate-spin" /> : <X size={18} />}
                          Kết thúc
                        </button>
                      )}
                      {/* Nếu chưa duyệt hoặc đã đóng thì show nút rỗng chiếm chỗ cho đẹp hoặc nút xem chi tiết */}
                      {event.status !== 'APPROVED' && event.status !== 'ONGOING' && (
                        <div className="flex-1 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm border border-gray-100">
                          {event.status === 'CLOSED' ? 'Đã kết thúc' : 'Chưa diễn ra'}
                        </div>
                      )}
                    </div>

                    {/* Các nút điều hướng cơ bản */}
                    <Link
                      to={`/page-admin/events/${event.id}/registrations`}
                      className="flex items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-colors border border-teal-100 shadow-sm"
                      title="Danh sách sinh viên"
                    >
                      <UserCheck size={18} />
                    </Link>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleOpenEditModal(event)} disabled={isActionLoading === event.id} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => confirmDeleteEvent(event.id)} disabled={isActionLoading === event.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        {isActionLoading === event.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-emerald-200">
              <Search size={48} className="mb-4 text-emerald-200" />
              <p className="text-lg text-emerald-800 font-medium">Không tìm thấy sự kiện nào.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Create/Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-emerald-100">
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
                <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-3">
                  <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Calendar size={24} /></span>
                  {editingEventId ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <form id="event-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Info */}
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16} /> Thông tin cơ bản</h3>
                    <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-semibold text-gray-700">Tên sự kiện <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleGeneratePoster}
                                disabled={isGeneratingPoster || (!formData.description.trim() && !formData.title.trim())}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Tạo poster bằng AI"
                              >
                                {isGeneratingPoster ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                                {isGeneratingPoster ? 'Đang vẽ ảnh...' : '🎨 Tạo Poster'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAiModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md shadow-indigo-200"
                                title="Viết bài bằng AI"
                              >
                                <Wand2 size={14} />
                                Viết bài bằng AI
                              </button>
                            </div>
                          </div>
                          <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" placeholder="Ví dụ: Lễ hội Xuân 2024" />
                        </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết <span className="text-red-500">*</span></label>
                        <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm resize-none" placeholder="Mô tả mục đích, nội dung..." />
                      </div>
                    </div>
                  </div>

                  {/* Time & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                      <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} /> Thời gian & Phân loại</h3>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
                        <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm">
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bắt đầu <span className="text-red-500">*</span></label>
                          <input type="datetime-local" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kết thúc</label>
                          <input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hạn đăng ký</label>
                        <input type="datetime-local" value={formData.registration_deadline} onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" />
                      </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                      <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin size={16} /> Địa điểm & GPS</h3>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nơi tổ chức</label>
                        <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="Hội trường A..." />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tọa độ GPS (Dùng để Check-in)</label>
                        <div className="flex gap-2">
                          <input readOnly value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" placeholder="Chưa chọn tọa độ" />
                          <button type="button" onClick={() => setIsMapModalOpen(true)} className="px-4 py-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 font-medium whitespace-nowrap flex items-center gap-2 transition-colors">
                            <MapIcon size={18} /> Bản đồ
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                         <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số lượng tối đa</label>
                          <input type="number" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="100" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Điểm rèn luyện</label>
                          <input type="number" value={formData.training_points} onChange={(e) => setFormData({ ...formData, training_points: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="5" />
                        </div>
                      </div>
                    </div>
                   </div>

                  {/* AI Poster Preview */}
                  {posterImageUrl && (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-pink-600 uppercase tracking-wider flex items-center gap-2">
                          <Image size={16} /> Poster AI đã tạo
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setPosterImageUrl('');
                            setFormData(prev => ({ ...prev, banner_url: '' }));
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                          <X size={14} /> Xóa
                        </button>
                      </div>
<div className="flex items-center justify-center">
                        <div className="relative w-full max-w-md aspect-[16/9] rounded-xl overflow-hidden shadow-lg border-2 border-white">
                          <img src={posterImageUrl} alt="AI Generated Poster" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <h3 className="text-white font-bold text-4xl uppercase drop-shadow-2xl text-center px-4">
                              {formData.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-pink-600 mt-3 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} /> Ảnh sẽ được sử dụng làm banner sự kiện khi bạn lưu
                      </p>
                    </div>
                  )}

                   {/* Banner Image */}
                   <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Image size={16} /> Ảnh bìa sự kiện</h3>
                    <div className="flex items-center justify-center w-full">
                      <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-emerald-300 rounded-2xl cursor-pointer bg-white hover:bg-emerald-50 transition-colors overflow-hidden group">
                        {imagePreview || formData.banner_url ? (
                          <>
                            <img src={imagePreview || formData.banner_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute flex flex-col items-center text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                              <Upload size={32} className="mb-2" />
                              <span className="font-semibold">Đổi ảnh khác</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-emerald-600">
                            <Image size={40} className="mb-3 opacity-60" />
                            <p className="mb-2 text-sm font-semibold">Nhấn để tải ảnh lên</p>
                            <p className="text-xs text-emerald-500/70">PNG, JPG, WEBP (Max: 5MB)</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <p className="text-xs text-gray-500 flex items-center gap-1.5"><AlertCircle size={14} className="text-amber-500"/> Kiểm tra kỹ thông tin trước khi lưu.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                    Hủy bỏ
                  </button>
                  <button type="submit" form="event-form" disabled={!!isActionLoading} className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:transform-none">
                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {editingEventId ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {/* ── AI Assistant Modal ── */}
       <AnimatePresence>
         {isAiModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAiModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                 <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                   <Wand2 className="text-purple-500" size={22} />
                   Trợ lý AI tạo nội dung
                 </h3>
                 <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
                   <X size={20} />
                 </button>
               </div>

               <div className="p-6 space-y-4">
                 <p className="text-sm text-gray-600">
                   Nhập từ khóa hoặc chủ đề sự kiện, AI sẽ giúp bạn viết tiêu đề và mô tả hấp dẫn.
                 </p>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Từ khóa / Chủ đề</label>
                   <textarea
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     rows={4}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm resize-none"
                     placeholder="Ví dụ: Sự kiện hiến máu mùa hè, 15/6, quyên góp máu cho người bệnh..."
                   />
                 </div>
               </div>

               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => setIsAiModalOpen(false)}
                   className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                 >
                   Hủy bỏ
                 </button>
                 <button
                   type="button"
                   onClick={handleAiGenerate}
                   disabled={isGenerating || !aiPrompt.trim()}
                   className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-indigo-200 hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
                 >
                   {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                   {isGenerating ? 'Đang tạo...' : 'Tạo nội dung'}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* ── Additional Modals ── */}
       <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        latitude={formData.latitude}
        longitude={formData.longitude}
        onLocationSelect={(lat: string, lng: string) => {
          setFormData({ ...formData, latitude: lat, longitude: lng });
          setIsMapModalOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        isLoading={!!isActionLoading}
        onClose={() => !isActionLoading && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
};