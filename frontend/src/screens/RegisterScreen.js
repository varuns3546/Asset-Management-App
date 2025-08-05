import React, { useState, useEffect } from 'react'
import {useSelector, useDispatch} from 'react-redux'
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
import {register, reset} from '../features/auth/authSlice'
import Spinner from '../components/Spinner'
import { screenStyles } from '../styles'

const RegisterScreen = ({navigation}) => {
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '',
        confirmPassword: '', 
        orgPassword: ''
      })
    
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const{firstName, lastName, email, 
        password, confirmPassword, orgPassword} = formData
    const dispatch = useDispatch()

    const {user, isLoading, isError, isSuccess, message} = useSelector(
        (state) => state.auth)

    useEffect(() => {
        if(isError){
           console.log('error', message) 
        }
        if(isSuccess || user){
            navigation.navigate('MainTabs')
        }
    }, [user, isError, isSuccess, message, dispatch])

    
    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const onSubmit = () => {
        if(formData.password!==formData.confirmPassword)
        {
            console.log('Passwords dont match')
        }else{
            const userData = {
                firstName,
                lastName,
                email,
                password,
                confirmPassword,
                orgPassword
            }

            dispatch(register(userData))
        }
    }
    if (isLoading){
        return <Spinner/>
    }
    return (
    <KeyboardAvoidingView 
        style={screenStyles.registerScreen.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <ScrollView contentContainerStyle={screenStyles.registerScreen.scrollContent}>
        <View style={screenStyles.registerScreen.heading}>
            <View style={screenStyles.registerScreen.titleContainer}>
            <Text style={screenStyles.registerScreen.title}>Register</Text>
            </View>
            <Text style={screenStyles.registerScreen.subtitle}>Create an account</Text>
        </View>

        <View style={screenStyles.registerScreen.form} data-testid="registration-form">
            <View style={screenStyles.registerScreen.formGroup}>
            <TextInput
                style={screenStyles.registerScreen.input}
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                autoCapitalize="words"
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                importantForAutofill="no"
                name="reg_first_name"
            />
            </View>
            <View style={screenStyles.registerScreen.formGroup}>
            <TextInput
                style={screenStyles.registerScreen.input}
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                autoCapitalize="words"
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                importantForAutofill="no"
                name="reg_last_name"
            />
            </View>
            <View style={screenStyles.registerScreen.formGroup}>
            <TextInput
                style={screenStyles.registerScreen.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                autoComplete="email"
                name="reg_email"
            />
            </View>
            <View style={screenStyles.registerScreen.formGroup}>
            <View style={screenStyles.registerScreen.inputContainer}>
                <TextInput
                    style={screenStyles.registerScreen.input}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="password"
                    autoComplete="password"
                    name="reg_password"
                />
                <TouchableOpacity 
                    style={screenStyles.registerScreen.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Text 
                        style={screenStyles.registerScreen.eyeIconText}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </Text>
                </TouchableOpacity>
            </View>
            </View>
            <View style={screenStyles.registerScreen.formGroup}>
            <View style={screenStyles.registerScreen.inputContainer}>
                <TextInput
                    style={screenStyles.registerScreen.input}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    textContentType="password"
                    autoComplete="password"
                    name="reg_confirm_password"
                />
                <TouchableOpacity 
                    style={screenStyles.registerScreen.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <Text 
                        style={screenStyles.registerScreen.eyeIconText}
                    >
                        {showConfirmPassword ? "🙈" : "👁️"}
                    </Text>
                </TouchableOpacity>
            </View>
            </View>
            <TouchableOpacity style={screenStyles.registerScreen.button} onPress={onSubmit}>
            <Text style={screenStyles.registerScreen.buttonText}>Submit</Text>
            </TouchableOpacity>
            <View style={screenStyles.registerScreen.footer}>
                <Text style={screenStyles.registerScreen.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={screenStyles.registerScreen.linkText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        </View>
        </ScrollView>
    </KeyboardAvoidingView>
    )
}

export default RegisterScreen;