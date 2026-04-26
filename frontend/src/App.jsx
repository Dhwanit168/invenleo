import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster, useToasterStore, toast } from 'react-hot-toast'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './guards/ProtectedRoute'
import RoleGuard from './guards/RoleGuard'
import DashboardLayout from './components/DashboardLayout'

import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import UnauthorizedPage   from './pages/UnauthorizedPage'

import DashboardPage      from './pages/DashboardPage'
import ProductListPage    from './pages/ProductListPage'
import ProductDetailPage  from './pages/ProductDetailPage'
import ProductFormPage    from './pages/ProductFormPage'
import SaleListPage       from './pages/SaleListPage'
import NewSalePage        from './pages/NewSalePage'
import SaleDetailPage     from './pages/SaleDetailPage'
import PurchaseListPage   from './pages/PurchaseListPage'
import NewPurchasePage    from './pages/NewPurchasePage'
import PurchaseDetailPage from './pages/PurchaseDetailPage'
import SupplierListPage   from './pages/SupplierListPage'
import SupplierFormPage   from './pages/SupplierFormPage'
import ReportsPage        from './pages/ReportsPage'
import AlertsPage         from './pages/AlertsPage'
import UserManagementPage from './pages/UserManagementPage'
import AuditLogPage       from './pages/AuditLogPage'
import ProfilePage        from './pages/ProfilePage'
import ForecastPage       from './pages/ForecastPage'
import ReorderPage        from './pages/ReorderPage'

function ToastLimiter() {
  const { toasts } = useToasterStore();
  
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= 5)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);
  
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastLimiter />
      <BrowserRouter>
        <Routes>
          {}
          <Route path="/"                      element={<LandingPage />} />
          <Route path="/login"                 element={<LoginPage />} />
          <Route path="/register"              element={<RegisterPage />} />
          <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/unauthorized"          element={<UnauthorizedPage />} />

          {}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"  element={<DashboardPage />} />

            {}
            <Route path="/products"          element={<ProductListPage />} />
            <Route path="/products/new"      element={
              <RoleGuard roles={['admin', 'manager']}>
                <ProductFormPage />
              </RoleGuard>
            } />
            <Route path="/products/:id"      element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={
              <RoleGuard roles={['admin', 'manager']}>
                <ProductFormPage />
              </RoleGuard>
            } />

            {}
            <Route path="/sales"       element={<SaleListPage />} />
            <Route path="/sales/new"   element={<NewSalePage />} />
            <Route path="/sales/:id"   element={<SaleDetailPage />} />

            {}
            <Route path="/purchases"     element={
              <RoleGuard roles={['admin', 'manager']}>
                <PurchaseListPage />
              </RoleGuard>
            } />
            <Route path="/purchases/new" element={
              <RoleGuard roles={['admin', 'manager']}>
                <NewPurchasePage />
              </RoleGuard>
            } />
            <Route path="/purchases/:id" element={
              <RoleGuard roles={['admin', 'manager']}>
                <PurchaseDetailPage />
              </RoleGuard>
            } />

            {}
            <Route path="/suppliers"          element={<SupplierListPage />} />
            <Route path="/suppliers/new"      element={
              <RoleGuard roles={['admin', 'manager']}>
                <SupplierFormPage />
              </RoleGuard>
            } />
            <Route path="/suppliers/:id/edit" element={
              <RoleGuard roles={['admin', 'manager']}>
                <SupplierFormPage />
              </RoleGuard>
            } />

            {}
            <Route path="/reports" element={
              <RoleGuard roles={['admin', 'manager']}>
                <ReportsPage />
              </RoleGuard>
            } />

            {}
            <Route path="/alerts" element={<AlertsPage />} />

            <Route path="/reorder" element={
              <RoleGuard roles={['admin', 'manager']}>
                <ReorderPage />
              </RoleGuard>
            } />

            {}
            <Route path="/forecast" element={
              <RoleGuard roles={["admin", "manager"]}>
                <ForecastPage />
              </RoleGuard>
            } />

            {}
            <Route path="/profile" element={<ProfilePage />} />

            {}
            <Route path="/admin/users" element={
              <RoleGuard roles={['admin']}>
                <UserManagementPage />
              </RoleGuard>
            } />
            <Route path="/admin/audit" element={
              <RoleGuard roles={['admin', 'manager']}>
                <AuditLogPage />
              </RoleGuard>
            } />
          </Route>

          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            border: '1px solid #E2E5EC',
            boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)',
            color: '#1A1C28',
          },
          success: {
            iconTheme: { primary: '#639922', secondary: '#EAF3DE' },
          },
          error: {
            iconTheme: { primary: '#A32D2D', secondary: '#FCEBEB' },
          },
        }}
      />
    </AuthProvider>
  )
}
