import axios from "axios";

const client = axios.create({ baseURL: "/api" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("MISDESC_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect to login if token is expired/invalid on protected endpoints,
    // not during actual login requests or when already on the login page
    const isLoginEndpoint = err.config?.url?.includes("/auth/login");
    const isAlreadyOnLoginPage = window.location.pathname === "/login";

    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem("MISDESC_token");
      localStorage.removeItem("MISDESC_user");
      if (!isAlreadyOnLoginPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;
