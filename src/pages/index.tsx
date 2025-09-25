import { useState, useEffect } from 'react';

// Mock components for demo with proper types
const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
const Link = ({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} className={className} {...props}>{children}</a>
);
const useAuthContext = () => ({ user: null });

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { user } = useAuthContext();

  const features = [
    {
      icon: '💬',
      title: 'Parent-Teacher Communication',
      description: "Seamless messaging with SMS and WhatsApp integration via Africa's Talking",
    },
    {
      icon: '📊',
      title: 'Attendance Tracking',
      description: 'Easy attendance marking with instant notifications to parents',
    },
    {
      icon: '💰',
      title: 'Payment Management',
      description: 'Track payments and send reminders via multiple channels',
    },
    {
      icon: '👥',
      title: 'Multi-Role System',
      description: 'Support for superadmins, school admins, teachers, parents, and students',
    },
    {
      icon: '🏫',
      title: 'Multi-School Support',
      description: 'Manage multiple schools from a single platform with data isolation',
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Fully responsive design that works on all devices',
    },
  ];

  const stats = [
    { label: 'Schools Using Tuitora', value: '500+' },
    { label: 'Active Users', value: '100,000+' },
    { label: 'Messages Sent Monthly', value: '2M+' },
    { label: 'Attendance Records', value: '10M+' },
  ];

  const filteredFeatures = features.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sections = ['features', 'pricing', 'contact'];
          let current = '';
          sections.forEach((id) => {
            const section = document.getElementById(id);
            if (section) {
              const top = section.getBoundingClientRect().top;
              if (top <= 120) current = id;
            }
          });
          setActiveSection(current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-surface to-brand-bg text-white relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
        ></div>
        <div
          className="absolute bottom-40 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
        ></div>
      </div>

      <Head>
        <title>Tuitora - Modern School Management Platform</title>
        <meta
          name="description"
          content="Multi-school EdTech platform for school management with communication, attendance tracking, and payment management"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-indigo-900/90 backdrop-blur-lg border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-white">Tuitora</div>
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                EdTech
              </span>
            </div>

            <nav className="hidden md:flex space-x-8" aria-label="Main navigation">
              {['features', 'pricing', 'contact'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavClick(id)}
                  className={`capitalize font-medium hover:text-emerald-400 transition-all duration-300 relative ${
                    activeSection === id ? 'text-emerald-400' : 'text-gray-200'
                  }`}
                >
                  {id}
                  {activeSection === id && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-white"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:block text-gray-200 hover:text-emerald-400 font-medium transition-colors duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg text-white"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              <button
                type="button"
                className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1 p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMenuOpen}
              >
                <span
                  className={`block w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                    isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                ></span>
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 p-6 bg-gray-100/10 backdrop-blur-lg rounded-2xl border border-white/20 transition-all duration-300">
              <nav className="flex flex-col space-y-4" aria-label="Mobile navigation">
                {['features', 'pricing', 'contact'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavClick(id)}
                    className={`text-left capitalize font-medium hover:text-emerald-400 transition-colors duration-300 ${
                      activeSection === id ? 'text-emerald-400' : 'text-gray-200'
                    }`}
                  >
                    {id}
                  </button>
                ))}
                <div className="border-t border-white/20 pt-4 space-y-3">
                  {user ? (
                    <Link
                      href="/dashboard"
                      className="block text-center bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-medium transition-all duration-300 text-white"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block text-center text-gray-200 hover:text-emerald-400 font-medium transition-colors duration-300"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block text-center bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-medium transition-all duration-300 text-white"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 relative z-10">
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
            <span className="text-white">Modern School Management</span>
            <span className="block text-emerald-400 mt-2">for African Schools</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-gray-300">
            Tuitora helps schools manage communication, attendance, payments, and more with tools designed for the African context.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-600 px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-emerald-500/25 text-white"
            >
              Get Started Free
            </Link>
            <Link
              href="#demo"
              className="border-2 border-white/30 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 text-white"
            >
              Request Demo
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-emerald-400/30 transition-all duration-300 transform hover:scale-105">
                  <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-gray-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
              Everything You Need to Run Your School
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for African educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFeatures.length > 0 ? (
              filteredFeatures.map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-emerald-400/30 transition-all duration-500 transform hover:scale-105 hover:bg-white/10">
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
                    <p className="text-white/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-white/60 py-12 text-lg">
                No features match your search. Try another term.
              </p>
            )}
          </div>
        </section>

        {/* School Search Section */}
        <section className="mb-20">
          <div className="bg-white/5 backdrop-blur-lg p-10 rounded-3xl border border-white/10">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
              Find Your School
            </h2>
            <p className="text-center text-white/70 mb-10 text-lg">Search for your school to join or access your account</p>
            <div className="max-w-2xl mx-auto">
              <div className="flex rounded-2xl overflow-hidden shadow-2xl">
                <input
                  type="text"
                  placeholder="Enter school name..."
                  className="flex-1 px-6 py-4 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search for school"
                />
                <button type="button" className="bg-emerald-500 hover:bg-emerald-600 px-8 py-4 transition-all duration-300 font-medium text-white">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-white/70">Free to start, scalable as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-emerald-400/30 transition-all duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-white">Free Tier</h3>
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-6">
                $0
              </div>
              <p className="text-white/70 mb-8">Perfect for small schools getting started</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  Up to 100 students
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  Basic features
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  Email support
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-center py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium text-white"
              >
                Start Free
              </Link>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-3xl transform scale-105 shadow-2xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-white">
                Popular
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Pro</h3>
              <div className="text-5xl font-bold text-white mb-6">
                $99<span className="text-lg">/month</span>
              </div>
              <p className="text-white/90 mb-8">Ideal for growing schools</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-xl">✓</span>
                  Up to 500 students
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-xl">✓</span>
                  All features included
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-xl">✓</span>
                  Priority support
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-xl">✓</span>
                  SMS/WhatsApp credits included
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full bg-white text-emerald-600 text-center py-3 rounded-xl transition-all duration-300 hover:bg-gray-50 transform hover:scale-105 font-medium shadow-lg"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-emerald-400/30 transition-all duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-white">Enterprise</h3>
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-6">
                Custom
              </div>
              <p className="text-white/70 mb-8">For large institutions and school groups</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  Unlimited students
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  Custom features
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  Dedicated support
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-3 text-xl">✓</span>
                  White-label options
                </li>
              </ul>
              <Link
                href="#contact"
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-center py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium text-white"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="text-center mb-20">
          <div className="bg-white/5 backdrop-blur-lg p-12 rounded-3xl border border-white/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
              Ready to Transform Your School Management?
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of schools across Africa that trust Tuitora with their daily operations
            </p>
            <Link
              href="/signup"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 px-12 py-4 rounded-2xl text-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 text-white"
            >
              Create Your School Account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10" role="contentinfo">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h4 className="font-bold text-xl mb-6 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Tuitora
              </h4>
              <p className="text-white/70 leading-relaxed">
                Modern school management for African educational institutions
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-6">Product</h4>
              <div className="space-y-3">
                <Link href="#features" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Features
                </Link>
                <Link href="#pricing" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Pricing
                </Link>
                <Link href="#contact" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Demo
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-6">Support</h4>
              <div className="space-y-3">
                <Link href="/help" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Help Center
                </Link>
                <Link href="/contact" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Contact
                </Link>
                <Link href="/faq" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  FAQ
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-6">Legal</h4>
              <div className="space-y-3">
                <Link href="/privacy" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-white/70 hover:text-emerald-300 transition-colors duration-300">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center text-white/60 pt-8 border-t border-white/10">
            &copy; {new Date().getFullYear()} Tuitora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}