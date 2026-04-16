// src/components/Auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, TrendingUp, Building2, Landmark, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import mainApi from '../../services/mainApi';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    location: ''
  });
  const [departmentData, setDepartmentData] = useState({
    department_id: '',
    agency_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [assignmentType, setAssignmentType] = useState('none');
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      const [deptRes, agencyRes] = await Promise.all([
        mainApi.departments.list(),
        mainApi.agencies.list()
      ]);
      setDepartmentsList(deptRes.data);
      setAgenciesList(agencyRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      // Don't show error to user, just log it
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleDepartmentChange = (e) => {
    setDepartmentData({
      ...departmentData,
      department_id: e.target.value,
      agency_id: '' // Clear agency when department is selected
    });
  };

  const handleAgencyChange = (e) => {
    setDepartmentData({
      ...departmentData,
      agency_id: e.target.value,
      department_id: '' // Clear department when agency is selected
    });
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare registration data
      const registerData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || '',
        location: formData.location || ''
      };
      
      // Only add department_id or agency_id if actually selected
      if (assignmentType === 'department' && departmentData.department_id) {
        registerData.department_id = departmentData.department_id;
      } else if (assignmentType === 'agency' && departmentData.agency_id) {
        registerData.agency_id = departmentData.agency_id;
      }
      
      console.log('Registering with data:', registerData);
      
      const success = await register(registerData);
      
      if (success) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          err.response?.data?.message ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-slide-up">
          <div>
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-3 rounded-full">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join the Federal Ministry of Environment platform
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="John"
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="Doe"
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="+234 123 456 7890"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Your city/community"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliation (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('department');
                      setDepartmentData({ department_id: '', agency_id: '' });
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      assignmentType === 'department' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Department
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('agency');
                      setDepartmentData({ department_id: '', agency_id: '' });
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      assignmentType === 'agency' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Landmark className="w-4 h-4 inline mr-1" />
                    Agency
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('none');
                      setDepartmentData({ department_id: '', agency_id: '' });
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      assignmentType === 'none' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    None
                  </button>
                </div>
                {dropdownLoading && assignmentType !== 'none' && (
                  <p className="text-xs text-gray-400 mt-1">Loading options...</p>
                )}
              </div>
              
              {assignmentType === 'department' && !dropdownLoading && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Department
                  </label>
                  <select
                    value={departmentData.department_id}
                    onChange={handleDepartmentChange}
                    className="input-field"
                  >
                    <option value="">Select a department</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {assignmentType === 'agency' && !dropdownLoading && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Agency
                  </label>
                  <select
                    value={departmentData.agency_id}
                    onChange={handleAgencyChange}
                    className="input-field"
                  >
                    <option value="">Select an agency</option>
                    {agenciesList.map(agency => (
                      <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-10 pr-10"
                    placeholder="•••••••• (min. 6 characters)"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 relative"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;