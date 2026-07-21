// src/constants/raceDistances.js
export const RACE_DISTANCES = [
  { id: "5k", label: "5K", km: 5, miles: 3.1068 },
  { id: "10k", label: "10K", km: 10, miles: 6.2137 },
  { id: "half_marathon", label: "Half Marathon", km: 21.0975, miles: 13.1094 },
  { id: "marathon", label: "Marathon", km: 42.195, miles: 26.2188 },
  { id: "50k", label: "50K Ultra", km: 50, miles: 31.0685 },
  { id: "100k", label: "100K Ultra", km: 100, miles: 62.1371 },
];

// src/constants/calculatorTypes.js
export const CALCULATOR_TYPES = {
  VCR: "vcr-calculator",
  RACE: "race-predictor",
  TRAINING: "training-zone",
  SPLIT: "split-calculator",
  FINISH_TIME: "finish-time",
};

// src/constants/apiEndpoints.js
export const API = {
  AUTH: {
    GOOGLE: "/auth/google",
    PROFILE: "/auth/profile",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  HISTORY: "/history",
  USERS: "/users",
  ADMIN: "/admin",
};
