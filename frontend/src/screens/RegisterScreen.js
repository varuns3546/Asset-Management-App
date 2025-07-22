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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

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

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}

      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>C</Text>
              </View>
              <Text style={styles.companyName}>ConsultPro</Text>
            </View>
            <Text style={styles.tagline}>Join Our Professional Network</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Fill in your details to get started</Text>
            </View>

            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.inputSection}>
              {/* Name Row */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.firstName}
                      onChangeText={(value) => updateField('firstName', value)}
                      placeholder="John"
                      placeholderTextColor="#8E8E93"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.lastName}
                      onChangeText={(value) => updateField('lastName', value)}
                      placeholder="Doe"
                      placeholderTextColor="#8E8E93"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    placeholder="john.doe@company.com"
                    placeholderTextColor="#8E8E93"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={formData.username}
                    onChangeText={(value) => updateField('username', value)}
                    placeholder="johndoe"
                    placeholderTextColor="#8E8E93"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
              
              {/* Organization Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization Code</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={formData.orgPassword}
                    onChangeText={(value) => updateField('orgPassword', value)}
                    placeholder="Organization access code"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry={!showPasswords.orgPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('orgPassword')}
                  >
                    <Text style={styles.eyeText}>
                      {showPasswords.orgPassword ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry={!showPasswords.password}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('password')}
                  >
                    <Text style={styles.eyeText}>
                      {showPasswords.password ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry={!showPasswords.confirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('confirmPassword')}
                  >
                    <Text style={styles.eyeText}>
                      {showPasswords.confirmPassword ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContainer: {
    flex: 1,
    minHeight: '100%',
    paddingBottom: 20, 
    height: '100vh'
    // Add bottom padding to prevent cutoff
  },
  headerSection: {
    paddingTop: 40, // Reduced from 50
    paddingHorizontal: 30,
    paddingBottom: 25, // Reduced from 30
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
  },
  logoIcon: {
    width: 60, // Reduced from 70
    height: 60, // Reduced from 70
    borderRadius: 30, // Reduced from 35
    backgroundColor: '#4c6ef5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Reduced from 12
    shadowColor: '#4c6ef5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 28, // Reduced from 32
    fontWeight: '700',
    color: 'white',
  },
  companyName: {
    fontSize: 22, // Reduced from 24
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14, // Reduced from 16
    color: '#a8a8b3',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 30, // Reduced from 35
    paddingBottom: 40, // Increased from 30 to ensure content isn't cut off
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 600, // Ensure minimum height
  },
  formHeader: {
    marginBottom: 25, // Reduced from 35
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Reduced from 28
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 6, // Reduced from 8
  },
  subtitle: {
    fontSize: 14, // Reduced from 16
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20, // Reduced from 24
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#feb2b2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20, // Reduced from 24
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 25, // Reduced from 32
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16, // Reduced from 20
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6, // Reduced from 8
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 48, // Reduced from 52
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  eyeText: {
    fontSize: 18,
  },
  registerButton: {
    height: 48, // Reduced from 52
    backgroundColor: '#4c6ef5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Reduced from 24
    shadowColor: '#4c6ef5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Reduced from 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10, // Add some bottom padding
  },
  footerText: {
    fontSize: 16,
    color: '#6c757d',
  },
  linkText: {
    fontSize: 16,
    color: '#4c6ef5',
    fontWeight: '600',
  },
});

export default RegisterScreen;