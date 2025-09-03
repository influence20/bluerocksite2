import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  noHeader?: boolean;
  noFooter?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'BlueRock Asset Management - Professional Investment Solutions',
  description = 'Expert cryptocurrency investment management with guaranteed weekly returns. Secure, transparent, and professional asset management services.',
  noHeader = false,
  noFooter = false,
  className = '',
}) => {
  const fullTitle = title.includes('BlueRock') ? title : `${title} | BlueRock Asset Management`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/assets/brand/bluerock-logo.png`} />
        <meta property="og:site_name" content="BlueRock Asset Management" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/assets/brand/bluerock-logo.png`} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="BlueRock Asset Management" />
        <meta name="keywords" content="cryptocurrency investment, asset management, bitcoin investment, crypto portfolio, investment returns, financial services" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              "name": "BlueRock Asset Management",
              "description": description,
              "url": process.env.NEXT_PUBLIC_SITE_URL,
              "logo": `${process.env.NEXT_PUBLIC_SITE_URL}/assets/brand/bluerock-logo.png`,
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-123-4567",
                "contactType": "customer service",
                "email": "bluerockasset@zohomail.com"
              },
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Financial District",
                "addressLocality": "New York",
                "addressRegion": "NY",
                "postalCode": "10004",
                "addressCountry": "US"
              },
              "sameAs": [
                "https://twitter.com/bluerockasset",
                "https://linkedin.com/company/bluerockasset"
              ]
            })
          }}
        />
      </Head>

      <div className={`min-h-screen flex flex-col ${className}`}>
        {!noHeader && <Header />}
        
        <main className="flex-1">
          {children}
        </main>
        
        {!noFooter && <Footer />}
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Live Chat Script */}
      <script 
        src="//code.jivosite.com/widget/foeFKzf8Lf" 
        async 
      />
    </>
  );
};

export default Layout;