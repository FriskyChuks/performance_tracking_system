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
  X,
  Send,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Shield,
  AlertCircle,
  Reply,
  MapPin,
  Navigation,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  DollarSign,
  Clock,
  BarChart3,
  Tag,
  Calendar as CalendarIcon,
  Activity,
  Award,
  Leaf
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import mainApi from '../../services/mainApi';
import engagementApi from '../../services/engagementApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

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
    <div className="mt-2 pl-4">
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-xs">
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
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim()}
                className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-lg font-medium hover:shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                onClick={onCancel}
                className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
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
      <div className={`flex gap-2 ${isReply ? 'pt-2' : 'py-3'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm ${
            comment.is_staff_comment 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
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
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`font-semibold text-xs ${
              comment.is_staff_comment ? 'text-green-700' : 'text-gray-900'
            }`}>
              {comment.author_name}
            </span>
            {badge && (
              <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[10px] font-medium ${badge.color} ${badge.textColor}`}>
                {badge.icon}
                {badge.text}
              </span>
            )}
            <span className="text-[10px] text-gray-400">{formatDate(comment.created_at)}</span>
          </div>
          
          {/* Comment Text */}
          <p className="text-gray-700 text-xs mb-1.5 leading-relaxed">{comment.content}</p>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
              <button
                onClick={() => onReaction(comment.id, 'agree')}
                disabled={submitting}
                className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-green-600 transition group disabled:opacity-50"
              >
                <ThumbsUp className="w-3 h-3 group-hover:scale-110 transition" />
                <span>{getReactionCount(comment, 'agree')}</span>
              </button>
              <button
                onClick={() => onReaction(comment.id, 'disagree')}
                disabled={submitting}
                className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-red-600 transition group disabled:opacity-50"
              >
                <ThumbsDown className="w-3 h-3 group-hover:scale-110 transition" />
                <span>{getReactionCount(comment, 'disagree')}</span>
              </button>
            
            {showReplyButton && (
              <button
                onClick={() => onReplyClick(comment.id)}
                className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-green-600 transition"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}
            
            <button className="text-gray-400 hover:text-red-500 transition">
              <Flag className="w-3 h-3" />
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
            <div className="mt-2">
              <button
                onClick={() => onToggleReplies(comment.id)}
                className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-green-600 transition mb-1"
              >
                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                {isExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
              
              {isExpanded && (
                <div className="pl-3 border-l-2 border-gray-200 space-y-1">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      isReply={true}
                      isReplyActive={activeReplyId === reply.id}
                      activeReplyId={activeReplyId}
                      expandedReplies={expandedReplies}
                      isAuthenticated={isAuthenticated}
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

// Image Gallery Modal Component
const ImageGalleryModal = ({ images, initialIndex, onClose, onImageChange }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isZoomed, setIsZoomed] = useState(false);

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    if (onImageChange) onImageChange(newIndex);
  };

  const prevImage = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    if (onImageChange) onImageChange(newIndex);
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
  }, [currentIndex]);

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
            onClick={() => {
              setCurrentIndex(idx);
              if (onImageChange) onImageChange(idx);
            }}
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
  const { user, isAuthenticated, userRole } = useAuth();
  const mainCommentRef = useRef(null);
  
  const [activity, setActivity] = useState(null);
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchActivityDetails();
    fetchImages();
    fetchComments();
  }, [id]);

  const fetchActivityDetails = async () => {
    try {
      const response = await mainApi.getPublicActivityDetail(id);
      setActivity(response);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to load project details');
    }
  };

  const fetchImages = async () => {
    try {
      const response = await engagementApi.getActivityImages(id);
      setImages(response || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for activity ID:', id);
      const commentsArray = await engagementApi.getActivityComments(id);
      // console.log('Comments array:', commentsArray);
      
      if (!commentsArray || commentsArray.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }
      
      // Organize comments into parent-child structure
      const topLevelComments = [];
      const repliesMap = {};
      
      commentsArray.forEach(comment => {
        if (comment.parent && comment.parent !== null) {
          if (!repliesMap[comment.parent]) {
            repliesMap[comment.parent] = [];
          }
          repliesMap[comment.parent].push(comment);
        } else {
          topLevelComments.push(comment);
        }
      });
      
      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || []
      }));
      
      commentsWithReplies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setComments(commentsWithReplies);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
      setComments([]);
      toast.error('Failed to load comments');
    }
  };

  const openImageGallery = (index) => {
    setGalleryStartIndex(index);
    setShowGallery(true);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    openImageGallery(index);
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
        await engagementApi.postComment(id, {
          project_activity: parseInt(id),
          content: commentText,
        });
        toast.success('Comment posted successfully!');
      } else {
        if (!anonymousInfo.display_name && !sessionId) {
          setShowAnonymousModal(true);
          setSubmitting(false);
          return;
        }
        
        const commentData = {
          project_activity: parseInt(id),
          content: commentText,
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
      await fetchComments();
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
      await engagementApi.postComment(id, {
        project_activity: parseInt(id),
        parent: commentId,
        content: replyContent,
      });
      toast.success('Reply posted successfully!');
      setActiveReplyId(null);
      await fetchComments();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId, reactionType) => {
    // Prevent double clicks
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      let sessionId = localStorage.getItem('public_session_id');
      
      // For anonymous users without session ID, create one
      if (!isAuthenticated && !sessionId) {
        sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('public_session_id', sessionId);
        // console.log('Created new session ID for reaction:', sessionId);
      }
      
      // console.log('Sending reaction:', { commentId, reactionType, isAuthenticated, sessionId });
      
      if (isAuthenticated) {
        // Authenticated user
        await engagementApi.addReaction(commentId, reactionType);
      } else {
        // Anonymous user
        await engagementApi.addReaction(commentId, reactionType, sessionId);
      }
      
      toast.success('Reaction added!');
      await fetchComments();
      
    } catch (error) {
      console.error('Reaction error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        toast.error(errorData?.error || errorData?.comment?.[0] || 'Invalid reaction');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please refresh the page.');
        localStorage.removeItem('public_session_id');
      } else if (error.response?.status === 404) {
        toast.error('Comment not found');
      } else {
        toast.error('Failed to add reaction. Please try again.');
      }
    } finally {
      setSubmitting(false);
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
        icon: <Shield className="w-2.5 h-2.5" />,
        text: 'Staff',
        color: 'bg-green-500',
        textColor: 'text-white'
      };
    } else if (comment.author_type === 'registered') {
      return {
        icon: <CheckCircle className="w-2.5 h-2.5" />,
        text: 'Verified',
        color: 'bg-blue-500',
        textColor: 'text-white'
      };
    }
    return null;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'from-emerald-500 to-green-600';
    if (percentage >= 75) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-amber-500 to-yellow-600';
    if (percentage >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Attention';
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
    return <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>{config.icon} {config.label}</span>;
  };

  const getReactionCount = (comment, type) => {
    // Use reaction_counts from the API if available
    if (comment.reaction_counts) {
      return comment.reaction_counts[type] || 0;
    }
    // Fallback to calculating from reactions array
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <Leaf className="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
        <button onClick={() => navigate('/public/projects')} className="text-green-600 hover:text-green-700 font-medium">
          ← Back to projects
        </button>
      </div>
    );
  }

  const displayImages = images.length > 0 ? images : [];
  const selectedImage = displayImages[selectedImageIndex];
  const performancePercentage = activity.overall_performance || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/public/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition group bg-white/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm hover:shadow-md text-sm"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
          Back to Projects
        </button>

        {/* Compact Project Info Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-5 hover:shadow-lg transition-all duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white">
                <Activity className="w-3 h-3" />
                <span className="text-[11px] font-medium">Project Overview</span>
              </div>
              <div className="text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                {getPerformanceLabel(performancePercentage)} • {Math.round(performancePercentage)}%
              </div>
            </div>
          </div>
          
          <div className="p-3">
            {/* Title Row */}
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-1 mb-1.5">
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  activity.activity_type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {activity.activity_type === 'project' ? '📋' : '📊'} {activity.activity_type === 'project' ? 'Project' : 'Program'}
                </span>
                {activity.code && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    <Tag className="w-2.5 h-2.5" />
                    {activity.code}
                  </span>
                )}
                {getStatusBadge(activity.status)}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight line-clamp-2">{activity.title}</h1>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-[11px] leading-relaxed mb-2 line-clamp-2">
              {activity.description}
            </p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
              {activity.department_name && (
                <div className="flex items-center gap-1">
                  <div className="bg-blue-100 rounded-full p-1">
                    <Building2 className="w-2.5 h-2.5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-gray-500 truncate">Dept</p>
                    <p className="text-[10px] font-semibold text-gray-900 truncate">{activity.department_name}</p>
                  </div>
                </div>
              )}
              
              {activity.agency_name && (
                <div className="flex items-center gap-1">
                  <div className="bg-purple-100 rounded-full p-1">
                    <Landmark className="w-2.5 h-2.5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-gray-500 truncate">Agency</p>
                    <p className="text-[10px] font-semibold text-gray-900 truncate">{activity.agency_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <div className="bg-green-100 rounded-full p-1">
                  <CalendarIcon className="w-2.5 h-2.5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-500">Start</p>
                  <p className="text-[10px] font-semibold text-gray-900">{new Date(activity.start_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              {activity.end_date && (
                <div className="flex items-center gap-1">
                  <div className="bg-orange-100 rounded-full p-1">
                    <Calendar className="w-2.5 h-2.5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-gray-500">End</p>
                    <p className="text-[10px] font-semibold text-gray-900">{new Date(activity.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {(activity.funding_source || activity.budget || activity.program_goal) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-gray-100">
                {activity.activity_type === 'project' && activity.funding_source && (
                  <div className="flex items-center gap-1">
                    <div className="bg-amber-100 rounded-full p-1">
                      <DollarSign className="w-2.5 h-2.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Funding</p>
                      <p className="text-[10px] font-semibold text-gray-900 capitalize">{activity.funding_source.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
                
                {activity.budget && (
                  <div className="flex items-center gap-1">
                    <div className="bg-emerald-100 rounded-full p-1">
                      <DollarSign className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Budget</p>
                      <p className="text-[10px] font-semibold text-gray-900">₦{parseFloat(activity.budget).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {activity.activity_type === 'program' && activity.program_goal && (
                  <div className="flex items-start gap-1 sm:col-span-2">
                    <div className="bg-indigo-100 rounded-full p-1 mt-0.5">
                      <Target className="w-2.5 h-2.5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-gray-500">Program Goal</p>
                      <p className="text-[10px] font-medium text-gray-900 line-clamp-1">{activity.program_goal}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {performancePercentage > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-0.5">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-2.5 h-2.5 text-green-600" />
                    <span className="text-[10px] font-semibold text-gray-700">Overall Progress</span>
                  </div>
                  <span className="text-[11px] font-bold text-green-600">
                    {Math.round(performancePercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(performancePercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Image Gallery & Map */}
          <div className="space-y-6">
            {/* Main Image Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200">
                {selectedImage ? (
                  <div className="relative group">
                    <img
                      src={selectedImage.image_url || selectedImage.image}
                      alt={activity.title}
                      className="w-full h-64 sm:h-80 md:h-96 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => handleImageClick(selectedImageIndex)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => handleImageClick(selectedImageIndex)}
                        className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:bg-black/80 transition"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        Fullscreen
                      </button>
                    </div>
                    
                    {displayImages.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3" />
                        {selectedImageIndex + 1} / {displayImages.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-80 md:h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Leaf className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {displayImages.length > 1 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                    {displayImages.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          idx === selectedImageIndex 
                            ? 'border-green-500 shadow-md scale-105' 
                            : 'border-gray-200 hover:border-green-300 hover:scale-105'
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
            </div>

            {/* Location Map Card */}
            {(activity.latitude && activity.longitude) && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Project Location
                  </h3>
                </div>
                
                <div className="h-56 sm:h-64 w-full">
                  <MapContainer 
                    center={[parseFloat(activity.latitude), parseFloat(activity.longitude)]} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    zoomControl={true}
                  >
                    <TileLayer 
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[parseFloat(activity.latitude), parseFloat(activity.longitude)]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold text-sm">{activity.title}</p>
                          {activity.location_address && (
                            <p className="text-xs text-gray-600 mt-1">{activity.location_address}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                
                <div className="p-3 bg-gray-50">
                  {activity.location_address && (
                    <p className="text-xs text-gray-600 mb-2 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{activity.location_address}</span>
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <a 
                      href={`https://www.google.com/maps?q=${activity.latitude},${activity.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition transform hover:scale-105"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Directions
                    </a>
                    <a 
                      href={`https://www.google.com/maps/place/${activity.latitude},${activity.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Map
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Discussion Section */}
          <div className="lg:sticky lg:top-6 h-[calc(100vh-3rem)]">
            <div ref={mainCommentRef} className="bg-white rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    Discussion ({comments.length})
                  </h2>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Live
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    isAuthenticated 
                      ? "Share your feedback..." 
                      : `You have ${rateLimit.remaining} comment${rateLimit.remaining !== 1 ? 's' : ''} left today. Sign in to comment unlimited.`
                  }
                  rows="2"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none bg-white"
                />
                
                <div className="flex gap-2 mt-2">
                  {isAuthenticated ? (
                    <button
                      onClick={handleSubmitComment}
                      disabled={submitting || !commentText.trim()}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-medium hover:shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Post Comment
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowAnonymousModal(true)}
                        disabled={rateLimit.remaining <= 0}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 text-xs font-medium hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rateLimit.remaining > 0 ? `Comment (${rateLimit.remaining} left)` : 'Limit Reached'}
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-medium hover:shadow-md transition"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Comments List - Scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {comments.map((comment) => (
                      <div key={comment.id} className="px-3">
                        <CommentCard
                          comment={comment}
                          isReplyActive={activeReplyId === comment.id}
                          activeReplyId={activeReplyId}
                          expandedReplies={expandedReplies}
                          isAuthenticated={isAuthenticated}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anonymous Comment Modal */}
      {showAnonymousModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 animate-fade-in-up shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Comment Anonymously</h3>
              <button onClick={() => setShowAnonymousModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={anonymousInfo.display_name}
                  onChange={(e) => setAnonymousInfo({ display_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="How you want to appear"
                  autoFocus
                />
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1 text-xs">Anonymous Commenting Rules:</p>
                  <ul className="text-xs space-y-0.5">
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
                className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-sm hover:shadow-md transition disabled:opacity-50"
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
          onImageChange={(index) => setSelectedImageIndex(index)}
        />
      )}
    </div>
  );
};

export default PublicProjectDetail;