import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',    
    confirmPassword: '',
    orgPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
    orgPassword: false
  });
  const [focusedInput, setFocusedInput] = useState(null);

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, username, password, confirmPassword, orgPassword} = formData;
    
    if (!email || !username || !password || !firstName || !lastName || !confirmPassword || !orgPassword) {
      setErrorMessage('Please fill in all fields')
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long')
      return false;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return false;
    }

    if (username.length < 3) {
      setErrorMessage('Username must be at least 3 characters long')
      return false;
    }

    if(password!==confirmPassword) {
      setErrorMessage('Password mismatch')
      return false
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setErrorMessage('')
    setLoading(true);
    try {
      const response = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        orgPassword: formData.orgPassword,
        is_prime_consultant: false
      });
      
      if (response.success) {
        // Store token and user data
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        Alert.alert('Success', 'Account created successfully!');
        // Navigate to main app or dashboard
        // navigation.navigate('Dashboard');
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
      console.log('error message in register screen', error.message)
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (field, placeholder, icon, options = {}) => {
    const isPassword = ['password', 'confirmPassword', 'orgPassword'].includes(field);
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{options.label || field.charAt(0).toUpperCase() + field.slice(1)}</Text>
        <View style={[
          styles.inputWrapper,
          focusedInput === field && styles.inputWrapperFocused,
          errorMessage && !formData[field] && styles.inputWrapperError
        ]}>
          <View style={styles.inputIcon}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
          <TextInput
            style={[styles.input, isPassword && styles.passwordInput]}
            value={formData[field]}
            onChangeText={(value) => updateField(field, value)}
            placeholder={placeholder}
            placeholderTextColor="#64748b"
            secureTextEntry={isPassword && !showPasswords[field]}
            onFocus={() => setFocusedInput(field)}
            onBlur={() => setFocusedInput(null)}
            {...options.textInputProps}
          />
          {isPassword && (
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => togglePasswordVisibility(field)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>{showPasswords[field] ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={false}
          nestedScrollEnabled={true}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>🚀</Text>
              </View>
              <Text style={styles.companyName}>Join SecureApp</Text>
              <Text style={styles.tagline}>Start your professional journey</Text>
            </View>
          </View>
        
          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Fill in your details to get started</Text>
            </View>

            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.inputSection}>
              {/* Name Row */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedInput === 'firstName' && styles.inputWrapperFocused,
                    errorMessage && !formData.firstName && styles.inputWrapperError
                  ]}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.iconText}>👤</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={formData.firstName}
                      onChangeText={(value) => updateField('firstName', value)}
                      placeholder="John"
                      placeholderTextColor="#64748b"
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('firstName')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedInput === 'lastName' && styles.inputWrapperFocused,
                    errorMessage && !formData.lastName && styles.inputWrapperError
                  ]}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.iconText}>👤</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={formData.lastName}
                      onChangeText={(value) => updateField('lastName', value)}
                      placeholder="Doe"
                      placeholderTextColor="#64748b"
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('lastName')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              {renderInputField('email', 'john.doe@company.com', '📧', {
                label: 'Email Address',
                textInputProps: {
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  autoCorrect: false,
                }
              })}

              {/* Username */}
              {renderInputField('username', 'johndoe', '🏷️', {
                textInputProps: {
                  autoCapitalize: 'none',
                  autoCorrect: false,
                }
              })}
              
              {/* Organization Password */}
              {renderInputField('orgPassword', 'Organization access code', '🏢', {
                label: 'Organization Code'
              })}
              
              {/* Password */}
              {renderInputField('password', 'Minimum 6 characters', '🔒')}

              {/* Confirm Password */}
              {renderInputField('confirmPassword', 'Re-enter your password', '🔐', {
                label: 'Confirm Password'
              })}
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                {loading && <Text style={styles.loadingSpinner}>⏳</Text>}
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.securityNote}>
              <Text style={styles.securityText}>🔐 By creating an account, you agree to our terms and privacy policy</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
    paddingBottom: 40,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inputSection: {
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    paddingRight: 16,
  },
  passwordInput: {
    paddingRight: 56,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  eyeText: {
    fontSize: 18,
  },
  registerButton: {
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
    fontSize: 16,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 20,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  linkText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '700',
  },
  securityNote: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  securityText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default RegisterScreen;