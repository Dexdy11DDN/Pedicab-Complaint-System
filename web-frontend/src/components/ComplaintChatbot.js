import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { BARANGAYS } from '../utils/locations';
import './ComplaintChatbot.css';

const CATEGORIES = [
  { value: 'overcharging', label: 'Overcharging' },
  { value: 'rude_behavior', label: 'Rude Behavior' },
  { value: 'reckless_driving', label: 'Reckless Driving' },
  { value: 'refusal_of_service', label: 'Refusal of Service' },
  { value: 'vehicle_condition', label: 'Vehicle Condition' },
  { value: 'sexual_harassment', label: 'Sexual Harassment' },
  { value: 'other', label: 'Other' }
];

const STEPS = {
  WELCOME: 'welcome',
  FRANCHISE: 'franchise',
  CATEGORY: 'category',
  DATE: 'date',
  LOCATION: 'location',
  DESCRIPTION: 'description',
  CONFIRM: 'confirm',
  DONE: 'done'
};

const ComplaintChatbot = ({ isOpen, onClose, onSubmitComplaint }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    franchiseNumber: '',
    category: '',
    incidentDate: '',
    location: '',
    description: ''
  });
  const [filteredLocations, setFilteredLocations] = useState([]);
  const messagesEndRef = useRef(null);
  const formDataRef = useRef(formData);

  // Keep ref in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage("Hi! I'm here to help you file a complaint. Would you like to start?", [
        { label: 'Yes, let\'s start', action: () => goToStep(STEPS.FRANCHISE) },
        { label: 'No, maybe later', action: onClose }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, messages.length]);

  const addBotMessage = (text, options = null) => {
    setMessages(prev => [...prev, { type: 'bot', text, options }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
  };

  const goToStep = (step, data = null) => {
    setCurrentStep(step);
    setInputValue('');
    setFilteredLocations([]);

    switch (step) {
      case STEPS.FRANCHISE:
        addBotMessage("What is the 4-digit franchise number of the pedicab? (e.g., 1234)");
        break;
      case STEPS.CATEGORY:
        addBotMessage("What type of complaint would you like to file?",
          CATEGORIES.map(cat => ({
            label: cat.label,
            action: () => handleCategorySelect(cat.value, cat.label)
          }))
        );
        break;
      case STEPS.DATE:
        addBotMessage("When did the incident happen? Please select a date.");
        break;
      case STEPS.LOCATION:
        addBotMessage("Where did the incident occur? Start typing the barangay name.");
        break;
      case STEPS.DESCRIPTION:
        addBotMessage("Please describe what happened in detail. The more information you provide, the better we can investigate.");
        break;
      case STEPS.CONFIRM:
        // Use passed data or ref for latest values
        const currentData = data || formDataRef.current;
        const categoryLabel = CATEGORIES.find(c => c.value === currentData.category)?.label;
        addBotMessage(
          `Great! Here's a summary of your complaint:\n\n` +
          `Franchise #: ${currentData.franchiseNumber}\n` +
          `Category: ${categoryLabel}\n` +
          `Date: ${currentData.incidentDate}\n` +
          `Location: ${currentData.location}\n` +
          `Description: ${currentData.description}\n\n` +
          `Is this correct?`,
          [
            { label: 'Yes, submit complaint', action: handleSubmit },
            { label: 'No, start over', action: handleReset }
          ]
        );
        break;
      case STEPS.DONE:
        addBotMessage("Your complaint has been submitted successfully! You can track its status in the 'My Complaints' section.", [
          { label: 'File another complaint', action: handleReset },
          { label: 'Close', action: onClose }
        ]);
        break;
      default:
        break;
    }
  };

  const handleFranchiseSubmit = () => {
    const value = inputValue.trim();
    if (!/^\d{4}$/.test(value)) {
      addBotMessage("Please enter exactly 4 digits for the franchise number.");
      return;
    }
    addUserMessage(value);
    setFormData(prev => ({ ...prev, franchiseNumber: value }));
    goToStep(STEPS.CATEGORY);
  };

  const handleCategorySelect = (value, label) => {
    addUserMessage(label);
    setFormData(prev => ({ ...prev, category: value }));
    goToStep(STEPS.DATE);
  };

  const handleDateSubmit = (dateValue) => {
    if (!dateValue) {
      addBotMessage("Please select a valid date.");
      return;
    }
    const formattedDate = new Date(dateValue).toLocaleDateString();
    addUserMessage(formattedDate);
    setFormData(prev => ({ ...prev, incidentDate: dateValue }));
    goToStep(STEPS.LOCATION);
  };

  const handleLocationSelect = (location) => {
    addUserMessage(location);
    setFormData(prev => ({ ...prev, location }));
    setFilteredLocations([]);
    setInputValue('');
    goToStep(STEPS.DESCRIPTION);
  };

  const handleLocationInput = (value) => {
    setInputValue(value);
    if (value.length > 0) {
      const matches = BARANGAYS.filter(b =>
        b.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(matches);
    } else {
      setFilteredLocations(BARANGAYS);
    }
  };

  const handleLocationSubmit = () => {
    const value = inputValue.trim();
    // Check if the entered value matches a barangay (case-insensitive)
    const matchedBarangay = BARANGAYS.find(b =>
      b.toLowerCase() === value.toLowerCase()
    );

    if (matchedBarangay) {
      handleLocationSelect(matchedBarangay);
    } else if (filteredLocations.length === 1) {
      // If only one match, auto-select it
      handleLocationSelect(filteredLocations[0]);
    } else if (filteredLocations.length > 1) {
      addBotMessage("Please select a barangay from the list or type a more specific name.");
    } else {
      addBotMessage("That location wasn't found. Please select from the available barangays.");
      setFilteredLocations(BARANGAYS);
    }
  };

  const handleDescriptionSubmit = () => {
    const value = inputValue.trim();
    if (value.length < 10) {
      addBotMessage("Please provide more details about the incident (at least 10 characters).");
      return;
    }
    addUserMessage(value);
    const updatedFormData = { ...formDataRef.current, description: value };
    setFormData(updatedFormData);
    formDataRef.current = updatedFormData;
    goToStep(STEPS.CONFIRM, updatedFormData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Use ref to get the latest formData
      await onSubmitComplaint(formDataRef.current);
      goToStep(STEPS.DONE);
    } catch (error) {
      addBotMessage("Sorry, there was an error submitting your complaint. Please try again.", [
        { label: 'Try again', action: handleSubmit },
        { label: 'Start over', action: handleReset }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      franchiseNumber: '',
      category: '',
      incidentDate: '',
      location: '',
      description: ''
    });
    setMessages([]);
    setCurrentStep(STEPS.WELCOME);
    setInputValue('');
    setFilteredLocations([]);
    addBotMessage("Hi! I'm here to help you file a complaint. Would you like to start?", [
      { label: 'Yes, let\'s start', action: () => goToStep(STEPS.FRANCHISE) },
      { label: 'No, maybe later', action: onClose }
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  const handleInputSubmit = () => {
    switch (currentStep) {
      case STEPS.FRANCHISE:
        handleFranchiseSubmit();
        break;
      case STEPS.LOCATION:
        handleLocationSubmit();
        break;
      case STEPS.DESCRIPTION:
        handleDescriptionSubmit();
        break;
      default:
        break;
    }
  };

  const renderInput = () => {
    switch (currentStep) {
      case STEPS.FRANCHISE:
        return (
          <div className="chatbot-input-area">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyPress={handleKeyPress}
              placeholder="Enter 4-digit franchise number..."
              maxLength="4"
              autoFocus
            />
            <button onClick={handleInputSubmit} disabled={inputValue.length !== 4}>
              <FaPaperPlane />
            </button>
          </div>
        );

      case STEPS.DATE:
        return (
          <div className="chatbot-input-area">
            <input
              type="date"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              autoFocus
            />
            <button onClick={() => handleDateSubmit(inputValue)} disabled={!inputValue}>
              <FaPaperPlane />
            </button>
          </div>
        );

      case STEPS.LOCATION:
        return (
          <div className="chatbot-input-area chatbot-location-input">
            <div className="location-input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => {
                  if (inputValue.length === 0) {
                    setFilteredLocations(BARANGAYS);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder="Start typing barangay name..."
                autoFocus
              />
              {filteredLocations.length > 0 && (
                <div className="location-suggestions">
                  {filteredLocations.map((loc, idx) => (
                    <div
                      key={idx}
                      className="location-suggestion-item"
                      onClick={() => handleLocationSelect(loc)}
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleLocationSubmit} disabled={!inputValue.trim()}>
              <FaPaperPlane />
            </button>
          </div>
        );

      case STEPS.DESCRIPTION:
        return (
          <div className="chatbot-input-area chatbot-textarea-area">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what happened..."
              rows="3"
              autoFocus
            />
            <button onClick={handleInputSubmit} disabled={inputValue.trim().length < 10}>
              <FaPaperPlane />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-window">
      <div className="chatbot-header">
        <span>Complaint Assistant</span>
        <button className="chatbot-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatbot-message ${msg.type}`}>
            <div className="message-content">
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </div>
            {msg.options && (
              <div className="message-options">
                {msg.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    className="option-button"
                    onClick={opt.action}
                    disabled={isSubmitting}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isSubmitting && (
          <div className="chatbot-message bot">
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {renderInput()}
    </div>
  );
};

export default ComplaintChatbot;
