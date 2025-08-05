import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import {useSelector, useDispatch} from 'react-redux'
import { login, reset } from '../features/auth/authSlice'
import Spinner from '../components/Spinner'
import { screenStyles, componentStyles } from '../styles'

const LoginScreen = ({navigation}) => {
    const [formData, setFormData] = useState({
        email: '', 
        password: '',
      })
    
    const [showPassword, setShowPassword] = useState(false)

    const { email, password } = formData
    const dispatch = useDispatch()

     const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth)

    useEffect(() => {
        if (isError) {
            console.log('error', message)
        }

        if (isSuccess || user) {
            navigation.navigate('MainTabs')
        }

        dispatch(reset())
    }, [user, isError, isSuccess, message, dispatch])
    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const onSubmit = (e) => {

        const userData = {
        email,
        password,
        }
        console.log('Submit pressed')
        dispatch(login(userData))
    }
    if(isLoading){
        return <Spinner/>
    }
    return (
    <KeyboardAvoidingView 
        style={screenStyles.loginScreen.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <ScrollView contentContainerStyle={screenStyles.loginScreen.scrollContent}>
        <View style={screenStyles.loginScreen.heading}>
            <View style={screenStyles.loginScreen.titleContainer}>
                <Text style={screenStyles.loginScreen.title}>Login</Text>
            </View>
        </View>

        <View style={screenStyles.loginScreen.form}>

            <View style={screenStyles.loginScreen.formGroup}>
                <TextInput
                    style={screenStyles.loginScreen.input}
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    autoComplete="email"
                />
            </View>
            <View style={screenStyles.loginScreen.formGroup}>
                <View style={screenStyles.loginScreen.inputContainer}>
                    <TextInput
                        style={screenStyles.loginScreen.input}
                        placeholder="Password"
                        value={formData.password}
                        onChangeText={(value) => updateField('password', value)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        textContentType="password"
                        autoComplete="password"
                    />
                    <TouchableOpacity 
                        style={screenStyles.loginScreen.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Text 
                            style={screenStyles.loginScreen.eyeIconText}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={screenStyles.loginScreen.button} onPress={onSubmit}>
            <Text style={screenStyles.loginScreen.buttonText}>Submit</Text>
            </TouchableOpacity>
            <View style={screenStyles.loginScreen.footer}>
                <Text style={screenStyles.loginScreen.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={screenStyles.loginScreen.linkText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
        </ScrollView>
    </KeyboardAvoidingView>
    )
}

export default LoginScreen;