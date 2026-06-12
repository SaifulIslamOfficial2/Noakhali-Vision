import axios from"axios";

export const API_URL=import.meta.env.VITE_API_URL||"http://localhost:5000/api";
export const SITE_URL=import.meta.env.VITE_SITE_URL||window.location.origin;

// Base URL for uploads (strip /api suffix safely)
const BASE_URL=API_URL.endsWith("/api")?API_URL.slice(0,-4):API_URL.replace(/\/api\/?$/,"");
export const BACKEND_URL=BASE_URL;

const api=axios.create({baseURL:API_URL});

api.interceptors.request.use(c=>{
  const t=localStorage.getItem("nv_token");
  if(t)c.headers.Authorization=`Bearer ${t}`;
  return c;
});

export const imageUrl=p=>{
  if(!p)return"/logo.svg";
  if(p.startsWith("http")||p.startsWith("data:"))return p;
  if(p.startsWith("/"))return BASE_URL+p;
  return BASE_URL+"/"+p;
};

export default api;
