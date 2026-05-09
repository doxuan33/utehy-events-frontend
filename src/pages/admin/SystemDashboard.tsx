import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Building2,
  Calendar,
  CheckSquare,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/common/Button';

// Mock data for system statistics
const mockStats = {
  totalStudents: 3245,
  totalClubs: 48,
  totalEvents: 156,
  totalCheckins: 4258
};

// Mock data for event frequency chart (12 months)
const mockEventFrequency = [
  { month: 'T1', events: 8 },
  { month: 'T2', events: 12 },
  { month: 'T3', events: 15 },
  { month: 'T4', events: 22 },
  { month: 'T5', events: 18 },
  { month: 'T6', events: 25 },
  { month: 'T7', events: 30 },
  { month: 'T8', events: 28 },
  { month: 'T9', events: 20 },
  { month: 'T10', events: 24 },
  { month: 'T11', events: 16 },
  { month: 'T12', events: 14 }
];

export const SystemDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const statCards = [
    {
      label: 'Tổng Sinh viên',
      value: stats.totalStudents,
      icon: Users,
      color: 'indigo',
      suffix: '',
      change: '+12%',
    },
    {
      label: 'Tổng Câu lạc bộ',
      value: stats.totalClubs,
      icon: Building2,
      color: 'violet',
      suffix: '',
      change: '+3',
    },
    {
      label: 'Sự kiện đã tổ chức',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'purple',
      suffix: '',
      change: '+8',
    },
    {
      label: 'Tổng lượt Check-in',
      value: stats.totalCheckins,
      icon: CheckSquare,
      color: 'fuchsia',
      suffix: '',
      change: '+245',
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Tổng quan Hệ thống</h1>
          <p className="text-gray-500 font-medium">Thống kê toàn diện từ Super Admin Dashboard.</p>
        </div>
        <Button
          onClick={() => setIsLoading(true)}
          disabled={isLoading}
          className="rounded-2xl px-6 py-4 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="font-bold">Làm mới dữ liệu</span>
        </Button>
      </div>

      {/* Stats Grid - Top Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group hover:scale-[1.02]`}
          >
            <div className={`h-14 w-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`h-7 w-7 text-${stat.color}-600`} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-baseline space-x-3 mt-2">
              <p className="text-4xl font-black text-gray-900">{stat.value.toLocaleString()}</p>
              <span className={`text-xs font-bold text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded-lg flex items-center`}>
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Event Frequency Chart */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-3 text-indigo-600" />
              Tần suất tổ chức sự kiện trong năm
            </h3>
            <p className="text-sm text-gray-500 mt-1">Số lượng sự kiện theo từng tháng</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
            <span className="font-medium">Số sự kiện</span>
          </div>
        </div>

        {/* Simple Bar Chart using CSS Grid */}
        <div className="h-[300px] w-full">
          <div className="h-full w-full flex items-end justify-between space-x-2 px-4">
            {mockEventFrequency.map((item, index) => {
              const maxEvents = Math.max(...mockEventFrequency.map(e => e.events));
              const height = (item.events / maxEvents) * 100;
              
              return (
                <motion.div
                  key={item.month}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg relative group cursor-pointer hover:from-indigo-700 hover:to-indigo-500 transition-all">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.events} sự kiện
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 mt-3">{item.month}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-6 mt-10 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-black text-indigo-600">{Math.max(...mockEventFrequency.map(e => e.events))}</p>
            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Tháng đông nhất</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-violet-600">{Math.round(mockEventFrequency.reduce((a, b) => a + b.events, 0) / 12)}</p>
            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Trung bình/tháng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-purple-600">{mockEventFrequency.reduce((a, b) => a + b.events, 0)}</p>
            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Tổng cộng</p>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100"
        >
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 mr-3" />
            <h3 className="text-lg font-bold">Xu hướng tăng trưởng</h3>
          </div>
          <p className="text-indigo-100 text-sm mb-6">Số lượng CLB và Sự kiện đang có xu hướng tăng ổn định trong 6 tháng qua.</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase mb-2">
                <span>CLB mới</span>
                <span>12/12</span>
              </div>
              <div className="h-2 w-full bg-indigo-800 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[100%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase mb-2">
                <span>Sự kiện mới</span>
                <span>28/30</span>
              </div>
              <div className="h-2 w-full bg-indigo-800 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[93%]" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Hoạt động gần đây</h3>
          <div className="space-y-4">
            {[
              { action: 'CLB Mới', name: 'Câu lạc bộ AI', time: '2 phút trước', color: 'indigo' },
              { action: 'Sự kiện', name: 'Hội thiện nguyện', time: '15 phút trước', color: 'violet' },
              { action: 'Check-in', name: '500+ lượt tại sự kiện UTC', time: '1 giờ trước', color: 'purple' },
              { action: 'Sinh viên', name: '25 người đăng ký mới', time: '3 giờ trước', color: 'fuchsia' }
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className={`h-10 w-10 rounded-xl bg-${item.color}-100 flex items-center justify-center`}>
                  <div className={`h-3 w-3 rounded-full bg-${item.color}-600 animate-pulse`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.action}: <span className="font-medium">{item.name}</span></p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};