import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { appReviewsAPI } from '../services/api';

const AppReviewModal = ({ visible, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadExistingReview();
    }
  }, [visible]);

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
      console.log('No existing review found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'Please provide a comment (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      await appReviewsAPI.submitReview({ rating, comment: comment.trim() });
      Alert.alert('Success', existingReview ? 'Review updated successfully!' : 'Thank you for your feedback!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[styles.starIcon, { color: star <= rating ? '#FFD700' : '#E0E0E0' }]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{existingReview ? 'Update Review' : 'Rate This App'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#ff8c42" style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>How would you rate your experience?</Text>
              {renderStars()}

              <Text style={styles.label}>Share your thoughts</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                placeholder="What do you like or dislike? Any suggestions?"
                maxLength={500}
              />
              <Text style={styles.charCount}>{comment.length}/500</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton, rating === 0 && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={isSubmitting || rating === 0}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting ? 'Submitting...' : existingReview ? 'Update' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 15
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold'
  },
  form: {
    marginTop: 10
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center'
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  starIcon: {
    fontSize: 40,
    marginHorizontal: 5
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  charCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 20
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#9e9e9e'
  },
  submitButton: {
    backgroundColor: '#ff8c42'
  },
  disabledButton: {
    opacity: 0.6
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default AppReviewModal;
