// src/components/Public/PublicProjectDetail.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  ThumbsUp,
  ThumbsDown,
  Flag,
  Building2,
  Landmark,
  Target,
  User,
  X,
  Send,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Shield,
  AlertCircle,
  Reply,
  Minimize2,
  Maximize2,
  MapPin,
  Navigation,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Heart
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { engagementApi } from '../../services/engagementApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import ImageGallery from './ImageGallery';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Memoized Reply Form Component
const ReplyForm = memo(({ comment, onSubmit, onCancel, isSubmitting }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(comment.id, text);
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="mt-3 pl-4">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-xs">
              R
            </div>
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              rows="2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Reply to ${comment.author_name}...`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim()}
                className="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs rounded-lg font-medium hover:shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <span className="text-xs text-gray-400 ml-auto hidden sm:block">
                Ctrl + Enter to post
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReplyForm.displayName = 'ReplyForm';

// Memoized Comment Card Component
const CommentCard = memo(({ 
  comment, 
  isReply = false,
  isReplyActive,
  activeReplyId,
  expandedReplies,
  isAuthenticated,
  user,
  submitting,
  onReaction,
  onToggleReplies,
  onReplyClick,
  onSubmitReply,
  onCancelReply,
  getAuthorBadge,
  getReactionCount,
  formatDate,
  canReply,
  canReceiveReplies
}) => {
  const badge = getAuthorBadge(comment);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isExpanded = expandedReplies[comment.id];
  const showReplyButton = canReply(comment) && !isReply;
  const showReplies = canReceiveReplies(comment);
  const showReplyForm = activeReplyId === comment.id;

  return (
    <div className={`${!isReply ? 'border-b border-gray-100' : ''}`}>
      <div className={`flex gap-3 ${isReply ? 'pt-3' : 'py-4'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md ${
            comment.is_staff_comment 
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : comment.author_type === 'registered'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
          }`}>
            {comment.author_name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
        
        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-semibold text-sm ${
              comment.is_staff_comment ? 'text-green-700' : 'text-gray-900'
            }`}>
              {comment.author_name}
            </span>
            {badge && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${badge.textColor}`}>
                {badge.icon}
                {badge.text}
              </span>
            )}
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            {comment.location && (
              <span className="text-xs text-gray-400">📍 {comment.location}</span>
            )}
          </div>
          
          {/* Comment Text */}
          <p className="text-gray-700 text-sm mb-2 leading-relaxed">{comment.content}</p>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onReaction(comment.id, 'agree')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition group"
            >
              <ThumbsUp className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>{getReactionCount(comment, 'agree')}</span>
            </button>
            <button
              onClick={() => onReaction(comment.id, 'disagree')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition group"
            >
              <ThumbsDown className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              <span>{getReactionCount(comment, 'disagree')}</span>
            </button>
            
            {showReplyButton && (
              <button
                onClick={() => onReplyClick(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}
            
            <button className="text-gray-400 hover:text-red-500 transition">
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inline Reply Form */}
          {showReplyForm && (
            <ReplyForm
              comment={comment}
              onSubmit={onSubmitReply}
              onCancel={onCancelReply}
              isSubmitting={submitting}
            />
          )}
          
          {/* Replies Section */}
          {hasReplies && showReplies && (
            <div className="mt-3">
              <button
                onClick={() => onToggleReplies(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition mb-2"
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
              
              {isExpanded && (
                <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      isReply={true}
                      isReplyActive={activeReplyId === reply.id}
                      activeReplyId={activeReplyId}
                      expandedReplies={expandedReplies}
                      isAuthenticated={isAuthenticated}
                      user={user}
                      submitting={submitting}
                      onReaction={onReaction}
                      onToggleReplies={onToggleReplies}
                      onReplyClick={onReplyClick}
                      onSubmitReply={onSubmitReply}
                      onCancelReply={onCancelReply}
                      getAuthorBadge={getAuthorBadge}
                      getReactionCount={getReactionCount}
                      formatDate={formatDate}
                      canReply={canReply}
                      canReceiveReplies={canReceiveReplies}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CommentCard.displayName = 'CommentCard';

// Image Gallery Component for the detail page
const ImageGalleryModal = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isZoomed, setIsZoomed] = useState(false);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10 bg-black/50 rounded-full p-2"
      >
        <X className="w-6 h-6" />
      </button>
      
      <button
        onClick={prevImage}
        className="absolute left-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-3 hover:bg-black/70"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextImage}
        className="absolute right-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-3 hover:bg-black/70"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => setIsZoomed(!isZoomed)}
        className="absolute top-4 left-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      
      <div className="max-w-5xl max-h-[85vh] mx-4">
        <img
          src={images[currentIndex]?.image_url || images[currentIndex]?.image}
          alt={images[currentIndex]?.caption || 'Project image'}
          className={`max-w-full max-h-[85vh] object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setIsZoomed(!isZoomed)}
        />
        {images[currentIndex]?.caption && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-md text-center">
            {images[currentIndex].caption}
          </div>
        )}
      </div>
      
      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setCurrentIndex(idx)}
            className={`w-12 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
              idx === currentIndex ? 'border-green-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={img.image_url || img.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      
      {/* Image Counter */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const PublicProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const mainCommentRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);
  const [anonymousInfo, setAnonymousInfo] = useState({ display_name: '' });
  const [showGallery, setShowGallery] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimit, setRateLimit] = useState({ remaining: 3, reset_time: null });
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchImages();
    fetchComments();
  }, [id]);

  useEffect(() => {
    const checkRateLimit = async () => {
      if (!isAuthenticated) {
        const sessionId = localStorage.getItem('public_session_id');
        if (sessionId) {
          try {
            const response = await engagementApi.getRateLimit(sessionId);
            setRateLimit(response.data);
          } catch (error) {
            console.error('Error checking rate limit:', error);
          }
        }
      }
    };
    checkRateLimit();
  }, [isAuthenticated]);

  const fetchProjectDetails = async () => {
    try {
      const response = await engagementApi.getInitiative(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project details');
    }
  };

  const fetchImages = async () => {
    try {
      const response = await engagementApi.getInitiativeImages(id);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await engagementApi.getComments(id);
      setComments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  const openImageGallery = (index) => {
    setGalleryStartIndex(index);
    setShowGallery(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const sessionId = localStorage.getItem('public_session_id');
      
      if (isAuthenticated && user) {
        await engagementApi.postCommentAuthenticated(id, {
          content: commentText,
          parent_id: null,
        });
        toast.success('Comment posted successfully!');
      } else {
        if (!anonymousInfo.display_name && !sessionId) {
          setShowAnonymousModal(true);
          setSubmitting(false);
          return;
        }
        
        const commentData = {
          content: commentText,
          parent_id: null,
          display_name: anonymousInfo.display_name || 'Anonymous',
          session_id: sessionId || 'anon_' + Date.now()
        };
        
        await engagementApi.postComment(id, commentData);
        
        if (!sessionId) {
          localStorage.setItem('public_session_id', commentData.session_id);
        }
        
        toast.success('Comment posted anonymously!');
        setRateLimit(prev => ({ ...prev, remaining: prev.remaining - 1 }));
      }
      
      setCommentText('');
      fetchComments();
      if (mainCommentRef.current) {
        mainCommentRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 429) {
        toast.error('Daily comment limit reached. Please register to continue commenting.');
        setShowAnonymousModal(false);
      } else {
        toast.error(error.response?.data?.error || 'Failed to post comment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId, replyContent) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      await engagementApi.postCommentAuthenticated(id, {
        content: replyContent,
        parent_id: commentId,
      });
      toast.success('Reply posted successfully!');
      setActiveReplyId(null);
      fetchComments();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId, reactionType) => {
    try {
      const sessionId = localStorage.getItem('public_session_id');
      
      if (isAuthenticated && user) {
        await engagementApi.reactToCommentAuthenticated(commentId, { reaction_type: reactionType });
      } else {
        await engagementApi.reactToComment(commentId, { 
          reaction_type: reactionType,
          session_id: sessionId 
        });
      }
      fetchComments();
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleReplyClick = (commentId) => {
    setActiveReplyId(activeReplyId === commentId ? null : commentId);
  };

  const handleCancelReply = () => {
    setActiveReplyId(null);
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const canReply = (comment) => {
    if (!isAuthenticated) return false;
    if (comment.author_type === 'anonymous') return false;
    return true;
  };

  const canReceiveReplies = (comment) => {
    return comment.author_type !== 'anonymous';
  };

  const getAuthorBadge = (comment) => {
    if (comment.is_staff_comment) {
      return {
        icon: <Shield className="w-3 h-3" />,
        text: 'Staff',
        color: 'bg-green-500',
        textColor: 'text-white'
      };
    } else if (comment.author_type === 'registered') {
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        text: 'Verified',
        color: 'bg-blue-500',
        textColor: 'text-white'
      };
    }
    return null;
  };

  const getPerformanceColor = (rating) => {
    if (rating >= 4) return 'bg-green-500';
    if (rating >= 3) return 'bg-yellow-500';
    if (rating >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPerformanceLabel = (rating) => {
    if (rating >= 4) return 'Excellent';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Poor';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'planning': { label: 'Planning', color: 'bg-gray-100 text-gray-700', icon: '📝' },
      'ongoing': { label: 'Ongoing', color: 'bg-blue-100 text-blue-700', icon: '🔄' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-700', icon: '✅' },
      'on_hold': { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: '⏸️' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: '❌' }
    };
    const config = statusConfig[status] || statusConfig.planning;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.icon} {config.label}</span>;
  };

  const getReactionCount = (comment, type) => {
    return comment.reactions?.filter(r => r.reaction_type === type).length || 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <button onClick={() => navigate('/public/projects')} className="text-primary-600 hover:text-primary-700">
          Back to projects
        </button>
      </div>
    );
  }

  const displayImages = images.length > 0 ? images : (project.images || []);
  const primaryImage = displayImages.find(img => img.is_primary) || displayImages[0];
  const thumbnailImages = displayImages.slice(0, 4);

  const statusInfo = getStatusBadge(project.status);
  const ratingInfo = {
    label: getPerformanceLabel(project.performance_rating),
    bg: getPerformanceColor(project.performance_rating),
    icon: project.performance_rating >= 4 ? '🏆' : project.performance_rating >= 3 ? '⭐' : '📊'
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/public/projects')}
        className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-4 transition group text-sm"
      >
        ← Back to Projects
      </button>

      {/* Project Header with Image Gallery */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        {/* Main Image */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200">
          {primaryImage ? (
            <div className="relative">
              <img
                src={primaryImage.image_url || primaryImage.image}
                alt={project.title}
                className="w-full h-80 md:h-96 object-cover"
              />
              {/* Image Count Badge */}
              {displayImages.length > 1 && (
                <button
                  onClick={() => openImageGallery(0)}
                  className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-black/80 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  {displayImages.length} Photos
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-80 md:h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <TrendingUp className="w-20 h-20 text-gray-300" />
            </div>
          )}
          
          {/* Performance Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r ${getPerformanceColor(project.performance_rating)} shadow-lg`}>
            {getPerformanceLabel(project.performance_rating)} • {project.performance_rating || 'N/A'}/5
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            {statusInfo}
          </div>
        </div>
        
        {/* Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => openImageGallery(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === 0 ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <img
                    src={img.image_url || img.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Project Info */}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  project.initiative_type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {project.initiative_type === 'project' ? '📋 Project' : '📊 Program'}
                </span>
                {project.code && (
                  <span className="text-xs text-gray-400">Code: {project.code}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.title}</h1>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{project.description}</p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {project.department_name && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <Building2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{project.department_name}</p>
              </div>
            )}
            {project.agency_name && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
                <Landmark className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Agency</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{project.agency_name}</p>
              </div>
            )}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
              <Calendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Started</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(project.start_date).toLocaleDateString()}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center">
              <MessageCircle className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Community Feedback</p>
              <p className="text-sm font-semibold text-gray-900">{comments.length} comments</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          {project.target_value && project.actual_value && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Achievement</span>
                <span className="font-semibold text-green-600">
                  {Math.min((project.actual_value / project.target_value) * 100, 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((project.actual_value / project.target_value) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Comments Section */}
        <div className="lg:col-span-2">
          <div ref={mainCommentRef} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary-600" />
                Discussion ({comments.length})
              </h2>
            </div>

            {/* Comment Input */}
            <div className="p-5 border-b border-gray-100">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isAuthenticated 
                    ? "Share your feedback..." 
                    : `You have ${rateLimit.remaining} comment${rateLimit.remaining !== 1 ? 's' : ''} left today. Sign in to comment unlimited.`
                }
                rows="3"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              />
              
              <div className="flex gap-3 mt-3">
                {isAuthenticated ? (
                  <button
                    onClick={handleSubmitComment}
                    disabled={submitting || !commentText.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Comment
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowAnonymousModal(true)}
                      disabled={rateLimit.remaining <= 0}
                      className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rateLimit.remaining > 0 ? `Comment (${rateLimit.remaining} left)` : 'Limit Reached'}
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-5 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Comments List */}
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {comments.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    isReplyActive={activeReplyId === comment.id}
                    activeReplyId={activeReplyId}
                    expandedReplies={expandedReplies}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    submitting={submitting}
                    onReaction={handleReaction}
                    onToggleReplies={toggleReplies}
                    onReplyClick={handleReplyClick}
                    onSubmitReply={handleSubmitReply}
                    onCancelReply={handleCancelReply}
                    getAuthorBadge={getAuthorBadge}
                    getReactionCount={getReactionCount}
                    formatDate={formatDate}
                    canReply={canReply}
                    canReceiveReplies={canReceiveReplies}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-5">
          {/* Rating Card */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-${getPerformanceColor(project.performance_rating)}/10 border border-${getPerformanceColor(project.performance_rating)}/30`}>
              <span className="text-3xl">{ratingInfo.icon}</span>
              <div className="text-left">
                <p className={`text-lg font-bold text-${getPerformanceColor(project.performance_rating)}-700`}>{ratingInfo.label}</p>
                <p className="text-xs text-gray-500">Rating {project.performance_rating}/5</p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          {(project.latitude && project.longitude) && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600" />
                Project Location
              </h3>
              
              <div className="h-48 rounded-xl overflow-hidden mb-3 border border-gray-200">
                <MapContainer 
                  center={[parseFloat(project.latitude), parseFloat(project.longitude)]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  zoomControl={true}
                >
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[parseFloat(project.latitude), parseFloat(project.longitude)]}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold text-sm">{project.title}</p>
                        {project.location_address && (
                          <p className="text-xs text-gray-600 mt-1">{project.location_address}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              
              {project.location_address && (
                <p className="text-sm text-gray-600 mb-2">{project.location_address}</p>
              )}
              
              <div className="flex gap-2 mt-3">
                <a 
                  href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
                <a 
                  href={`https://www.google.com/maps/place/${project.latitude},${project.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Map
                </a>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Start Date</span>
                <span className="font-semibold text-gray-900">{new Date(project.start_date).toLocaleDateString()}</span>
              </div>
              {project.end_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">End Date</span>
                  <span className="font-semibold text-gray-900">{new Date(project.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Funding Card */}
          {project.initiative_type === 'project' && project.funding_source && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-600" />
                Funding
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Source</span>
                  <span className="font-semibold text-gray-900 capitalize">{project.funding_source.replace('_', ' ')}</span>
                </div>
                {project.budget && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Budget</span>
                    <span className="font-semibold text-gray-900">₦{parseFloat(project.budget).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Program Goal Card */}
          {project.initiative_type === 'program' && project.program_goal && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-600" />
                Program Goal
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{project.program_goal}</p>
            </div>
          )}

          {/* Achievement Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">Overall Achievement</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {project.target_value && project.actual_value 
                  ? Math.round((project.actual_value / project.target_value) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-gray-500">of target achieved</p>
              <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all" 
                     style={{ width: project.target_value && project.actual_value 
                       ? `${Math.min(100, (project.actual_value / project.target_value) * 100)}%` 
                       : '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anonymous Comment Modal */}
      {showAnonymousModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Comment Anonymously</h3>
              <button onClick={() => setShowAnonymousModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={anonymousInfo.display_name}
                  onChange={(e) => setAnonymousInfo({ display_name: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="How you want to appear"
                  autoFocus
                />
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Anonymous Commenting Rules:</p>
                  <ul className="text-xs space-y-1">
                    <li>• {rateLimit.remaining}/3 comments remaining today</li>
                    <li>• Cannot reply to comments</li>
                    <li>• Your comments cannot receive replies</li>
                    <li>• Register to unlock full features</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium text-sm hover:shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && displayImages.length > 0 && (
        <ImageGalleryModal 
          images={displayImages} 
          initialIndex={galleryStartIndex}
          onClose={() => setShowGallery(false)} 
        />
      )}
    </div>
  );
};

export default PublicProjectDetail;