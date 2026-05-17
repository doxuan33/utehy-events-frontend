import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '@/api/events.api';
import { pagesApi } from '@/api/pages.api';
import { checkinApi } from '@/api/checkin.api';
import { uploadApi } from '@/api/upload.api';
import { aiApi } from '@/api/ai.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Calendar, MapPin, Users, Award, Loader2,
  AlertCircle, X, Send, Clock, Map as MapIcon, CheckCircle2,
  Timer, FileText, ChevronRight, Download, Upload, Edit2,
  Trash2, Maximize, Navigation, Target, Crosshair, LocateFixed,
  Image, QrCode, UserCheck, AlertTriangle, Wand2, RefreshCw,
  ChevronLeft
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
   is_global?: boolean;
   registration_type?: 'NORMAL' | 'MANDATORY' | 'CHECKIN_ONLY';
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

const MapClickHandler = ({ onClick }: { onClick: (e: any) => void }) => {
  useMapEvents({ click: onClick });
  return null;
};

// ── Custom Confirm Dialog Component ──
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', isLoading }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-gray-100 overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'danger' ? 'bg-red-500' : 'bg-orange-500'}`} />
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex gap-3 justify-end">
          <button onClick={onClose} disabled={isLoading} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50">Hủy bỏ</button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-sm' : 'bg-orange-500 hover:bg-orange-600 shadow-sm'}`}>
            {isLoading && <Loader2 size={16} className="animate-spin" />} Xác nhận
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

  useEffect(() => { if (latitude && longitude) setMarkerPosition([parseFloat(latitude), parseFloat(longitude)]); }, [latitude, longitude]);

  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition([lat, lng] as [number, number]);
    onLocationSelect(lat.toString(), lng.toString());
  }, [onLocationSelect]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5&addressdetails=1`);
      const data = await response.json();
      if (data && data[0]) {
        const newLat = parseFloat(data[0].lat); const newLng = parseFloat(data[0].lon);
        setMarkerPosition([newLat, newLng] as [number, number]);
        onLocationSelect(newLat.toString(), newLng.toString());
      } else { toast.error('Không tìm thấy địa chỉ'); }
    } catch (error) { toast.error('Không tìm thấy địa chỉ'); }
  };

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) return toast.error('Trình duyệt không hỗ trợ định vị');
    toast.loading('Đang lấy vị trí...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMarkerPosition([pos.coords.latitude, pos.coords.longitude] as [number, number]);
        onLocationSelect(pos.coords.latitude.toString(), pos.coords.longitude.toString());
        toast.dismiss('geo');
      },
      (err) => { toast.error('Không thể lấy vị trí.'); toast.dismiss('geo'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] border border-green-100">
        <div className="px-6 py-4 border-b border-green-50 flex justify-between items-center bg-green-50/50">
          <h3 className="text-lg font-bold text-green-800 flex items-center gap-2"><MapIcon className="text-green-500" /> Chọn vị trí trên bản đồ</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 shadow-sm"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-4 flex flex-col md:flex-row gap-3 bg-white border-b border-green-50">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm địa chỉ..." className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-green-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm" />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"><Navigation size={16} /></button>
          </form>
          <button type="button" onClick={handleGetLocation} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors shadow-sm text-sm font-medium">
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
        <div className="px-6 py-4 bg-white border-t border-green-50 flex flex-wrap justify-between items-center gap-4">
          <div className="text-sm font-mono bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-100">Lat: {markerPosition[0].toFixed(6)} | Lng: {markerPosition[1].toFixed(6)}</div>
          <button onClick={onClose} className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2 transform hover:-translate-y-0.5">
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

  // [TÍNH NĂNG MỚI] Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

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
    is_global: false, registration_type: 'NORMAL' as 'NORMAL' | 'MANDATORY' | 'CHECKIN_ONLY',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => { return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]);
  useEffect(() => { if (!isModalOpen) { setImagePreview(prev => { if (prev) URL.revokeObjectURL(prev); return ''; }); setImageFile(null); setPosterImageUrl(''); } }, [isModalOpen]);

  useEffect(() => { fetchInitialData(); }, []);

  // Đặt lại trang về 1 khi search
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setEvents((prevEvents) => {
        let hasChanged = false;
        const updatedEvents = prevEvents.map((event) => {
          if (event.end_time && new Date(event.end_time).getTime() < now && event.status !== 'CLOSED') {
            hasChanged = true;
            return { ...event, status: 'CLOSED' };
          }
          return event;
        });
        return hasChanged ? updatedEvents : prevEvents;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const { user } = useAuthStore.getState();
      const managedPageId = user?.managed_pages?.[0]?.page?.id || user?.managed_pages?.[0]?.page_id;
      let managedPage = null;
      if (managedPageId) {
        const pageRes = await pagesApi.getById(managedPageId);
        managedPage = pageRes.data.data;
      }
      if (!managedPage) { setIsLoading(false); return; }
      setPage(managedPage);
      
      const eventsRes = await eventsApi.getAll({ page_id: managedPage.id, limit: 100 });
      const rawEvents = eventsRes.data.data.data || eventsRes.data.data || [];
      
      const now = new Date().getTime();
      const processedEvents = rawEvents.map((event: any) => {
        if (event.end_time && new Date(event.end_time).getTime() < now && event.status !== 'CLOSED') {
          return { ...event, status: 'CLOSED' };
        }
        return event;
      });

      const sortedEvents = processedEvents.sort((a: any, b: any) => new Date(b.created_at || b.start_time || b.id).getTime() - new Date(a.created_at || a.start_time || a.id).getTime());
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
    } catch (err: any) { toast.error(err.response?.data?.message || 'Không thể bắt đầu điểm danh.'); } 
    finally { setIsActionLoading(false); }
  };

  const confirmEndCheckin = (eventId: string) => {
    setConfirmDialog({
      isOpen: true, title: 'Kết thúc điểm danh', message: 'Bạn có chắc chắn muốn kết thúc điểm danh? Thao tác này sẽ đóng đăng ký và cập nhật vắng mặt cho những người chưa điểm danh.', type: 'warning',
      onConfirm: async () => {
        try {
          setIsActionLoading(eventId);
          await checkinApi.endCheckin(eventId);
          setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'CLOSED' } : e));
          toast.success('Đã kết thúc điểm danh và đóng sự kiện.');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) { toast.error(err.response?.data?.message || 'Không thể kết thúc điểm danh.'); } 
        finally { setIsActionLoading(false); }
      }
    });
  };

  const confirmDeleteEvent = (eventId: string) => {
    setConfirmDialog({
      isOpen: true, title: 'Xóa sự kiện', message: 'Bạn có chắc chắn muốn xóa sự kiện này? Toàn bộ dữ liệu liên quan sẽ bị xóa và không thể hoàn tác.', type: 'danger',
      onConfirm: async () => {
        if (!page) return;
        try {
          setIsActionLoading(eventId);
          await eventsApi.delete(eventId, page.id);
          setEvents(prev => prev.filter(e => e.id !== eventId));
          toast.success('Đã xóa sự kiện thành công.');
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) { toast.error(err.response?.data?.message || 'Xóa sự kiện thất bại.'); } 
        finally { setIsActionLoading(false); }
      }
    });
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormData({ title: '', description: '', category_id: String(categories[0]?.id || ''), location: '', latitude: '', longitude: '', start_time: '', end_time: '', registration_deadline: '', max_participants: '', training_points: '', banner_url: '', is_global: false, registration_type: 'NORMAL' });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(''); setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title || '', description: event.description || '', category_id: event.category_id?.toString() || '', location: event.location || '', latitude: event.latitude?.toString() || '', longitude: event.longitude?.toString() || '',
      start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : '', end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : '', registration_deadline: event.registration_deadline ? format(new Date(event.registration_deadline), "yyyy-MM-dd'T'HH:mm") : '',
      max_participants: (event.max_slots || '').toString(), training_points: (event.training_points || 0).toString(), banner_url: event.banner_url || '',
      is_global: event.is_global ?? false, registration_type: event.registration_type || 'NORMAL'
    });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(''); setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Vui lòng chọn file ảnh hợp lệ');
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
    if (posterImageUrl) { setPosterImageUrl(''); setFormData(prev => ({ ...prev, banner_url: '' })); }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Vui lòng nhập từ khóa hoặc chủ đề');
    try {
      setIsGenerating(true);
      const result = await aiApi.generateContent(aiPrompt);
      setFormData(prev => ({ ...prev, title: result.data.data.title, description: result.data.data.description }));
      setIsAiModalOpen(false); setAiPrompt('');
      toast.success('AI đã tạo nội dung thành công!');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi khi tạo nội dung.'); } 
    finally { setIsGenerating(false); }
  };

  const handleGeneratePoster = async () => {
    const description = formData.description.trim() || formData.title.trim();
    if (!description) return toast.error('Vui lòng nhập mô tả hoặc tiêu đề sự kiện');
    try {
      setIsGeneratingPoster(true); setPosterImageUrl('');
      const result = await aiApi.generatePoster(description);
      if (result?.data?.data?.imageUrl) {
        setPosterImageUrl(result.data.data.imageUrl); setFormData(prev => ({ ...prev, banner_url: result.data.data.imageUrl }));
        setImageFile(null); setImagePreview('');
        toast.success('AI đã tạo poster thành công!');
      } else throw new Error('Không nhận được URL ảnh');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi khi tạo poster.'); } 
    finally { setIsGeneratingPoster(false); }
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
        } catch (err: any) { toast.error('Tải ảnh thất bại: ' + err.message); return setIsActionLoading(false); }
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
        max_slots: maxSlots, training_points: trainingPoints, checkin_radius_m: 200, requires_approval: false,
        banner_url: bannerUrl || undefined, is_global: formData.is_global, registration_type: formData.registration_type,
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
    } catch (err: any) { toast.error(`Lỗi: ${err.response?.data?.message || err.message}`); } 
    finally { setIsActionLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      PENDING: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Chờ duyệt', icon: <Timer size={12} /> },
      APPROVED: { color: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Sắp diễn ra', icon: <CheckCircle2 size={12} /> },
      REJECTED: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Từ chối', icon: <X size={12} /> },
      ONGOING: { color: 'bg-green-50 text-green-700 border-green-300 animate-pulse', label: 'Đang diễn ra', icon: <Crosshair size={12} /> },
      CLOSED: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Đã kết thúc', icon: <FileText size={12} /> },
    };
    const { color, label, icon } = config[status] || { color: 'bg-gray-50 text-gray-700', label: status, icon: null };
    return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border shadow-sm ${color}`}>{icon} {label}</span>;
  };

  // Tính toán phân trang
  const filteredEvents = events.filter((event: any) => event.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvents = filteredEvents.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50"><Loader2 className="w-12 h-12 animate-spin text-green-500" /></div>;

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8 rounded-2xl">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-green-800 tracking-tight">Quản lý Sự kiện</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base flex items-center gap-2">
              <Target size={18} className="text-green-500" /> Tổ chức và theo dõi các hoạt động của {page?.name}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchInitialData} disabled={isLoading} className="rounded-lg p-3 border-green-200 text-green-600 hover:bg-green-50 shadow-sm">
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <button onClick={handleOpenCreateModal} className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 font-medium">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Tạo sự kiện
            </button>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="mt-6 relative max-w-2xl bg-white rounded-xl shadow-sm border border-green-100">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-green-500" /></div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl transition-all" placeholder="Tìm kiếm theo tên sự kiện..." />
        </div>
      </div>

      {/* ── Event Cards Grid ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {paginatedEvents.length > 0 ? (
            paginatedEvents.map((event: any, index: number) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
                <div className="relative h-48 w-full bg-gray-50 overflow-hidden border-b border-green-50">
                  {event.banner_url ? (
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-green-200 bg-gradient-to-br from-green-50 to-white">
                      <Image size={40} className="mb-2 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-green-100 flex items-center gap-1.5">
                    <Award size={14} /> +{event.training_points} điểm
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-2 mb-4 group-hover:text-green-600 transition-colors" title={event.title}>{event.title}</h3>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50/50 p-2.5 rounded-lg border border-transparent hover:border-green-100 transition-colors">
                      <div className="p-1.5 bg-green-50 rounded-md text-green-600 shadow-sm"><Clock size={16} /></div>
                      <span className="font-medium">{format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50/50 p-2.5 rounded-lg border border-transparent hover:border-green-100 transition-colors">
                      <div className="p-1.5 bg-green-50 rounded-md text-green-600 shadow-sm"><MapPin size={16} /></div>
                      <span className="truncate font-medium">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50/50 p-2.5 rounded-lg border border-transparent hover:border-green-100 transition-colors">
                      <div className="p-1.5 bg-green-50 rounded-md text-green-600 shadow-sm"><Users size={16} /></div>
                      <span className="font-medium">Đăng ký: <strong className="text-green-700 bg-green-50 px-2 py-0.5 rounded">{event._count?.registrations || 0}</strong> / {event.max_slots || '∞'}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-green-50 grid grid-cols-4 gap-2">
                    <div className="col-span-2 flex gap-2">
                      {(event.status === 'APPROVED' || event.status === 'ONGOING') && (
                        <button onClick={() => event.status === 'ONGOING' ? navigate(`/page-admin/events/${event.id}/qr-display`) : handleStartCheckin(event.id)} disabled={isActionLoading === event.id} title={event.status === 'ONGOING' ? "Mở lại màn hình QR" : "Bắt đầu điểm danh"} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 transition-all shadow-sm text-sm font-medium disabled:opacity-50">
                          {isActionLoading === event.id ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={18} />}
                        </button>
                      )}
                      {event.status === 'ONGOING' && (
                        <button onClick={() => confirmEndCheckin(event.id)} disabled={isActionLoading === event.id} title="Kết thúc điểm danh" className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-sm text-sm font-medium disabled:opacity-50">
                          {isActionLoading === event.id ? <Loader2 size={16} className="animate-spin" /> : <X size={18} />}
                        </button>
                      )}
                      {event.status !== 'APPROVED' && event.status !== 'ONGOING' && (
                        <div className="flex-1 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider border border-gray-100">
                          {event.status === 'CLOSED' ? 'Đã kết thúc' : 'Chưa mở'}
                        </div>
                      )}
                    </div>
                    <Link to={`/page-admin/events/${event.id}/registrations`} className="flex items-center justify-center rounded-lg bg-green-50 text-green-700 hover:bg-green-500 hover:text-white transition-colors border border-green-100 shadow-sm" title="Quản lý sinh viên">
                      <UserCheck size={18} />
                    </Link>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleOpenEditModal(event)} disabled={isActionLoading === event.id} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Chỉnh sửa"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDeleteEvent(event.id)} disabled={isActionLoading === event.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        {isActionLoading === event.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-green-800 bg-white rounded-2xl border border-dashed border-green-200 shadow-sm">
              <Search size={48} className="mb-4 text-green-200" />
              <p className="text-lg font-medium">Không tìm thấy sự kiện nào.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pagination Controls ── */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto mt-8 flex justify-center items-center gap-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="p-2 rounded-lg bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors shadow-sm"><ChevronLeft size={20} /></button>
          <span className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border border-green-100 shadow-sm">Trang <span className="font-bold text-green-700">{safeCurrentPage}</span> / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="p-2 rounded-lg bg-white border border-green-100 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors shadow-sm"><ChevronRight size={20} /></button>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-green-100 flex flex-col max-h-[90vh]">
              <div className="px-6 md:px-8 py-5 border-b border-green-50 flex justify-between items-center bg-green-50/50 flex-shrink-0">
                <h2 className="text-xl font-bold text-green-800 flex items-center gap-3">
                  <span className="p-2 bg-green-100 text-green-600 rounded-lg shadow-sm"><Calendar size={20} /></span>
                  {editingEventId ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">
                <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white p-5 md:p-6 rounded-xl border border-green-100 shadow-sm">
                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16} /> Thông tin cơ bản</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <label className="block text-sm font-bold text-gray-700">Tên sự kiện <span className="text-red-500">*</span></label>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={handleGeneratePoster} disabled={isGeneratingPoster || (!formData.description.trim() && !formData.title.trim())} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50">
                              {isGeneratingPoster ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />} {isGeneratingPoster ? 'Đang vẽ...' : 'Tạo Poster'}
                            </button>
                            <button type="button" onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold rounded-lg hover:bg-teal-100 transition-colors shadow-sm">
                              <Wand2 size={14} /> Viết bài AI
                            </button>
                          </div>
                        </div>
                        <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 shadow-sm outline-none" placeholder="Nhập tên sự kiện..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả chi tiết <span className="text-red-500">*</span></label>
                        <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 shadow-sm outline-none resize-none" placeholder="Mô tả nội dung, mục đích..." />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Time & Category */}
                    <div className="bg-white p-5 md:p-6 rounded-xl border border-green-100 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} /> Thời gian & Phân loại</h3>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
                        <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 shadow-sm outline-none">
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Bắt đầu <span className="text-red-500">*</span></label>
                          <input type="datetime-local" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-green-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-green-500 shadow-sm outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Kết thúc</label>
                          <input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-green-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-green-500 shadow-sm outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hạn đăng ký</label>
                        <input type="datetime-local" value={formData.registration_deadline} onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 shadow-sm outline-none" />
                      </div>
                    </div>

                    {/* Location & GPS */}
                    <div className="bg-white p-5 md:p-6 rounded-xl border border-green-100 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin size={16} /> Địa điểm & Thuộc tính</h3>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Nơi tổ chức</label>
                        <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 shadow-sm outline-none" placeholder="Nhập địa điểm..." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Tọa độ GPS (Check-in)</label>
                        <div className="flex gap-2">
                          <input readOnly value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none" placeholder="Tọa độ trống" />
                          <button type="button" onClick={() => setIsMapModalOpen(true)} className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-bold whitespace-nowrap flex items-center gap-2 transition-colors">
                            <MapIcon size={18} /> Bản đồ
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                         <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Số lượng tối đa</label>
                          <input type="number" min="0" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 shadow-sm outline-none" placeholder="Không giới hạn" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Điểm rèn luyện</label>
                          <input type="number" min="0" value={formData.training_points} onChange={(e) => setFormData({ ...formData, training_points: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-green-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 shadow-sm outline-none" placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sự kiện Toàn trường & Loại đăng ký */}
                  <div className="bg-white p-5 md:p-6 rounded-xl border border-green-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2"><UserCheck size={16} /> Cài đặt sự kiện</h3>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1 w-full flex items-center justify-between p-4 bg-green-50/50 rounded-xl border border-green-100">
                        <div>
                          <p className="text-sm font-bold text-green-800">Sự kiện Toàn trường</p>
                          <p className="text-xs text-green-600/70 mt-0.5 font-medium">Hiển thị trên bảng tin chung</p>
                        </div>
                        <button type="button" role="switch" aria-checked={formData.is_global} onClick={() => setFormData(prev => ({ ...prev, is_global: !prev.is_global }))} className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${formData.is_global ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${formData.is_global ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại đăng ký</label>
                        <select value={formData.registration_type} onChange={(e) => setFormData(prev => ({ ...prev, registration_type: e.target.value as 'NORMAL' | 'MANDATORY' | 'CHECKIN_ONLY' }))} className="w-full px-4 py-3 bg-white border border-green-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 shadow-sm outline-none">
                          <option value="NORMAL">Đăng ký tự nguyện</option>
                          <option value="MANDATORY">Bắt buộc tham gia</option>
                          <option value="CHECKIN_ONLY">Chỉ Check-in, không cần đăng ký</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* AI Poster Preview */}
                  {posterImageUrl && (
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider flex items-center gap-2"><Image size={16} /> Poster AI đã tạo</h3>
                        <button type="button" onClick={() => { setPosterImageUrl(''); setFormData(prev => ({ ...prev, banner_url: '' })); }} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-white border border-red-100 px-3 py-1.5 rounded-lg shadow-sm">
                          <X size={14} /> Bỏ ảnh
                        </button>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-md border-4 border-white">
                          <img src={posterImageUrl} alt="AI Generated Poster" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Banner Image */}
                  <div className="bg-white p-5 md:p-6 rounded-xl border border-green-100 shadow-sm">
                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Image size={16} /> Ảnh bìa sự kiện</h3>
                    <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-green-200 rounded-xl cursor-pointer bg-green-50/50 hover:bg-green-50 transition-colors overflow-hidden group">
                      {imagePreview || formData.banner_url ? (
                        <>
                          <img src={imagePreview || formData.banner_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-50 transition-opacity" />
                          <div className="absolute flex flex-col items-center text-green-800 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md bg-white/90 px-6 py-4 rounded-xl font-bold shadow-lg border border-green-100">
                            <Upload size={24} className="mb-2 text-green-600" />
                            Thay đổi ảnh bìa
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-green-600">
                          <Image size={40} className="mb-3 opacity-40 text-green-500" />
                          <p className="mb-1 text-sm font-bold">Nhấn để chọn ảnh bìa</p>
                          <p className="text-xs font-medium text-green-600/60">Định dạng PNG, JPG (Tối đa 5MB)</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 md:px-8 py-5 border-t border-green-50 bg-white flex flex-col-reverse sm:flex-row justify-between items-center gap-4 rounded-b-2xl flex-shrink-0">
                <p className="text-xs font-bold text-orange-500 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                  <AlertCircle size={14}/> Kiểm tra kỹ thông tin trước khi lưu.
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-green-700 bg-green-50 border border-green-100 hover:bg-green-100 transition-colors">
                    Hủy bỏ
                  </button>
                  <button type="submit" form="event-form" disabled={!!isActionLoading} className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-sm hover:shadow-md hover:from-green-600 hover:to-teal-600 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none">
                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {editingEventId ? 'Lưu cập nhật' : 'Hoàn tất tạo'}
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAiModalOpen(false)} className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-teal-100">
              <div className="px-6 py-4 border-b border-teal-50 flex justify-between items-center bg-teal-50/50">
                <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                  <Wand2 className="text-teal-600" size={20} /> Trợ lý viết bài AI
                </h3>
                <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4 bg-gray-50/30">
                <p className="text-sm text-gray-600 font-medium bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                  💡 Nhập nội dung cốt lõi, AI sẽ tự động tối ưu hóa tiêu đề và viết đoạn mô tả chi tiết, hấp dẫn chuẩn form sinh viên.
                </p>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chủ đề / Yêu cầu</label>
                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={4} className="w-full px-4 py-3 bg-white border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm resize-none" placeholder="Ví dụ: Lễ hội xuân 2024, tuyển thành viên gen 3, hiến máu tình nguyện..." />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-teal-50 bg-white flex justify-end gap-3">
                <button type="button" onClick={() => setIsAiModalOpen(false)} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="button" onClick={handleAiGenerate} disabled={isGenerating || !aiPrompt.trim()} className="px-6 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:transform-none">
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />} {isGenerating ? 'Đang viết...' : 'Bắt đầu viết'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} latitude={formData.latitude} longitude={formData.longitude} onLocationSelect={(lat: string, lng: string) => { setFormData({ ...formData, latitude: lat, longitude: lng }); setIsMapModalOpen(false); }} />
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} isLoading={!!isActionLoading} onClose={() => !isActionLoading && setConfirmDialog(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmDialog.onConfirm} />
    </div>
  );
};