import { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { activitiesAPI, reportsAPI } from '../services/api';
import { FiX, FiCalendar, FiClock, FiFileText, FiUsers, FiImage, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateActivities, setDateActivities] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [existingReport, setExistingReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    const fetchEvents = useCallback(async (start, end) => {
        try {
            setLoading(true);
            const response = await activitiesAPI.getCalendarEvents({ start, end });
            setEvents(response.data.data);
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
        fetchEvents(start, end);
    }, [fetchEvents]);

    const handleDateClick = (info) => {
        const clickedDate = info.dateStr;
        setSelectedDate(clickedDate);

        const activitiesOnDate = events.filter(event => {
            const eventStart = format(new Date(event.start), 'yyyy-MM-dd');
            const eventEnd = format(new Date(event.end), 'yyyy-MM-dd');
            return clickedDate >= eventStart && clickedDate <= eventEnd;
        });

        setDateActivities(activitiesOnDate);
        setShowModal(true);
    };

    const handleEventClick = async (info) => {
        const eventId = info.event.id;
        const activity = events.find(e => e.id === eventId);
        if (activity) {
            setSelectedActivity(activity);
            setShowReportModal(true);
            await fetchExistingReport(activity.id);
        }
    };

    const fetchExistingReport = async (activityId) => {
        setReportLoading(true);
        setExistingReport(null);
        try {
            const response = await reportsAPI.getByActivity(activityId);
            if (response.data.success && response.data.data) {
                setExistingReport(response.data.data);
            }
        } catch (error) {
            // 404 means no report exists — that's fine
            if (error.response?.status !== 404) {
                console.error('Failed to fetch report:', error);
            }
        } finally {
            setReportLoading(false);
        }
    };

    const handleDatesSet = (dateInfo) => {
        fetchEvents(dateInfo.startStr, dateInfo.endStr);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedDate(null);
        setDateActivities([]);
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setSelectedActivity(null);
        setExistingReport(null);
    };

    const openReportForm = async (activity) => {
        setSelectedActivity(activity);
        setShowModal(false);
        setShowReportModal(true);
        await fetchExistingReport(activity.id);
    };

    if (loading && events.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="calendar-page">
            <div className="page-header">
                <h1 className="page-title">Calendar</h1>
            </div>

            <div className="calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    height="auto"
                    eventDisplay="block"
                />
            </div>

            {/* Date Activities Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <FiCalendar style={{ marginRight: '8px' }} />
                                Activities on {selectedDate && format(new Date(selectedDate), 'MMMM d, yyyy')}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {dateActivities.length === 0 ? (
                                <div className="empty-state">
                                    <p>No activities scheduled for this date</p>
                                </div>
                            ) : (
                                <div className="activity-list">
                                    {dateActivities.map(activity => (
                                        <div
                                            key={activity.id}
                                            className="activity-card"
                                            style={{
                                                marginBottom: 'var(--spacing-md)',
                                                borderLeft: `4px solid ${activity.backgroundColor}`
                                            }}
                                        >
                                            <div className="activity-header">
                                                <h4 className="activity-title">{activity.title}</h4>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: activity.backgroundColor + '20',
                                                        color: activity.backgroundColor
                                                    }}
                                                >
                                                    {activity.extendedProps?.priority}
                                                </span>
                                            </div>
                                            <div className="activity-meta">
                                                <span className="activity-meta-item">
                                                    <FiClock size={14} />
                                                    {format(new Date(activity.start), 'HH:mm')} - {format(new Date(activity.end), 'HH:mm')}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => openReportForm(activity)}
                                                >
                                                    <FiFileText size={14} />
                                                    Create Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Report Modal */}
            {showReportModal && selectedActivity && (
                <div className="modal-overlay" onClick={closeReportModal}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {existingReport ? <FiCheckCircle style={{ marginRight: '8px', color: 'var(--success)' }} /> : <FiFileText style={{ marginRight: '8px' }} />}
                                {existingReport ? 'Report' : 'Create Report'}: {selectedActivity.title}
                            </h2>
                            <button className="modal-close" onClick={closeReportModal}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {reportLoading ? (
                                <LoadingSpinner />
                            ) : existingReport ? (
                                <ReportView report={existingReport} />
                            ) : (
                                <ReportForm
                                    activityId={selectedActivity.id}
                                    activityName={selectedActivity.title}
                                    onSuccess={closeReportModal}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Report Form Component
const ReportForm = ({ activityId, activityName, onSuccess }) => {
    const [guestPhotos, setGuestPhotos] = useState([]);
    const [activityPhotos, setActivityPhotos] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        if (type === 'guest') {
            setGuestPhotos(prev => [...prev, ...files].slice(0, 5));
        } else {
            setActivityPhotos(prev => [...prev, ...files].slice(0, 5));
        }
    };

    const removePhoto = (index, type) => {
        if (type === 'guest') {
            setGuestPhotos(prev => prev.filter((_, i) => i !== index));
        } else {
            setActivityPhotos(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (guestPhotos.length === 0 || activityPhotos.length === 0) {
            setError('Please upload at least one guest photo and one activity photo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('activityId', activityId);
            formData.append('notes', notes);

            guestPhotos.forEach(file => {
                formData.append('photosGuestList', file);
            });

            activityPhotos.forEach(file => {
                formData.append('photosActivity', file);
            });

            await reportsAPI.create(formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error mb-md">{error}</div>}

            <div className="form-group">
                <label className="form-label">Guest List Photos (Required)</label>
                <div className="photo-upload">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'guest')}
                        style={{ display: 'none' }}
                        id="guest-photos"
                    />
                    <label htmlFor="guest-photos" style={{ cursor: 'pointer' }}>
                        <FiUsers size={32} style={{ marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                        <p>Click to upload guest list photos (max 5)</p>
                    </label>
                </div>
                {guestPhotos.length > 0 && (
                    <div className="photo-preview">
                        {guestPhotos.map((file, index) => (
                            <div key={index} className="photo-preview-item">
                                <img src={URL.createObjectURL(file)} alt={`Guest ${index + 1}`} />
                                <button
                                    type="button"
                                    className="photo-preview-remove"
                                    onClick={() => removePhoto(index, 'guest')}
                                >
                                    <FiX size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Activity Photos (Required)</label>
                <div className="photo-upload">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, 'activity')}
                        style={{ display: 'none' }}
                        id="activity-photos"
                    />
                    <label htmlFor="activity-photos" style={{ cursor: 'pointer' }}>
                        <FiCalendar size={32} style={{ marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                        <p>Click to upload activity photos (max 5)</p>
                    </label>
                </div>
                {activityPhotos.length > 0 && (
                    <div className="photo-preview">
                        {activityPhotos.map((file, index) => (
                            <div key={index} className="photo-preview-item">
                                <img src={URL.createObjectURL(file)} alt={`Activity ${index + 1}`} />
                                <button
                                    type="button"
                                    className="photo-preview-remove"
                                    onClick={() => removePhoto(index, 'activity')}
                                >
                                    <FiX size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="notes">Notes (Optional)</label>
                <textarea
                    id="notes"
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about the activity..."
                    rows={4}
                />
            </div>

            <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Creating Report...' : 'Create Report'}
                </button>
            </div>
        </form>
    );
};

// Report View Component (read-only, shows existing report images)
const ReportView = ({ report }) => {
    const buildImageUrl = (path) => {
        // path is like /api/images/:id — prepend base URL
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    return (
        <div className="report-view">
            <div className="report-view-section">
                <h3 className="report-view-label">
                    <FiUsers size={16} style={{ marginRight: '6px' }} />
                    Guest List Photos
                </h3>
                <div className="report-view-gallery">
                    {report.photosGuestList.map((url, index) => (
                        <div key={index} className="report-view-image">
                            <img src={buildImageUrl(url)} alt={`Guest ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="report-view-section">
                <h3 className="report-view-label">
                    <FiImage size={16} style={{ marginRight: '6px' }} />
                    Activity Photos
                </h3>
                <div className="report-view-gallery">
                    {report.photosActivity.map((url, index) => (
                        <div key={index} className="report-view-image">
                            <img src={buildImageUrl(url)} alt={`Activity ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </div>

            {report.notes && (
                <div className="report-view-section">
                    <h3 className="report-view-label">
                        <FiFileText size={16} style={{ marginRight: '6px' }} />
                        Notes
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{report.notes}</p>
                </div>
            )}

            <div className="report-view-meta">
                Reported on {format(new Date(report.reportDate), 'MMMM d, yyyy \'at\' HH:mm')}
                {report.userId?.username && ` by ${report.userId.username}`}
            </div>
        </div>
    );
};

export default CalendarPage;
