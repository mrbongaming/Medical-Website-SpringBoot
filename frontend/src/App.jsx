import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Navigate,
  Outlet,
  Route,
  useLocation,
} from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import HospitalProvider from './state/HospitalProvider';
import { PublicLayout, RequireRole, StaffLayout } from './components/Layouts';
import {
  HomePage,
  DirectoryPage,
  DetailPage,
  InformationPage,
  NotFound,
} from './pages/PublicPages';
import { AuthPage, BookingPage, ProfilePage } from './pages/PatientPages';
import {
  AppointmentsPage,
  RecordsPage,
  DoctorSchedulePage,
  RecordDetailPage,
  ExaminationPage,
} from './pages/ClinicalPages';
import { ManagementPage, SystemPage } from './pages/ManagementPages';
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <Outlet />;
}
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
