import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '@/api/events.api';
import { pagesApi } from '@/api/pages.api';
import { checkinApi } from '@/api/checkin.api';
import { uploadApi } from '@/api/upload.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Award,
  Loader2,
  AlertCircle,
  X,
  Send,
  Clock,
  Map as MapIcon,
  CheckCircle2,
  Timer,
  FileText,
  ChevronRight,
  Download,
  Upload,
  Edit2,
  Trash2,
  Maximize,
  Navigation,
  Target,
  Crosshair,
  LocateFixed,
  Image
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

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

// Custom red icon for marker
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
  useMapEvents({
    click: onClick
  });
  return null;
};

// ── MapModal Component
const MapModal = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  onLocationSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  latitude: string;
  longitude: string;
  onLocationSelect: (lat: string, lng: string) => void;
}) => {
  const hasCoords = latitude && longitude;
  const initialLat = hasCoords ? parseFloat(latitude) : 20.971137;
  const initialLng = hasCoords ? parseFloat(longitude) : 105.788646;
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize marker position when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition([parseFloat(latitude), parseFloat(longitude)]);
    }
  }, [latitude, longitude]);

  // Handle map click to set marker position
  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition([lat, lng] as [number, number]);
    onLocationSelect(lat.toString(), lng.toString());
  }, [onLocationSelect]);

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback((e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setMarkerPosition([lat, lng] as [number, number]);
    onLocationSelect(lat.toString(), lng.toString());
  }, [onLocationSelect]);

  // Handle search (using Nominatim OpenStreetMap search API)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=vn&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'UTEHY-Event-Management/1.0 (https://utehy.edu.vn)'
          }
        }
      );
      const data = await response.json();
      if (data && data[0]) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setMarkerPosition([newLat, newLng] as [number, number]);
        onLocationSelect(newLat.toString(), newLng.toString());
      } else {
        toast.error('Không tìm thấy địa chỉ');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Không tìm thấy địa chỉ');
    }
  };

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }
    toast.loading('Đang lấy vị trí của bạn...', { id: 'geo-location' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarkerPosition([lat, lng] as [number, number]);
        onLocationSelect(lat.toString(), lng.toString());
        toast.dismiss('geo-location');
      },
      (err) => {
        console.error('Geo error:', err);
        if (err.code === 1) {
          toast.error('Truy cập định vị bị từ chối. Vui lòng chọn vị trí thủ công trên bản đồ.');
        } else {
          toast.error('Không thể lấy vị trí. Vui lòng chọn thủ công trên bản đồ.');
        }
        toast.dismiss('geo-location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Chọn vị trí trên bản đồ</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[70vh]">
            {/* Search Box */}
            <form onSubmit={handleSearch} className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm địa chỉ (ví dụ: UTEHY)..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-600 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
            <p className="text-xs text-orange-500 mt-1">
              Mẹo: Nếu không tìm thấy tên trường, hãy gõ tên đường/xã/huyện (VD: Khoái Châu, Hưng Yên) hoặc tự kéo thả ghim đỏ.
            </p>

            <button
              type="button"
              onClick={handleGetLocation}
              className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
              Vị trí của tôi
            </button>

            {/* Map Container */}
            <div
              className="relative w-full h-96 rounded-2xl overflow-hidden border-2 border-emerald-200 cursor-pointer"
            >
              <MapContainer
                center={markerPosition}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <MapClickHandler onClick={handleMapClick} />
                {/* OpenStreetMap tiles */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Draggable marker */}
                <Marker
                  position={markerPosition}
                  icon={redIcon}
                  draggable
                  eventHandlers={{
                    dragend: handleMarkerDragEnd
                  }}
                />
              </MapContainer>

              {/* Overlay instructions */}
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-bold text-gray-700 shadow-lg">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Kéo thả ghim hoặc click trên bản đồ để chọn vị trí
                </div>
              </div>
            </div>

            {/* Current coordinates display */}
            <div className="text-xs text-gray-500 flex items-center">
              <Crosshair className="h-3 w-3 mr-1" />
              <span>
                Vĩ độ: {markerPosition[0].toFixed(6)}&nbsp;&nbsp;|&nbsp;&nbsp;
                Kinh độ: {markerPosition[1].toFixed(6)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const EventManagement = () => {
  const { token } = useAuthStore();
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

   // Modal states
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isMapModalOpen, setIsMapModalOpen] = useState(false);
   const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form state - imageFile holds the actual File object
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location: '',
    latitude: '',
    longitude: '',
    start_time: '',
    end_time: '',
    registration_deadline: '',
    max_participants: '',
    training_points: '',
    banner_url: '', // For display only (preview or existing URL)
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(''); // Object URL for local preview

  // Cleanup preview URL to prevent memory leaks on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

   // Cleanup when modal closes
   useEffect(() => {
     if (!isModalOpen) {
       setImagePreview(prev => {
         if (prev) URL.revokeObjectURL(prev);
         return '';
       });
       setImageFile(null);
     }
   }, [isModalOpen]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // 1. Get managed page
      const pagesRes = await pagesApi.getAll();
      const managedPage = pagesRes.data.data?.[0];
      
if (managedPage) {
         setPage(managedPage);
         // 2. Get events for this page
         const eventsRes = await eventsApi.getAll({ page_id: managedPage.id, limit: 50 });
         const rawEvents = eventsRes.data.data.data || [];
         // Sort by created_at (newest first), fallback to start_time or id
         const sortedEvents = rawEvents.sort((a: any, b: any) => {
           const dateA = new Date(a.created_at || a.start_time || a.id).getTime();
           const dateB = new Date(b.created_at || b.start_time || b.id).getTime();
           return dateB - dateA;
         });
         setEvents(sortedEvents);
       }

      // 3. Get categories
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
      console.error('Failed to start checkin', err);
      toast.error(err.response?.data?.message || 'Không thể bắt đầu điểm danh.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndCheckin = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn kết thúc điểm danh? Thao tác này sẽ đóng đăng ký và cập nhật vắng mặt cho những người chưa điểm danh.')) return;

    try {
      setIsActionLoading(eventId);
      await checkinApi.endCheckin(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'CLOSED' } : e));
      toast.success('Đã kết thúc điểm danh và đóng sự kiện.');
    } catch (err: any) {
      console.error('Failed to end checkin', err);
      toast.error(err.response?.data?.message || 'Không thể kết thúc điểm danh.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormData({
      title: '',
      description: '',
      category_id: categories[0]?.id || '',
      location: '',
      latitude: '',
      longitude: '',
      start_time: '',
      end_time: '',
      registration_deadline: '',
      max_participants: '',
      training_points: '',
      banner_url: '',
    });
    // Cleanup previous image file/preview if exists
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      category_id: event.category_id?.toString() || '',
      location: event.location || '',
      latitude: event.latitude?.toString() || '',
      longitude: event.longitude?.toString() || '',
      start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : '',
      registration_deadline: event.registration_deadline ? format(new Date(event.registration_deadline), "yyyy-MM-dd'T'HH:mm") : '',
      max_participants: (event.max_slots || '').toString(),
      training_points: (event.training_points || 0).toString(),
      banner_url: event.banner_url || event.banner_url || '',
    });
    // In edit mode, we don't have the original file; we just show existing image URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Clean up previous preview
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // We don't set in formData because we'll upload separately
  };

   const handleRemoveImage = () => {
     if (imagePreview) {
       URL.revokeObjectURL(imagePreview);
     }
     setImageFile(null);
     setImagePreview('');
   };

   // Map modal handler
   const handleMapLocationSelect = (lat: string, lng: string) => {
     setFormData({ ...formData, latitude: lat, longitude: lng });
     setIsMapModalOpen(false);
   };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này? Thao tác này không thể hoàn tác.')) return;

    try {
      setIsActionLoading(eventId);
      await eventsApi.delete(eventId, page.id);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Đã xóa sự kiện thành công.');
    } catch (err: any) {
      console.error('Failed to delete event', err);
      toast.error(err.response?.data?.message || 'Xóa sự kiện thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      setIsActionLoading(false);
      return;
    }

    try {
      setIsActionLoading(true);

      // Validate required fields
      if (!formData.category_id) {
        toast.error('Vui lòng chọn danh mục sự kiện');
        setIsActionLoading(false);
        return;
      }
if (!formData.title.trim()) {
         toast.error('Vui lòng nhập tên sự kiện');
         setIsActionLoading(false);
         return;
       }
       if (!formData.description.trim()) {
         toast.error('Vui lòng nhập mô tả sự kiện');
         setIsActionLoading(false);
         return;
       }
       if (!formData.start_time) {
         toast.error('Vui lòng chọn thời gian bắt đầu');
         setIsActionLoading(false);
         return;
       }

// Upload image if selected
      let bannerUrl = formData.banner_url || '';
      if (imageFile) {
        toast.loading('Đang tải ảnh lên...', { id: 'upload-image' });
        try {
          const uploadRes = await uploadApi.uploadImage(imageFile);

          // Parse response to extract image URL
          const resData = uploadRes?.data?.data || uploadRes?.data || {};
          bannerUrl = resData?.url
                   || resData?.secure_url
                   || resData?.banner_url
                   || '';

          // Guard clause - stop if URL extraction failed
          if (imageFile && !bannerUrl) {
            toast.error("Tải ảnh lên thất bại: Không nhận được URL từ server");
            setIsActionLoading(false);
            return;
          }

          toast.dismiss('upload-image');
        } catch (err: any) {
          toast.error('Tải ảnh thất bại: ' + (err.response?.data?.message || err.message));
          setIsActionLoading(false);
          return;
        }
      }

      // ── DATA SANITIZATION & TYPE SAFETY ──────────────────────
      // Parse numbers safely (never send NaN)
      const categoryId = formData.category_id ? parseInt(formData.category_id.toString(), 10) : 0;
      const maxSlots = formData.max_participants
        ? parseInt(formData.max_participants.toString(), 10)
        : 0;
      const trainingPoints = formData.training_points
        ? parseInt(formData.training_points.toString(), 10)
        : 0;
      const latitude = formData.latitude ? parseFloat(formData.latitude.toString()) : null;
      const longitude = formData.longitude ? parseFloat(formData.longitude.toString()) : null;

      // Validate parsed numbers
      if (isNaN(categoryId) || categoryId <= 0) {
        toast.error('Danh mục không hợp lệ');
        setIsActionLoading(false);
        return;
      }
      if (isNaN(maxSlots) || maxSlots < 1) {
        toast.error('Số lượng tham gia phải lớn hơn 0');
        setIsActionLoading(false);
        return;
      }
      if (isNaN(trainingPoints) || trainingPoints < 0) {
        toast.error('Điểm rèn luyện không hợp lệ');
        setIsActionLoading(false);
        return;
      }
      // GPS validation - only if values are provided (now optional)
      if (latitude !== null && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
        toast.error('Vĩ độ không hợp lệ');
        setIsActionLoading(false);
        return;
      }
      if (longitude !== null && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
        toast.error('Kinh độ không hợp lệ');
        setIsActionLoading(false);
        return;
      }

      // Normalize datetime inputs to ISO 8601
      const startTime = new Date(formData.start_time);
      if (isNaN(startTime.getTime())) {
        toast.error('Thời gian bắt đầu không hợp lệ');
        setIsActionLoading(false);
        return;
      }

// Auto-generate end_time if missing (fallback: +3h from start)
       let endTime: Date;
       if (formData.end_time) {
         endTime = new Date(formData.end_time);
         if (isNaN(endTime.getTime())) {
           toast.error('Thời gian kết thúc không hợp lệ');
           setIsActionLoading(false);
           return;
         }
       } else {
         endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // +3 hours
       }

       // Validate end_time > start_time
       if (endTime <= startTime) {
         toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
         setIsActionLoading(false);
         return;
       }

       // Normalize registration_deadline
       let registrationDeadline: Date;
       if (formData.registration_deadline) {
         registrationDeadline = new Date(formData.registration_deadline);
         if (isNaN(registrationDeadline.getTime())) {
           toast.error('Hạn đăng ký không hợp lệ');
           setIsActionLoading(false);
           return;
         }
       } else {
         registrationDeadline = new Date(startTime.getTime() - 24 * 60 * 60 * 1000); // 24h before start
       }

      // Validate registration_deadline <= start_time
      if (registrationDeadline > startTime) {
        toast.error('Hạn đăng ký phải trước hoặc bằng thời gian bắt đầu');
        setIsActionLoading(false);
        return;
      }

// Build payload (all numbers are proper numbers, not strings)
      const payload: any = {
        page_id: page.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: categoryId,
        location: formData.location.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        registration_deadline: registrationDeadline.toISOString(),
        max_slots: maxSlots,
        training_points: trainingPoints,
        checkin_radius_m: 200,
        requires_approval: false,
        banner_url: bannerUrl || undefined,
      };

// Only include GPS if provided (optional in backend)
        if (latitude !== null && !isNaN(latitude)) payload.latitude = latitude;
        if (longitude !== null && !isNaN(longitude)) payload.longitude = longitude;

        if (editingEventId) {
         const res = await eventsApi.update(editingEventId, payload);
         setEvents(prev => prev.map(e => e.id === editingEventId ? res.data.data : e));
         toast.success('Cập nhật sự kiện thành công!');
       } else {
         const res = await eventsApi.create(payload);
         setEvents([res.data.data, ...events]);
         toast.success('Gửi yêu cầu phê duyệt sự kiện thành công!');
       }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save event:', err);
      // Detailed error logging
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.errors || err.message || 'Lỗi không xác định từ Server';
      console.error("Chi tiết lỗi Backend:", errorData);
      toast.error(`Lỗi: ${JSON.stringify(errorMessage)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      APPROVED: 'bg-green-50 text-green-700 border-green-100',
      REJECTED: 'bg-red-50 text-red-700 border-red-100',
      ONGOING: 'bg-blue-50 text-blue-700 border-blue-100',
      CLOSED: 'bg-gray-50 text-gray-700 border-gray-100',
    };
    const labels: any = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      ONGOING: 'Đang diễn ra',
      CLOSED: 'Đã kết thúc',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sự kiện</h1>
          <p className="text-gray-500 text-sm">Tổ chức và theo dõi các hoạt động ngoại khóa của {page?.name}.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center space-x-2 rounded-2xl px-6">
          <Plus className="h-5 w-5" />
          <span>Tạo sự kiện mới</span>
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-blue-100 transition-all group"
            >
               <div className="flex flex-col md:flex-row gap-4">
<div className="w-20 h-12 flex-shrink-0">
                    {event.banner_url || event.banner_url ? (
                      <img 
                        src={event.banner_url || event.banner_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover rounded-xl shadow-sm border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl shadow-sm border border-gray-100">
                        <Image className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                 <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(event.status)}
                    <div className="flex items-center text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded-lg">
                      <Award className="h-3 w-3 mr-1" />
                      +{event.training_points} điểm
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{event.title}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span>{format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span>{event._count?.registrations || 0} / {event.max_slots || event.max_participants || 0} chỗ</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Timer className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span>{event.category?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2">
                  {event.status === 'APPROVED' && (
                    <Button 
                      onClick={() => handleStartCheckin(event.id)}
                      disabled={isActionLoading === event.id}
                      className="rounded-xl p-2 h-10 w-10 bg-blue-600 hover:bg-blue-700"
                      title="Bắt đầu điểm danh"
                    >
                      {isActionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                    </Button>
                  )}

                  {event.status === 'ONGOING' && (
                    <>
                      <Link 
                        to={`/page-admin/events/${event.id}/qr-display`}
                        className="flex items-center justify-center rounded-xl p-2 h-10 w-10 bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-sm"
                        title="Trình chiếu QR"
                      >
                        <Maximize className="h-4 w-4" />
                      </Link>
                      <Button 
                        onClick={() => handleEndCheckin(event.id)}
                        disabled={isActionLoading === event.id}
                        className="rounded-xl p-2 h-10 w-10 bg-red-600 hover:bg-red-700"
                        title="Kết thúc điểm danh"
                      >
                        {isActionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                    </>
                  )}

                  <Link 
                    to={`/page-admin/events/${event.id}/registrations`}
                    className="flex items-center justify-center rounded-xl p-2 h-10 w-10 border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                    title="Danh sách đăng ký"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                  <Button 
                    variant="outline" 
                    className="rounded-xl p-2 h-10 w-10"
                    onClick={() => handleOpenEditModal(event)}
                    disabled={isActionLoading === event.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl p-2 h-10 w-10 text-red-500 hover:bg-red-50 hover:border-red-200"
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={isActionLoading === event.id}
                  >
                    {isActionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <p className="text-gray-400">Không tìm thấy sự kiện nào.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  {editingEventId ? 'Chỉnh sửa sự kiện' : 'Tạo yêu cầu sự kiện mới'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Tên sự kiện</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="Ví dụ: Giải bóng đá sinh viên UTEHY 2024"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Mô tả chi tiết</label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                        placeholder="Mô tả mục đích, nội dung và quyền lợi tham gia..."
                      />
                    </div>
                  </div>
                </div>

                {/* Time & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Thời gian & Phân loại
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Danh mục</label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 ml-1">Bắt đầu</label>
                          <input
                            type="datetime-local"
                            required
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 ml-1">Kết thúc</label>
                          <input
                            type="datetime-local"
                            required
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Hạn đăng ký</label>
                        <input
                          type="datetime-local"
                          required
                          value={formData.registration_deadline}
                          onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-gray-400 ml-1 italic">* Thường trước khi sự kiện bắt đầu</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & GPS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                      <MapIcon className="h-4 w-4 mr-2" />
                      Địa điểm & GPS
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Địa điểm tổ chức</label>
                        <input
                          type="text"
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ví dụ: Hội trường A1, Cơ sở Khoái Châu"
                        />
                      </div>

{/* Map Picker Button */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Tọa độ GPS</label>
                      <button
                        type="button"
                        className="w-full bg-emerald-50 text-emerald-600 flex items-center justify-center px-4 py-3 rounded-2xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                        onClick={() => setIsMapModalOpen(true)}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Chọn vị trí trên Bản đồ
                      </button>
                    </div>
                    </div>
                  </div>
                </div>

                 {/* Slots & Points */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Số lượng & Quyền lợi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Số lượng tham gia tối đa</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Điểm rèn luyện tích lũy</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.training_points}
                        onChange={(e) => setFormData({ ...formData, training_points: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Ảnh bìa sự kiện
                  </h3>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-blue-200">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : formData.banner_url ? (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={formData.banner_url}
                          alt="Current banner"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <p className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                          Ảnh hiện tại
                        </p>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-8 w-8 mb-2 text-gray-400" />
                          <p className="text-sm font-bold text-gray-500">Chọn ảnh bìa</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-400 italic flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Sự kiện sẽ được gửi đến Admin hệ thống để phê duyệt trước khi hiển thị.
                  </div>
                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 rounded-2xl border-gray-200">
                      Hủy
                    </Button>
                    <Button type="submit" disabled={!!isActionLoading} className="px-8 rounded-2xl shadow-lg shadow-blue-100 flex items-center space-x-2">
                      {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      <span>{editingEventId ? 'Cập nhật sự kiện' : 'Gửi yêu cầu phê duyệt'}</span>
                    </Button>
                  </div>
                </div>
              </form>
</motion.div>
           </div>
         )}
       </AnimatePresence>

      {/* Map Modal */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        latitude={formData.latitude}
        longitude={formData.longitude}
        onLocationSelect={handleMapLocationSelect}
      />
    </div>
  );
};
