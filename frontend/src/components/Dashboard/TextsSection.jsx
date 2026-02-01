import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const TextsSection = ({ texts, loading = false }) => {
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

    if (!texts || texts.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.texts')}</h2>
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>{t('dashboard.noTextsAvailable')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.texts')}</h2>
                <span className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-full">
                    {texts.length} {isBengali ? 'আইটেম' : 'Items'}
                </span>
            </div>
            
            <div className="space-y-3">
                {texts.map((text, index) => (
                    <div 
                        key={index} 
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 group cursor-pointer"
                    >
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                        <span className="text-gray-700 font-medium flex-grow group-hover:text-blue-600 transition-colors duration-200">
                            {text}
                        </span>
                        <svg className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </div>
                ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex space-x-3">
                    <input
                        type="text"
                        placeholder={t('dashboard.addNewTextPlaceholder')}
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        {t('dashboard.add')}
                    </button>
                </div>
            </div>
        </div>
    );
};

TextsSection.propTypes = {
    texts: PropTypes.arrayOf(PropTypes.string),
    loading: PropTypes.bool
};

TextsSection.defaultProps = {
    texts: [],
    loading: false
};

export default TextsSection;