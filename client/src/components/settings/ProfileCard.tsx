import React from 'react';
import { Bot, Leaf, Zap, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileCardProps {
  profile: 'default' | 'light' | 'high' | 'overdrive';
  isActive: boolean;
  onClick: () => void;
  description: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isActive,
  onClick,
  description
}) => {
  // Get icon based on profile
  const getIcon = () => {
    switch(profile) {
      case 'default': return <Bot size={20} style={{ color: 'var(--primary-color)' }} />;
      case 'light': return <Leaf size={20} style={{ color: '#10b981' }} />;
      case 'high': return <Zap size={20} style={{ color: '#8b5cf6' }} />;
      case 'overdrive': return <Flame size={20} style={{ color: '#dc2626' }} />;
    }
  };

  // Get profile-specific animations and styles
  const getProfileStyles = () => {
    const baseStyles = {
      borderColor: isActive ? 'var(--primary-color)' : 'var(--border-color)',
      backgroundColor: isActive ? 'var(--primary-muted)' : 'var(--bg-tertiary)',
      transition: 'all 0.3s ease'
    };

    // Add profile-specific particle animations
    let particles: React.ReactNode = null;
    
    if (isActive) {
      switch(profile) {
        case 'default':
          // Subtle indigo particles that flow around
          particles = (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={`default-particle-${i}`}
                  className="absolute rounded-full bg-indigo-500 opacity-30"
                  style={{
                    width: 3,
                    height: 3,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 20 - 10, 0],
                    y: [0, Math.random() * 20 - 10, 0],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </>
          );
          break;
          
        case 'light':
          // Green leaf-like particles that float upward
          particles = (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`eco-particle-${i}`}
                  className="absolute opacity-40"
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: 'transparent',
                    borderRadius: '50% 50% 50% 0',
                    border: '1px solid #10b981',
                    left: `${20 + (i * 30)}%`,
                    bottom: '0%',
                  }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 180, 360],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.8,
                  }}
                />
              ))}
            </>
          );
          break;
          
        case 'high':
          // Pulsating purple energy
          particles = (
            <>
              <motion.div
                className="absolute inset-0 rounded-lg opacity-20"
                style={{
                  background: 'radial-gradient(circle at center, #8b5cf6 0%, transparent 70%)',
                }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`performance-particle-${i}`}
                  className="absolute w-[1px] h-[1px] bg-purple-400 opacity-80"
                  style={{
                    top: `${30 + (i * 20)}%`,
                    left: `${20 + (i * 30)}%`,
                  }}
                  animate={{
                    scale: [0, 3, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                />
              ))}
            </>
          );
          break;
          
        case 'overdrive':
          // Fiery red/orange particles that move upward
          particles = (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={`overdrive-particle-${i}`}
                  className="absolute w-[3px] h-[10px] rounded-full bg-red-500 opacity-50"
                  style={{
                    bottom: '10%',
                    left: `${20 + (i * 20)}%`,
                    filter: 'blur(1px)',
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0, 0.5, 0],
                    backgroundColor: ['#dc2626', '#f97316', '#dc2626'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
              
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 opacity-30"
                animate={{
                  scaleX: [0, 1, 0],
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          );
          break;
      }
    }

    return { styles: baseStyles, particles };
  };

  const { styles, particles } = getProfileStyles();

  // Convert profile name for display
  const getDisplayName = () => {
    return profile.charAt(0).toUpperCase() + profile.slice(1);
  };

  return (
    <motion.div
      className="rounded-lg border p-4 cursor-pointer relative overflow-hidden"
      style={styles}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Interactive animations */}
      {particles}
      
      <div className="flex justify-between items-center mb-2 relative z-10">
        <span style={{ color: 'var(--text-primary)' }} className="font-medium">
          {getDisplayName()}
        </span>
        {getIcon()}
      </div>
      <p style={{ color: 'var(--text-secondary)' }} className="text-xs relative z-10">
        {description}
      </p>
    </motion.div>
  );
};

export default ProfileCard;