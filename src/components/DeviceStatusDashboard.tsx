// src/components/DeviceStatusDashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  Smartphone, 
  Clock, 
  Thermometer, 
  Search, 
  RefreshCw, 
  Settings, 
  ChevronDown 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from './ui/alert';
import { db } from '@/lib/firebase'; // Ensure correct path
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

interface Device {
  deviceID: string;
  deviceName: string;
  batteryLevel: number;
  isCharging: boolean;
  estimatedTimeToFull: string;
  thermalState: string;
  timestamp: string | Timestamp;
  status: 'online' | 'offline';
  lastSeen: string;
}

const DeviceStatusDashboard = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Reference to the 'devices' collection
      const devicesCollection = collection(db, 'batteryData'); // Update 'devices' to your collection name

      // Set up real-time listener
      const q = query(devicesCollection);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const devicesArray: Device[] = [];
          const now = new Date().getTime();

          snapshot.forEach((doc) => {
            const data = doc.data();
            const deviceID = doc.id;
            const deviceName = data.deviceName || 'Unnamed Device';
            const batteryLevel = typeof data.batteryLevel === 'number' ? data.batteryLevel : 0;
            const isCharging = data.isCharging || false;
            const estimatedTimeToFull = data.estimatedTimeToFull || 'N/A';
            const thermalState = data.thermalState || 'unknown';
            const timestamp = data.timestamp || new Date().toISOString();

            let lastUpdateTime: number;
            try {
              if (timestamp instanceof Timestamp) {
                lastUpdateTime = timestamp.toDate().getTime();
              } else if (typeof timestamp === 'string') {
                // Adjusted parsing: Replace ' at ' with ' ' to make it parseable
                lastUpdateTime = new Date(timestamp.replace(' at ', ' ')).getTime();
              } else {
                throw new Error("Invalid timestamp format");
              }

              if (isNaN(lastUpdateTime)) throw new Error("Invalid timestamp");
            } catch {
              lastUpdateTime = 0; // Default or handle as needed
            }

            const minutesSinceUpdate = (now - lastUpdateTime) / (1000 * 60);

            const status: 'online' | 'offline' = minutesSinceUpdate < 5 ? 'online' : 'offline';
            const lastSeen = formatLastSeen(minutesSinceUpdate);

            devicesArray.push({
              deviceID,
              deviceName,
              batteryLevel,
              isCharging,
              estimatedTimeToFull,
              thermalState,
              timestamp,
              status,
              lastSeen
            });
          });

          console.log("Processed Devices Array:", devicesArray); // Debugging log
          setDevices(devicesArray);
          setLoading(false);
        } catch (err) {
          console.error("Error processing device data:", err);
          setError('Error processing device data');
          setLoading(false);
        }
      }, (err) => {
        console.error("Firestore listener error:", err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error initializing Firestore listener:", err);
      setError('Error initializing Firestore');
      setLoading(false);
    }
  }, []);

  const formatLastSeen = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${Math.floor(minutes)} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const getBatteryColor = (level: number) => {
    if (level <= 0.2) return 'text-red-500';
    if (level <= 0.5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getThermalStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'nominal': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'serious': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
    // Firestore onSnapshot already provides real-time updates, so manual refresh might not be necessary
  };

  const filteredDevices = devices.filter(device =>
    device.deviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return status === "online" 
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-gray-100 text-gray-800`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Device Status Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className={`transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>View Settings</DropdownMenuItem>
                  <DropdownMenuItem>Notifications</DropdownMenuItem>
                  <DropdownMenuItem>Help</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search devices..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All Devices</DropdownMenuItem>
                <DropdownMenuItem>Low Battery</DropdownMenuItem>
                <DropdownMenuItem>Charging</DropdownMenuItem>
                <DropdownMenuItem>Thermal Issues</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Summary Alert */}
          <Alert>
            <AlertTitle className="text-sm font-medium">System Status</AlertTitle>
            <AlertDescription>
              {devices.filter(d => d.status === "online").length} devices online. 
              {devices.filter(d => d.batteryLevel <= 0.2).length > 0 && 
                ` ${devices.filter(d => d.batteryLevel <= 0.2).length} devices with low battery.`}
            </AlertDescription>
          </Alert>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <Card 
              key={device.deviceID} 
              className={`shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1
                ${device.status === 'offline' ? 'opacity-75' : ''}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-6 w-6" />
                    {device.deviceName}
                  </div>
                </CardTitle>
                <span className={getStatusBadge(device.status)}>
                  {device.status}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Battery className={`h-5 w-5 ${getBatteryColor(device.batteryLevel)}`} />
                      <span>Battery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getBatteryColor(device.batteryLevel)}`}>
                        {Math.round(device.batteryLevel * 100)}%
                      </span>
                      {device.isCharging && (
                        <span className="animate-pulse text-yellow-500">⚡</span>
                      )}
                    </div>
                  </div>

                  {device.isCharging && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span>Time to Full</span>
                      </div>
                      <span>{device.estimatedTimeToFull}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className={`h-5 w-5 ${getThermalStateColor(device.thermalState)}`} />
                      <span>Thermal State</span>
                    </div>
                    <span className={`font-medium ${getThermalStateColor(device.thermalState)}`}>
                      {device.thermalState.charAt(0).toUpperCase() + device.thermalState.slice(1)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Last Seen: {device.lastSeen}
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated: {formatTimestamp(device.timestamp)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to format the timestamp
const formatTimestamp = (timestamp: string | Timestamp): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleString();
  } else if (typeof timestamp === 'string') {
    // Attempt to parse the string after replacing ' at ' with ' '
    const parsedDate = new Date(timestamp.replace(' at ', ' '));
    return !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleString() : 'Invalid Date';
  } else {
    return 'Invalid Date';
  }
};

export default DeviceStatusDashboard;
