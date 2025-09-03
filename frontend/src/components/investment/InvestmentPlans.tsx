import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, calculateWeeklyPayout, calculateTotalReturns, calculateROI } from '@/lib/utils';

interface InvestmentExample {
  investment: number;
  weeklyPayout: number;
  totalPayouts: number;
  totalReturns: number;
  roi: number;
}

const InvestmentPlans: React.FC = () => {
  const [examples, setExamples] = useState<InvestmentExample[]>([]);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    // Generate investment examples
    const amounts = [300, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const generatedExamples = amounts.map(amount => ({
      investment: amount,
      weeklyPayout: calculateWeeklyPayout(amount),
      totalPayouts: 8,
      totalReturns: calculateTotalReturns(amount),
      roi: calculateROI(amount),
    }));
    setExamples(generatedExamples);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const selectedExample = examples.find(ex => ex.investment === selectedAmount) || examples[2];

  return (
    <section className="section-padding bg-secondary-50">
      <div className="container-custom">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Investment Plans
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              Choose your investment amount and start earning guaranteed weekly returns. 
              Our transparent formula ensures predictable growth for your portfolio.
            </p>
          </motion.div>

          {/* Interactive Calculator */}
          <motion.div variants={itemVariants} className="mb-16">
            <Card className="max-w-4xl mx-auto p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-secondary-900 mb-4">
                  Investment Calculator
                </h3>
                <p className="text-secondary-600">
                  Select an amount to see your potential returns
                </p>
              </div>

              {/* Amount Selector */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
                {examples.slice(0, 8).map((example) => (
                  <button
                    key={example.investment}
                    onClick={() => setSelectedAmount(example.investment)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedAmount === example.investment
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-white border border-secondary-200 text-secondary-700 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {formatCurrency(example.investment)}
                  </button>
                ))}
              </div>

              {/* Results Display */}
              {selectedExample && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(selectedExample.weeklyPayout)}
                    </div>
                    <div className="text-sm text-secondary-600 mt-1">Weekly Payout</div>
                  </div>
                  <div className="text-center p-4 bg-success-50 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">
                      {formatCurrency(selectedExample.totalReturns)}
                    </div>
                    <div className="text-sm text-secondary-600 mt-1">Total Returns</div>
                  </div>
                  <div className="text-center p-4 bg-warning-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning-600">
                      {formatCurrency(selectedExample.totalReturns - selectedExample.investment)}
                    </div>
                    <div className="text-sm text-secondary-600 mt-1">Net Profit</div>
                  </div>
                  <div className="text-center p-4 bg-secondary-50 rounded-lg">
                    <div className="text-2xl font-bold text-secondary-600">
                      {selectedExample.roi.toFixed(1)}%
                    </div>
                    <div className="text-sm text-secondary-600 mt-1">ROI</div>
                  </div>
                </div>
              )}

              {/* Payout Schedule */}
              {selectedExample && (
                <div className="bg-white border border-secondary-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4">
                    8-Week Payout Schedule
                  </h4>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className="text-center p-2 bg-primary-50 rounded">
                        <div className="text-xs text-secondary-600 mb-1">Week {i + 1}</div>
                        <div className="text-sm font-semibold text-primary-600">
                          {formatCurrency(selectedExample.weeklyPayout)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center mt-8">
                <Button size="lg" className="mr-4">
                  Start Investing
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Investment Examples Grid */}
          <motion.div variants={itemVariants}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-secondary-900 mb-4">
                Popular Investment Amounts
              </h3>
              <p className="text-lg text-secondary-600">
                See how different investment levels perform with our proven formula
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {examples.slice(1, 7).map((example, index) => (
                <motion.div
                  key={example.investment}
                  variants={itemVariants}
                  className={`relative ${index === 2 ? 'lg:scale-105' : ''}`}
                >
                  <Card 
                    className={`p-6 h-full ${
                      index === 2 
                        ? 'border-2 border-primary-500 shadow-blue-lg' 
                        : 'hover:shadow-lg'
                    }`}
                    hover={index !== 2}
                  >
                    {index === 2 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-primary-600 mb-2">
                        {formatCurrency(example.investment)}
                      </div>
                      <div className="text-sm text-secondary-500">Investment Amount</div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                        <span className="text-secondary-600">Weekly Payout:</span>
                        <span className="font-semibold text-secondary-900">
                          {formatCurrency(example.weeklyPayout)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                        <span className="text-secondary-600">Duration:</span>
                        <span className="font-semibold text-secondary-900">8 weeks</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                        <span className="text-secondary-600">Total Returns:</span>
                        <span className="font-semibold text-success-600">
                          {formatCurrency(example.totalReturns)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-secondary-600">ROI:</span>
                        <span className="font-bold text-primary-600">
                          {example.roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={index === 2 ? 'primary' : 'outline'}
                    >
                      Invest {formatCurrency(example.investment)}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Formula Explanation */}
          <motion.div variants={itemVariants} className="mt-16">
            <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary-900 mb-4">
                  Our Transparent Formula
                </h3>
                <div className="text-lg text-primary-800 mb-6">
                  <strong>Weekly Payout = (Investment ÷ 500) × 300</strong>
                </div>
                <p className="text-primary-700 leading-relaxed max-w-2xl mx-auto">
                  This simple, transparent formula ensures predictable returns. 
                  Every Friday for 8 weeks, you receive your calculated payout directly to your account balance. 
                  No hidden fees, no surprises - just consistent, reliable growth.
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvestmentPlans;