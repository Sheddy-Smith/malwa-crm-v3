import { motion } from 'framer-motion';

const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }) => {
  const baseClasses = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-lg focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";
  const variants = {
    primary: 'text-white bg-brand-red hover:bg-brand-red-dark focus:ring-red-300 dark:focus:ring-red-800',
    secondary: 'text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600',
    ghost: 'text-brand-blue hover:bg-blue-50 focus:ring-brand-blue dark:text-blue-400 dark:hover:bg-gray-700',
  };

  return (
    <motion.button
      whileHover={{ y: disabled ? 0 : -2 }}
      whileTap={{ y: disabled ? 0 : 1 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;
