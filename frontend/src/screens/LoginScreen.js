
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({
        username: username,
        password: password,        
      }); 
      console.log('response', response)    
      console.log('response.user in loginscreen',response.user);
            
      if (response.success) {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        console.log('success')
        Alert.alert('Success', 'Login successful!');
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.log('login error:', error);
      Alert.alert('Login Error', error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>📱</Text>
              </View>
              <Text style={styles.companyName}>SecureApp</Text>
              <Text style={styles.tagline}>Professional. Secure. Reliable.</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to access your account</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'username' && styles.inputWrapperFocused
                ]}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>👤</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('username')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'password' && styles.inputWrapperFocused
                ]}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                {loading && <Text style={styles.loadingSpinner}>⏳</Text>}
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.securityNote}>
              <Text style={styles.securityText}>🔐 Your data is encrypted and secure</Text>
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
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  headerSection: {
    paddingTop: 80,
    paddingHorizontal: 32,
    paddingBottom: 50,
    alignItems: 'center',
    flex: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1.2,
    marginBottom: 8,
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
    paddingTop: 44,
    paddingBottom: 44,
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
    marginBottom: 44,
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
  inputSection: {
    marginBottom: 44,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
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
    transition: 'all 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    paddingLeft: 20,
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: 60,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    paddingRight: 20,
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  eyeText: {
    fontSize: 20,
  },
  loginButton: {
    height: 60,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
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
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen;