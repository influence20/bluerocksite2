import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Investment Plans', href: '/plans' },
    { name: 'Markets & Insights', href: '/insights' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-soft sticky top-0 z-40">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/assets/brand/bluerock-logo.png"
              alt="BlueRock Asset Management"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-primary-500">BlueRock</span>
              <span className="text-sm text-secondary-500 block -mt-1">Asset Management</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'nav-link',
                  isActivePath(item.href) && 'active'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-secondary-600">
                    Welcome, {user?.firstName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-primary-500 hover:bg-secondary-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-secondary-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
                    isActivePath(item.href)
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-secondary-600 hover:text-primary-500 hover:bg-secondary-100'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Mobile Auth Section */}
            <div className="pt-4 pb-3 border-t border-secondary-200">
              {isAuthenticated ? (
                <div className="px-2 space-y-3">
                  <div className="px-3 py-2">
                    <p className="text-sm text-secondary-600">
                      Welcome, {user?.firstName}
                    </p>
                  </div>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="px-2 space-y-3">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Chat Script */}
      <script 
        src="//code.jivosite.com/widget/foeFKzf8Lf" 
        async 
        dangerouslySetInnerHTML={{
          __html: ''
        }}
      />
    </header>
  );
};

export default Header;