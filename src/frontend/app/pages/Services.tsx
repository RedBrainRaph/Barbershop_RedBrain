import { Scissors, Sparkles, Droplets, Heart } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { apiClient, Service } from "../api/client";

export function Services() {
  const [mainServices, setMainServices] = useState<Service[]>([]);
  const [additionalServices, setAdditionalServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const services = await apiClient.getServices();
        
        // Разделяем услуги на основные и дополнительные
        const main = services.filter(s => s.category === 'main');
        const additional = services.filter(s => s.category === 'additional');
        
        setMainServices(main);
        setAdditionalServices(additional);
        setError(null);
      } catch (err) {
        console.error('Failed to load services:', err);
        setError('Не удалось загрузить услуги. Проверьте подключение к серверу.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Маппинг иконок для основных услуг
  const getIcon = (iconName: string | undefined) => {
    switch (iconName) {
      case 'scissors': return Scissors;
      case 'sparkles': return Sparkles;
      case 'droplets': return Droplets;
      case 'heart': return Heart;
      default: return Scissors;
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1678356163587-6bb3afb89679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXIlMjB0b29scyUyMHNjaXNzb3JzJTIwY29tYnxlbnwxfHx8fDE3NzI3NjMxNjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Barber Tools"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Наши услуги</h1>
          <p className="text-xl">Профессиональный уход для настоящих мужчин</p>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-zinc-600">Загрузка услуг...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mainServices.map((service) => {
                const Icon = getIcon(service.icon);
                return (
                  <div
                    key={service.id}
                    className="bg-zinc-50 p-8 rounded-lg border border-zinc-200 hover:border-amber-500 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold mb-2">
                          {service.title}
                        </h3>
                        <p className="text-zinc-600 mb-4">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-amber-500">
                            {service.price} ₽
                          </span>
                          <span className="text-zinc-500">{service.duration} мин</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Дополнительные услуги
          </h2>
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-zinc-600">Загрузка...</p>
              </div>
            ) : additionalServices.length > 0 ? (
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                {additionalServices.map((service, index) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-6 ${
                      index !== additionalServices.length - 1
                        ? "border-b border-zinc-200"
                        : ""
                    }`}
                  >
                    <span className="text-lg">{service.title}</span>
                    <span className="text-xl font-semibold text-amber-500">
                      {service.price} ₽
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-600">Нет дополнительных услуг</p>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-zinc-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Готовы записаться на прием?
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Выберите удобное время и наш мастер создаст для вас идеальный образ
          </p>
          <Link
            to="/booking"
            className="inline-block bg-amber-500 text-black px-8 py-4 rounded-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Записаться сейчас
          </Link>
        </div>
      </section>
    </div>
  );
}