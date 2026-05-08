export class ValidationUtil {
  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates pace format (MM:SS)
   */
  static isValidPace(pace: string): boolean {
    const paceRegex = /^\d{1,2}:\d{2}$/;
    return paceRegex.test(pace);
  }

  /**
   * Converts pace string to seconds
   */
  static paceToSeconds(pace: string): number {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds;
  }

  /**
   * Converts seconds to pace string
   */
  static secondsToPace(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
