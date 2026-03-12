// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Types
export interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: number;
  icon?: string;
  category?: 'main' | 'additional';
}

export interface Barber {
  id: number;
  name: string;
  photo_url?: string;
  specialty?: string;
}

export interface BookingData {
  client_name: string;
  client_phone: string;
  client_telegram: string; // здесь хранится Telegram
  service_id: number;
  barber_id?: number;
  booking_date: string;
  booking_time: string;
}

export interface BookingResponse {
  id: number;
  message: string;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
      endpoint: string,
      options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      // Пытаемся получить тело ответа даже при ошибке
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // ИСПРАВЛЕНО: создаем ошибку с полем status
        const error: any = new Error(
            responseData.error ||
            responseData.message ||
            `HTTP error! status: ${response.status}`
        );
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all services
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/api/services');
  }

  // Get all barbers
  async getBarbers(): Promise<Barber[]> {
    return this.request<Barber[]>('/api/barbers');
  }

  // Create new booking
  async createBooking(data: BookingData): Promise<BookingResponse> {
    return this.request<BookingResponse>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  // Get available time slots for a specific date
  async getAvailableSlots(date: string, barberId?: number): Promise<string[]> {
    const params = new URLSearchParams({ date });
    if (barberId && barberId > 0) {
      params.append('barber_id', barberId.toString());
    }
    return this.request<string[]>(`/api/available-slots?${params}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);