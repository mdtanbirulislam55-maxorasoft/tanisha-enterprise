import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Wrench, Clock, AlertCircle, DollarSign } from "lucide-react";

const ServicingRequests = () => {
  const { theme } = useTheme();

  return (
    <div className={`p-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}>
          <Wrench className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Service Requests</h1>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Manage customer service requests and schedules
          </p>
        </div>
      </div>

      <div className={`rounded-xl p-8 text-center ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"}`}>
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h2 className="text-xl font-semibold mb-2">Servicing Module</h2>
        <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}>
          The Servicing module is under development. Features will include:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-semibold">Service Requests</h3>
            <p className="text-sm text-gray-500">Customer service bookings</p>
          </div>

          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <Wrench className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold">Ongoing Services</h3>
            <p className="text-sm text-gray-500">Active service jobs</p>
          </div>

          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold">Service Billing</h3>
            <p className="text-sm text-gray-500">Invoicing & payments</p>
          </div>
        </div>

        <button
          onClick={() => window.history.back()}
          className={`mt-8 px-6 py-2 rounded-lg ${
            theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
          } transition-colors`}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ServicingRequests;
