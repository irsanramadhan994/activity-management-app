import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../context/ActivityContext';
import {
    FiPlus, FiSearch, FiFilter, FiCalendar, FiUsers,
    FiX, FiTrash2, FiDownload, FiFileText
} from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const activitySchema = Yup.object().shape({
    name: Yup.string().required('Activity name is required').max(200),
    priority: Yup.string().oneOf(['low', 'medium', 'high']).required(),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date().required('End date is required')
        .min(Yup.ref('startDate'), 'End date must be after start date'),
    description: Yup.string().max(2000),
});

const ActivitiesPage = () => {
    const { isAdmin } = useAuth();
    const { activities, loading, fetchActivities, createActivity, deleteActivity } = useActivities();
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => { fetchActivities(); }, [fetchActivities]);

    const handleSearch = () => {
        fetchActivities({ search: searchTerm, priority: priorityFilter || undefined });
    };

    const handleCreateActivity = async (values, { setSubmitting, resetForm }) => {
        const result = await createActivity(values);
        if (result.success) { setShowModal(false); resetForm(); }
        setSubmitting(false);
    };

    const handleDeleteActivity = async (id) => {
        if (window.confirm('Delete this activity?')) await deleteActivity(id);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Activity Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 30);

        const data = activities.map(a => [
            a.name, a.priority.toUpperCase(),
            format(new Date(a.startDate), 'MMM d, yyyy'),
            format(new Date(a.endDate), 'MMM d, yyyy'),
            a.assignees?.map(u => u.username).join(', ') || '-'
        ]);

        autoTable(doc, {
            head: [['Name', 'Priority', 'Start', 'End', 'Assignees']],
            body: data, startY: 38,
            headStyles: { fillColor: [99, 102, 241] }
        });
        doc.save('activities-report.pdf');
    };

    const filtered = activities.filter(a => {
        const matchSearch = !searchTerm ||
            a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchPriority = !priorityFilter || a.priority === priorityFilter;
        return matchSearch && matchPriority;
    });

    if (loading && !activities.length) return <LoadingSpinner />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Aktifitas</h1>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={generatePDF}>
                        <FiDownload size={18} /> Export PDF
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus size={18} /> Kegiatan Baru
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <FiSearch size={18} />
                    <input type="text" className="form-input" placeholder="Cari..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                </div>
                <select className="form-select" value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)} style={{ width: '150px' }}>
                    <option value="">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <button className="btn btn-secondary" onClick={handleSearch}>
                    <FiFilter size={16} /> Filter
                </button>
            </div>

            {!filtered.length ? (
                <div className="empty-state">
                    <FiFileText className="empty-state-icon" />
                    <h3 className="empty-state-title">No activities found</h3>
                    <button className="btn btn-primary mt-md" onClick={() => setShowModal(true)}>
                        <FiPlus size={18} /> Create Activity
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3">
                    {filtered.map(activity => (
                        <div key={activity._id} className={`activity-card priority-${activity.priority}`}>
                            <div className="activity-header">
                                <h3 className="activity-title">{activity.name}</h3>
                                <span className={`badge badge-${activity.priority}`}>{activity.priority}</span>
                            </div>
                            {activity.description && (
                                <p className="text-secondary mb-md" style={{ fontSize: '0.875rem' }}>
                                    {activity.description.substring(0, 100)}{activity.description.length > 100 && '...'}
                                </p>
                            )}
                            <div className="activity-meta">
                                <span className="activity-meta-item">
                                    <FiCalendar size={14} />
                                    {format(new Date(activity.startDate), 'MMM d')} - {format(new Date(activity.endDate), 'MMM d, yyyy')}
                                </span>
                            </div>
                            {activity.assignees?.length > 0 && (
                                <div className="activity-assignees mt-md">
                                    <FiUsers size={14} style={{ marginRight: '4px' }} />
                                    {activity.assignees.slice(0, 2).map(u => (
                                        <span key={u._id} className="assignee-badge">{u.username}</span>
                                    ))}
                                    {activity.assignees.length > 2 && <span className="assignee-badge">+{activity.assignees.length - 2}</span>}
                                </div>
                            )}
                            {isAdmin && (
                                <div className="flex gap-sm mt-md">
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteActivity(activity._id)}>
                                        <FiTrash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title"><FiPlus style={{ marginRight: '8px' }} /> New Activity</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><FiX size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <Formik
                                initialValues={{ name: '', priority: 'medium', startDate: '', endDate: '', description: '', assignees: [], sub: '' }}
                                validationSchema={activitySchema}
                                onSubmit={handleCreateActivity}
                            >
                                {({ isSubmitting, setFieldValue }) => (
                                    <Form>
                                        <div className="form-group">
                                            <label className="form-label">Activity Name *</label>
                                            <Field type="text" name="name" className="form-input" placeholder="Enter name" />
                                            <ErrorMessage name="name" component="div" className="form-error" />
                                        </div>
                                        <div className="grid grid-cols-2">
                                            <div className="form-group">
                                                <label className="form-label">Priority *</label>
                                                <Field as="select" name="priority" className="form-select">
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                </Field>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Sub-category</label>
                                                <Field type="text" name="sub" className="form-input" placeholder="e.g., Meeting" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2">
                                            <div className="form-group">
                                                <label className="form-label">Start Date *</label>
                                                <Field type="datetime-local" name="startDate" className="form-input" />
                                                <ErrorMessage name="startDate" component="div" className="form-error" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">End Date *</label>
                                                <Field type="datetime-local" name="endDate" className="form-input" />
                                                <ErrorMessage name="endDate" component="div" className="form-error" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <Field as="textarea" name="description" className="form-textarea" rows={3} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Assign Users (comma separated usernames)</label>
                                            <input type="text" className="form-input" placeholder="user1, user2"
                                                onChange={e => setFieldValue('assignees', e.target.value.split(',').map(u => u.trim()).filter(Boolean))} />
                                        </div>
                                        <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                                {isSubmitting ? 'Creating...' : 'Create Activity'}
                                            </button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivitiesPage;
