import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ToastProps {
  message: string
  duration?: number
  onClose: () => void
}

export const CustomToast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          onAnimationComplete={() => !isVisible && onClose()}
          className="fixed bottom-4 right-4 bg-white-4 font-bold text-grey-4 px-4 py-2 rounded-lg shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

