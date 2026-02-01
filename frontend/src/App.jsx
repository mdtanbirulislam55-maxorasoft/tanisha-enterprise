import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// ✅ Toasts (single library: react-hot-toast)
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';

// Layout Components
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Loading Component
const LoadingFallback = () => {
  const { theme } = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background:
          theme === 'dark'
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Box sx={{ position: 'relative', mb: 3 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              border: '4px solid transparent',
              borderTopColor: 'primary.main',
              borderRightColor: 'secondary.main',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box component="span" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              TE
            </Box>
          </Box>
        </Box>
        <Box component="p" sx={{ color: 'text.primary', fontSize: '1.25rem', fontWeight: 'medium', mb: 1 }}>
          Loading Tanisha Enterprise Pro
        </Box>
        <Box component="p" sx={{ color: 'text.secondary', mb: 3 }}>
          Premium Business Management Suite
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          {[0, 150, 300].map((delay) => (
            <Box
              key={delay}
              sx={{
                width: 8,
                height: 8,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                animation: 'bounce 1.4s infinite',
                animationDelay: `${delay}ms`,
                '@keyframes bounce': {
                  '0%, 80%, 100%': { transform: 'translateY(0)' },
                  '40%': { transform: 'translateY(-10px)' },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// Lazy imports
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));

// Sales Pages
const CreateSale = React.lazy(() => import('./pages/Sales/CreateSale'));
const SalesList = React.lazy(() => import('./pages/Sales/SalesList'));
const SaleDetails = React.lazy(() => import('./pages/Sales/SaleDetails'));

// Purchase Pages
const CreatePurchase = React.lazy(() => import('./pages/Purchase/CreatePurchase'));
const PurchaseList = React.lazy(() => import('./pages/Purchase/PurchaseList'));
const SupplierManagement = React.lazy(() => import('./pages/Purchase/SupplierManagement'));

// Product Pages
const ProductList = React.lazy(() => import('./pages/Products/ProductList'));
const AddEditProduct = React.lazy(() => import('./pages/Products/AddEditProduct'));
const ProductDetails = React.lazy(() => import('./pages/Products/ProductDetails'));

// Customer Pages
const CustomerList = React.lazy(() => import('./pages/Customers/CustomerList'));
const AddEditCustomer = React.lazy(() => import('./pages/Customers/AddEditCustomer'));
const CustomerDetails = React.lazy(() => import('./pages/Customers/CustomerDetails'));

// Stock Pages
const StockCurrent = React.lazy(() => import('./pages/Stock/StockCurrent'));
const StockAdjustment = React.lazy(() => import('./pages/Stock/StockAdjustment'));

// Service Pages
const ServicingRequests = React.lazy(() => import('./pages/Servicing/ServicingRequests'));
const ServicingOngoing = React.lazy(() => import('./pages/Servicing/ServicingOngoing'));
const ServicingCompleted = React.lazy(() => import('./pages/Servicing/ServicingCompleted'));
const ServicingReports = React.lazy(() => import('./pages/Servicing/ServicingReports'));

// Reports Pages
const ReportsSales = React.lazy(() => import('./pages/Reports/ReportsSales'));
const ReportsPurchase = React.lazy(() => import('./pages/Reports/ReportsPurchase'));

// Settings Pages
const SettingsCompany = React.lazy(() => import('./pages/Settings/SettingsCompany'));
const SettingsUsers = React.lazy(() => import('./pages/Settings/SettingsUsers'));

// Theme Wrapper Component
const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();

  const muiTheme = createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
      primary: { main: theme === 'dark' ? '#4fc3f7' : '#2196f3' },
      secondary: { main: theme === 'dark' ? '#ff8a80' : '#f50057' },
      background: {
        default: theme === 'dark' ? '#121212' : '#f8f9fa',
        paper: theme === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: { borderRadius: 12 },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

        {/* Protected Routes with AppLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Sales Routes */}
          <Route path="sales">
            <Route index element={<SalesList />} />
            <Route path="create" element={<CreateSale />} />
            <Route path="details/:id" element={<SaleDetails />} />
          </Route>

          {/* Purchase Routes */}
          <Route path="purchase">
            <Route index element={<PurchaseList />} />
            <Route path="create" element={<CreatePurchase />} />
            <Route path="suppliers" element={<SupplierManagement />} />
          </Route>

          {/* Servicing Routes */}
          <Route path="servicing">
            <Route path="requests" element={<ServicingRequests />} />
            <Route path="ongoing" element={<ServicingOngoing />} />
            <Route path="completed" element={<ServicingCompleted />} />
            <Route path="reports" element={<ServicingReports />} />
          </Route>

          {/* Products Routes */}
          <Route path="products">
            <Route index element={<ProductList />} />
            <Route path="add" element={<AddEditProduct />} />
            <Route path="edit/:id" element={<AddEditProduct />} />
            <Route path="details/:id" element={<ProductDetails />} />
          </Route>

          {/* Customers Routes */}
          <Route path="customers">
            <Route index element={<CustomerList />} />
            <Route path="add" element={<AddEditCustomer />} />
            <Route path="edit/:id" element={<AddEditCustomer />} />
            <Route path="details/:id" element={<CustomerDetails />} />
          </Route>

          {/* Stock Routes */}
          <Route path="stock">
            <Route path="current" element={<StockCurrent />} />
            <Route path="adjustment" element={<StockAdjustment />} />
          </Route>

          {/* Reports Routes */}
          <Route path="reports">
            <Route path="sales" element={<ReportsSales />} />
            <Route path="purchase" element={<ReportsPurchase />} />
          </Route>

          {/* Settings Routes */}
          <Route path="settings">
            <Route path="company" element={<SettingsCompany />} />
            <Route path="users" element={<SettingsUsers />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <CustomThemeProvider>
        <ThemeWrapper>
          <LanguageProvider>
            <AuthProvider>
              {/* ✅ react-hot-toast container (only toast system now) */}
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

              <AppRoutes />
            </AuthProvider>
          </LanguageProvider>
        </ThemeWrapper>
      </CustomThemeProvider>
    </Router>
  );
}

export default App;
