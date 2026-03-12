import { Link } from "react-router";
import { Scissors, Clock, Award, Users } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXJiZXJzaG9wJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyNzU4MjExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Barbershop Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">BS REDBRAIN</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Профессиональные стрижки и уход для настоящих мужчин
          </p>
          <Link
            to="/booking"
            className="inline-block bg-amber-500 text-black px-8 py-4 rounded-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Записаться сейчас
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Профессиональные мастера
              </h3>
              <p className="text-zinc-600">
                Опытные барберы с многолетним стажем
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Удобное время</h3>
              <p className="text-zinc-600">
                Работаем 7 дней в неделю без выходных
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Премиум качество</h3>
              <p className="text-zinc-600">
                Используем только премиальные инструменты и косметику
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Доверие клиентов</h3>
              <p className="text-zinc-600">
                Наши клиенты всегда остаются довольны
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-zinc-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">О нас</h2>
              <p className="text-zinc-300 mb-4 text-lg leading-relaxed">
                Наш барбершоп — это место, где традиции классического ухода за
                волосами встречаются с современными технологиями. Мы создаем
                атмосферу, в которой каждый мужчина чувствует себя
                комфортно и уверенно.
              </p>
              <p className="text-zinc-300 mb-6 text-lg leading-relaxed">
                Наша команда профессиональных барберов постоянно совершенствуется,
                чтобы предоставлять вам услуги высочайшего
                качества. От классических стрижек до современных стилей — мы
                воплотим в жизнь любые ваши идеи.
              </p>
              <Link
                to="/services"
                className="inline-block bg-amber-500 text-black px-6 py-3 rounded-sm font-semibold hover:bg-amber-400 transition-colors"
              >
                Наши услуги
              </Link>
            </div>
            <div className="relative h-[500px] rounded-lg overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1768363446104-b8a0c1716600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXIlMjBjdXR0aW5nJTIwaGFpciUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzI3MzYzNzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Professional Barber"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-amber-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-black mb-6">
            Готовы к новому образу?
          </h2>
          <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
            Запишитесь на прием прямо сейчас и получите скидку 10% на первое
            посещение
          </p>
          <Link
            to="/booking"
            className="inline-block bg-black text-white px-8 py-4 rounded-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            Записаться онлайн
          </Link>
        </div>
      </section>
    </div>
  );
}
