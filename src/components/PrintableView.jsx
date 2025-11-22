import React from 'react';

/**
 * Standardized Printable View Component
 * Provides consistent styling for all print, PDF, and export outputs
 */
const PrintableView = ({ 
  children, 
  title, 
  subtitle,
  headerInfo = [],
  className = '' 
}) => {
  return (
    <div className={`bg-white dark:bg-dark-card ${className}`}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print-header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-table {
            border-collapse: collapse;
            width: 100%;
          }
          
          .print-table th {
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
            padding: 8px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-table td {
            border: 1px solid #dee2e6 !important;
            padding: 8px !important;
          }
          
          .print-card {
            border: 1px solid #dee2e6 !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-after: always;
          }
        }
        
        .printable-container {
          background: white;
          color: #000;
          font-family: Arial, sans-serif;
          line-height: 1.6;
        }
        
        .print-header {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          padding: 24px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 24px;
        }
        
        .print-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 8px 0;
        }
        
        .print-subtitle {
          font-size: 14px;
          opacity: 0.95;
          margin: 0;
        }
        
        .print-header-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .print-header-info-item {
          font-size: 13px;
        }
        
        .print-header-info-label {
          opacity: 0.85;
          margin-bottom: 2px;
        }
        
        .print-header-info-value {
          font-weight: 600;
        }
        
        .print-content {
          padding: 0 24px 24px 24px;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .print-table thead {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        
        .print-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .print-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #dee2e6;
          color: #212529;
          font-size: 14px;
        }
        
        .print-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .print-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .print-table tfoot {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          font-weight: 600;
        }
        
        .print-table tfoot td {
          padding: 12px;
          border-top: 2px solid #dee2e6;
          border-bottom: none;
        }
        
        .print-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .print-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #dc3545;
        }
        
        .print-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin: 16px 0;
        }
        
        .print-summary-item {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #dc3545;
        }
        
        .print-summary-label {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .print-summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #212529;
        }
        
        .print-footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 2px solid #dee2e6;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
      `}</style>
      
      <div className="printable-container">
        {/* Header */}
        {title && (
          <div className="print-header">
            <h1 className="print-title">{title}</h1>
            {subtitle && <p className="print-subtitle">{subtitle}</p>}
            
            {headerInfo.length > 0 && (
              <div className="print-header-info">
                {headerInfo.map((info, index) => (
                  <div key={index} className="print-header-info-item">
                    <div className="print-header-info-label">{info.label}</div>
                    <div className="print-header-info-value">{info.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="print-content">
          {children}
        </div>
        
        {/* Footer */}
        <div className="print-footer">
          Generated on {new Date().toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default PrintableView;
