import { PromotionsPage } from './pages/PromotionsPage';
import { InsuranceSettingsPage } from './pages/InsuranceSettingsPage';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Navigate,
  Route,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScrollToTop } from './components/ScrollToTop';
import HospitalProvider from './state/HospitalProvider';
import { PublicLayout } from './components/PublicLayout';
import { RequireRole } from './components/RequireRole';
import { StaffLayout } from './components/StaffLayout';
import { HomePage } from './pages/HomePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { DetailPage } from './pages/DetailPage';
import { InformationPage } from './pages/InformationPage';
import { NotFound } from './pages/NotFound';
import { AuthPage } from './pages/AuthPage';
import { BookingPage } from './pages/BookingPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { RecordsPage } from './pages/RecordsPage';
import { DoctorSchedulePage } from './pages/DoctorSchedulePage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { ExaminationPage } from './pages/ExaminationPage';
import { ManagementPage } from './pages/ManagementPage';
import { SystemPage } from './pages/SystemPage';
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<ScrollToTop />}>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        {[
          ['co-so', 'branches'],
          ['bac-si', 'doctors'],
          ['goi-kham', 'packages'],
        ].map(([path, kind]) => (
          <Route key={path} path={path}>
            <Route index element={<DirectoryPage key={kind} kind={kind} />} />
            <Route path=":slug" element={<DetailPage kind={kind} />} />
          </Route>
        ))}
        <Route
          path="chuyen-khoa"
          element={<DirectoryPage key="specialties" kind="specialties" />}
        />
        <Route path="dat-lich" element={<BookingPage />} />
        <Route path="dang-nhap" element={<AuthPage />} />
        <Route path="dang-ky" element={<Navigate to="/dang-nhap" replace />} />
        <Route path="gioi-thieu" element={<InformationPage mode="about" />} />
        <Route path="huong-dan" element={<InformationPage mode="guide" />} />
        <Route path="lien-he" element={<InformationPage mode="contact" />} />
        <Route path="co-so-y-te/*" element={<Navigate to="/co-so" replace />} />
        <Route element={<RequireRole roles={['patient', 'doctor', 'branchAdmin', 'superAdmin']} />}>
          <Route path="tai-khoan" element={<ProfilePage />} />
        </Route>
        <Route element={<RequireRole roles={['patient']} />}>
          <Route path="lich-hen" element={<AppointmentsPage />} />
          <Route path="ho-so-kham" element={<RecordsPage />} />
          <Route path="ho-so-kham/:recordId" element={<RecordDetailPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<RequireRole roles={['superAdmin', 'branchAdmin']} />}>
        <Route path="quan-tri" element={<StaffLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<p>Đang tải thống kê…</p>}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route path="lich-hen" element={<AppointmentsPage />} />
          <Route path="khuyen-mai" element={<PromotionsPage />} />
          <Route path="bao-hiem" element={<InsuranceSettingsPage />} />
          {[
            ['co-so', 'branches'],
            ['khoa-phong', 'departments'],
            ['bac-si', 'doctors'],
            ['lich-lam-viec', 'schedules'],
          ].map(([path, entity]) => (
            <Route
              key={path}
              path={path}
              element={<ManagementPage key={entity} entity={entity} />}
            />
          ))}
          <Route element={<RequireRole roles={['superAdmin']} />}>
            {[
              ['admin', 'users'],
              ['chuyen-khoa', 'specialties'],
              ['goi-kham', 'packages'],
            ].map(([path, entity]) => (
              <Route
                key={path}
                path={path}
                element={<ManagementPage key={entity} entity={entity} />}
              />
            ))}
            <Route path="he-thong" element={<SystemPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      <Route element={<RequireRole roles={['doctor']} />}>
        <Route path="bac-si-lam-viec" element={<StaffLayout />}>
          <Route index element={<AppointmentsPage />} />
          <Route path="lich-lam-viec" element={<DoctorSchedulePage />} />
          <Route path="ho-so" element={<RecordsPage />} />
          <Route path="ho-so/:recordId" element={<RecordDetailPage />} />
          <Route path="kham/:appointmentId" element={<ExaminationPage />} />
          <Route path="tai-khoan" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Route>,
  ),
);
export default function App() {
  return (
    <HospitalProvider>
      <RouterProvider router={router} />
    </HospitalProvider>
  );
}
