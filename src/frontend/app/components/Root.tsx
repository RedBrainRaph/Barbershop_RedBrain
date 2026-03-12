import { Link, Outlet, useLocation } from "react-router";
import { Scissors, Menu, X } from "lucide-react";
import { useState } from "react";

export function Root() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: "/", label: "Главная" },
    { path: "/services", label: "Услуги" },
    { path: "/gallery", label: "Галерея" },
    { path: "/booking", label: "Запись" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 text-white sticky top-0 z-50 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Scissors className="w-6 h-6 text-amber-500" />
              <span className="font-bold text-xl">Barbershop REDBRAIN</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors hover:text-amber-500 ${
                    isActive(link.path) ? "text-amber-500" : "text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-zinc-800">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block py-3 transition-colors hover:text-amber-500 ${
                    isActive(link.path) ? "text-amber-500" : "text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white border-t border-zinc-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-5 h-5 text-amber-500" />
                <span className="font-bold">BARBERSHOP</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Профессиональные услуги барбершопа для мужчин
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Контакты</h3>
              <p className="text-zinc-400 text-sm mb-2">
                Тел: +7 (995) 870-77-77
              </p>
              <p className="text-zinc-400 text-sm mb-2">
                Email: RedBRain@barbershop.ru
              </p>
              <p className="text-zinc-400 text-sm">
                Адрес: ул. Пушкина, д. Колотушкина, Владивосток
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Часы работы</h3>
              <p className="text-zinc-400 text-sm mb-2">Пн-Пт: 10:00 - 20:00</p>
              <p className="text-zinc-400 text-sm mb-2">Сб-Вс: 10:00 - 20:00</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
            © 2026 Barbershop RedBrain. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
