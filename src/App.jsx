import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import VisitTracker from "./components/VisitTracker.jsx";
import SubmitConfirm from "./components/SubmitConfirm.jsx";
import { PageLoader } from "./components/Spinner.jsx";
import { readSession, isStaffUser, hasPermission } from "./admin/session.js";

const Home              = lazy(() => import("./pages/Home.jsx"));
const ElectionSpotlight = lazy(() => import("./pages/ElectionSpotlight.jsx"));
const ElectionApplications = lazy(() => import("./admin/ElectionApplications.jsx"));
const NewsPage          = lazy(() => import("./pages/NewsPage.jsx"));
const Details           = lazy(() => import("./pages/Details.jsx"));
const AuthorProfile     = lazy(() => import("./pages/AuthorProfile.jsx"));
const Company           = lazy(() => import("./pages/Company.jsx"));
const Partnership       = lazy(() => import("./pages/Partnership.jsx"));
const CategoryPage      = lazy(() => import("./pages/CategoryPage.jsx"));
const SearchPage        = lazy(() => import("./pages/SearchPage.jsx"));
const PremiumMembership = lazy(() => import("./pages/PremiumMembership.jsx"));
const PremiumDirectory  = lazy(() => import("./pages/PremiumDirectory.jsx"));
const MemberProfile     = lazy(() => import("./pages/MemberProfile.jsx"));
const About             = lazy(() => import("./pages/About.jsx"));
const Team              = lazy(() => import("./pages/Team.jsx"));
const NotFound          = lazy(() => import("./pages/NotFound.jsx"));

const AdminLogin      = lazy(() => import("./admin/AdminLogin.jsx"));
const Dashboard       = lazy(() => import("./admin/Dashboard.jsx"));
const NewsEditor      = lazy(() => import("./admin/NewsEditor.jsx"));
const CategoriesEditor = lazy(() => import("./admin/CategoriesEditor.jsx"));
const NavigationEditor = lazy(() => import("./admin/NavigationEditor.jsx"));
const SectionsEditor   = lazy(() => import("./admin/SectionsEditor.jsx"));
const CompanyEditor   = lazy(() => import("./admin/CompanyEditor.jsx"));
const AdsEditor       = lazy(() => import("./admin/AdsEditor.jsx"));
const PremiumMembers  = lazy(() => import("./admin/PremiumMembers.jsx"));
const TeamEditor      = lazy(() => import("./admin/TeamEditor.jsx"));
const ChangePassword  = lazy(() => import("./admin/ChangePassword.jsx"));
const StaffRoles      = lazy(() => import("./admin/StaffRoles.jsx"));
const Inbox            = lazy(() => import("./admin/Inbox.jsx"));
const Subscribers      = lazy(() => import("./admin/Subscribers.jsx"));
const SiteSettings     = lazy(() => import("./admin/SiteSettings.jsx"));
const TeamProfile      = lazy(() => import("./pages/TeamProfile.jsx"));
const Careers          = lazy(() => import("./pages/Careers.jsx"));
const CareersEditor    = lazy(() => import("./admin/CareersEditor.jsx"));

function Public({ children }) {
  return <><Navbar /><main>{children}</main><Footer /></>;
}
// UI guard only: the API checks the token and the permission on every request.
// `perm`: staff need this permission; `adminOnly`: staff can never open the page.
function Protected({ children, perm, adminOnly }) {
  const { token, user } = readSession();
  if (!token) return <Navigate to="/admin" replace />;
  if (isStaffUser(user) && (adminOnly || (perm && !hasPermission(user, perm)))) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <VisitTracker />
      <SubmitConfirm />
      <Suspense fallback={<PageLoader fullscreen />}>
        <Routes>
          {/* Public */}
          <Route path="/"                  element={<Public><Home /></Public>} />
          <Route path="/news"              element={<Public><NewsPage /></Public>} />
          <Route path="/news/:slug"        element={<Public><Details /></Public>} />
          <Route path="/author/:id" element={<Public><AuthorProfile /></Public>} />
          <Route path="/location/:slug"    element={<Public><NewsPage /></Public>} />
          <Route path="/category/:slug"    element={<Public><CategoryPage /></Public>} />
          <Route path="/search"            element={<Public><SearchPage /></Public>} />
          <Route path="/company"           element={<Public><Company /></Public>} />
          <Route path="/partnership"       element={<Public><Partnership /></Public>} />
          <Route path="/premium-member"    element={<Public><PremiumMembership /></Public>} />
          <Route path="/election-spotlight" element={<Public><ElectionSpotlight /></Public>} />
          <Route path="/admin/election-applications" element={<Protected adminOnly><ElectionApplications /></Protected>} />
          <Route path="/admin/election-applications-demo" element={<Navigate to="/admin/election-applications" replace />} />
          <Route path="/premium-members"   element={<Public><PremiumDirectory /></Public>} />
          <Route path="/member/:memberId"  element={<Public><MemberProfile /></Public>} />
          <Route path="/about"             element={<Public><About /></Public>} />
          <Route path="/team"              element={<Public><Team /></Public>} />
          <Route path="/team/:id"           element={<Public><TeamProfile /></Public>} />
          <Route path="/careers"            element={<Public><Careers /></Public>} />

          {/* Admin */}
          <Route path="/admin"                     element={<AdminLogin />} />
          <Route path="/admin/dashboard"           element={<Protected><Dashboard /></Protected>} />
          <Route path="/admin/premium-members"     element={<Protected adminOnly><PremiumMembers /></Protected>} />
          <Route path="/admin/news/new"            element={<Protected perm="news.create"><NewsEditor /></Protected>} />
          <Route path="/admin/news/:id/edit"       element={<Protected perm="news.edit"><NewsEditor /></Protected>} />
          <Route path="/admin/companies"           element={<Protected adminOnly><CompanyEditor list /></Protected>} />
          <Route path="/admin/companies/new"       element={<Protected adminOnly><CompanyEditor /></Protected>} />
          <Route path="/admin/companies/:id/edit"  element={<Protected adminOnly><CompanyEditor /></Protected>} />
          <Route path="/admin/ads"                 element={<Protected adminOnly><AdsEditor list /></Protected>} />
          <Route path="/admin/ads/new"             element={<Protected adminOnly><AdsEditor /></Protected>} />
          <Route path="/admin/ads/:id/edit"        element={<Protected adminOnly><AdsEditor /></Protected>} />
          <Route path="/admin/team"                element={<Protected adminOnly><TeamEditor /></Protected>} />
          <Route path="/admin/careers"            element={<Protected adminOnly><CareersEditor /></Protected>} />
          <Route path="/admin/inbox"              element={<Protected adminOnly><Inbox /></Protected>} />
          <Route path="/admin/subscribers"        element={<Protected adminOnly><Subscribers /></Protected>} />
          <Route path="/admin/site-settings"      element={<Protected adminOnly><SiteSettings /></Protected>} />
          <Route path="/admin/change-password"     element={<Protected><ChangePassword /></Protected>} />
          <Route path="/admin/staff-roles"          element={<Protected adminOnly><StaffRoles /></Protected>} />
          <Route path="/admin/categories"           element={<Protected perm="categories.manage"><CategoriesEditor /></Protected>} />
          <Route path="/admin/navigation"           element={<Protected perm="navigation.manage"><NavigationEditor /></Protected>} />
          <Route path="/admin/sections"             element={<Protected perm="sections.manage"><SectionsEditor /></Protected>} />

          {/* 404 — public pages */}
          <Route path="*" element={<Public><NotFound /></Public>} />
        </Routes>
      </Suspense>
    </>
  );
}
