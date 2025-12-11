import React, { useState } from 'react';
import { User, Mail, Lock, ArrowLeft, Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import * as api from '../api';

interface RegisterPageProps {
  readonly onCancel: () => void;
  readonly onSuccess: () => void;
  readonly lang: 'es' | 'en';
}

export function RegisterPage({ onCancel, onSuccess, lang }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return lang === 'es' ? 'Débil' : 'Weak';
    if (strength === 2) return lang === 'es' ? 'Regular' : 'Fair';
    if (strength === 3) return lang === 'es' ? 'Buena' : 'Good';
    return lang === 'es' ? 'Fuerte' : 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return;
    }

    if (passwordStrength < 2) {
        setError(lang === 'es' ? 'La contraseña es muy débil' : 'Password is too weak');
        return;
    }

    setIsLoading(true);

    try {
      await api.register(formData.email, formData.password, formData.username);
      
      // Save profile if remember is checked (simulated for now as register doesn't return token usually)
      // In a real app, we might auto-login here.
      // For this requirement: "si al momento de crear al usuario no se haya seleccionado algo tipo recordar contraseña... que si les solicite la contraseña"
      // So we save the profile anyway, but only save token if remember is true.
      // Since register doesn't return token, we can't save it yet. The user must login.
      // BUT, we can save the profile metadata so it appears in the list.
      
      const profiles = JSON.parse(localStorage.getItem('app:profiles') || '[]')
      const newProfile = {
        email: formData.email,
        name: formData.username,
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
        // No token yet, user must login first time usually. 
        // Unless we auto-login after register. Let's assume we redirect to login.
      }
      // Check if exists
      if (!profiles.find((p: any) => p.email === newProfile.email)) {
        profiles.push(newProfile)
        localStorage.setItem('app:profiles', JSON.stringify(profiles))
      }

      alert(lang === 'es' ? 'Registro exitoso' : 'Registration successful');
      onSuccess(); 
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || (lang === 'es' ? 'Error al registrarse' : 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    title: lang === 'es' ? 'Crear Cuenta' : 'Create Account',
    username: lang === 'es' ? 'Usuario' : 'Username',
    email: lang === 'es' ? 'Correo' : 'Email',
    password: lang === 'es' ? 'Contraseña' : 'Password',
    confirm: lang === 'es' ? 'Confirmar Contraseña' : 'Confirm Password',
    submit: lang === 'es' ? 'Registrarse' : 'Sign Up',
    back: lang === 'es' ? 'Volver' : 'Back',
    loading: lang === 'es' ? 'Registrando...' : 'Registering...',
    passwordRequirements: lang === 'es' ? 'Requisitos de contraseña:' : 'Password requirements:',
    reqLen: lang === 'es' ? 'Mínimo 8 caracteres' : 'Minimum 8 characters',
    reqCap: lang === 'es' ? 'Al menos una mayúscula' : 'At least one uppercase letter',
    reqNum: lang === 'es' ? 'Al menos un número' : 'At least one number',
    reqSym: lang === 'es' ? 'Al menos un símbolo' : 'At least one symbol',
    passMatch: lang === 'es' ? 'Las contraseñas coinciden' : 'Passwords match',
    remember: lang === 'es' ? 'Recordar contraseña para ingreso automático' : 'Remember password for automatic login',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <button 
          onClick={onCancel}
          className="mb-6 flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </button>

        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.username}</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t.username}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Strength Meter */}
            {formData.password && (
                <div className="mt-2">
                    <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{t.passwordRequirements}</span>
                        <span className="text-xs font-medium text-gray-700">{getStrengthText(passwordStrength)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`} 
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        ></div>
                    </div>
                    <ul className="mt-2 space-y-1">
                        <li className={`text-xs flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                            {formData.password.length >= 8 ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                            {t.reqLen}
                        </li>
                        <li className={`text-xs flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/[A-Z]/.test(formData.password) ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                            {t.reqCap}
                        </li>
                        <li className={`text-xs flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/\d/.test(formData.password) ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                            {t.reqNum}
                        </li>
                         <li className={`text-xs flex items-center ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/[^A-Za-z0-9]/.test(formData.password) ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                            {t.reqSym}
                        </li>
                    </ul>
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirm}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.password && formData.confirmPassword && (
                <div className={`mt-2 p-2 rounded-lg flex items-center text-xs font-medium ${
                    formData.password === formData.confirmPassword 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {formData.password === formData.confirmPassword ? (
                        <>
                            <Check className="w-3 h-3 mr-2" />
                            {t.passMatch}
                        </>
                    ) : (
                        <>
                            <X className="w-3 h-3 mr-2" />
                            {lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'}
                        </>
                    )}
                </div>
            )}
          </div>

          <div className="flex items-center mb-4">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              {t.remember}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.loading : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
