import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/api";

export default function VisitTracker() {
  const l = useLocation();
  useEffect(() => {
    if (!l.pathname.startsWith("/admin"))
      api.post("/visitors", { path: l.pathname + l.search }).catch(() => {});
  }, [l.pathname, l.search]);
  return null;
}
