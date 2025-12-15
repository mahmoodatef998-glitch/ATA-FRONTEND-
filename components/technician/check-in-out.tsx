"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import { useSocket, useSocketEvent } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { formatUaeTime } from "@/lib/timezone-utils";
import { useI18n } from "@/lib/i18n/context";

interface AttendanceStatus {
  checkedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  hoursWorked: string;
  attendanceType: string;
  hasPendingRequest?: boolean;
  pendingRequestId?: number | null;
}

export function CheckInOut() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [allowCheckInWithoutLocation, setAllowCheckInWithoutLocation] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Initialize WebSocket connection
  const { socket } = useSocket({
    companyId: session?.user?.companyId,
    userId: session?.user?.id,
    autoConnect: true,
  });

  // Define fetchStatus before useEffect
  const fetchStatus = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setStatusLoading(true);
      const response = await fetch("/api/attendance/status");
      const result = await response.json();
      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setStatusLoading(false);
    }
  }, [session?.user]);

  // Subscribe to attendance approval events (after fetchStatus is defined)
  useSocketEvent(socket, "attendance_approved", (data: any) => {
    console.log("✅ Attendance approved event received:", data);
    
    if (data.approved) {
      toast({
        title: "✅ Check-in Approved!",
        description: "Your check-in request has been approved. You are now checked in.",
        duration: 5000,
        className: "bg-green-50 border-green-200",
      });
      
      // Refresh status to show checked in
      fetchStatus();
    } else {
      toast({
        title: "❌ Check-in Rejected",
        description: data.message || "Your check-in request has been rejected.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Refresh status to clear pending request
      fetchStatus();
    }
  });

  // useEffect after fetchStatus is defined
  useEffect(() => {
    // Only fetch if session is available
    if (!session?.user) return;
    
    // Fetch status once on mount
    fetchStatus();
    
    // Removed automatic polling - WebSocket handles real-time updates
    // If WebSocket is not available, user can manually refresh or check-in/out will trigger update
    // This prevents unnecessary page refreshes and improves performance
    
    // Optional: Only poll if WebSocket is not connected (as a fallback)
    // Uncomment the following if you need polling as fallback:
    // if (!isConnected) {
    //   const interval = setInterval(() => {
    //     fetchStatus();
    //   }, 60000); // Poll every 60 seconds only if WebSocket is disconnected
    //   return () => clearInterval(interval);
    // }
  }, [fetchStatus, session?.user]); // Depend on fetchStatus callback

  const getCurrentLocation = (): Promise<{ lat: number; lng: number; accuracy?: number }> => {
    return new Promise((resolve, reject) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser. Please use a modern browser (Chrome, Firefox, Edge)."));
        return;
      }

      // Improved location accuracy: Get multiple readings, filter bad ones, and use median
      // This reduces GPS drift and improves consistency significantly
      const readings: Array<{ lat: number; lng: number; accuracy: number; timestamp: number }> = [];
      const maxReadings = 15; // Get 15 readings for maximum accuracy and consistency
      const minGoodReadings = 8; // Need at least 8 good readings for precision
      const maxAccuracyThreshold = 25; // Only accept readings with accuracy <= 25 meters (very high precision)
      const maxDeviationMeters = 50; // Maximum deviation from median (in meters) - reject outliers
      let readingCount = 0;
      let watchId: number | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let hasStartedCollecting = false;

      const collectReading = (position: GeolocationPosition) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy, // Accuracy in meters
          timestamp: Date.now(),
        };
        
        // Validate coordinates (basic sanity check)
        if (isNaN(coords.lat) || isNaN(coords.lng) || 
            coords.lat < -90 || coords.lat > 90 ||
            coords.lng < -180 || coords.lng > 180) {
          return; // Skip invalid readings
        }
        
        hasStartedCollecting = true;
        readingCount++;
        
        // Filter out readings with poor accuracy (unless we have very few readings)
        if (coords.accuracy > maxAccuracyThreshold && readings.length >= minGoodReadings) {
          console.log(`⚠️ Skipping reading ${readingCount} with poor accuracy: ${coords.accuracy.toFixed(1)}m`);
          return; // Skip this reading
        }
        
        readings.push(coords);
        
        console.log(`📍 Reading ${readingCount} (${readings.length} good):`, {
          lat: coords.lat.toFixed(6),
          lng: coords.lng.toFixed(6),
          accuracy: `${coords.accuracy.toFixed(1)}m`
        });
        
        // If we have enough good readings, calculate result
        if (readings.length >= maxReadings) {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
          
          // Sort readings by accuracy (best first)
          const sortedReadings = [...readings].sort((a, b) => a.accuracy - b.accuracy);
          
          // Calculate median first to filter outliers
          const calculateMedian = (arr: number[]) => {
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 
              ? (sorted[mid - 1] + sorted[mid]) / 2 
              : sorted[mid];
          };
          
          const medianLat = calculateMedian(readings.map(r => r.lat));
          const medianLng = calculateMedian(readings.map(r => r.lng));
          
          // Filter readings: keep only those within maxDeviationMeters from median
          const filteredReadings = sortedReadings.filter(reading => {
            // Calculate distance from median using Haversine formula
            const R = 6371000; // Earth's radius in meters
            const dLat = (reading.lat - medianLat) * Math.PI / 180;
            const dLng = (reading.lng - medianLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(medianLat * Math.PI / 180) * Math.cos(reading.lat * Math.PI / 180) *
                      Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance <= maxDeviationMeters;
          });
          
          // Use filtered readings (or all if filtering removed too many)
          const bestReadings = filteredReadings.length >= minGoodReadings 
            ? filteredReadings.slice(0, Math.max(5, Math.ceil(filteredReadings.length * 0.6)))
            : sortedReadings.slice(0, Math.max(5, Math.ceil(sortedReadings.length * 0.6)));
          
          // Calculate median of best readings (more stable than average for GPS)
          const bestLats = bestReadings.map(r => r.lat).sort((a, b) => a - b);
          const bestLngs = bestReadings.map(r => r.lng).sort((a, b) => a - b);
          const finalLat = bestLats.length % 2 === 0
            ? (bestLats[bestLats.length / 2 - 1] + bestLats[bestLats.length / 2]) / 2
            : bestLats[Math.floor(bestLats.length / 2)];
          const finalLng = bestLngs.length % 2 === 0
            ? (bestLngs[bestLngs.length / 2 - 1] + bestLngs[bestLngs.length / 2]) / 2
            : bestLngs[Math.floor(bestLngs.length / 2)];
          
          // Use best accuracy from filtered readings
          const bestAccuracy = Math.min(...bestReadings.map(r => r.accuracy));
          
          const finalCoords = {
            lat: finalLat,
            lng: finalLng,
            accuracy: bestAccuracy,
          };
          
          // Calculate spread to check consistency
          const latSpread = Math.max(...bestReadings.map(r => r.lat)) - Math.min(...bestReadings.map(r => r.lat));
          const lngSpread = Math.max(...bestReadings.map(r => r.lng)) - Math.min(...bestReadings.map(r => r.lng));
          const maxSpread = Math.max(latSpread, lngSpread) * 111000; // Convert to meters (approx)
          
          console.log("📍 Final GPS Result (Median-based, Outlier-filtered):", {
            totalReadings: readings.length,
            filteredReadings: filteredReadings.length,
            bestReadingsUsed: bestReadings.length,
            median: {
              lat: medianLat.toFixed(6),
              lng: medianLng.toFixed(6)
            },
            final: {
              lat: finalCoords.lat.toFixed(6),
              lng: finalCoords.lng.toFixed(6),
              accuracy: `${finalCoords.accuracy.toFixed(1)}m`
            },
            spread: `${maxSpread.toFixed(1)}m`,
            readings: bestReadings.map(r => ({
              lat: r.lat.toFixed(6),
              lng: r.lng.toFixed(6),
              accuracy: `${r.accuracy.toFixed(1)}m`
            }))
          });
          
          resolve(finalCoords);
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        
        let errorMessage = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied Geolocation";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Your device may not have GPS or network location services.";
            // If we have at least minGoodReadings readings, use them
            if (readings.length >= minGoodReadings) {
              const sortedReadings = [...readings].sort((a, b) => a.accuracy - b.accuracy);
              const bestReadings = sortedReadings.slice(0, Math.min(3, sortedReadings.length));
              const avgLat = bestReadings.reduce((sum, r) => sum + r.lat, 0) / bestReadings.length;
              const avgLng = bestReadings.reduce((sum, r) => sum + r.lng, 0) / bestReadings.length;
              const bestAccuracy = Math.min(...bestReadings.map(r => r.accuracy));
              resolve({ lat: avgLat, lng: avgLng, accuracy: bestAccuracy });
              return;
            }
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            // If we have at least minGoodReadings readings, use them
            if (readings.length >= minGoodReadings) {
              const sortedReadings = [...readings].sort((a, b) => a.accuracy - b.accuracy);
              const bestReadings = sortedReadings.slice(0, Math.min(3, sortedReadings.length));
              const avgLat = bestReadings.reduce((sum, r) => sum + r.lat, 0) / bestReadings.length;
              const avgLng = bestReadings.reduce((sum, r) => sum + r.lng, 0) / bestReadings.length;
              const bestAccuracy = Math.min(...bestReadings.map(r => r.accuracy));
              resolve({ lat: avgLat, lng: avgLng, accuracy: bestAccuracy });
              return;
            }
            break;
          default:
            errorMessage = error.message || "Unknown location error";
        }
        
        reject(new Error(errorMessage));
      };

      // Use watchPosition to get multiple readings
      // This gives us continuous updates which we can filter and average
      try {
        watchId = navigator.geolocation.watchPosition(
          collectReading,
          handleError,
          {
            enableHighAccuracy: true, // Always use high accuracy for better results
            timeout: 30000, // 30 second timeout (longer for more readings)
            maximumAge: 0, // Don't use cached location - always get fresh location
          }
        );
        
        // Fallback: If we don't get enough readings in 25 seconds, use what we have
        timeoutId = setTimeout(() => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          
          if (readings.length >= minGoodReadings) {
            // Sort and use best readings
            const sortedReadings = [...readings].sort((a, b) => a.accuracy - b.accuracy);
            
            // Calculate median first
            const calculateMedian = (arr: number[]) => {
              const sorted = [...arr].sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              return sorted.length % 2 === 0 
                ? (sorted[mid - 1] + sorted[mid]) / 2 
                : sorted[mid];
            };
            
            const medianLat = calculateMedian(readings.map(r => r.lat));
            const medianLng = calculateMedian(readings.map(r => r.lng));
            
            // Filter outliers
            const filteredReadings = sortedReadings.filter(reading => {
              const R = 6371000;
              const dLat = (reading.lat - medianLat) * Math.PI / 180;
              const dLng = (reading.lng - medianLng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(medianLat * Math.PI / 180) * Math.cos(reading.lat * Math.PI / 180) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;
              return distance <= maxDeviationMeters;
            });
            
            const bestReadings = filteredReadings.length >= minGoodReadings
              ? filteredReadings.slice(0, Math.max(5, Math.ceil(filteredReadings.length * 0.6)))
              : sortedReadings.slice(0, Math.max(5, Math.ceil(sortedReadings.length * 0.6)));
            
            // Use median of best readings
            const bestLats = bestReadings.map(r => r.lat).sort((a, b) => a - b);
            const bestLngs = bestReadings.map(r => r.lng).sort((a, b) => a - b);
            const finalLat = bestLats.length % 2 === 0
              ? (bestLats[bestLats.length / 2 - 1] + bestLats[bestLats.length / 2]) / 2
              : bestLats[Math.floor(bestLats.length / 2)];
            const finalLng = bestLngs.length % 2 === 0
              ? (bestLngs[bestLngs.length / 2 - 1] + bestLngs[bestLngs.length / 2]) / 2
              : bestLngs[Math.floor(bestLngs.length / 2)];
            
            const bestAccuracy = Math.min(...bestReadings.map(r => r.accuracy));
            
            const finalCoords = {
              lat: finalLat,
              lng: finalLng,
              accuracy: bestAccuracy,
            };
            
            console.log("📍 Timeout - Using available readings:", {
              totalReadings: readings.length,
              readingsUsed: bestReadings.length,
              final: {
                lat: finalCoords.lat.toFixed(6),
                lng: finalCoords.lng.toFixed(6),
                accuracy: `${finalCoords.accuracy.toFixed(1)}m`
              }
            });
            
            resolve(finalCoords);
          } else if (readings.length > 0) {
            // Even if we have less than minGoodReadings, use what we have if it's the best we can get
            const sortedReadings = [...readings].sort((a, b) => a.accuracy - b.accuracy);
            const bestReading = sortedReadings[0]; // Use the best single reading
            
            console.log("📍 Using single best reading (limited readings available):", {
              lat: bestReading.lat.toFixed(6),
              lng: bestReading.lng.toFixed(6),
              accuracy: `${bestReading.accuracy.toFixed(1)}m`
            });
            
            resolve({
              lat: bestReading.lat,
              lng: bestReading.lng,
              accuracy: bestReading.accuracy,
            });
          } else if (!hasStartedCollecting) {
            // No readings collected at all - likely a permission or hardware issue
            reject(new Error("Could not get GPS location. Please check your location permissions and try again."));
          } else {
            // Started collecting but all readings were filtered out
            reject(new Error("GPS readings are not accurate enough. Please try again or check your location settings."));
          }
        }, 30000); // Increased to 30 seconds for more readings
      } catch (error: any) {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        reject(new Error(error.message || "Failed to get location"));
      }
    });
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setLocationError(null);

      let currentLocation: { lat: number; lng: number; accuracy?: number };
      let locationName: string;

      try {
        // Try to get current location
        // Force request - don't check cached permissions
        currentLocation = await getCurrentLocation();
        locationName = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
        setLocation(currentLocation);
        
        // Show success message with accuracy info
        const accuracyMsg = currentLocation.accuracy 
          ? `${t('common.locationAccuracy')}: ±${Math.round(currentLocation.accuracy)} ${t('common.meters')}`
          : t('common.locationDetected');
        toast({
          title: `📍 ${t('common.locationDetected')}`,
          description: accuracyMsg,
          duration: 3000,
        });
      } catch (locationError: any) {
        // If location fails, show error and don't allow check-in with default location
        const errorMsg = locationError.message || "Could not get location";
        
        // Clean up error message - remove duplicate "Location error:" prefix
        let cleanErrorMsg = errorMsg;
        if (cleanErrorMsg.includes("Location error: Location error:")) {
          cleanErrorMsg = cleanErrorMsg.replace("Location error: Location error:", "Location error:");
        }
        if (cleanErrorMsg.includes("Location error: User denied Geolocation")) {
          cleanErrorMsg = "User denied Geolocation. The browser has cached old permission settings.";
        }
        
        // Determine error type
        let errorType = "unknown";
        let userMessage = "";
        
        if (cleanErrorMsg.includes("permission denied") || cleanErrorMsg.includes("Permission denied") || cleanErrorMsg.includes("User denied Geolocation")) {
          errorType = "permission_denied";
          userMessage = "Location permission denied. The browser has permanently blocked location access.\n\n🔧 Solution (Chrome/Edge):\n1. Click 🔒 lock icon in address bar\n2. Click 'Site settings'\n3. Find 'Location' → Change to 'Allow'\n4. Close settings → Refresh page (F5)\n\n🔧 Alternative (Complete Reset):\n1. Press F12 → Application tab\n2. Under 'Storage' → Click 'Clear site data'\n3. Close F12 → Refresh page (F5)\n\n💡 Quick Fix: Use Incognito Mode (Ctrl+Shift+N) - it works there!";
        } else if (cleanErrorMsg.includes("unavailable") || cleanErrorMsg.includes("POSITION_UNAVAILABLE")) {
          errorType = "unavailable";
          userMessage = "Location unavailable. Please:\n1. Check your WiFi/Network connection\n2. Ensure location services are enabled\n3. Try again";
        } else if (cleanErrorMsg.includes("timeout") || cleanErrorMsg.includes("TIMEOUT")) {
          errorType = "timeout";
          userMessage = "Location request timed out. Please:\n1. Check your internet connection\n2. Try again";
        } else {
          errorType = "unknown";
          userMessage = `${cleanErrorMsg}\n\nPlease enable location services and try again.`;
        }
        
        setLocationError(userMessage);
        
        toast({
          title: "❌ Location Error",
          description: userMessage,
          variant: "destructive",
          duration: 10000,
        });
        
        console.error("Location error:", cleanErrorMsg);
        
        // If user previously allowed check-in without location, use default location
        if (allowCheckInWithoutLocation) {
          console.warn("Using default location due to permission denial");
          currentLocation = {
            lat: 25.2048, // Default Dubai coordinates
            lng: 55.2708,
          };
          locationName = "Office (Default Location - GPS unavailable)";
          setLocation(currentLocation);
          
          toast({
            title: "⚠️ Using Default Location",
            description: "Check-in will proceed with default office location. Location tracking is disabled.",
            variant: "default",
            duration: 5000,
          });
        } else {
          // Don't proceed with check-in if location fails
          setLoading(false);
          return;
        }
      }

      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          location: locationName,
          attendanceType: "OFFICE",
        }),
      });

      const result = await response.json();

      // Check if check-in was rejected due to being outside radius
      if (!result.success && result.requiresRequest) {
        // Show request dialog
        setRequestDialogOpen(true);
        setLoading(false);
        toast({
          title: "⚠️ Outside Allowed Radius",
          description: result.message || "You are outside the allowed radius. Please use 'Request Check-in' instead.",
          variant: "default",
          duration: 6000,
        });
        return;
      }

      if (result.success) {
        // Check location validation result
        if (result.locationValidation) {
          const { valid, distance, message } = result.locationValidation;
          
          if (result.requiresApproval) {
            // Outside radius - pending approval
            toast({
              title: "⏳ Check-in Pending Approval",
              description: `You are ${distance}m from the office (allowed: ${result.locationValidation.distance ? 'within range' : 'outside range'}).\n\nYour check-in request has been submitted and is waiting for admin approval.`,
              duration: 8000,
              variant: "default",
            });
          } else {
            // Within radius - approved
            toast({
              title: "✅ Checked in successfully!",
              description: message || `Checked in at ${formatUaeTime(new Date())}\nDistance: ${distance}m from office`,
              className: "bg-green-50 border-green-200",
              duration: 5000,
            });
          }
        } else {
          // No location validation (no company location set)
          toast({
            title: "✅ Checked in successfully!",
            description: `Checked in at ${formatUaeTime(new Date())}`,
            className: "bg-green-50 border-green-200",
          });
        }
        fetchStatus();
      } else {
        // Handle specific error messages
        let errorMessage = result.error || "Failed to check in";
        
        if (errorMessage.includes("already checked in")) {
          errorMessage = "You are already checked in. Please check out first.";
        } else if (errorMessage.includes("outside")) {
          errorMessage = "You are outside the allowed radius. Your check-in request is pending admin approval.";
        }
        
        toast({
          title: "❌ Check-in failed",
          description: errorMessage,
          variant: "destructive",
          duration: 6000,
        });
      }
    } catch (error: any) {
      console.error("Check-in error:", error);
      const errorMessage = error.message || "Failed to check in. Please try again.";
      setLocationError(errorMessage);
      
      toast({
        title: "❌ Check-in Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setLocationError(null);

      let currentLocation: { lat: number; lng: number };
      let locationName: string;

      try {
        // Try to get current location
        currentLocation = await getCurrentLocation();
        locationName = `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`;
        setLocation(currentLocation);
      } catch (locationError: any) {
        // If location fails, use default location
        currentLocation = {
          lat: 25.2048, // Default Dubai coordinates
          lng: 55.2708,
        };
        locationName = "Office (Default Location - GPS unavailable)";
        setLocation(currentLocation);
        
        toast({
          title: "⚠️ Using default location",
          description: `${locationError.message || "Could not get location"}\n\nUsing default office location for check-out.`,
          duration: 4000,
          variant: "default",
        });
      }

      const response = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          location: locationName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Checked out successfully!",
          description: `Worked ${result.data.hoursWorked} hours today`,
          className: "bg-green-50 border-green-200",
        });
        fetchStatus();
      } else {
        toast({
          title: "❌ Check-out failed",
          description: result.error || "Failed to check out",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Check-out error:", error);
      setLocationError(error.message);
      toast({
        title: "❌ Check-out error",
        description: error.message || "Failed to check out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Check In Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {t('common.checkIn')}
          </CardTitle>
          <CardDescription>{t('common.startWorkDay')}</CardDescription>
        </CardHeader>
        <CardContent>
          {status?.hasPendingRequest ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{t('common.checkInRequestPending')}</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {t('common.waitingForApproval')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('common.youWillBeNotified')}
                </p>
              </div>
            </div>
          ) : status?.checkedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{t('common.checkedIn')}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{status.checkInTime ? formatDateTime(status.checkInTime) : "N/A"}</span>
                </div>
                {status.checkInLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{status.checkInLocation}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">{t('common.hoursWorked')}: </span>
                  <span className="font-medium">{status.hoursWorked}h</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Location Details */}
              {location && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">📍 {t('common.currentLocation')}:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLocationDetails(!showLocationDetails)}
                          className="h-6 text-xs"
                        >
                          {showLocationDetails ? t('common.hideDetails') : t('common.showDetails')}
                        </Button>
                      </div>
                      {showLocationDetails && (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-blue-700">{t('common.latitude')}:</span>
                              <span className="font-mono ml-1">{location.lat.toFixed(6)}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">{t('common.longitude')}:</span>
                              <span className="font-mono ml-1">{location.lng.toFixed(6)}</span>
                            </div>
                          </div>
                          {location.accuracy && (
                            <div className="pt-2 border-t border-blue-200">
                              <span className="text-blue-700">{t('common.accuracy')}:</span>
                              <span className="font-medium ml-1">
                                {location.accuracy < 10 
                                  ? `${t('common.highAccuracy')} (±${Math.round(location.accuracy)} ${t('common.meters')})` 
                                  : location.accuracy < 50 
                                  ? `${t('common.goodAccuracy')} (±${Math.round(location.accuracy)} ${t('common.meters')})`
                                  : `${t('common.mediumAccuracy')} (±${Math.round(location.accuracy)} ${t('common.meters')})`}
                              </span>
                            </div>
                          )}
                          <div className="pt-2">
                            <a
                              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-xs"
                            >
                              🗺️ {t('common.viewOnGoogleMaps')}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.checkingIn')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('common.checkIn')}
                  </>
                )}
              </Button>
              
              <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={(e) => {
                      e.preventDefault();
                      setRequestDialogOpen(true);
                    }}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {t('common.requestCheckIn')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('common.requestCheckIn')}</DialogTitle>
                    <DialogDescription>
                      {t('common.outsideRadius')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="reason">{t('common.reasonPlaceholder')}</Label>
                      <Input
                        id="reason"
                        placeholder={t('common.reasonPlaceholder')}
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRequestDialogOpen(false);
                        setRequestReason("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!requestReason.trim()) {
                          toast({
                            title: "Error",
                            description: t('common.reasonRequired'),
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          setRequesting(true);
                          let currentLocation: { lat: number; lng: number };

                          try {
                            currentLocation = await getCurrentLocation();
                          } catch (error: any) {
                            toast({
                              title: "❌ Location Error",
                              description: "Could not get location. Please enable location services.",
                              variant: "destructive",
                            });
                            setRequesting(false);
                            return;
                          }

                          const response = await fetch("/api/attendance/request-checkin", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              lat: currentLocation.lat,
                              lng: currentLocation.lng,
                              location: `Lat: ${currentLocation.lat.toFixed(6)}, Lng: ${currentLocation.lng.toFixed(6)}`,
                              reason: requestReason,
                            }),
                          });

                          const result = await response.json();

                          if (result.success) {
                            toast({
                              title: `✅ ${t('common.requestSubmitted')}`,
                              description: t('common.requestPendingApproval'),
                              duration: 5000,
                            });
                            setRequestDialogOpen(false);
                            setRequestReason("");
                            fetchStatus();
                          } else {
                            toast({
                              title: `❌ ${t('common.requestFailed')}`,
                              description: result.error || t('common.requestFailed'),
                              variant: "destructive",
                            });
                          }
                        } catch (error: any) {
                          console.error("Request check-in error:", error);
                          toast({
                            title: "❌ Error",
                            description: error.message || "Failed to submit request",
                            variant: "destructive",
                          });
                        } finally {
                          setRequesting(false);
                        }
                      }}
                      disabled={requesting || !requestReason.trim()}
                    >
                      {requesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.submitting')}
                        </>
                      ) : (
                        t('common.submitRequest')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check Out Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            {t('common.checkOut')}
          </CardTitle>
          <CardDescription>{t('common.endWorkDay')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!status?.checkedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span>{t('common.notCheckedIn')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('common.pleaseCheckInFirst')}
              </p>
            </div>
          ) : (
            <Button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full"
              size="lg"
              variant="destructive"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.checkingIn')}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('common.checkOut')}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {locationError && (
        <div className="col-span-2">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm text-yellow-800 whitespace-pre-line">
                  ⚠️ {locationError}
                </p>
                {locationError.includes("permission denied") || locationError.includes("permanently denied") ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Force clear any cached permission state and try again
                          setLocationError(null);
                          // Small delay to ensure state is cleared
                          setTimeout(() => {
                            handleCheckIn();
                          }, 100);
                        }}
                        className="flex-1"
                      >
                        🔄 Try Again
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            // Try to clear site data if possible
                            if ('serviceWorker' in navigator) {
                              const registrations = await navigator.serviceWorker.getRegistrations();
                              for (const registration of registrations) {
                                await registration.unregister();
                              }
                            }
                            
                            // Clear cache storage
                            if ('caches' in window) {
                              const cacheNames = await caches.keys();
                              await Promise.all(cacheNames.map(name => caches.delete(name)));
                            }
                            
                            // Clear localStorage and sessionStorage
                            try {
                              localStorage.clear();
                              sessionStorage.clear();
                            } catch (e) {
                              // Ignore errors
                            }
                            
                            toast({
                              title: "✅ Cache Cleared",
                              description: "Site cache cleared. Now please:\n1. Click 🔒 lock icon → Site settings\n2. Change Location to 'Allow'\n3. Refresh page (F5)",
                              duration: 8000,
                            });
                            
                            // Don't auto-refresh - let user change site settings first
                          } catch (error) {
                            toast({
                              title: "⚠️ Manual Steps Required",
                              description: "Please:\n1. Click 🔒 lock icon → Site settings → Allow Location\n2. F12 → Application → Clear site data\n3. Refresh page",
                              variant: "default",
                              duration: 8000,
                            });
                          }
                        }}
                        className="flex-1"
                      >
                        🗑️ Clear Cache
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Open site settings in new window (if possible)
                          const url = window.location.origin;
                          toast({
                            title: "📖 Instructions",
                            description: "1. Click 🔒 lock icon (left of URL)\n2. Click 'Site settings'\n3. Find 'Location' → Change to 'Allow'\n4. Close → Refresh page (F5)",
                            duration: 10000,
                          });
                        }}
                        className="flex-1"
                      >
                        📖 How to Fix
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs font-semibold text-blue-900 mb-2">💡 Step-by-Step Fix:</p>
                        <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                          <li><strong>Click 🔒 lock icon</strong> in address bar (left of URL)</li>
                          <li>Click <strong>&quot;Site settings&quot;</strong> (or &quot;Permissions&quot;)</li>
                          <li>Find <strong>&quot;Location&quot;</strong> → Change from &quot;Block&quot; to <strong>&quot;Allow&quot;</strong></li>
                          <li>Close settings → Press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">F5</kbd> to refresh</li>
                          <li>Try Check-in again</li>
                        </ol>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-blue-700">
                            <strong>Alternative:</strong> Use Incognito Mode (<kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Shift+N</kbd>) - it works there!
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded p-3">
                        <p className="text-xs font-semibold text-orange-900 mb-2">⚠️ Temporary Workaround:</p>
                        <p className="text-xs text-orange-800 mb-2">
                          If location permission cannot be fixed, you can check in with default office location (location tracking will be disabled).
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAllowCheckInWithoutLocation(true);
                            setLocationError(null);
                            toast({
                              title: "✅ Enabled",
                              description: "You can now check in with default location. Click 'Check In' again.",
                              duration: 3000,
                            });
                            // Automatically retry check-in
                            setTimeout(() => {
                              handleCheckIn();
                            }, 500);
                          }}
                          className="w-full bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-300"
                        >
                          ✓ Allow Check-in Without Location
                        </Button>
                        <p className="text-xs text-orange-700 mt-2">
                          Note: This will use default office coordinates. Location tracking will be disabled.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

