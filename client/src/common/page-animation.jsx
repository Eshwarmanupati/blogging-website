import { AnimatePresence, motion } from "framer-motion";

/*
    A 1s fade made every navigation feel like the page was still loading, so the
    default is kept short. Callers that stagger a list still pass their own delay.
*/
const AnimationWrapper = ({
    children,
    Keyvalue,
    initial = { opacity: 0 },
    animate = { opacity: 1 },
    transition = { duration: 0.3 },
    className
}) => {
    return (
        <AnimatePresence>
            <motion.div
                key={Keyvalue}
                initial={initial}
                animate={animate}
                transition={transition}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default AnimationWrapper;
