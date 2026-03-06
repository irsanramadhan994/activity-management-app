const LoadingSpinner = ({ fullScreen = false }) => {
    return (
        <div className={`loading-spinner ${fullScreen ? 'full-screen' : ''}`}>
            <div className="spinner"></div>
        </div>
    );
};

export default LoadingSpinner;
