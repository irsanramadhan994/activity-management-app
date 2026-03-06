import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiActivity } from 'react-icons/fi';

const loginSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
});

const LoginPage = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || '/';

    if (isAuthenticated) {
        navigate(from, { replace: true });
        return null;
    }

    const handleSubmit = async (values, { setSubmitting }) => {
        setError('');
        const result = await login(values.username, values.password);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
        }
        setSubmitting(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="flex justify-center items-center  gap-sm mb-md">
                        <img className="logo" src="/logo.png" alt="Logo" />
                    </div>
                    <h1 className="auth-title">Selamat Datang</h1>
                    <p className="auth-subtitle">Masuk ke akun Anda untuk melanjutkan</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <Formik
                    initialValues={{ username: '', password: '' }}
                    validationSchema={loginSchema}
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
                                    placeholder="Enter your username"
                                />
                                <ErrorMessage name="username" component="div" className="form-error" />
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
                                    placeholder="Enter your password"
                                />
                                <ErrorMessage name="password" component="div" className="form-error" />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full btn-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign In'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <div className="auth-footer">
                    Belum punya akun?{' '}
                    <Link to="/register">Buat Akun</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
