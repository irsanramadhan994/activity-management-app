import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiMail, FiPhone, FiActivity } from 'react-icons/fi';

const registerSchema = Yup.object().shape({
    username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must not exceed 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .required('Username is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
    phoneNumber: Yup.string()
        .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code (e.g., +1234567890)')
        .required('Phone number is required'),
});

const RegisterPage = () => {
    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    if (isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSubmit = async (values, { setSubmitting }) => {
        setError('');
        const { confirmPassword, ...userData } = values;

        const result = await register(userData);

        if (result.success) {
            navigate('/', { replace: true });
        } else {
            setError(result.error);
        }
        setSubmitting(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="flex items-center justify-center gap-sm mb-md">
                        <FiActivity size={32} color="var(--color-primary)" />
                    </div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Get started with Activity Manager</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <Formik
                    initialValues={{
                        username: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        phoneNumber: '',
                    }}
                    validationSchema={registerSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div className="form-group">
                                <label className="form-label" htmlFor="username">
                                    <FiUser style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Username
                                </label>
                                <Field
                                    type="text"
                                    id="username"
                                    name="username"
                                    className="form-input"
                                    placeholder="Choose a username"
                                />
                                <ErrorMessage name="username" component="div" className="form-error" />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="email">
                                    <FiMail style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Email
                                </label>
                                <Field
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                />
                                <ErrorMessage name="email" component="div" className="form-error" />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="phoneNumber">
                                    <FiPhone style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Phone Number
                                </label>
                                <Field
                                    type="text"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    className="form-input"
                                    placeholder="+1234567890"
                                />
                                <ErrorMessage name="phoneNumber" component="div" className="form-error" />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="password">
                                    <FiLock style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Password
                                </label>
                                <Field
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="Create a password"
                                />
                                <ErrorMessage name="password" component="div" className="form-error" />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword">
                                    <FiLock style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Confirm Password
                                </label>
                                <Field
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="Confirm your password"
                                />
                                <ErrorMessage name="confirmPassword" component="div" className="form-error" />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full btn-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating account...' : 'Create Account'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
