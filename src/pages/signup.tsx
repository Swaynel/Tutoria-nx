'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  schoolName: string
}

export default function Signup() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    schoolName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const { user } = useAuthContext()

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password))
  }, [formData.password])

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return strength
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength === 0) return 'bg-gray-200'
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (strength: number): string => {
    if (strength === 0) return ''
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Medium'
    return 'Strong'
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.fullName || !formData.schoolName) {
      setError('All fields are required')
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (passwordStrength <= 2) {
      setError('Please choose a stronger password')
      return false
    }
    
    if (formData.schoolName.length < 2) {
      setError('School name must be at least 2 characters')
      return false
    }
    
    return true
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      console.log('🚀 Starting signup process...')
      
      // SIMPLIFIED: Let the database trigger handle school/profile creation
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { 
            full_name: formData.fullName, 
            school_name: formData.schoolName 
          }
        }
      })

      console.log('📝 Signup response:', { signUpData, signUpError })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      if (!signUpData.user) {
        throw new Error('Signup failed: No user returned')
      }

      console.log('✅ User created with ID:', signUpData.user.id)

      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess(
        signUpData.user.email_confirmed_at 
          ? 'Account created successfully! Redirecting to dashboard...'
          : 'Account created successfully! Please check your email to verify your account.'
      )

      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        schoolName: ''
      })

      // Redirect after success
      setTimeout(() => {
  if (signUpData.user?.email_confirmed_at) {
    router.push('/dashboard')
  } else {
    router.push('/login?message=Please verify your email before signing in')
  }
}, 3000)


    } catch (err: unknown) {
      console.error('❌ Signup error:', err)
      
      let errorMessage = 'An unexpected error occurred.'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Handle common errors with better messages
        if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else if (errorMessage.includes('duplicate key value')) {
          errorMessage = 'An account with this email or school name already exists.'
        } else if (errorMessage.includes('Database error')) {
          errorMessage = 'There was an issue creating your account. Please try again or contact support.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <div className="bg-indigo-600 rounded-lg p-2">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-8 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your school account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm flex items-center">
              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={loading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </label>
              <input
                id="schoolName"
                name="schoolName"
                type="text"
                required
                placeholder="Enter your school name"
                value={formData.schoolName}
                onChange={handleInputChange}
                disabled={loading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-gray-600">{getPasswordStrengthText(passwordStrength)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use at least 8 characters with uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms</Link> and{' '}
            <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </div>
  )
}
