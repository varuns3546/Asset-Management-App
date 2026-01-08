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
        // Error handling is done via UI display
        if(isSuccess || user){
            navigate('/home')
        }
    }, [user, isSuccess, dispatch, navigate])

    // Only reset on successful registration
    useEffect(() => {
        if (isSuccess) {
            dispatch(reset())
        }
    }, [isSuccess, dispatch])

    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '',
        confirmPassword: '', 
        orgPassword: ''
      })
    
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        orgPassword: ''
    })

    const [isFormValid, setIsFormValid] = useState(false)
    
    const{firstName, lastName, email, 
        password, confirmPassword, orgPassword} = formData
        const validateName = (name, fieldName) => {
            if (!name || !name.trim()) {
                return `${fieldName} is required`
            }
            if (name.trim().length < 2) {
                return `${fieldName} must be at least 2 characters`
            }
            if (!/^[a-zA-Z\s-']+$/.test(name)) {
                return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
            }
            return ''
        }
        
        const validateEmail = (email) => {
            if (!email || !email.trim()) {
                return 'Email is required'
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return 'Please enter a valid email address'
            }
            return ''
        }
        
        const validatePassword = (password) => {
            if (!password) {
                return 'Password is required'
            }
            if (password.length < 8) {
                return 'Password must be at least 8 characters'
            }
            if (!/[A-Z]/.test(password)) {
                return 'Password must contain at least one uppercase letter'
            }
            if (!/[a-z]/.test(password)) {
                return 'Password must contain at least one lowercase letter'
            }
            if (!/[0-9]/.test(password)) {
                return 'Password must contain at least one number'
            }
            return ''
        }
        
        const validateConfirmPassword = (password, confirmPassword) => {
            if (!confirmPassword) {
                return 'Please confirm your password'
            }
            if (password !== confirmPassword) {
                return 'Passwords do not match'
            }
            return ''
        }
        
        const validateOrgPassword = (orgPassword) => {
            if (!orgPassword || !orgPassword.trim()) {
                return 'Organization password is required'
            }
            if (orgPassword.trim().length < 6) {
                return 'Organization password must be at least 6 characters'
            }
            return ''
        }
        
        const updateField = (field, value) => {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));

            // Clear field error when user starts typing
            if (fieldErrors[field]) {
                setFieldErrors(prev => ({
                    ...prev,
                    [field]: ''
                }));
            }

            // Also clear confirmPassword error if password changes
            if (field === 'password' && fieldErrors.confirmPassword) {
                setFieldErrors(prev => ({
                    ...prev,
                    confirmPassword: ''
                }));
            }

            // Re-validate form to update button state
            setTimeout(() => {
                const errors = {
                    firstName: validateName({...formData, [field]: value}.firstName, 'First name'),
                    lastName: validateName({...formData, [field]: value}.lastName, 'Last name'),
                    email: validateEmail({...formData, [field]: value}.email),
                    password: validatePassword({...formData, [field]: value}.password),
                    confirmPassword: validateConfirmPassword({...formData, [field]: value}.password, {...formData, [field]: value}.confirmPassword),
                    orgPassword: validateOrgPassword({...formData, [field]: value}.orgPassword)
                }

                const formValid = !Object.values(errors).some(error => error !== '')
                setIsFormValid(formValid)
            }, 0);
        };
        
        const validateForm = () => {
            const errors = {
                firstName: validateName(formData.firstName, 'First name'),
                lastName: validateName(formData.lastName, 'Last name'),
                email: validateEmail(formData.email),
                password: validatePassword(formData.password),
                confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
                orgPassword: validateOrgPassword(formData.orgPassword)
            }

            setFieldErrors(errors)

            // Update form validity state
            const formValid = !Object.values(errors).some(error => error !== '')
            setIsFormValid(formValid)

            // Return true if no errors
            return formValid
        }
        
    const onSubmit = (e) => {
        e.preventDefault()
        
        // Validate form before submitting
        if (!validateForm()) {
            return
        }
        
        const userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            confirmPassword,
            orgPassword: orgPassword.trim()
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

                <form className="auth-form" onSubmit={onSubmit} noValidate>
                    <div className="auth-form-row">
                        <div className="auth-form-group">
                            <input 
                                type="text" 
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => updateField('firstName', e.target.value)}
                                className={`auth-input ${fieldErrors.firstName ? 'error' : ''}`}
                                disabled={isLoading}
                            />
                            {fieldErrors.firstName && (
                                <div className="field-error">{fieldErrors.firstName}</div>
                            )}
                        </div>
                        <div className="auth-form-group">
                            <input 
                                type="text" 
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => updateField('lastName', e.target.value)}
                                className={`auth-input ${fieldErrors.lastName ? 'error' : ''}`}
                                disabled={isLoading}
                            />
                            {fieldErrors.lastName && (
                                <div className="field-error">{fieldErrors.lastName}</div>
                            )}
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <input 
                            type="email" 
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className={`auth-input ${fieldErrors.email ? 'error' : ''}`}
                            disabled={isLoading}
                        />
                        {fieldErrors.email && (
                            <div className="field-error">{fieldErrors.email}</div>
                        )}
                    </div>

                    <div className="auth-form-group">
                        <PasswordInput
                            value={password}
                            onChange={(e) => updateField('password', e.target.value)}
                            placeholder="Password"
                            disabled={isLoading}
                            className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
                            required={false}
                        />
                        {fieldErrors.password && (
                            <div className="field-error">{fieldErrors.password}</div>
                        )}
                        <div className="password-requirements">
                            <small>Password must contain: 8+ characters, uppercase, lowercase, and a number</small>
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <PasswordInput
                            value={confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            placeholder="Confirm Password"
                            disabled={isLoading}
                            className={`auth-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                            required={false}
                        />
                        {fieldErrors.confirmPassword && (
                            <div className="field-error">{fieldErrors.confirmPassword}</div>
                        )}
                    </div>

                    <div className="auth-form-group">
                        <input 
                            type="text" 
                            placeholder="Organization Password"
                            value={orgPassword}
                            onChange={(e) => updateField('orgPassword', e.target.value)}
                            className={`auth-input ${fieldErrors.orgPassword ? 'error' : ''}`}
                            disabled={isLoading}
                        />
                        {fieldErrors.orgPassword && (
                            <div className="field-error">{fieldErrors.orgPassword}</div>
                        )}
                        <div className="password-requirements">
                            <small>Contact your organization administrator for this password</small>
                        </div>
                    </div>

                    <div className="button-container">
                        <button
                            type="submit"
                            className={`auth-submit-button ${!isFormValid ? 'disabled' : ''}`}
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                        
                        {!isFormValid && !isLoading && (
                            <div className="button-tooltip">
                                {(() => {
                                    // Check if all fields have values
                                    const allFieldsFilled = firstName && firstName.trim() &&
                                                          lastName && lastName.trim() &&
                                                          email && email.trim() &&
                                                          password &&
                                                          confirmPassword &&
                                                          orgPassword && orgPassword.trim()
                                    
                                    if (!allFieldsFilled) {
                                        return 'Complete all fields'
                                    }
                                    
                                    // All fields filled, check for specific validation errors
                                    const issues = []
                                    
                                    // Check password requirements
                                    if (password) {
                                        if (password.length < 8) {
                                            issues.push('Password must be at least 8 characters')
                                        }
                                        if (!/[A-Z]/.test(password)) {
                                            issues.push('Password needs an uppercase letter')
                                        }
                                        if (!/[a-z]/.test(password)) {
                                            issues.push('Password needs a lowercase letter')
                                        }
                                        if (!/[0-9]/.test(password)) {
                                            issues.push('Password needs a number')
                                        }
                                    }
                                    
                                    // Check if passwords match
                                    if (password && confirmPassword && password !== confirmPassword) {
                                        issues.push('Passwords do not match')
                                    }
                                    
                                    // Check other field errors
                                    if (fieldErrors.firstName) issues.push('Invalid first name')
                                    if (fieldErrors.lastName) issues.push('Invalid last name')
                                    if (fieldErrors.email) issues.push('Invalid email format')
                                    if (fieldErrors.orgPassword) issues.push('Invalid organization password')
                                    
                                    return issues.length > 0 ? issues.join('. ') : 'Please check all field requirements'
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
                        Already have an account? <a href="/" className="auth-link">Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterScreen