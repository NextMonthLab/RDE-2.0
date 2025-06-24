import React from 'react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
        <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          Return to RDE
        </a>
      </div>
    </div>
  );
};

export default NotFoundPage;