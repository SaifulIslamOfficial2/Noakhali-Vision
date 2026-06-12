import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import VisitTracker from "./components/VisitTracker.jsx";

const Home              = lazy(() => import("./pages/Home.jsx"));
const NewsPage          = lazy(() => import("./pages/NewsPage.jsx"));
const Details           = lazy(() => import("./pages/Details.jsx"));
const Company           = lazy(() => import("./pages/Company.jsx"));
const Partnership       = lazy(() => import("./pages/Partnership.jsx"));
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
const CompanyEditor   = lazy(() => import("./admin/CompanyEditor.jsx"));
const AdsEditor       = lazy(() => import("./admin/AdsEditor.jsx"));
const PremiumMembers  = lazy(() => import("./admin/PremiumMembers.jsx"));
const TeamEditor      = lazy(() => import("./admin/TeamEditor.jsx"));
const ChangePassword  = lazy(() => import("./admin/ChangePassword.jsx"));

const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
    <div style={{
      width: 36, height: 36,
      border: "3px solid #EAEAEA",
      borderTop: "3px solid #EF152B",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite"
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

function Public({ children }) {
  return <><Navbar /><main>{children}</main><Footer /></>;
}
function Protected({ children }) {
  return localStorage.getItem("nv_token") ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <>
      <VisitTracker />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/"                  element={<Public><Home /></Public>} />
          <Route path="/news"              element={<Public><NewsPage /></Public>} />
          <Route path="/news/:slug"        element={<Public><Details /></Public>} />
          <Route path="/location/:slug"    element={<Public><Home /></Public>} />
          <Route path="/search"            element={<Public><SearchPage /></Public>} />
          <Route path="/company"           element={<Public><Company /></Public>} />
          <Route path="/partnership"       element={<Public><Partnership /></Public>} />
          <Route path="/premium-member"    element={<Public><PremiumMembership /></Public>} />
          <Route path="/premium-members"   element={<Public><PremiumDirectory /></Public>} />
          <Route path="/member/:memberId"  element={<Public><MemberProfile /></Public>} />
          <Route path="/about"             element={<Public><About /></Public>} />
          <Route path="/team"              element={<Public><Team /></Public>} />

          {/* Admin */}
          <Route path="/admin"                     element={<AdminLogin />} />
          <Route path="/admin/dashboard"           element={<Protected><Dashboard /></Protected>} />
          <Route path="/admin/premium-members"     element={<Protected><PremiumMembers /></Protected>} />
          <Route path="/admin/news/new"            element={<Protected><NewsEditor /></Protected>} />
          <Route path="/admin/news/:id/edit"       element={<Protected><NewsEditor /></Protected>} />
          <Route path="/admin/companies"           element={<Protected><CompanyEditor list /></Protected>} />
          <Route path="/admin/companies/new"       element={<Protected><CompanyEditor /></Protected>} />
          <Route path="/admin/companies/:id/edit"  element={<Protected><CompanyEditor /></Protected>} />
          <Route path="/admin/ads"                 element={<Protected><AdsEditor list /></Protected>} />
          <Route path="/admin/ads/new"             element={<Protected><AdsEditor /></Protected>} />
          <Route path="/admin/ads/:id/edit"        element={<Protected><AdsEditor /></Protected>} />
          <Route path="/admin/team"                element={<Protected><TeamEditor /></Protected>} />
          <Route path="/admin/change-password"     element={<Protected><ChangePassword /></Protected>} />

          {/* 404 — public pages */}
          <Route path="*" element={<Public><NotFound /></Public>} />
        </Routes>
      </Suspense>
    </>
  );
}
