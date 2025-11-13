import { motion } from 'framer-motion';

const Card = ({ children, className = '', title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-card dark:shadow-dark-card border border-gray-100 dark:border-gray-700 ${className}`}>
      {title && <h3 className="text-lg font-bold text-brand-dark dark:text-dark-text mb-4">{title}</h3>}
      {children}
    </motion.div>
  );
};

export default Card;
