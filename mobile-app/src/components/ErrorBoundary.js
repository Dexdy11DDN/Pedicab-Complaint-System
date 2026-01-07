import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';

/**
 * ErrorBoundary - A robust error handling component that catches JavaScript errors
 * anywhere in the child component tree and displays a fallback UI.
 * 
 * Features:
 * - Catches and displays errors gracefully
 * - Provides retry functionality
 * - Shows troubleshooting steps for common issues
 * - Auto-recovery for network-related errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error for debugging (could be sent to a logging service)
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    // In production, you would send this to an error tracking service
    console.log('=== ERROR LOG ===');
    console.log('Error:', error?.message || error);
    console.log('Stack:', error?.stack);
    console.log('Component Stack:', errorInfo?.componentStack);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=================');
  };

  handleRetry = () => {
    const { retryCount, maxRetries } = this.state;
    
    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  handleRestart = () => {
    // Reset completely
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  getErrorType = () => {
    const { error } = this.state;
    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('axios')) {
      return 'network';
    }
    if (errorMessage.includes('database') || errorMessage.includes('sqlite')) {
      return 'database';
    }
    if (errorMessage.includes('auth') || errorMessage.includes('token')) {
      return 'auth';
    }
    return 'general';
  };

  getTroubleshootingSteps = () => {
    const errorType = this.getErrorType();
    
    const steps = {
      network: [
        '1. Check your internet connection',
        '2. Make sure WiFi is connected',
        '3. Verify the server is running',
        '4. Try again in a few moments',
      ],
      database: [
        '1. Close and reopen the app',
        '2. Clear app cache in settings',
        '3. Ensure sufficient storage space',
        '4. Restart your device if issues persist',
      ],
      auth: [
        '1. Try logging in again',
        '2. Check your username and password',
        '3. Contact admin if locked out',
        '4. Clear app data and try again',
      ],
      general: [
        '1. Close and reopen the app',
        '2. Check your internet connection',
        '3. Restart the app',
        '4. Contact support if the problem persists',
      ],
    };
    
    return steps[errorType] || steps.general;
  };

  render() {
    const { hasError, error, retryCount, maxRetries } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      const errorType = this.getErrorType();
      const troubleshootingSteps = this.getTroubleshootingSteps();
      const canRetry = retryCount < maxRetries;

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Error Icon */}
            <Text style={styles.errorIcon}>⚠️</Text>
            
            {/* Error Title */}
            <Text style={styles.title}>Something Went Wrong</Text>
            
            {/* Error Type Badge */}
            <View style={[styles.badge, styles[`${errorType}Badge`]]}>
              <Text style={styles.badgeText}>
                {errorType.charAt(0).toUpperCase() + errorType.slice(1)} Error
              </Text>
            </View>
            
            {/* Error Message */}
            <Text style={styles.message}>
              {error?.message || 'An unexpected error occurred'}
            </Text>
            
            {/* Troubleshooting Steps */}
            <View style={styles.troubleshootingContainer}>
              <Text style={styles.troubleshootingTitle}>Troubleshooting Steps:</Text>
              {troubleshootingSteps.map((step, index) => (
                <Text key={index} style={styles.troubleshootingStep}>{step}</Text>
              ))}
            </View>
            
            {/* Retry Count */}
            {retryCount > 0 && (
              <Text style={styles.retryCount}>
                Retry attempts: {retryCount}/{maxRetries}
              </Text>
            )}
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {canRetry && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={this.handleRetry}
                >
                  <Text style={styles.buttonText}>🔄 Try Again</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.restartButton}
                onPress={this.handleRestart}
              >
                <Text style={styles.buttonText}>🔃 Restart App</Text>
              </TouchableOpacity>
            </View>
            
            {/* Developer Info (collapsible in production) */}
            {__DEV__ && (
              <View style={styles.devInfo}>
                <Text style={styles.devTitle}>Developer Info:</Text>
                <Text style={styles.devText}>{error?.stack?.substring(0, 500)}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  networkBadge: {
    backgroundColor: '#2196f3',
  },
  databaseBadge: {
    backgroundColor: '#9c27b0',
  },
  authBadge: {
    backgroundColor: '#f44336',
  },
  generalBadge: {
    backgroundColor: '#ff9800',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  troubleshootingContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  troubleshootingStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 5,
  },
  retryCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#ff8c42',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
  },
  restartButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  devInfo: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginTop: 20,
  },
  devTitle: {
    color: '#ff8c42',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  devText: {
    color: '#aaa',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
