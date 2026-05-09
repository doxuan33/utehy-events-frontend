import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { StudentLayout } from './components/layout/StudentLayout';
import { PageAdminLayout } from './components/layout/PageAdminLayout';
import { SystemAdminLayout } from './components/layout/SystemAdminLayout';
import { Newsfeed } from './pages/student/Newsfeed';
import { EventsList } from './pages/student/EventsList';
import { EventDetail } from './pages/student/EventDetail';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { Profile } from './pages/student/Profile';
import { Settings } from './pages/student/Settings';
import { MyEvents } from './pages/student/MyEvents';
import { ScanQR } from './pages/student/ScanQR';
import { ClubsList } from './pages/student/ClubsList';
import { ClubDetail } from './pages/student/ClubDetail';
import { EventCheckin } from './pages/page-admin/EventCheckin';
import { QRDisplay } from './pages/page-admin/QRDisplay';
import { DynamicQrScreen } from './pages/page-admin/DynamicQrScreen';
import { PageSettings } from './pages/page-admin/PageSettings';
import { StudentCheckin } from './pages/student/StudentCheckin';
import { PostManagement } from './pages/page-admin/PostManagement';
import { EventManagement } from './pages/page-admin/EventManagement';
import { Dashboard } from './pages/page-admin/Dashboard';
import { MembersManagement } from './pages/page-admin/MembersManagement';
import EventRegistrations from './pages/page-admin/EventRegistrations';
import { PageManagement } from './pages/admin/PageManagement';
import { CategoryManagement } from './pages/admin/CategoryManagement';
import { EventApproval } from './pages/admin/EventApproval';
import { StudentManagement } from './pages/admin/StudentManagement';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
// import { SystemDashboard } from './pages/admin/SystemDashboard';
// import { ClubManagement } from './pages/admin/ClubManagement';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToasterSetup } from './components/ui/ToasterSetup';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { user, token, hydrated } = useAuthStore();
  const location = useLocation();

  if (!hydrated) return null;
  if (!token) return <Navigate to="/login" />;

  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }

  if (!role && user?.role === 'PAGE_ADMIN' && location.pathname === '/') {
    return <Navigate to="/page-admin" />;
  }
  if (!role && user?.role === 'SYSTEM_ADMIN' && location.pathname === '/') {
    return <Navigate to="/admin" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToasterSetup>
        <ErrorBoundary>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Newsfeed />} />
              <Route path="events" element={<EventsList />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="clubs" element={<ClubsList />} />
              <Route path="clubs/:slug" element={<ClubDetail />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="my-events" element={<MyEvents />} />
              <Route path="scan-qr" element={<ScanQR />} />
              <Route path="checkin" element={<StudentCheckin />} />
            </Route>

            {/* Page Admin Routes */}
            <Route
              path="/page-admin"
              element={
                <ProtectedRoute role="PAGE_ADMIN">
                  <PageAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="events" element={<EventManagement />} />
              <Route path="events/:eventId/registrations" element={<EventRegistrations />} />
              <Route path="events/:eventId/checkin" element={<EventCheckin />} />
              <Route path="events/:eventId/qr-display" element={<QRDisplay />} />
              <Route path="events/:eventId/dynamic-qr" element={<DynamicQrScreen />} />
              <Route path="posts" element={<PostManagement />} />
              <Route path="members" element={<MembersManagement />} />
              <Route path="settings" element={<PageSettings />} />
            </Route>

            {/* System Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="SYSTEM_ADMIN">
                  <SystemAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              {/* Routes temporarily disabled due to missing backend APIs */}
              {/* <Route path="system" element={<SystemDashboard />} /> */}
              {/* <Route path="clubs" element={<ClubManagement />} /> */}
              <Route path="events" element={<EventApproval />} />
              <Route path="pages" element={<PageManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="users" element={<StudentManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
      </ToasterSetup>
    </BrowserRouter>
  );
}