import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useInView } from 'react-intersection-observer';

const Hero: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="relative container-custom">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="py-20 lg:py-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-white">
              <motion.div variants={itemVariants}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Professional
                  <span className="block text-primary-200">Investment</span>
                  <span className="block">Management</span>
                </h1>
              </motion.div>

              <motion.p 
                variants={itemVariants}
                className="text-xl text-primary-100 leading-relaxed mb-8 max-w-lg"
              >
                Secure cryptocurrency investments with guaranteed weekly returns. 
                Expert portfolio management delivering consistent growth through innovative strategies.
              </motion.p>

              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl"
                  >
                    Start Investing Today
                  </Button>
                </Link>
                <Link href="/plans">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-primary-600"
                  >
                    View Investment Plans
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-3 gap-6 text-center"
              >
                <div>
                  <div className="text-2xl font-bold text-primary-200">$50M+</div>
                  <div className="text-sm text-primary-100">Assets Under Management</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-200">10,000+</div>
                  <div className="text-sm text-primary-100">Active Investors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-200">99.8%</div>
                  <div className="text-sm text-primary-100">Payout Success Rate</div>
                </div>
              </motion.div>
            </div>

            {/* Investment Calculator Preview */}
            <motion.div 
              variants={itemVariants}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-semibold text-white mb-6">
                Investment Calculator
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-primary-100 mb-2">
                    Investment Amount (USD)
                  </label>
                  <input
                    type="number"
                    defaultValue="1000"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="bg-white/20 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-primary-100">
                    <span>Weekly Payout:</span>
                    <span className="font-semibold text-white">$600.00</span>
                  </div>
                  <div className="flex justify-between text-primary-100">
                    <span>Total Duration:</span>
                    <span className="font-semibold text-white">8 weeks</span>
                  </div>
                  <div className="flex justify-between text-primary-100">
                    <span>Total Returns:</span>
                    <span className="font-semibold text-white">$4,800.00</span>
                  </div>
                  <div className="flex justify-between text-primary-100 pt-3 border-t border-white/20">
                    <span>Net Profit:</span>
                    <span className="font-bold text-xl text-green-300">$3,800.00</span>
                  </div>
                </div>

                <Link href="/calculator">
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-primary-600 hover:bg-primary-50"
                  >
                    Try Full Calculator
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            fill="currentColor"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            fill="currentColor"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;