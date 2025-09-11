import { useState, useEffect } from 'react'
import {useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { login, reset } from '../features/auth/authSlice'


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
    const [showPassword, setShowPassword] = useState(false)


    useEffect(() => {
        if (isError) {
            console.log('error', message)
        }

        if (isSuccess || user) {
            navigate('/projects')
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
        e.preventDefault()
        dispatch(login(formData))
    }
    return (
        
    <div 
    >
        <div>Login</div>
        <div>
            <form onSubmit={onSubmit}>
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
                <button type="submit">Login</button>
            </form>
        </div>
        <div>Don't have an account? <a href="/register">Sign up</a></div>
    </div>
    )
}

export default LoginScreen;