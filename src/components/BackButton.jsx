import React from "react";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ className = "" }) => {
    return (
        <button
            onClick={() => window.history.back()}
            className={`flex items-center text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        >
            <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                <ArrowLeft className="w-5 h-5" />
            </div>
        </button>
    );
};

export default BackButton;
