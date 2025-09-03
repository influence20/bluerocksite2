import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import InvestmentPlans from '@/components/investment/InvestmentPlans';

const HomePage: React.FC = () => {
  return (
    <Layout
      title="BlueRock Asset Management - Professional Cryptocurrency Investment"
      description="Expert cryptocurrency investment management with guaranteed weekly returns. Secure, transparent, and professional asset management services with 8-week investment plans."
    >
      <Hero />
      <Features />
      <InvestmentPlans />
    </Layout>
  );
};

export default HomePage;