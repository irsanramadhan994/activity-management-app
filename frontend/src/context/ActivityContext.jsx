import { createContext, useContext, useState, useCallback } from 'react';
import { activitiesAPI } from '../services/api';

const ActivityContext = createContext(null);

export const useActivities = () => {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error('useActivities must be used within an ActivityProvider');
    }
    return context;
};

export const ActivityProvider = ({ children }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    });

    const fetchActivities = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await activitiesAPI.getAll(params);
            setActivities(response.data.data);
            setPagination(response.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch activities');
        } finally {
            setLoading(false);
        }
    }, []);

    const createActivity = async (activityData) => {
        try {
            setError(null);
            const response = await activitiesAPI.create(activityData);
            setActivities((prev) => [response.data.data, ...prev]);
            return { success: true, data: response.data.data };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create activity';
            setError(message);
            return { success: false, error: message };
        }
    };

    const updateActivity = async (id, activityData) => {
        try {
            setError(null);
            const response = await activitiesAPI.update(id, activityData);
            setActivities((prev) =>
                prev.map((a) => (a._id === id ? response.data.data : a))
            );
            return { success: true, data: response.data.data };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update activity';
            setError(message);
            return { success: false, error: message };
        }
    };

    const deleteActivity = async (id) => {
        try {
            setError(null);
            await activitiesAPI.delete(id);
            setActivities((prev) => prev.filter((a) => a._id !== id));
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to delete activity';
            setError(message);
            return { success: false, error: message };
        }
    };

    const getActivity = async (id) => {
        try {
            const response = await activitiesAPI.getOne(id);
            return { success: true, data: response.data.data };
        } catch (err) {
            return { success: false, error: err.response?.data?.message };
        }
    };

    const value = {
        activities,
        loading,
        error,
        pagination,
        fetchActivities,
        createActivity,
        updateActivity,
        deleteActivity,
        getActivity,
    };

    return (
        <ActivityContext.Provider value={value}>
            {children}
        </ActivityContext.Provider>
    );
};
