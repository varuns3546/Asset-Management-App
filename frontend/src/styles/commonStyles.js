import { StyleSheet } from 'react-native';

const commonStyles = StyleSheet.create({
  // Colors
  colors: {
    primary: '#007AFF',
    secondary: '#FF6B6B',
    warning: '#FF9500',
    success: '#34C759',
    error: '#FF3B30',
    background: '#F2F2F7',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      light: '#F2F2F7',
      medium: '#C7C7CC',
      dark: '#8E8E93',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      light: '#999999',
    }
  },

  // Typography
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333333',
    },
    h2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333333',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333333',
    },
    body: {
      fontSize: 16,
      color: '#333333',
    },
    caption: {
      fontSize: 14,
      color: '#666666',
    },
    small: {
      fontSize: 12,
      color: '#999999',
    }
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 25,
  },

  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    }
  },

  // Common components
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  button: {
    primary: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondary: {
      backgroundColor: '#F2F2F7',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    danger: {
      backgroundColor: '#FF3B30',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    }
  },

  buttonText: {
    primary: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondary: {
      color: '#666666',
      fontSize: 16,
      fontWeight: '600',
    },
    danger: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    }
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },

  modal: {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: '#333333',
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: 5,
    },
  }
});

export default commonStyles; 