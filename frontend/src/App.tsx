import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { MainLayout } from "./layout/MainLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { StaysPage } from "./pages/StaysPage";
import { StayDetailPage } from "./pages/StayDetailPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { HostBookingsPage } from "./pages/HostBookingsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { HostDashboard } from "./pages/HostDashboard";
import { BrandStoryPage } from "./pages/BrandStoryPage";
import { AboutPage } from "./pages/AboutPage";
import { NeighborhoodPage } from "./pages/NeighborhoodPage";
import { HieroPage } from "./pages/HieroPage";
import { LaunchingPage } from "./pages/LaunchingPage";
import { RegisterLayout } from "./host/RegisterLayout";
import { TypeStep } from "./host/steps/TypeStep";
import { ConceptStep } from "./host/steps/ConceptStep";
import { BasicsStep } from "./host/steps/BasicsStep";
import { DescriptionStep } from "./host/steps/DescriptionStep";
import { LocationStep } from "./host/steps/LocationStep";
import { PhotosStep } from "./host/steps/PhotosStep";
import { PriceStep } from "./host/steps/PriceStep";
import { SuccessStep } from "./host/steps/SuccessStep";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/stays" element={<StaysPage />} />
            <Route path="/stays/:id" element={<StayDetailPage />} />
            <Route path="/brand-story" element={<BrandStoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/neighborhood" element={<NeighborhoodPage />} />
            <Route path="/host/hiero" element={<HieroPage />} />
            <Route path="/host/launching" element={<LaunchingPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/bookings/my" element={<MyBookingsPage />} />
              <Route path="/messages" element={<MessagesPage />} />

              <Route path="/host/register" element={<RegisterLayout />}>
                <Route index element={<Navigate to="type" replace />} />
                <Route path="type" element={<TypeStep />} />
                <Route path="concept" element={<ConceptStep />} />
                <Route path="basics" element={<BasicsStep />} />
                <Route path="description" element={<DescriptionStep />} />
                <Route path="location" element={<LocationStep />} />
                <Route path="photos" element={<PhotosStep />} />
                <Route path="price" element={<PriceStep />} />
                <Route path="success" element={<SuccessStep />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireHost />}>
              <Route path="/host" element={<HostDashboard />} />
              <Route path="/host/bookings" element={<HostBookingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
