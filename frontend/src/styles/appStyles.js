import { StyleSheet } from 'react-native';
import commonStyles from './commonStyles';

const appStyles = StyleSheet.create({
  // Main app container
  app: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.background,
    },
  },

  // Navigation styles
  navigation: {
    headerStyle: {
      backgroundColor: commonStyles.colors.white,
      ...commonStyles.shadows.small,
    },
    headerTitleStyle: {
      color: commonStyles.colors.text.primary,
      fontSize: 18,
      fontWeight: '600',
    },
    headerTintColor: commonStyles.colors.primary,
    tabBarStyle: {
      backgroundColor: commonStyles.colors.white,
      borderTopWidth: 1,
      borderTopColor: commonStyles.colors.gray.light,
      ...commonStyles.shadows.medium,
    },
    tabBarActiveTintColor: commonStyles.colors.primary,
    tabBarInactiveTintColor: commonStyles.colors.text.light,
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500',
    },
  },

  // Tab navigator styles
  tabNavigator: {
    tabBarIcon: {
      width: 24,
      height: 24,
    },
    tabBarIconFocused: {
      width: 24,
      height: 24,
    },
  },

  // Stack navigator styles
  stackNavigator: {
    headerBackTitleVisible: false,
    headerStyle: {
      backgroundColor: commonStyles.colors.white,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTitleStyle: {
      color: commonStyles.colors.text.primary,
      fontSize: 18,
      fontWeight: '600',
    },
    headerTintColor: commonStyles.colors.primary,
  },

  // Loading screen styles
  loadingScreen: {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: commonStyles.colors.background,
    },
    logo: {
      fontSize: 48,
      fontWeight: 'bold',
      color: commonStyles.colors.primary,
      marginBottom: 24,
    },
    text: {
      fontSize: 16,
      color: commonStyles.colors.text.secondary,
      marginTop: 16,
    },
  },

  // Error screen styles
  errorScreen: {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: commonStyles.colors.background,
      padding: 32,
    },
    icon: {
      fontSize: 64,
      color: commonStyles.colors.error,
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: commonStyles.colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: commonStyles.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      ...commonStyles.button.primary,
    },
    buttonText: {
      ...commonStyles.buttonText.primary,
    },
  },

  // Safe area styles
  safeArea: {
    container: {
      flex: 1,
      backgroundColor: commonStyles.colors.background,
    },
  },

  // Status bar styles
  statusBar: {
    backgroundColor: commonStyles.colors.white,
    barStyle: 'dark-content',
  },
});

export default appStyles; 