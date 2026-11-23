import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import EducationScholarships from './pages/EducationScholarships';
import ScholarshipDetail from './pages/ScholarshipDetail';
import TourPackages from './pages/TourPackages';
import TourPackageDetail from './pages/TourPackageDetail';
import ResearchSupport from './pages/ResearchSupport';
import FaqPage from './pages/FaqPage';
import UniversityDetail from './pages/UniversityDetail';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServices from './pages/admin/AdminServices';
import AdminServiceForm from './pages/admin/AdminServiceForm';
import AdminUniversities from './pages/admin/AdminUniversities';
import AdminUniversityForm from './pages/admin/AdminUniversityForm';
import AdminScholarships from './pages/admin/AdminScholarships';
import AdminScholarshipForm from './pages/admin/AdminScholarshipForm';
import AdminTourPackages from './pages/admin/AdminTourPackages';
import AdminTourPackageForm from './pages/admin/AdminTourPackageForm';
import AdminFaqs from './pages/admin/AdminFaqs';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminSettings from './pages/admin/AdminSettings';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminUsers from './pages/admin/AdminUsers';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Admin panel has its own sidebar layout, no public navbar/footer */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="services/new" element={<AdminServiceForm />} />
          <Route path="services/:id/edit" element={<AdminServiceForm />} />
          <Route path="universities" element={<AdminUniversities />} />
          <Route path="universities/new" element={<AdminUniversityForm />} />
          <Route path="universities/:id/edit" element={<AdminUniversityForm />} />
          <Route path="scholarships" element={<AdminScholarships />} />
          <Route path="scholarships/new" element={<AdminScholarshipForm />} />
          <Route path="scholarships/:id/edit" element={<AdminScholarshipForm />} />
          <Route path="tour-packages" element={<AdminTourPackages />} />
          <Route path="tour-packages/new" element={<AdminTourPackageForm />} />
          <Route path="tour-packages/:id/edit" element={<AdminTourPackageForm />} />
          <Route path="faqs" element={<AdminFaqs />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Route>

      {/* Public site */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
      <Route path="/services/:slug" element={<PublicLayout><ServiceDetail /></PublicLayout>} />
      <Route path="/education-scholarships" element={<PublicLayout><EducationScholarships /></PublicLayout>} />
      <Route path="/universities" element={<Navigate to="/education-scholarships" replace />} />
      <Route path="/scholarships" element={<Navigate to="/education-scholarships?tab=scholarships" replace />} />
      <Route path="/scholarships/:slug" element={<PublicLayout><ScholarshipDetail /></PublicLayout>} />
      <Route path="/tour-packages" element={<PublicLayout><TourPackages /></PublicLayout>} />
      <Route path="/tour-packages/:slug" element={<PublicLayout><TourPackageDetail /></PublicLayout>} />
      <Route path="/academic-research-support" element={<PublicLayout><ResearchSupport /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FaqPage /></PublicLayout>} />
      <Route path="/universities/:slug" element={<PublicLayout><UniversityDetail /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<PublicLayout><Dashboard /></PublicLayout>} />
      </Route>

      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  );
}
