import React from 'react';
import { FaPlus, FaCheck, FaFileAlt, FaGavel, FaUserShield, FaChartLine } from 'react-icons/fa';
import DashboardHeading from '../DashboardHeading';
import { Link } from 'react-router-dom';

function ClientHome() {
 

  return (
    <>
      <div className="container mt-4">
        {/* Dashboard Header */}
        <div className="card mb-4" style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #333" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-0" style={{ color: "#fff", fontSize: "28px" }}>
                  <FaUserShield className="me-3" style={{ color: "#0077FF" }} />
                  Client Dashboard
                </h2>
                <p className="text-muted mt-2 mb-0" style={{ color: "#aaa !important" }}>
                  Welcome to Legal Vault - Your case management portal
                </p>
              </div>
              <div className="text-end">
                <p className="mb-0" style={{ color: "#aaa" }}>
                  Today: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Main Actions */}
        <div className="row mt-4">
          <div className="col-md-6 mb-4">
            <div 
              className="card h-100" 
              style={{ 
                backgroundColor: "#000", 
                color: "#fff", 
                border: "1px solid #333",
                transition: "transform 0.3s ease, box-shadow 0.3s ease"
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 119, 255, 0.2)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="card-body text-center p-5">
                <div 
                  className="icon-circle mb-4 mx-auto d-flex align-items-center justify-content-center"
                  style={{ 
                    backgroundColor: "#0077FF20", 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%" 
                  }}
                >
                  <FaPlus style={{ fontSize: "32px", color: "#0077FF" }} />
                </div>
                <h4 className="card-title" style={{ color: "#fff" }}>Submit New Case</h4>
                <p className="card-text mb-4" style={{ color: "#aaa" }}>
                  Create and submit a new legal case with all required documentation
                </p>
                <Link 
                  to="/client-add-case" 
                  className="btn btn-lg w-100" 
                  style={{ 
                    backgroundColor: "#0077FF", 
                    color: "#fff",
                    border: "none"
                  }}
                >
                  <FaPlus className="me-2" />
                  Add New Case
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div 
              className="card h-100" 
              style={{ 
                backgroundColor: "#000", 
                color: "#fff", 
                border: "1px solid #333",
                transition: "transform 0.3s ease, box-shadow 0.3s ease"
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 179, 0, 0.2)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="card-body text-center p-5">
                <div 
                  className="icon-circle mb-4 mx-auto d-flex align-items-center justify-content-center"
                  style={{ 
                    backgroundColor: "#00b30020", 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%" 
                  }}
                >
                  <FaFileAlt style={{ fontSize: "32px", color: "#00b300" }} />
                </div>
                <h4 className="card-title" style={{ color: "#fff" }}>Track Case Status</h4>
                <p className="card-text mb-4" style={{ color: "#aaa" }}>
                  View updates, track progress, and monitor the status of your cases
                </p>
                <Link 
                  to="/client-case-status" 
                  className="btn btn-lg w-100" 
                  style={{ 
                    backgroundColor: "#00b300", 
                    color: "#fff",
                    border: "none"
                  }}
                >
                  <FaCheck className="me-2" />
                  View Case Status
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default ClientHome;