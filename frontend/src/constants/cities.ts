export const SUPPORTED_CITIES = [
  "Pune",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
] as const;

export type SupportedCity = (typeof SUPPORTED_CITIES)[number];
