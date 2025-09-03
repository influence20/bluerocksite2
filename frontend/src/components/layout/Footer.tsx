import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Our Services', href: '/services' },
      { name: 'Investment Plans', href: '/plans' },
      { name: 'Markets & Insights', href: '/insights' },
      { name: 'Contact Us', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/legal/privacy' },
      { name: 'Terms of Service', href: '/legal/terms' },
      { name: 'Risk Disclosure', href: '/legal/risk-disclosure' },
      { name: 'Compliance', href: '/legal/compliance' },
      { name: 'AML Policy', href: '/legal/aml' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Live Chat', href: '#', onClick: () => window.jivo_api?.open() },
      { name: 'Contact Support', href: '/contact' },
      { name: 'System Status', href: '/status' },
    ],
    investment: [
      { name: 'Why Crypto Only?', href: '/crypto-benefits' },
      { name: 'Investment Calculator', href: '/calculator' },
      { name: 'Testimonials', href: '/testimonials' },
      { name: 'Getting Started', href: '/getting-started' },
      { name: 'Security', href: '/security' },
    ],
  };

  const socialLinks = [
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <Image
                  src="/assets/brand/bluerock-logo.png"
                  alt="BlueRock Asset Management"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <div>
                  <span className="text-xl font-bold text-primary-400">BlueRock</span>
                  <span className="text-sm text-secondary-400 block -mt-1">Asset Management</span>
                </div>
              </Link>
              <p className="text-secondary-400 text-sm leading-relaxed mb-6">
                Professional investment management with innovative cryptocurrency solutions. 
                Building wealth through strategic diversification and expert guidance.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-secondary-400 hover:text-primary-400 transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{social.name}</span>
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="footer-link">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investment Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Investment</h3>
              <ul className="space-y-3">
                {footerLinks.investment.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="footer-link">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    {link.onClick ? (
                      <button onClick={link.onClick} className="footer-link text-left">
                        {link.name}
                      </button>
                    ) : (
                      <Link href={link.href} className="footer-link">
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="footer-link">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="py-8 border-t border-secondary-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-medium mb-3">Global Headquarters</h4>
              <p className="text-secondary-400 text-sm">
                123 Financial District<br />
                New York, NY 10004<br />
                United States
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">European Office</h4>
              <p className="text-secondary-400 text-sm">
                45 Canary Wharf<br />
                London E14 5AB<br />
                United Kingdom
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Contact</h4>
              <p className="text-secondary-400 text-sm">
                Email: <a href="mailto:bluerockasset@zohomail.com" className="footer-link">bluerockasset@zohomail.com</a><br />
                Phone: +1 (555) 123-4567<br />
                24/7 Live Chat Available
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-secondary-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-secondary-400 text-sm">
              © {currentYear} BlueRock Asset Management. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <span className="text-secondary-400">
                Regulated by Financial Conduct Authority
              </span>
              <span className="text-secondary-400">
                Member SIPC
              </span>
              <span className="text-secondary-400">
                SSL Secured
              </span>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="py-4 border-t border-secondary-800">
          <p className="text-secondary-500 text-xs leading-relaxed">
            <strong>Risk Warning:</strong> Cryptocurrency investments carry significant risk. 
            Past performance does not guarantee future results. Only invest what you can afford to lose. 
            BlueRock Asset Management is committed to transparent, professional investment management. 
            All investments are subject to market risk and potential loss of principal.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;