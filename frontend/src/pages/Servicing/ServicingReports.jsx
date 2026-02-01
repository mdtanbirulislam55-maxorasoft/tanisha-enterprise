import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Wrench, Clock, CheckCircle, AlertCircle, FileText, DollarSign, Home } from "lucide-react";

const ServicingReports = () => {
  const { theme } = useTheme();
  const iconMap = {
    Wrench: Wrench,
    Clock: Clock,
    CheckCircle: CheckCircle,
    FileText: FileText,
    DollarSign: DollarSign
  };
  const IconComponent = iconMap["FileText"] || AlertCircle;
  
  return (
    <div className={`p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
          <IconComponent className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Service Reports</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Service analytics and reports
          </p>
        </div>
      </div>
      
      <div className={`rounded-xl p-8 text-center ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
          <IconComponent className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Service Reports</h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6 max-w-md mx-auto`}>
          This module is part of the Servicing system. Full features including customer service management,
          technician assignment, service tracking, and billing will be available soon.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button 
            onClick={() => window.history.back()}
            className={`px-6 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors flex items-center justify-center gap-2`}
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/servicing/requests'}
            className={`px-6 py-3 rounded-lg ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors flex items-center justify-center gap-2`}
          >
            <Wrench className="w-4 h-4" />
            Go to Service Requests
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicingReports;
