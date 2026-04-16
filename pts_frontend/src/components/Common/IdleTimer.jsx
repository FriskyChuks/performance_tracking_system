// src/components/Common/IdleTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const IdleTimer = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  // Use refs to track timers
  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const logoutTimerRef = useRef(null);

  const IDLE_TIME = 15 * 60 * 1000; // 15 minutes
  const COUNTDOWN_TIME = 60 * 1000; // 1 minute

  // Clear all timers
  const clearAllTimers = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  // Reset all timers and hide modal
  const resetTimers = () => {
    // console.log('🔄 Resetting timers - Activity detected');
    clearAllTimers();
    setShowModal(false);
    setCountdown(60); // 60 seconds
    
    // Start fresh idle timer
    idleTimerRef.current = setTimeout(() => {
    //   console.log('⚠️ Idle time reached - Starting countdown');
      startCountdown();
    }, IDLE_TIME);
  };

  // Start the countdown modal
  const startCountdown = () => {
    setShowModal(true);
    let timeLeft = 10; // 10 seconds countdown for testing
    
    // Update countdown every second
    countdownRef.current = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
    //   console.log(`⏰ Countdown: ${timeLeft} seconds remaining`);
      
      if (timeLeft <= 0) {
        console.log('💀 Countdown ended - Logging out');
        clearInterval(countdownRef.current);
        handleLogout();
      }
    }, 1000);
    
    // Set final logout timer
    logoutTimerRef.current = setTimeout(() => {
    //   console.log('💀 Logout timer triggered');
      handleLogout();
    }, COUNTDOWN_TIME);
  };

  // Handle logout
  const handleLogout = async () => {
    // console.log('🚪 Logging out due to inactivity');
    clearAllTimers();
    setShowModal(false);
    toast.error('Session expired due to inactivity');
    
    setTimeout(async () => {
      await logout();
      navigate('/login');
    }, 500);
  };

  // Handle stay logged in
  const handleStayLoggedIn = () => {
    // console.log('✅ User chose to stay logged in');
    clearAllTimers();
    setShowModal(false);
    setCountdown(60);
    toast.success('Session extended');
    
    // Restart idle timer
    idleTimerRef.current = setTimeout(() => {
    //   console.log('⚠️ Idle time reached - Starting countdown');
      startCountdown();
    }, IDLE_TIME);
  };

  // Set up event listeners
  useEffect(() => {
    if (!isAuthenticated) {
    //   console.log('🔒 User not authenticated - IdleTimer disabled');
      return;
    }
    
    // console.log('✅ IdleTimer initialized for authenticated user');
    
    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'click', 'keydown', 'touchstart'];
    
    const handleActivity = () => {
      resetTimers();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Start initial timer
    resetTimers();
    
    // Cleanup
    return () => {
      //console.log('🧹 Cleaning up IdleTimer');
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [isAuthenticated]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in-up">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Session Timeout
        </h3>
        
        <p className="text-gray-600 text-center mb-4">
          You've been inactive. Your session will expire in {formatTime(countdown)}.
        </p>
        
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Session remaining</span>
            <span className="font-mono">{countdown}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 60) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout Now
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Stay Logged In
          </button>
        </div>
        
        <p className="text-xs text-gray-400 text-center mt-4">
          Press any key or move your mouse to stay logged in
        </p>
      </div>
    </div>
  );
};

export default IdleTimer;