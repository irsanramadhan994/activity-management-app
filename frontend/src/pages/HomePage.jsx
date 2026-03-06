import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../context/ActivityContext';
import {
    FiCalendar,
    FiList,
    FiClock,
    FiTrendingUp,
    FiPlus,
    FiChevronRight
} from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
    const { user } = useAuth();
    const { activities, loading, fetchActivities } = useActivities();
    const [stats, setStats] = useState({
        total: 0,
        upcoming: 0,
        highPriority: 0,
    });

    useEffect(() => {
        fetchActivities({ limit: 10 });
    }, [fetchActivities]);

    useEffect(() => {
        if (activities.length > 0) {
            const now = new Date();
            setStats({
                total: activities.length,
                upcoming: activities.filter(a => new Date(a.startDate) > now).length,
                highPriority: activities.filter(a => a.priority === 'high').length,
            });
        }
    }, [activities]);

    const upcomingActivities = activities
        .filter(a => new Date(a.startDate) > new Date())
        .slice(0, 5);

    const recentActivities = activities
        .filter(a => new Date(a.startDate) <= new Date())
        .slice(0, 5);

    if (loading && activities.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="home-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Selamat datang, <span className="text-gradient">{user?.username}</span>
                    </h1>
                    <p className="text-secondary">Berikut adalah aktifitas anda</p>
                </div>
                <Link to="/activities" className="btn btn-primary">
                    <FiPlus size={18} />
                    Aktifitas Baru
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 mb-xl">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FiList size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Aktifitas</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}>
                        <FiCalendar size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.upcoming}</div>
                        <div className="stat-label">Yang Akan Datang</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}>
                        <FiTrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.highPriority}</div>
                        <div className="stat-label">High Priority</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                        <FiClock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{format(new Date(), 'HH:mm')}</div>
                        <div className="stat-label">{format(new Date(), 'EEEE')}</div>
                    </div>
                </div>
            </div>

            {/* Activity Lists */}
            <div className="grid grid-cols-2">
                {/* Upcoming Activities */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Aktifitas Yang Akan Datang</h3>
                        <Link to="/calendar" className="btn btn-ghost btn-sm">
                            View Calendar <FiChevronRight size={16} />
                        </Link>
                    </div>

                    {upcomingActivities.length === 0 ? (
                        <div className="empty-state">
                            <FiCalendar className="empty-state-icon" />
                            <p>Belum ada aktifitas</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {upcomingActivities.map(activity => (
                                <div
                                    key={activity._id}
                                    className={`activity-card priority-${activity.priority}`}
                                    style={{ marginBottom: 'var(--spacing-md)' }}
                                >
                                    <div className="activity-header">
                                        <h4 className="activity-title">{activity.name}</h4>
                                        <span className={`badge badge-${activity.priority}`}>
                                            {activity.priority}
                                        </span>
                                    </div>
                                    <div className="activity-meta">
                                        <span className="activity-meta-item">
                                            <FiCalendar size={14} />
                                            {format(new Date(activity.startDate), 'MMM d, yyyy')}
                                        </span>
                                        <span className="activity-meta-item">
                                            <FiClock size={14} />
                                            {format(new Date(activity.startDate), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activities */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Aktifitas Terbaru</h3>
                        <Link to="/activities" className="btn btn-ghost btn-sm">
                            Lihat Semua <FiChevronRight size={16} />
                        </Link>
                    </div>

                    {recentActivities.length === 0 ? (
                        <div className="empty-state">
                            <FiList className="empty-state-icon" />
                            <p>No recent activities</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {recentActivities.map(activity => (
                                <div
                                    key={activity._id}
                                    className={`activity-card priority-${activity.priority}`}
                                    style={{ marginBottom: 'var(--spacing-md)' }}
                                >
                                    <div className="activity-header">
                                        <h4 className="activity-title">{activity.name}</h4>
                                        <span className={`badge badge-${activity.priority}`}>
                                            {activity.priority}
                                        </span>
                                    </div>
                                    <div className="activity-meta">
                                        <span className="activity-meta-item">
                                            <FiCalendar size={14} />
                                            {format(new Date(activity.startDate), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    {activity.assignees && activity.assignees.length > 0 && (
                                        <div className="activity-assignees">
                                            {activity.assignees.slice(0, 3).map(assignee => (
                                                <span key={assignee._id} className="assignee-badge">
                                                    {assignee.username}
                                                </span>
                                            ))}
                                            {activity.assignees.length > 3 && (
                                                <span className="assignee-badge">
                                                    +{activity.assignees.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
