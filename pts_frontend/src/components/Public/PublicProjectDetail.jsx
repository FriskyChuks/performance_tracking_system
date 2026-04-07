// src/components/Public/PublicProjectDetail.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  ThumbsUp,
  ThumbsDown,
  Flag,
  Building2,
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
  Minimize2,
  Maximize2
} from 'lucide-react';
import { publicApi } from '../../services/publicApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import ImageGallery from './ImageGallery';

// Memoized Reply Form Component to prevent re-renders
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

          {/* Inline Reply Form - Separate component to prevent re-renders */}
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

const PublicProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const mainCommentRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [showAnonymousModal, setShowAnonymousModal] = useState(false);
  const [anonymousInfo, setAnonymousInfo] = useState({ display_name: '' });
  const [showGallery, setShowGallery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimit, setRateLimit] = useState({ remaining: 3, reset_time: null });
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user's rate limit for anonymous comments
  useEffect(() => {
    const checkRateLimit = async () => {
      if (!isAuthenticated) {
        const sessionId = localStorage.getItem('public_session_id');
        if (sessionId) {
          try {
            const response = await publicApi.getRateLimit(sessionId);
            setRateLimit(response.data);
          } catch (error) {
            console.error('Error checking rate limit:', error);
          }
        }
      }
    };
    checkRateLimit();
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProjectDetails();
    fetchComments();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await publicApi.getProject(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project details');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await publicApi.getComments(id);
      setComments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const sessionId = localStorage.getItem('public_session_id');
      
      let commentData;
      
      if (isAuthenticated && user) {
        commentData = {
          content: commentText,
          parent_id: null,
        };
        await publicApi.postCommentAuthenticated(id, commentData);
        toast.success('Comment posted successfully!');
      } else {
        if (!anonymousInfo.display_name && !sessionId) {
          setShowAnonymousModal(true);
          setSubmitting(false);
          return;
        }
        
        commentData = {
          content: commentText,
          parent_id: null,
          display_name: anonymousInfo.display_name || 'Anonymous',
          session_id: sessionId || 'anon_' + Date.now()
        };
        
        if (!sessionId) {
          localStorage.setItem('public_session_id', commentData.session_id);
        }
        
        await publicApi.postComment(id, commentData);
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
      const commentData = {
        content: replyContent,
        parent_id: commentId,
      };
      
      await publicApi.postCommentAuthenticated(id, commentData);
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
        await publicApi.reactToCommentAuthenticated(commentId, { reaction_type: reactionType });
      } else {
        await publicApi.reactToComment(commentId, { 
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/public/projects')}
        className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-3 transition group text-sm"
      >
        ← Back to Projects
      </button>

      {/* Collapsible Header */}
      <div className={`bg-white rounded-xl shadow-md overflow-hidden mb-4 transition-all duration-300 ${isHeaderCollapsed ? 'border border-gray-200' : ''}`}>
        <div 
          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition ${!isHeaderCollapsed ? 'border-b border-gray-100' : ''}`}
          onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getPerformanceColor(project.performance_rating)} flex items-center justify-center flex-shrink-0`}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">{project.outcome}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{project.ministry_name}</span>
                <span>•</span>
                <span>{project.year} Q{project.quarter}</span>
                <span>•</span>
                <span>{comments.length} comments</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {isHeaderCollapsed ? 'Tap to expand' : 'Tap to collapse'}
            </span>
            {isHeaderCollapsed ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {!isHeaderCollapsed && (
          <div className="animate-fade-in-up">
            <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200">
              {project.images && project.images.length > 0 ? (
                <img
                  src={project.images[0].image}
                  alt={project.outcome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-gray-300" />
                </div>
              )}
              {project.images && project.images.length > 1 && (
                <button
                  onClick={() => setShowGallery(true)}
                  className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-black/70 transition"
                >
                  <ImageIcon className="w-3 h-3" />
                  {project.images.length} photos
                </button>
              )}
              <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-white text-xs font-medium bg-gradient-to-r ${getPerformanceColor(project.performance_rating)} shadow-lg`}>
                {getPerformanceLabel(project.performance_rating)} • {project.performance_rating || 'N/A'}/5
              </div>
            </div>

            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">{project.indicator}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 text-center">
                  <Building2 className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
                  <p className="text-xs text-gray-500">Ministry</p>
                  <p className="text-xs font-semibold text-gray-900 truncate">{project.ministry_name || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 text-center">
                  <Calendar className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
                  <p className="text-xs text-gray-500">Timeline</p>
                  <p className="text-xs font-semibold text-gray-900">{project.year} • Q{project.quarter}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 text-center">
                  <Target className="w-4 h-4 text-purple-600 mx-auto mb-0.5" />
                  <p className="text-xs text-gray-500">Target/Actual</p>
                  <p className="text-xs font-semibold text-gray-900">{project.target_data || 'N/A'} / {project.actual_data || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 text-center">
                  <MessageCircle className="w-4 h-4 text-orange-600 mx-auto mb-0.5" />
                  <p className="text-xs text-gray-500">Comments</p>
                  <p className="text-xs font-semibold text-gray-900">{comments.length}</p>
                </div>
              </div>

              {project.target_data && project.actual_data && (
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Completion</span>
                    <span>{Math.min((project.actual_data / project.target_data) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((project.actual_data / project.target_data) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div ref={mainCommentRef}>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-600" />
              Discussion ({comments.length})
            </h2>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-b border-gray-100">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                isAuthenticated 
                  ? "Share your feedback..." 
                  : `You have ${rateLimit.remaining} comment${rateLimit.remaining !== 1 ? 's' : ''} left today. Sign in to comment unlimited.`
              }
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
            
            <div className="flex gap-2 mt-2">
              {isAuthenticated ? (
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm rounded-lg font-medium hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
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
                    className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rateLimit.remaining > 0 ? `Comment (${rateLimit.remaining} left)` : 'Limit Reached'}
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm rounded-lg font-medium hover:shadow-md transition"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {comments.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
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

      {/* Anonymous Comment Modal */}
      {showAnonymousModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 animate-fade-in-up">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Comment Anonymously</h3>
              <button onClick={() => setShowAnonymousModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="How you want to appear"
                  autoFocus
                />
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Anonymous users: {rateLimit.remaining}/3 comments today • Cannot reply • Comments cannot receive replies</span>
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={submitting}
                className="w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium text-sm hover:shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && project.images && (
        <ImageGallery images={project.images} onClose={() => setShowGallery(false)} />
      )}
    </div>
  );
};

export default PublicProjectDetail;