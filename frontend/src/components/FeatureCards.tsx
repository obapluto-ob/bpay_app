import { motion } from 'framer-motion';

const features = [
  {
    title: 'Secure Trading',
    description: 'Bank-level security with 2FA protection',
    icon: 'https://cdn-icons-png.flaticon.com/128/3064/3064197.png',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop&crop=center',
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Fast Transactions',
    description: 'Lightning-fast crypto to cash conversions',
    icon: 'https://cdn-icons-png.flaticon.com/128/1041/1041916.png',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center',
    color: 'from-green-500 to-green-600'
  },
  {
    title: 'Multi-Currency',
    description: 'Support for NGN, KES, BTC, ETH, USDT',
    icon: 'https://cdn-icons-png.flaticon.com/128/2830/2830284.png',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop&crop=center',
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: '24/7 Support',
    description: 'Round-the-clock customer assistance',
    icon: 'https://cdn-icons-png.flaticon.com/128/3079/3079553.png',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop&crop=center',
    color: 'from-orange-500 to-orange-600'
  }
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div className="relative h-32 overflow-hidden">
            <img 
              src={feature.image} 
              alt={feature.title}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-80`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={feature.icon} 
                alt={feature.title}
                className="w-12 h-12 filter brightness-0 invert"
              />
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}