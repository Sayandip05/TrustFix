"use client";

import { useState, useEffect, useCallback } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string;
  address: string;
  permission: "granted" | "denied" | "prompt" | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "trustfix_user_location";

const DEFAULT_LOCATION = {
  latitude: 22.5726, // Kolkata
  longitude: 88.3639,
  city: "Kolkata",
  address: "Kolkata, West Bengal",
};

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: "",
    address: "",
    permission: null,
    loading: false,
    error: null,
  });

  // Load location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocation((prev: LocationState) => ({
          ...prev,
          ...parsed,
          permission: "granted",
        }));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((loc: Partial<LocationState>) => {
    const newLocation = { ...location, ...loc };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      city: newLocation.city,
      address: newLocation.address,
    }));
    setLocation(newLocation);
  }, [location]);

  // Request location permission
  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setLocation((prev: LocationState) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        permission: "denied",
      }));
      return false;
    }

    setLocation((prev: LocationState) => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const cityInfo = await reverseGeocode(latitude, longitude);

      const newLocation: LocationState = {
        latitude,
        longitude,
        city: cityInfo.city || DEFAULT_LOCATION.city,
        address: cityInfo.address || DEFAULT_LOCATION.address,
        permission: "granted",
        loading: false,
        error: null,
      };

      saveLocation(newLocation);
      return true;
    } catch (err: any) {
      const errorMessage = getGeolocationErrorMessage(err);
      setLocation((prev: LocationState) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permission: err.code === 1 ? "denied" : "prompt",
      }));
      return false;
    }
  }, [saveLocation]);

  // Use default location (when user denies permission)
  const useDefaultLocation = useCallback(() => {
    const defaultLoc: LocationState = {
      ...DEFAULT_LOCATION,
      permission: "denied",
      loading: false,
      error: null,
    };
    saveLocation(defaultLoc);
  }, [saveLocation]);

  // Manually set location (for city search)
  const setManualLocation = useCallback((city: string, address: string) => {
    // For manual location, we'll use default coordinates
    // In production, you might want to geocode the city name
    saveLocation({
      city,
      address,
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      permission: "granted",
    });
  }, [saveLocation]);

  // Clear location
  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocation({
      latitude: null,
      longitude: null,
      city: "",
      address: "",
      permission: null,
      loading: false,
      error: null,
    });
  }, []);

  // Check if location is available
  const hasLocation = location.latitude !== null && location.longitude !== null;

  return {
    ...location,
    hasLocation,
    requestLocation,
    useDefaultLocation,
    setManualLocation,
    clearLocation,
  };
}

// Reverse geocode using OpenStreetMap (free)
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; address: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "TrustFix/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract city from various possible fields
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      DEFAULT_LOCATION.city;

    return {
      city,
      address: data.display_name || DEFAULT_LOCATION.address,
    };
  } catch {
    return {
      city: DEFAULT_LOCATION.city,
      address: DEFAULT_LOCATION.address,
    };
  }
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Please enable location access in your browser settings.";
    case error.POSITION_UNAVAILABLE:
      return "Location information unavailable. Please try again.";
    case error.TIMEOUT:
      return "Location request timed out. Please try again.";
    default:
      return "An error occurred while getting your location.";
  }
}
