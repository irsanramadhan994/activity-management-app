import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiHome,
    FiCalendar,
    FiList,
    FiSettings,
    FiLogOut,
    FiActivity
} from 'react-icons/fi';

const Navbar = () => {
    const { user, logout, isAuthenticated, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        return null;
    }

    const navItems = [
        { path: '/', label: 'Home', icon: FiHome },
        { path: '/calendar', label: 'Kalender', icon: FiCalendar },
        { path: '/activities', label: 'Aktifitas', icon: FiList },
    ];

    if (isAdmin) {
        navItems.push({ path: '/admin', label: 'Admin', icon: FiSettings });
    }

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <img src="/logo.png" alt="Logo" className="navbar-logo" />
                <span>Kecamatan Cimenyan</span>
            </Link>

            <ul className="navbar-nav">
                {navItems.map((item) => (
                    <li key={item.path}>
                        <Link
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="navbar-user">
                <div className="user-info">
                    <div className="user-name">{user?.username}</div>
                    <div className="user-role">{user?.role}</div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                    <FiLogOut size={18} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
