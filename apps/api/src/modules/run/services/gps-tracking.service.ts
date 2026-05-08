import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Live GPS Tracking System
 * 
 * Real-time location tracking with:
 * - Kalman filtering for noise reduction
 * - GPS accuracy validation
 * - Battery optimization
 * - Pace smoothing
 * - Distance calculation
 * - Split tracking
 */
@Injectable()
export class GpsTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Process incoming GPS point with Kalman filtering
   * Reduces GPS noise and improves accuracy
   */
  processGpsPoint(
    runId: string,
    latitude: number,
    longitude: number,
    timestamp: Date,
    accuracy: number,
    previousPoint?: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      filteredLat: number;
      filteredLng: number;
      velocity?: number;
    },
  ) {
    // Kalman filter for GPS smoothing
    const processNoise = 0.01; // Q matrix
    const measurementNoise = accuracy * 0.001; // R matrix (proportional to GPS accuracy)

    let filteredLat = latitude;
    let filteredLng = longitude;

    if (previousPoint) {
      // Simple Kalman filter implementation
      const K = processNoise / (processNoise + measurementNoise);
      filteredLat = previousPoint.filteredLat + K * (latitude - previousPoint.filteredLat);
      filteredLng = previousPoint.filteredLng + K * (longitude - previousPoint.filteredLng);
    }

    return {
      filteredLatitude: filteredLat,
      filteredLongitude: filteredLng,
      accuracy,
    };
  }

  /**
   * Calculate distance between two GPS points using Haversine formula
   * More accurate than simple Euclidean distance
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculate pace from distance and time
   * Returns pace in MM:SS per km format
   */
  calculatePace(distanceKm: number, durationSeconds: number): string {
    if (distanceKm === 0 || durationSeconds === 0) return '0:00';
    const secondsPerKm = durationSeconds / distanceKm;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Validate GPS accuracy
   */
  validateGpsAccuracy(
    previousPoint: { latitude: number; longitude: number; timestamp: Date },
    currentPoint: { latitude: number; longitude: number; timestamp: Date },
    accuracy: number,
  ): boolean {
    // GPS accuracy must be < 30 meters for valid outdoor run
    if (accuracy > 30) return false;

    // Calculate maximum reasonable distance
    const maxReasonableSpeed = 40; // km/h
    const timeGapSeconds =
      (currentPoint.timestamp.getTime() - previousPoint.timestamp.getTime()) / 1000;
    const maxReasonableDistance = (maxReasonableSpeed * timeGapSeconds) / 3600; // km

    const distance = this.calculateDistance(
      previousPoint.latitude,
      previousPoint.longitude,
      currentPoint.latitude,
      currentPoint.longitude,
    );

    return distance <= maxReasonableDistance;
  }

  /**
   * Calculate splits (distance segments, typically 1 km)
   */
  calculateSplits(
    gpsPoints: Array<{ latitude: number; longitude: number; timestamp: Date }>,
  ): Array<{
    splitNumber: number;
    distance: number;
    pace: string;
    timeSeconds: number;
  }> {
    const splits: Array<{
      splitNumber: number;
      distance: number;
      pace: string;
      timeSeconds: number;
    }> = [];

    let totalDistance = 0;
    let lastSplitDistance = 0;
    let lastSplitTime = gpsPoints[0].timestamp;
    let splitNumber = 1;

    for (let i = 1; i < gpsPoints.length; i++) {
      const segmentDistance = this.calculateDistance(
        gpsPoints[i - 1].latitude,
        gpsPoints[i - 1].longitude,
        gpsPoints[i].latitude,
        gpsPoints[i].longitude,
      );

      totalDistance += segmentDistance;

      // Every 1 km, record a split
      if (totalDistance - lastSplitDistance >= 1.0) {
        const timeSinceLastSplit =
          (gpsPoints[i].timestamp.getTime() - lastSplitTime.getTime()) / 1000;
        const pace = this.calculatePace(totalDistance - lastSplitDistance, timeSinceLastSplit);

        splits.push({
          splitNumber,
          distance: totalDistance,
          pace,
          timeSeconds: Math.round(timeSinceLastSplit),
        });

        lastSplitDistance = totalDistance;
        lastSplitTime = gpsPoints[i].timestamp;
        splitNumber++;
      }
    }

    return splits;
  }
}
