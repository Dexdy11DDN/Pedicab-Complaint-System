import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { complaintsAPI } from '../services/api';
import { BARANGAYS } from '../utils/locations';

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

const ComplaintChatbotModal = ({ visible, onClose, onRefreshData }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [formData, setFormData] = useState({
    franchiseNumber: '',
    category: '',
    incidentDate: '',
    location: '',
    description: ''
  });
  const scrollViewRef = useRef();

  // Reset or initialize chatbot when opened
  useEffect(() => {
    if (visible && messages.length === 0) {
      addBotMessage("Hi! I'm here to help you file a complaint. Would you like to start?", [
        { label: "Yes, let's start", action: () => goToStep(STEPS.FRANCHISE) },
        { label: "No, maybe later", action: onClose }
      ]);
    }
  }, [visible]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, filteredLocations]);

  const addBotMessage = (text, options = null) => {
    setMessages(prev => [...prev, { type: 'bot', text, options }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
  };

  const goToStep = (step, currentData = formData) => {
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
        addBotMessage("When did the incident happen? (e.g., YYYY-MM-DD or today)");
        break;
      case STEPS.LOCATION:
        addBotMessage("Where did the incident occur? Start typing the barangay name.");
        break;
      case STEPS.DESCRIPTION:
        addBotMessage("Please describe what happened in detail. The more information you provide, the better we can investigate.");
        break;
      case STEPS.CONFIRM:
        const categoryLabel = CATEGORIES.find(c => c.value === currentData.category)?.label;
        addBotMessage(
          `Great! Here's a summary of your complaint:\n\n` +
          `Franchise #: ${currentData.franchiseNumber}\nCategory: ${categoryLabel}\nDate: ${currentData.incidentDate}\nLocation: ${currentData.location}\nDescription: ${currentData.description}\n\nIs this correct?`,
          [
            { label: 'Yes, submit complaint', action: () => handleSubmit(currentData) },
            { label: 'No, start over', action: handleReset }
          ]
        );
        break;
      case STEPS.DONE:
        addBotMessage("Your complaint has been submitted successfully! You can track its status in the 'My Complaints' section.", [
          { label: 'File another complaint', action: handleReset },
          { label: 'Close Assistant', action: () => { handleReset(); onClose(); } }
        ]);
        break;
      default:
        break;
    }
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;

    switch (currentStep) {
      case STEPS.FRANCHISE:
        const franchise = inputValue.trim();
        if (!/^\d{4}$/.test(franchise)) {
          addBotMessage("Please enter exactly 4 digits for the franchise number.");
          return;
        }
        addUserMessage(franchise);
        setFormData(prev => ({ ...prev, franchiseNumber: franchise }));
        goToStep(STEPS.CATEGORY);
        break;
      case STEPS.DATE:
        // Simple date parsing for mobile text input
        let dateVal = inputValue.trim();
        if (dateVal.toLowerCase() === 'today') {
          dateVal = new Date().toISOString().split('T')[0];
        }
        addUserMessage(dateVal);
        setFormData(prev => ({ ...prev, incidentDate: dateVal }));
        goToStep(STEPS.LOCATION);
        break;
      case STEPS.LOCATION:
        const loc = inputValue.trim();
        const matched = BARANGAYS.find(b => b.toLowerCase() === loc.toLowerCase());
        if (matched) {
          handleLocationSelect(matched);
        } else if (filteredLocations.length === 1) {
          handleLocationSelect(filteredLocations[0]);
        } else if (filteredLocations.length > 1) {
          addBotMessage("Please select a barangay from the list or type a more specific name.");
        } else {
          addBotMessage("That location wasn't found. Please type a valid barangay.");
          setFilteredLocations(BARANGAYS);
        }
        break;
      case STEPS.DESCRIPTION:
        const desc = inputValue.trim();
        if (desc.length < 10) {
          addBotMessage("Please provide more details about the incident (at least 10 characters).");
          return;
        }
        addUserMessage(desc);
        const updatedData = { ...formData, description: desc };
        setFormData(updatedData);
        goToStep(STEPS.CONFIRM, updatedData);
        break;
      default:
        break;
    }
  };

  const handleCategorySelect = (value, label) => {
    addUserMessage(label);
    setFormData(prev => ({ ...prev, category: value }));
    goToStep(STEPS.DATE);
  };

  const handleLocationSelect = (location) => {
    addUserMessage(location);
    setFormData(prev => ({ ...prev, location }));
    setFilteredLocations([]);
    setInputValue('');
    goToStep(STEPS.DESCRIPTION);
  };

  const handleLocationInput = (text) => {
    setInputValue(text);
    if (text.length > 0) {
      const matches = BARANGAYS.filter(b => b.toLowerCase().includes(text.toLowerCase()));
      setFilteredLocations(matches);
    } else {
      setFilteredLocations([]);
    }
  };

  const handleSubmit = async (finalData) => {
    setIsSubmitting(true);
    try {
      await complaintsAPI.create(finalData);
      if (onRefreshData) onRefreshData();
      goToStep(STEPS.DONE);
    } catch (error) {
      addBotMessage("Sorry, there was an error submitting your complaint. Please try again.", [
        { label: 'Try again', action: () => handleSubmit(finalData) },
        { label: 'Start over', action: handleReset }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ franchiseNumber: '', category: '', incidentDate: '', location: '', description: '' });
    setMessages([]);
    setCurrentStep(STEPS.WELCOME);
    setInputValue('');
    setFilteredLocations([]);
    addBotMessage("Hi! I'm here to help you file a complaint. Would you like to start?", [
      { label: "Yes, let's start", action: () => goToStep(STEPS.FRANCHISE) },
      { label: "No, maybe later", action: onClose }
    ]);
  };

  const renderInputArea = () => {
    if (currentStep === STEPS.WELCOME || currentStep === STEPS.CATEGORY || currentStep === STEPS.CONFIRM || currentStep === STEPS.DONE) {
      return null;
    }

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={currentStep === STEPS.LOCATION ? handleLocationInput : setInputValue}
          placeholder={currentStep === STEPS.DESCRIPTION ? "Type your description..." : "Type here..."}
          placeholderTextColor="#999"
          multiline={currentStep === STEPS.DESCRIPTION}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleInputSubmit} disabled={isSubmitting}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complaint Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollViewRef} style={styles.chatArea} contentContainerStyle={{ padding: 15 }}>
          {messages.map((msg, idx) => (
            <View key={idx} style={msg.type === 'bot' ? styles.botMessageBubble : styles.userMessageBubble}>
              <Text style={msg.type === 'bot' ? styles.botMessageText : styles.userMessageText}>{msg.text}</Text>
              
              {msg.options && (
                <View style={styles.optionsContainer}>
                  {msg.options.map((opt, i) => (
                    <TouchableOpacity key={i} style={styles.optionButton} onPress={opt.action} disabled={isSubmitting}>
                      <Text style={styles.optionText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          {isSubmitting && (
            <View style={styles.botMessageBubble}>
              <ActivityIndicator color="#ff8c42" size="small" />
            </View>
          )}

          {currentStep === STEPS.LOCATION && filteredLocations.length > 0 && (
            <View style={styles.suggestionsContainer}>
               {filteredLocations.slice(0, 5).map((loc, i) => (
                 <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => handleLocationSelect(loc)}>
                   <Text style={styles.suggestionText}>{loc}</Text>
                 </TouchableOpacity>
               ))}
            </View>
          )}
        </ScrollView>

        {renderInputArea()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  header: {
    backgroundColor: '#ff8c42',
    padding: 15,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  closeIcon: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  chatArea: { flex: 1 },
  botMessageBubble: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  userMessageBubble: {
    backgroundColor: '#ff8c42',
    padding: 12,
    borderRadius: 15,
    borderBottomRightRadius: 0,
    maxWidth: '85%',
    alignSelf: 'flex-end',
    marginBottom: 15
  },
  botMessageText: { color: '#333', fontSize: 16, lineHeight: 22 },
  userMessageText: { color: 'white', fontSize: 16, lineHeight: 22 },
  optionsContainer: { marginTop: 10, gap: 8 },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  optionText: { color: '#ff8c42', fontWeight: 'bold', textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#333'
  },
  sendButton: {
    backgroundColor: '#ff8c42',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  sendIcon: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: -5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  suggestionText: { fontSize: 16, color: '#333' }
});

export default ComplaintChatbotModal;
