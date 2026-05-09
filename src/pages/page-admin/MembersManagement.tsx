import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Users, UserPlus, Search, Filter, ShieldAlert,
  CheckCircle2, XCircle, MoreVertical, Trash2, Edit, X, Loader2
} from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { pagesApi } from '@/api/pages.api';

// ── Types matching backend response ──────────────────────────
interface MemberUser {
  id: string;
  email: string;
  role: 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';
  is_active: boolean;
  profile?: {
    full_name: string;
    student_id?: string;
    avatar_url?: string;
    class_name?: string;
  };
}

interface PageMember {
  id: string;
  page_id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  user: MemberUser;
}

interface JoinRequestUser {
  id: string;
  email: string;
  role: 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';
  profile?: {
    full_name: string;
    student_id?: string;
    avatar_url?: string;
    class_name?: string;
  };
}

interface PageJoinRequest {
  id: string;
  page_id: string;
  user_id: string;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  user: JoinRequestUser;
}

// ── Helper: get role label in Vietnamese ─────────────────────
const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'CHUNHIEM': return 'Chủ nhiệm';
    case 'PHOCHUNHIEM': return 'Phó Chủ nhiệm';
    default: return 'Thành viên';
  }
};

export const MembersManagement = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  const [members, setMembers] = useState<PageMember[]>([]);
  const [requests, setRequests] = useState<PageJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // States cho Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // States cho Modal
  const [memberToKick, setMemberToKick] = useState<PageMember | null>(null);
  const [memberToRoleChange, setMemberToRoleChange] = useState<PageMember | null>(null);

  // ── Lấy pageId hiện tại (trang CLB mà user quản lý) ───────
  const fetchPageId = async () => {
    try {
      const res = await pagesApi.getAll();
      const pages = res.data.data?.data || res.data.data || [];
      if (pages.length > 0) {
        setPageId(pages[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    }
  };

  // ── Nạp dữ liệu chính ────────────────────────────────────
const fetchData = async () => {
    if (!pageId) return;
    setIsLoading(true);
    try {
      const [membersRes, requestsRes] = await Promise.all([
        pagesApi.getMembers(pageId),
        pagesApi.getJoinRequests(pageId),
      ]);

      const membersData = membersRes.data.data || [];
      const requestsData = requestsRes.data.data || [];

      const sortedRequests = [...requestsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMembers(membersData);
      setRequests(sortedRequests);
    } catch (err: any) {
      console.error('Failed to fetch members/requests:', err);
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageId();
  }, []);

  useEffect(() => {
    if (pageId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // ── XỬ LÝ OPTIMISTIC UI + GỌI API ────────────────────────

  // Duyệt yêu cầu gia nhập
const handleApproveRequest = async (request: PageJoinRequest) => {
    if (!pageId) return;
    setIsActionLoading(true);
    setRequests(prev => prev.filter(req => req.user_id !== request.user_id));

    try {
      await pagesApi.approveJoinRequest(pageId, request.user_id);
      toast.success(`Đã duyệt sinh viên ${request.user?.profile?.full_name || request.user_id} vào Câu lạc bộ!`);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to approve request:', err);
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
      setRequests(prev => [...prev, request].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectRequest = async (request: PageJoinRequest) => {
    if (!pageId) return;
    setIsActionLoading(true);
    setRequests(prev => prev.filter(req => req.user_id !== request.user_id));

    try {
      await pagesApi.rejectJoinRequest(pageId, request.user_id);
      toast.warning('Đã từ chối yêu cầu gia nhập.');
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
      setRequests(prev => [...prev, request].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleKickMember = async () => {
    if (!memberToKick || !pageId) return;
    setIsActionLoading(true);
    const kickedMember = memberToKick;
    setMembers(prev => prev.filter(m => m.user_id !== kickedMember.user_id));
    setMemberToKick(null);

    try {
      await pagesApi.kickMember(pageId, kickedMember.user_id);
      toast.success(`Đã xóa ${kickedMember.user?.profile?.full_name || kickedMember.user_id} khỏi Câu lạc bộ.`);
    } catch (err: any) {
      console.error('Failed to kick member:', err);
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
      setMembers(prev => [...prev, kickedMember]);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeRole = async (newRole: 'CHUNHIEM' | 'PHOCHUNHIEM' | 'THANHVIEN') => {
    if (!memberToRoleChange || !pageId) return;
    setIsActionLoading(true);
    const prevOwner = memberToRoleChange.is_owner;
    const prevRole = memberToRoleChange.user.role;
    setMembers(prev => prev.map(m =>
      m.user_id === memberToRoleChange.user_id ? {
        ...m,
        is_owner: newRole === 'CHUNHIEM',
        user: {
          ...m.user,
          role: newRole === 'CHUNHIEM' ? 'PAGE_ADMIN' as const : 'PAGE_ADMIN' as const,
        },
      } : m
    ));
    const changedMember = memberToRoleChange;
    setMemberToRoleChange(null);

    try {
      await pagesApi.updateMemberRole(pageId, changedMember.user_id, newRole);
      toast.success(`Đã cập nhật vai trò cho ${changedMember.user?.profile?.full_name || changedMember.user_id}.`);
    } catch (err: any) {
      console.error('Failed to change role:', err);
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
      setMembers(prev => prev.map(m =>
        m.user_id === changedMember.user_id
          ? { ...m, is_owner: prevOwner, user: { ...m.user, role: prevRole } }
          : m
      ));
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── RENDER HELPERS ─────────────────────────────────────
  const filteredMembers = members.filter(m => {
    const fullName = m.user?.profile?.full_name?.toLowerCase() || '';
    const studentId = m.user?.profile?.student_id?.toLowerCase() || '';
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || studentId.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || (roleFilter === 'CHUNHIEM' && m.is_owner) || (roleFilter === 'THANHVIEN' && !m.is_owner);
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (member: PageMember) => {
    if (member.is_owner) {
      return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">Chủ nhiệm</span>;
    }
    return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">Thành viên</span>;
  };

  // ── LOADING STATE ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER & THỐNG KÊ NHANH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Thành viên</h1>
          <p className="text-gray-500 font-medium">Theo dõi nhân sự và duyệt thành viên mới</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tổng thành viên</p>
            <h3 className="text-3xl font-black text-gray-900">{members.length}</h3>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <Users className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Yêu cầu chờ duyệt</p>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-black text-gray-900">{requests.length}</h3>
              {requests.length > 0 && (
                <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">Mới</span>
              )}
            </div>
          </div>
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <UserPlus className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-fit relative">
        <button onClick={() => setActiveTab('members')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold transition-all z-10 ${activeTab === 'members' ? 'text-gray-900' : 'text-gray-500'}`}>Danh sách Thành viên</button>
        <button onClick={() => setActiveTab('requests')} className={`flex-1 md:px-8 py-2.5 rounded-xl font-bold transition-all z-10 flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'text-gray-900' : 'text-gray-500'}`}>
          Yêu cầu gia nhập {requests.length > 0 && <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">{requests.length}</span>}
        </button>
        <motion.div animate={{ x: activeTab === 'members' ? 0 : '100%' }} className="absolute top-1.5 left-1.5 w-[calc(50%-6px)] h-[calc(100%-12px)] bg-white rounded-xl shadow-sm" />
      </div>

      {/* --- TAB 1: DANH SÁCH THÀNH VIÊN --- */}
      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm theo tên, MSSV..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer min-w-[150px]">
              <option value="ALL">Tất cả vai trò</option>
              <option value="CHUNHIEM">Chủ nhiệm</option>
              <option value="THANHVIEN">Thành viên</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">MSSV / Email</th>
                  <th className="px-6 py-4">Ngày gia nhập</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => {
                  const name = member.user?.profile?.full_name || 'N/A';
                  const studentId = member.user?.profile?.student_id || 'N/A';
                  const email = member.user?.email || 'N/A';
                  const avatar = member.user?.profile?.avatar_url || '';
                  const joinDate = member.joined_at || '';

                  return (
                    <tr key={member.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={avatar} name={name} size="sm" />
                          <span className="font-bold text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-700">{studentId}</p>
                        <p className="text-xs text-gray-500">{email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {new Date(joinDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(member)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setMemberToRoleChange(member)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Đổi vai trò"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setMemberToKick(member)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Xóa khỏi CLB"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isLoading && filteredMembers.length === 0 && (
              <div className="py-20 text-center text-gray-500 font-medium">Không tìm thấy thành viên nào phù hợp.</div>
            )}
          </div>
        </motion.div>
      )}

      {/* --- TAB 2: YÊU CẦU GIA NHẬP --- */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <AnimatePresence>
            {requests.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-200 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Không có yêu cầu gia nhập nào mới!</h3>
                <p className="text-gray-500 mt-1">Đội ngũ của bạn hiện tại đã được duyệt đầy đủ.</p>
              </motion.div>
            ) : (
              requests.map((req) => {
                const name = req.user?.profile?.full_name || 'N/A';
                const studentId = req.user?.profile?.student_id || 'N/A';
                const className = req.user?.profile?.class_name || 'N/A';
                const avatar = req.user?.profile?.avatar_url || '';
                const message = req.message || '';

                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100, scale: 0.95 }}
                    className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5 group hover:border-emerald-200 transition-colors"
                  >
                    <Avatar src={avatar} name={name} size="lg" className="shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{name}</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{studentId}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{className}</span>
                      </div>
                      {message && (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-700 italic relative mt-2">
                          <span className="absolute -top-2 left-4 text-2xl text-gray-300">"</span>
                          {message}
                        </div>
                      )}
                      <p className="text-xs font-medium text-gray-400 mt-2">Nộp lúc: {new Date(req.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(req)}
                        disabled={isActionLoading}
                        className="flex-1 md:flex-none border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                      >
                        Từ chối
                      </Button>
                      <Button
                        onClick={() => handleApproveRequest(req)}
                        disabled={isActionLoading}
                        className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Duyệt ngay
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Modal Xác nhận Xóa (Kick Member) */}
      <AnimatePresence>
        {memberToKick && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isActionLoading && setMemberToKick(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl z-10 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Xóa khỏi Câu lạc bộ?</h2>
              <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa sinh viên <strong className="text-gray-900">{memberToKick.user?.profile?.full_name || memberToKick.user_id} ({memberToKick.user?.profile?.student_id || memberToKick.user_id})</strong> khỏi danh sách CLB không? Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setMemberToKick(null)} disabled={isActionLoading}>Hủy bỏ</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleKickMember} disabled={isActionLoading}>
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Xóa thành viên'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal Phân quyền (Change Role) */}
      <AnimatePresence>
        {memberToRoleChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isActionLoading && setMemberToRoleChange(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-gray-900">Phân quyền vai trò</h2>
                <button onClick={() => setMemberToRoleChange(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
                <Avatar
                  src={memberToRoleChange.user?.profile?.avatar_url || ''}
                  name={memberToRoleChange.user?.profile?.full_name || memberToRoleChange.user_id}
                  size="sm"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{memberToRoleChange.user?.profile?.full_name || memberToRoleChange.user_id}</p>
                  <p className="text-xs text-gray-500">{memberToRoleChange.user?.profile?.student_id || memberToRoleChange.user_id}</p>
                </div>
              </div>
                <div className="space-y-2">
                {(['CHUNHIEM', 'PHOCHUNHIEM', 'THANHVIEN'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleChangeRole(role)}
                    disabled={isActionLoading}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-sm ${
                      memberToRoleChange.is_owner
                        ? role === 'CHUNHIEM'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700'
                        : role === 'CHUNHIEM'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : role === 'PHOCHUNHIEM'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    }`}
                  >
                    {role === 'CHUNHIEM' ? 'Chủ nhiệm' : role === 'PHOCHUNHIEM' ? 'Phó Chủ nhiệm' : 'Thành viên'}
                    {((memberToRoleChange.is_owner && role === 'CHUNHIEM') ||
                      (!memberToRoleChange.is_owner && role === 'THANHVIEN')) && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembersManagement;