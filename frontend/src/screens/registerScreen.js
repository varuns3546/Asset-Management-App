import { useState, useEffect } from 'react'
import { register, reset } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
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
            navigate('/projects')
        }
        dispatch(reset())
    }, [user, isError, isSuccess, message, dispatch])

    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '',
        confirmPassword: '', 
        orgPassword: ''
      })
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
    return (
        <div>
            <form onSubmit={onSubmit}>
                <input 
                    type="text" 
                    placeholder="First Name" 
                    value={firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    required
                />
                <input 
                    type="text" 
                    placeholder="Last Name" 
                    value={lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    required
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    required
                />
                <input 
                    type="text" 
                    placeholder="Organization Password" 
                    value={orgPassword}
                    onChange={(e) => updateField('orgPassword', e.target.value)}
                    required
                />
                <button type="submit">Register</button>
            </form>
            <div>Already have an account? <a href="/">Login</a></div>
        </div>
    )
}

export default RegisterScreen