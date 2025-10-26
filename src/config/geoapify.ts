export const GEOAPIFY_CONFIG = {
  apiKey: import.meta.env.VITE_GEOAPIFY_KEY || "ef98d518703c4358986bbd6f972f608c",
  baseUrl: "https://api.geoapify.com/v1/routing",
  defaultRadius: 2000, // 2km in meters
  minUpdateInterval: 8000, // 8 seconds debounce
};
