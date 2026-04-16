// src/components/Landing/Hero.jsx
import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, Target, Award, ChevronLeft, ChevronRight, Play, Pause, BarChart3, Building2, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';

const backgroundImages = [
  {
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&h=900&fit=crop",
    title: "Forest Conservation",
    color: "from-green-600/80 to-green-800/80"
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3f7fe05?w=1600&h=900&fit=crop",
    title: "Mountain Ecosystems",
    color: "from-blue-600/80 to-indigo-800/80"
  },
  {
    url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1600&h=900&fit=crop",
    title: "Water Resources",
    color: "from-cyan-600/80 to-blue-800/80"
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&h=900&fit=crop",
    title: "Landscape Protection",
    color: "from-emerald-600/80 to-teal-800/80"
  },
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&h=900&fit=crop",
    title: "Biodiversity",
    color: "from-amber-600/80 to-orange-800/80"
  }
];

const Hero = ({ stats }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    let progressInterval;
    if (isPlaying) {
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + (100 / 50);
        });
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(progressInterval);
  }, [isPlaying, currentImage]);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    setProgress(0);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + backgroundImages.length) % backgroundImages.length);
    setProgress(0);
  };

  const goToImage = (index) => {
    setCurrentImage(index);
    setProgress(0);
  };

  const statCards = [
    {
      icon: TrendingUp,
      value: stats?.completion_rate ? `${stats.completion_rate}%` : '95%',
      label: "Completion Rate",
      color: "from-green-400 to-emerald-500",
      description: "Target achievement"
    },
    {
      icon: Target,
      value: stats?.total_initiatives?.toLocaleString() || '50+',
      label: "Active Initiatives",
      color: "from-blue-400 to-indigo-500",
      description: "Nationwide coverage"
    },
    {
      icon: Award,
      value: stats?.avg_performance_rating ? `${stats.avg_performance_rating}/5` : '4.2/5',
      label: "Avg Performance",
      color: "from-purple-400 to-pink-500",
      description: "Quality rating"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${image.color} mix-blend-overlay z-10`}></div>
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 z-20"></div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-8 right-8 z-30 flex gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={prevImage}
          className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextImage}
          className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300 hover:scale-110"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentImage
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="animate-fade-in-up mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Federal Ministry of Environment
              </span>
            </div>

            <div className="animate-fade-in-up animation-delay-200">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4">
                Performance Tracking
              </h1>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent mb-6">
                System
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                Empowering environmental stewardship through real-time monitoring, 
                data-driven insights, and transparent governance
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-400">
              <Link
                to="/public"
                className="group relative px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white font-semibold text-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  Citizen's Engagement Portal
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                Staff Login
              </Link>
            </div>
            
            {/* Stats Cards with Real Data */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up"
                    style={{ animationDelay: `${index * 200 + 600}ms` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                    <div className="relative z-10">
                      <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                      <div className="text-sm font-semibold text-gray-200 mb-1">{stat.label}</div>
                      <div className="text-xs text-gray-300">{stat.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Stats Row */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{stats?.total_departments || 0} Departments</span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                <span>{stats?.total_agencies || 0} Agencies</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>{stats?.total_deliverables || 0} Active Deliverables</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden lg:block">
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                <div className="w-1 h-2 bg-white/50 rounded-full mt-2 animate-scroll"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scroll {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(10px);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-scroll {
          animation: scroll 1.5s ease-in-out infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </div>
  );
};

export default Hero;