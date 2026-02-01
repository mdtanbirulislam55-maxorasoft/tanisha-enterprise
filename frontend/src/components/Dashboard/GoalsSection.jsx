import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const GoalsSection = ({ goals, loading = false }) => {
    const { t, i18n } = useTranslation();
    const isBengali = i18n.language === 'bn';

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className="w-2 h-2 bg-gray-200 rounded-full mr-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!goals || goals.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.goals')}</h2>
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p>{t('dashboard.noGoalsSet')}</p>
                </div>
            </div>
        );
    }

    const getGoalProgress = (goal) => {
        // In real app, this would come from API
        const progressMap = {
            'Timelogs': 75,
            'Folders': 60,
            'Employees': 90,
            'Nutrientions': 40,
            'News': 85,
            'Training': 55,
            'Development': 70,
            'Innovation': 30,
            'টাইমলগ': 75,
            'ফোল্ডার': 60,
            'কর্মচারী': 90,
            'পুষ্টি': 40,
            'খবর': 85,
            'প্রশিক্ষণ': 55,
            'উন্নয়ন': 70,
            'নতুনত্ব': 30
        };
        return progressMap[goal] || 50;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.goals')}</h2>
                <span className="px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                    {goals.length} {isBengali ? 'লক্ষ্য' : 'Targets'}
                </span>
            </div>
            
            <div className="space-y-4">
                {goals.map((goal, index) => {
                    const progress = getGoalProgress(goal);
                    
                    return (
                        <div 
                            key={index} 
                            className="p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                            <div className="flex items-center mb-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                                <span className="text-gray-700 font-medium flex-grow">{goal}</span>
                                <span className="text-sm font-semibold text-green-600">
                                    {progress}%
                                </span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">{t('dashboard.overallProgress')}</h3>
                        <p className="text-2xl font-bold text-gray-800">68%</p>
                    </div>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        {t('dashboard.viewDetails')}
                    </button>
                </div>
            </div>
        </div>
    );
};

GoalsSection.propTypes = {
    goals: PropTypes.arrayOf(PropTypes.string),
    loading: PropTypes.bool
};

GoalsSection.defaultProps = {
    goals: [],
    loading: false
};

export default GoalsSection;