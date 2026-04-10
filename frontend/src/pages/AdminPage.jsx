import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { adminAPI, activitiesAPI, notificationsAPI } from '../services/api';
import {
    FiSearch, FiFilter, FiUsers, FiCalendar, FiClock, FiBell,
    FiEdit, FiTrash2, FiX, FiActivity
} from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPage = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [usernameFilter, setUsernameFilter] = useState('');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderTime, setReminderTime] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [activitiesRes, statsRes] = await Promise.all([
                adminAPI.getActivities({ limit: 50 }),
                adminAPI.getStats()
            ]);
            setActivities(activitiesRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getActivities({
                search: searchTerm,
                username: usernameFilter
            });
            setActivities(response.data.data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await activitiesAPI.delete(id);
            setActivities(prev => prev.filter(a => a._id !== id));
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleSetReminder = async () => {
        if (!selectedActivity || !reminderTime) return;
        try {
            // Convert datetime-local value to ISO string with timezone info
            // datetime-local gives "2026-04-10T09:00" (no timezone),
            // new Date() interprets it in local timezone and toISOString() converts to UTC
            const localDate = new Date(reminderTime);
            await adminAPI.setReminder(selectedActivity._id, localDate.toISOString());
            setShowReminderModal(false);
            fetchData();
        } catch (error) {
            alert('Failed to set reminder');
        }
    };

    const handleSendNotification = async (activityId) => {
        try {
            await notificationsAPI.send(activityId);
            alert('Notification sent!');
        } catch (error) {
            alert('Failed to send notification');
        }
    };

    if (loading && !stats) return <LoadingSpinner />;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard</h1>
            </div>

            {stats && (
                <div className="grid grid-cols-4 mb-xl">
                    <div className="stat-card">
                        <div className="stat-icon"><FiUsers size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalUsers}</div>
                            <div className="stat-label">Users</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><FiActivity size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalActivities}</div>
                            <div className="stat-label">Activities</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><FiCalendar size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.upcomingActivities}</div>
                            <div className="stat-label">Upcoming</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><FiClock size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.totalReports}</div>
                            <div className="stat-label">Reports</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <FiSearch size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Filter by username"
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    style={{ width: '200px' }}
                />
                <button className="btn btn-primary" onClick={handleSearch}>
                    <FiFilter size={16} /> Filter
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Priority</th>
                                <th>Creator</th>
                                <th>Dates</th>
                                <th>Reminder</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map(activity => (
                                <tr key={activity._id}>
                                    <td>
                                        <strong>{activity.name}</strong>
                                        <br />
                                        <small className="text-muted">
                                            {activity.assignees?.length || 0} assignees
                                        </small>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${activity.priority}`}>
                                            {activity.priority}
                                        </span>
                                    </td>
                                    <td>{activity.createdBy?.username || 'N/A'}</td>
                                    <td>
                                        {format(new Date(activity.startDate), 'MMM d')} -
                                        {format(new Date(activity.endDate), 'MMM d')}
                                    </td>
                                    <td>
                                        {activity.reminderTime
                                            ? format(new Date(activity.reminderTime), 'MMM d, HH:mm')
                                            : '-'}
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => {
                                                    setSelectedActivity(activity);
                                                    setShowReminderModal(true);
                                                }}
                                                title="Set Reminder"
                                            >
                                                <FiBell size={14} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleSendNotification(activity._id)}
                                                title="Send Notification"
                                            >
                                                <FiClock size={14} />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(activity._id)}
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showReminderModal && (
                <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Set Reminder</h2>
                            <button className="modal-close" onClick={() => setShowReminderModal(false)}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-md">Set reminder for: <strong>{selectedActivity?.name}</strong></p>
                            <div className="form-group">
                                <label className="form-label">Reminder Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={reminderTime}
                                    onChange={(e) => setReminderTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowReminderModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSetReminder}>
                                Set Reminder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
