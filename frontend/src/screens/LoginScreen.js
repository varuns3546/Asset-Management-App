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


    useEffect(() => {
        if (isError) {
            console.log('error', message)
        }

        if (isSuccess || user) {
            navigate('/home')
        }

        dispatch(reset())
    }, [user, isError, isSuccess, message, dispatch, navigate])
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
                        {message || 'Login failed. Please try again.'}
                    </div>
                )}

                <form className="auth-form" onSubmit={onSubmit}>
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

                    <button 
                        type="submit" 
                        className="auth-submit-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
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