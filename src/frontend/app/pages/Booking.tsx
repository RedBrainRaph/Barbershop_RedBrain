import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, Send } from "lucide-react";
import { apiClient, Service, Barber, BookingData } from "../api/client";

export function Booking() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    telegram: "",
    serviceId: 0,
    barberId: 0,
    date: "",
    time: "",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botLink] = useState("https://t.me/ITBotyara02_bot");

  // Загрузка услуг и барберов при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, barbersData] = await Promise.all([
          apiClient.getServices(),
          apiClient.getBarbers(),
        ]);

        setServices(servicesData);
        setBarbers(barbersData);
        setError(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Не удалось загрузить данные. Проверьте подключение к серверу.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Загружаем доступные слоты при изменении даты или барбера
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!formData.date) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const slots = await apiClient.getAvailableSlots(
            formData.date,
            formData.barberId > 0 ? formData.barberId : undefined
        );
        setAvailableSlots(slots);

        // Если текущее выбранное время недоступно - сбрасываем его
        if (formData.time && !slots.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: "" }));
        }
      } catch (err) {
        console.error('Failed to load available slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [formData.date, formData.barberId]);

  // Валидация Telegram username
  const validateTelegram = (username: string): boolean => {
    return /^@[a-zA-Z0-9_]{5,}$/.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем Telegram перед отправкой
    if (!validateTelegram(formData.telegram)) {
      setError('❌ Telegram должен быть в формате @username');
      return;
    }

    // Проверяем, что время выбрано
    if (!formData.time) {
      setError('❌ Выберите время записи');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const bookingData: BookingData = {
        client_name: formData.name,
        client_phone: formData.phone,
        client_telegram: formData.telegram,
        service_id: formData.serviceId,
        booking_date: formData.date,
        booking_time: formData.time,
      };

      if (formData.barberId > 0) {
        bookingData.barber_id = formData.barberId;
      }

      const response = await apiClient.createBooking(bookingData);
      console.log('Booking created:', response);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to create booking:', err);

      if (err.status === 409) {
        setError('⏰ Это время только что заняли. Пожалуйста, выберите другое время.');
        // Обновляем список доступных слотов
        if (formData.date) {
          try {
            const slots = await apiClient.getAvailableSlots(
                formData.date,
                formData.barberId > 0 ? formData.barberId : undefined
            );
            setAvailableSlots(slots);
            setFormData(prev => ({ ...prev, time: "" }));
          } catch (error) {
            console.error('Failed to reload slots:', error);
          }
        }
      } else if (err.status === 400) {
        setError('❌ Проверьте правильность заполнения полей');
      } else {
        setError('❌ ' + (err.message || 'Не удалось создать запись. Попробуйте еще раз.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'serviceId' || name === 'barberId') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
        // Сбрасываем время при смене барбера
        ...(name === 'barberId' && { time: "" }),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
        // Сбрасываем время при смене даты
        ...(name === 'date' && { time: "" }),
      });
    }

    if (error) setError(null);
  };

  if (submitted) {
    return (
        <div className="min-h-[600px] flex items-center justify-center bg-zinc-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white p-8 rounded-lg border border-zinc-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Запись подтверждена!</h2>
              <p className="text-zinc-600 mb-4">
                Ждем вас {new Date(formData.date).toLocaleDateString('ru-RU')} в {formData.time}!
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Получайте уведомления в Telegram
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  Чтобы получать подтверждения и напоминания о записи, напишите нашему боту любое сообщение:
                </p>
                <a
                    href={botLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Написать боту @ITBotyara02_bot
                </a>
              </div>

              <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      phone: "",
                      telegram: "",
                      serviceId: 0,
                      barberId: 0,
                      date: "",
                      time: "",
                    });
                    setAvailableSlots([]);
                  }}
                  className="bg-amber-500 text-black px-6 py-3 rounded-sm font-semibold hover:bg-amber-400 transition-colors"
              >
                Сделать еще одну запись
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div>
        {/* Hero */}
        <section className="bg-zinc-900 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Онлайн-запись
            </h1>
            <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
              Выберите удобное время и запишитесь на стрижку онлайн
            </p>
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-20 bg-zinc-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-zinc-600">Загрузка данных...</p>
                  </div>
              ) : (
                  <form
                      onSubmit={handleSubmit}
                      className="bg-white p-8 md:p-12 rounded-lg border border-zinc-200"
                  >
                    {error && (
                        <div
                            className="mb-6 rounded-lg p-4"
                            style={{
                              backgroundColor: error.includes('занято') ? '#fff3cd' : '#fee2e2',
                              border: `1px solid ${error.includes('занято') ? '#ffeeba' : '#fecaca'}`,
                            }}
                        >
                          <div className="flex items-start gap-3">
                            {error.includes('занято') ? (
                                <span className="text-2xl">⏰</span>
                            ) : error.includes('полей') ? (
                                <span className="text-2xl">📝</span>
                            ) : (
                                <span className="text-2xl">❌</span>
                            )}
                            <p
                                style={{
                                  color: error.includes('занято') ? '#856404' : '#dc2626',
                                }}
                                className="flex-1"
                            >
                              {error}
                            </p>
                          </div>
                        </div>
                    )}

                    {/* Personal Info */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <User className="w-6 h-6 text-amber-500" />
                        Ваши данные
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Имя *
                          </label>
                          <input
                              type="text"
                              name="name"
                              required
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500"
                              placeholder="Ваше имя"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Телефон *
                          </label>
                          <input
                              type="tel"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500"
                              placeholder="+7 (999) 123-45-67"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium mb-2">
                          Telegram *
                        </label>
                        <input
                            type="text"
                            name="telegram"
                            required
                            value={formData.telegram}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500"
                            placeholder="@username"
                            pattern="@[a-zA-Z0-9_]{5,}"
                            title="Формат: @username (минимум 5 символов, только буквы, цифры и _)"
                        />
                        <p className="text-sm text-zinc-500 mt-1">
                          Напишите этому боту после записи, чтобы получать уведомления:
                          <a
                              href={botLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-1"
                          >
                            @ITBotyara02_bot
                          </a>
                        </p>
                      </div>
                    </div>

                    {/* Service Selection */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-amber-500" />
                        Выбор услуги и мастера
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Услуга *
                          </label>
                          <select
                              name="serviceId"
                              required
                              value={formData.serviceId}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500 bg-white"
                          >
                            <option value={0}>Выберите услугу</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {service.title} - {service.price} ₽
                                </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Мастер
                          </label>
                          <select
                              name="barberId"
                              value={formData.barberId}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500 bg-white"
                          >
                            <option value={0}>Любой мастер</option>
                            {barbers.map((barber) => (
                                <option key={barber.id} value={barber.id}>
                                  {barber.name} {barber.specialty ? `- ${barber.specialty}` : ''}
                                </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-amber-500" />
                        Дата и время
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Дата *
                          </label>
                          <input
                              type="date"
                              name="date"
                              required
                              value={formData.date}
                              onChange={handleChange}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Время *
                          </label>
                          <select
                              name="time"
                              required
                              value={formData.time}
                              onChange={handleChange}
                              disabled={!formData.date || loadingSlots}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-sm focus:outline-none focus:border-amber-500 bg-white disabled:bg-zinc-100 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {!formData.date
                                  ? 'Сначала выберите дату'
                                  : loadingSlots
                                      ? 'Загрузка...'
                                      : availableSlots.length === 0
                                          ? 'Нет свободного времени'
                                          : 'Выберите время'}
                            </option>
                            {availableSlots.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                            ))}
                          </select>
                          {availableSlots.length === 0 && formData.date && !loadingSlots && (
                              <p className="text-sm text-amber-600 mt-1">
                                На эту дату нет свободного времени
                              </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !formData.time}
                        className="w-full bg-amber-500 text-black px-8 py-4 rounded-sm font-semibold hover:bg-amber-400 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Отправка...' : 'Записаться'}
                    </button>
                  </form>
              )}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Полезная информация
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Телефон</h3>
                  <p className="text-zinc-600">+7 (995) 870-77-77</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Telegram бот</h3>
                  <p className="text-zinc-600">
                    <a
                        href={botLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                      @ITBotyara02_bot
                    </a>
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Режим работы</h3>
                  <p className="text-zinc-600">Пн-Вс: 10:00 - 20:00</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}