import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { entriesAPI } from '../services/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      console.log('Updated user:', user);
      loadEntries();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      console.log('Raw userData from storage:', userData);
      if (userData) {
        setUser(JSON.parse(userData));
        console.log('user', user)
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadEntries = async () => {
    try {
        const response = await entriesAPI.getEntries({userId: user.id})
        console.log(response)
        setEntries(response.entries);
    } catch (error) {
      console.log('Error loading entries:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `entries/${user?.id || 'anonymous'}/${fileName}`;

      const { error: uploadError } = await entriesAPI.storage
        .from('images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      const { data } = entriesAPI.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSaveEntry = async () => {
    console.log('handle save entry')
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      let image_url = null;
      
      if (selectedImage) {
        image_url = await uploadImage(selectedImage);
      }

      const response = await entriesAPI.createEntry({
        userId: user.id,
        entryData: {
            title: title,
            description: description,
            image_url: image_url
        },        
      });     
      console.log(response)
      
      setEntries([response.entry, ...entries]);

      setTitle('');
      setDescription('');
      setSelectedImage(null);

      Alert.alert('Success', 'Entry saved successfully!');
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entry_id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await entriesAPI.deleteEntry({
                user_id: user.id,
                entry_id: entry_id 
              });
              console.log('attempted delete', response);
              setEntries(entries.filter(entry => entry.id !== entry_id));
              Alert.alert('Success', 'Entry deleted successfully!');
            } catch (error) {
              console.log('Delete error:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}
                </Text>
              </View>
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* New Entry Form */}
        <View style={styles.formContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>✍️</Text>
              <Text style={styles.sectionTitle}>Create New Entry</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Share your thoughts and memories</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Entry Title</Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'title' && styles.inputWrapperFocused
            ]}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>📝</Text>
              </View>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What's your entry about?"
                placeholderTextColor="#64748b"
                autoCapitalize="sentences"
                onFocus={() => setFocusedInput('title')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[
              styles.inputWrapper,
              styles.textAreaWrapper,
              focusedInput === 'description' && styles.inputWrapperFocused
            ]}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>💭</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Share your thoughts... (optional)"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedInput('description')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Image Selection */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Add Image (Optional)</Text>
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity 
                style={styles.imageButton} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Text style={styles.imageButtonIcon}>🖼️</Text>
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.imageButton} 
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Text style={styles.imageButtonIcon}>📸</Text>
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSaveEntry}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator size="small" color="white" style={styles.buttonSpinner} />
              ) : (
                <Text style={styles.submitButtonIcon}>✨</Text>
              )}
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Entry...' : 'Create Entry'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        <View style={styles.entriesContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>📚</Text>
              <Text style={styles.sectionTitle}>Your Journal</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {entries.length === 0 ? 'No entries yet' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
            </Text>
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🌟</Text>
              <Text style={styles.emptyStateText}>Start Your Journey!</Text>
              <Text style={styles.emptyStateSubtext}>Create your first entry to begin documenting your experiences</Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {entries.map((entry, index) => (
                <View key={entry.id || index} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryHeaderLeft}>
                      <Text style={styles.entryTitle}>{entry.title}</Text>
                      <View style={styles.entryMeta}>
                        <Text style={styles.entryDate}>
                          {formatDate(entry.created_at)}
                        </Text>
                        <Text style={styles.entryTime}>
                          {new Date(entry.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteEntry(entry.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {entry.description && (
                    <Text style={styles.entryDescription} numberOfLines={3}>
                      {entry.description}
                    </Text>
                  )}
                  
                  {entry.image_url && (
                    <View style={styles.entryImageContainer}>
                      <Image 
                        source={{ uri: entry.image_url }} 
                        style={styles.entryImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
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
  },
  inputWrapperFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: 16,
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
    height: 56,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    paddingRight: 20,
  },
  textArea: {
    height: 100,
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginBottom: 24,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageButton: {
    flex: 0.48,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  imageButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedImageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
  buttonSpinner: {
    marginRight: 8,
  },
  submitButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  entriesContainer: {
    marginHorizontal: 24,
    marginTop: 0,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 48,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  entriesList: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  entryHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginRight: 8,
  },
  entryTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  entryDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  entryImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  entryImage: {
    width: '100%',
    height: 200,
  },
});

export default DashboardScreen;