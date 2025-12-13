import { useState, useEffect } from 'react'
import { register, reset } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/auth/PasswordInput'
import '../styles/auth.css'
const RegisterScreen = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const {user, isLoading, isError, isSuccess, message} = useSelector(
        (state) => state.auth)
    useEffect(() => {
        if(isError){
           console.log('error', message) 
        }
        if(isSuccess || user){
            navigate('/home')
        }
        dispatch(reset())
    }, [user, isError, isSuccess, message, dispatch, navigate])

    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '',
        confirmPassword: '', 
        orgPassword: ''
      })
    const [passwordError, setPasswordError] = useState('')
    const{firstName, lastName, email, 
        password, confirmPassword, orgPassword} = formData
        const updateField = (field, value) => {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        };
    const onSubmit = (e) => {
        e.preventDefault()
        setPasswordError('')
        
        if(formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }
        
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
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join us to get started</p>
                </div>

                {isError && (
                    <div className="auth-error">
                        {message || 'Registration failed. Please try again.'}
                    </div>
                )}

                {passwordError && (
                    <div className="auth-error">
                        {passwordError}
                    </div>
                )}

                <form className="auth-form" onSubmit={onSubmit}>
                    <div className="auth-form-row">
                        <div className="auth-form-group">
                            <input 
                                type="text" 
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => updateField('firstName', e.target.value)}
                                className="auth-input"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="auth-form-group">
                            <input 
                                type="text" 
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => updateField('lastName', e.target.value)}
                                className="auth-input"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

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
                        />
                    </div>

                    <div className="auth-form-group">
                        <PasswordInput
                            value={confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            placeholder="Confirm Password"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="auth-form-group">
                        <input 
                            type="text" 
                            placeholder="Organization Password"
                            value={orgPassword}
                            onChange={(e) => updateField('orgPassword', e.target.value)}
                            className="auth-input"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="auth-submit-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {isLoading && (
                    <div className="auth-loading">
                        <Spinner />
                    </div>
                )}

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Already have an account? <a href="/" className="auth-link">Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterScreen