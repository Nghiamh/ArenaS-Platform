import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage/HomePage';
import { FindFieldPage } from './pages/FindFieldPage/FindFieldPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/Customer/RegisterPage';
import { ForgotPasswordPage } from './pages/Customer/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Customer/ResetPasswordPage';
import { ProfilePage } from './pages/Customer/ProfilePage';
import { OwnerDashboardScreen } from './pages/Owner/OwnerDashboardScreen';
import { OwnerManageCourtScreen } from './pages/Owner/OwnerManageCourtScreen';
import { OwnerRevenueScreen } from './pages/Owner/OwnerRevenueScreen';
import { OwnerBookingScheduleScreen } from './pages/Owner/OwnerBookingScheduleScreen';
import { OwnerSettingsScreen } from './pages/Owner/OwnerSettingsScreen';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { AdminManageStadiumPage } from './pages/Admin/AdminManageStadiumPage';
import { PriceListPage } from './pages/HomePage/PriceListPage';
import CourtDetailPage from './pages/CourtDetailPage/CourtDetailPage';
import { WalletPage } from './pages/WalletPage/WalletPage';
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage';
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
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/owner/dashboard" element={<OwnerDashboardScreen />} />
        <Route path="/owner/manage-courts" element={<OwnerManageCourtScreen />} />
        <Route path="/owner/revenue" element={<OwnerRevenueScreen />} />
        <Route path="/owner/bookings" element={<OwnerBookingScheduleScreen />} />
        <Route path="/owner/settings" element={<OwnerSettingsScreen />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/manage-stadiums" element={<AdminManageStadiumPage />} />
        <Route
          path="/profile"
          element={
            <Layout>
              <ProfilePage />
            </Layout>
          }
        />
        <Route
          path="/home"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/tim-san"
          element={
            <Layout>
              <FindFieldPage />
            </Layout>
          }
        />
        <Route
          path="/bang-gia"
          element={
            <Layout>
              <PriceListPage />
            </Layout>
          }
        />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/courts/:courtId"
          element={
            <Layout>
              <CourtDetailPage />
            </Layout>
          }
        />
        <Route
          path="/wallet"
          element={
            <Layout>
              <WalletPage />
            </Layout>
          }
        />
        <Route
          path="*"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
