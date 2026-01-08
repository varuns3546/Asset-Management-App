import { useState, useEffect } from 'react'
import {useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/auth/PasswordInput'
import { login, reset } from '../features/auth/authSlice'
import '../styles/auth.css'


const LoginScreen = () => {

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
      })

    const { email, password } = formData

    // Basic validation for button enable/disable
    const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const isPasswordValid = password && password.length >= 6
    const isFormValid = isEmailValid && isPasswordValid


    useEffect(() => {
        // Error handling is done via UI display

        if (isSuccess || user) {
            navigate('/home')
        }
    }, [user, isSuccess, dispatch, navigate])

    // Only reset on successful login or when component unmounts
    useEffect(() => {
        if (isSuccess) {
            dispatch(reset())
        }
    }, [isSuccess, dispatch])
    
    const updateField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const onSubmit = (e) => {
        e.preventDefault()
        dispatch(login(formData))
    }
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                {isError && (
                    <div className="auth-error">
                        {message || 'Invalid credentials'}
                    </div>
                )}

                <form className="auth-form" onSubmit={onSubmit} noValidate>
                    <div className="auth-form-group">
                        <input 
                            type="email" 
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="auth-input"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <PasswordInput
                            value={password}
                            onChange={(e) => updateField('password', e.target.value)}
                            placeholder="Password"
                            disabled={isLoading}
                            className="auth-input"
                        />
                        <div className="password-requirements">
                            <small>Password must be at least 6 characters</small>
                        </div>
                    </div>

                    <div className="button-container">
                        <button
                            type="submit"
                            className={`auth-submit-button ${!isFormValid ? 'disabled' : ''}`}
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                        
                        {!isFormValid && !isLoading && (
                            <div className="button-tooltip">
                                {(() => {
                                    const issues = []
                                    if (!isEmailValid) issues.push('valid email')
                                    if (!isPasswordValid) issues.push('password (6+ characters)')
                                    return issues.length > 0 ? `Please enter: ${issues.join(' and ')}` : ''
                                })()}
                            </div>
                        )}
                    </div>
                </form>

                {isLoading && (
                    <div className="auth-loading">
                        <Spinner />
                    </div>
                )}

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Don't have an account? <a href="/register" className="auth-link">Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginScreen;