import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const ServicesSection = ({ services, loading = false }) => {
    const { t, i18n } = useTranslation();
    const isBengali = i18n.language === 'bn';

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border-l-4 border-gray-200 pl-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j}>
                                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!services || services.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('dashboard.services')}</h2>
                <p className="text-gray-600 mb-6">{t('dashboard.learnAboutBrand')}</p>
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>{t('dashboard.noServicesData')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.services')}</h2>
                <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                    {services.length} {isBengali ? 'সক্রিয়' : 'Active'}
                </span>
            </div>
            <p className="text-gray-600 mb-6">{t('dashboard.learnAboutBrand')}</p>
            
            <div className="space-y-4">
                {services.map((service, index) => (
                    <div 
                        key={index} 
                        className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-blue-50 transition-colors duration-200 rounded-r-lg"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t('dashboard.name')}
                                </label>
                                <p className="text-gray-800 font-semibold text-lg">{service.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t('dashboard.executor')}
                                </label>
                                <div className="flex items-center">
                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    <p className="text-gray-700 font-medium">{service.executor || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t('dashboard.hitel')}
                                </label>
                                <p className="text-gray-700 font-medium">{service.hitel || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {t('dashboard.management')}
                                </label>
                                <p className="text-gray-700 font-medium">{service.management || 'N/A'}</p>
                            </div>
                        </div>
                        
                        {service.description && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-gray-600 text-sm">{service.description}</p>
                            </div>
                        )}
                        
                        {service.status && (
                            <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    service.status === 'Active' || service.status === 'সক্রিয়'
                                        ? 'bg-green-100 text-green-800' 
                                        : service.status === 'Pending' || service.status === 'অপেক্ষমান'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {service.status}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
                <button className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    {t('dashboard.addNewService')}
                </button>
            </div>
        </div>
    );
};

ServicesSection.propTypes = {
    services: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            executor: PropTypes.string,
            hitel: PropTypes.string,
            management: PropTypes.string,
            status: PropTypes.string,
            description: PropTypes.string
        })
    ),
    loading: PropTypes.bool
};

ServicesSection.defaultProps = {
    services: [],
    loading: false
};

export default ServicesSection;