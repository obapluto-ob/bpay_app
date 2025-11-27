import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <motion.div 
      className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-8 mb-8 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop&crop=center" 
          alt="Crypto Background"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-white">
          <motion.h2 
            className="text-3xl font-bold mb-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Start Trading Today! 🚀
          </motion.h2>
          <motion.p 
            className="text-orange-100 mb-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Buy and sell Bitcoin, Ethereum, and USDT with Nigerian Naira or Kenyan Shillings
          </motion.p>
          <motion.button 
            className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Trade Now
          </motion.button>
        </div>
        
        {/* Crypto Icons */}
        <div className="hidden md:flex space-x-4">
          {[
            { name: 'Bitcoin', icon: '₿', color: 'bg-yellow-500' },
            { name: 'Ethereum', icon: 'Ξ', color: 'bg-blue-500' },
            { name: 'USDT', icon: '₮', color: 'bg-green-500' }
          ].map((crypto, index) => (
            <motion.div
              key={crypto.name}
              className={`${crypto.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {crypto.icon}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}