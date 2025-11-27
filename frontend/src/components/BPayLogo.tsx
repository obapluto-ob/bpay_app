import { motion } from 'framer-motion';

export default function BPayLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-16',
    md: 'h-20', 
    lg: 'h-24'
  };

  return (
    <motion.div 
      className="flex items-center justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img 
        src="/5782897843587714011_120.jpg" 
        alt="BPay - Easy Bitcoin Payments" 
        className={`${sizes[size]} w-auto object-contain`}
      />
    </motion.div>
  );
}