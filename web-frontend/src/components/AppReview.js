import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import { appReviewsAPI } from '../services/api';
import { useToast, handleApiError } from './ErrorToast';
import './AppReview.css';

const AppReview = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadExistingReview();
    }
  }, [isOpen]);

  const loadExistingReview = async () => {
    setIsLoading(true);
    try {
      const response = await appReviewsAPI.getMyReview();
      if (response.data) {
        setExistingReview(response.data);
        setRating(response.data.rating);
        setComment(response.data.comment);
      }
    } catch (error) {
      // No existing review, that's fine
      console.log('No existing review found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      showError('Please provide a comment (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      await appReviewsAPI.submitReview({ rating, comment: comment.trim() });
      showSuccess(existingReview ? 'Review updated successfully!' : 'Thank you for your feedback!');
      onClose();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (r) => {
    const texts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[r] || 'Select a rating';
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>{existingReview ? 'Update Your Review' : 'Rate This App'}</h2>
          <button className="review-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <div className="review-loading">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form">
            <div className="rating-section">
              <p className="rating-label">How would you rate your experience?</p>
              <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
              <p className="rating-text">{getRatingText(hoverRating || rating)}</p>
            </div>

            <div className="comment-section">
              <label htmlFor="review-comment">Share your thoughts</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What do you like or dislike about the app? Any suggestions for improvement?"
                rows="4"
                maxLength="500"
              />
              <span className="char-count">{comment.length}/500</span>
            </div>

            <div className="review-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit-review"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppReview;
