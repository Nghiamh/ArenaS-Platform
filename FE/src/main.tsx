import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { HomePage } from './pages/HomePage/HomePage';
import { FindFieldPage } from './pages/FindFieldPage/FindFieldPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/Customer/RegisterPage';
import { ForgotPasswordPage } from './pages/Customer/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Customer/ResetPasswordPage';
import { VerifyEmailPage } from './pages/Customer/VerifyEmailPage';
import { ProfilePage } from './pages/Customer/ProfilePage';
import { OwnerDashboardScreen } from './pages/Owner/OwnerDashboardScreen';
import { OwnerLandingPage } from './pages/Owner/OwnerLandingPage';
import { OwnerContactPage } from './pages/Owner/OwnerContactPage';
import { OwnerManageCourtScreen } from './pages/Owner/OwnerManageCourtScreen';
import { OwnerRevenueScreen } from './pages/Owner/OwnerRevenueScreen';
import { OwnerBookingScheduleScreen } from './pages/Owner/OwnerBookingScheduleScreen';
import { OwnerWalletScreen } from './pages/Owner/OwnerWalletScreen';
import { OwnerSettingsScreen } from './pages/Owner/OwnerSettingsScreen';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { AdminManageStadiumPage } from './pages/Admin/AdminManageStadiumPage';
import { AdminManageUsersPage } from './pages/Admin/AdminManageUsersPage';
import { AdminModerationPage } from './pages/Admin/AdminModerationPage';
import { AdminVoucherPage } from './pages/Admin/AdminVoucherPage';
import { AdminIncomePage } from './pages/Admin/AdminIncomePage';
import { AdminManageOwnerApplicationPage } from './pages/Admin/AdminManageOwnerApplicationPage';
import { AdminWithdrawalPage } from './pages/Admin/AdminWithdrawalPage';
import { PriceListPage } from './pages/HomePage/PriceListPage';
import CourtDetailPage from './pages/CourtDetailPage/CourtDetailPage';
import { WalletPage } from './pages/WalletPage/WalletPage';
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage';
import { PaymentSuccessPage } from './pages/CheckoutPage/PaymentSuccessPage';
import { VietQRPaymentPage } from './pages/CheckoutPage/VietQRPaymentPage';
import { MatchmakingPage } from './pages/MatchmakingPage/MatchmakingPage';
import { ChatPage } from './pages/ChatPage/ChatPage';
import { UserVoucherPage } from './pages/VoucherPage/UserVoucherPage';
import { DownloadAppPage } from './pages/DownloadAppPage/DownloadAppPage';
import './index.css';

function App() {
  return (
    <Router
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        {/* ─── Public routes ─────────────────────────────────── */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/home" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/tim-san" element={<Layout><FindFieldPage /></Layout>} />
        <Route path="/bang-gia" element={<Layout><PriceListPage /></Layout>} />
        <Route path="/courts/:courtId" element={<Layout><CourtDetailPage /></Layout>} />
        <Route path="/download-app" element={<Layout><DownloadAppPage /></Layout>} />

        {/* ─── Public (informational) pages ────────────────── */}
        <Route
          path="/for-owners"
          element={
            <Layout>
              <OwnerLandingPage />
            </Layout>
          }
        />
        <Route
          path="/cho-chu-san"
          element={
            <Layout>
              <OwnerContactPage />
            </Layout>
          }
        />

        {/* ─── Any logged-in user ────────────────────────────── */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout><ProfilePage /></Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/matchmaking"
          element={
            <PrivateRoute>
              <Layout>
                <MatchmakingPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:matchId"
          element={
            <PrivateRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <PrivateRoute>
              <Layout><WalletPage /></Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/vouchers"
          element={
            <PrivateRoute>
              <Layout><UserVoucherPage /></Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <CheckoutPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment-qr"
          element={
            <PrivateRoute>
              <VietQRPaymentPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <PrivateRoute>
              <PaymentSuccessPage />
            </PrivateRoute>
          }
        />

        {/* ─── Owner only ────────────────────────────────────── */}
        <Route
          path="/owner/dashboard"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerDashboardScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/manage-courts"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerManageCourtScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/revenue"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerRevenueScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/bookings"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerBookingScheduleScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/wallet"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerWalletScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/settings"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerSettingsScreen />
            </PrivateRoute>
          }
        />

        {/* ─── Admin only ────────────────────────────────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/manage-stadiums"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminManageStadiumPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminManageUsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminModerationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/vouchers"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminVoucherPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/income"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminIncomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/owner-applications"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminManageOwnerApplicationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminWithdrawalPage />
            </PrivateRoute>
          }
        />

        {/* ─── Fallback ──────────────────────────────────────── */}
        <Route path="*" element={<Layout><HomePage /></Layout>} />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
