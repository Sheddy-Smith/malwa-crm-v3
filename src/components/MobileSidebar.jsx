import { AnimatePresence, motion } from 'framer-motion';
import useUiStore from '@/store/uiStore';
import { SidebarContent } from './Sidebar';

const MobileSidebar = () => {
    const { isSidebarOpen, setSidebarOpen } = useUiStore();
    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full w-64 z-50 md:hidden"
                    >
                        <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileSidebar;
