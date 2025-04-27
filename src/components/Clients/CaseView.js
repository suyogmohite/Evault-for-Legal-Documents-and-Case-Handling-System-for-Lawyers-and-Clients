import React from "react";
import { useEffect, useState } from "react";
import { ref as rtdbRef, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../firebaseConfig";
import DashboardHeading from "../DashboardHeading";
import CaseCard from "../CaseCard";
import { FaSearch, FaFilter, FaFolder, FaFolderOpen, FaSortAmountDown, FaSortAmountUp, FaSpinner, FaCalendarAlt } from "react-icons/fa";

function CaseView(props) {
  const [cases, setCases] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc"); 
  const [filterStatus, setFilterStatus] = useState("all"); 


  const fetchCasesFromMetaMask = async () => {
    setLoading(true);
    try {
      const casesRef = rtdbRef(database, "Cases");
      
      // Get all cases from Blockchain
      const snapshot = await get(casesRef);
      
      if (snapshot.exists()) {
        const casesData = [];
        
        // Convert Blockchain object to array and add the Blockchain key as id
        // Only include cases where addedBy matches props.userDetails[1]
        snapshot.forEach((childSnapshot) => {
          const caseData = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          
          // Filter to only include cases that match the current user's addedBy value
          if (caseData.addedBy === props.userDetails[1]) {
            casesData.push(caseData);
          }
        });
        
        // Set the cases
        setCases(casesData);
        setFilteredCases(casesData);
        
        if (casesData.length === 0) {
          console.log("No cases found for this user");
        }
      } else {
        console.log("No cases found in Blockchain");
        setCases([]);
        setFilteredCases([]);
      }
    } catch (error) {
      console.error("Error fetching cases from Blockchain:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases specific to a client
  const fetchClientCases = async () => {
    setLoading(true);
    try {
      // Reference to the Cases node in Blockchain
      const casesRef = rtdbRef(database, "Cases");
      
      // Get cases for this client
      const snapshot = await get(casesRef);
      
      if (snapshot.exists()) {
        const casesData = [];
        
        // Convert Blockchain object to array and filter for the current client
        snapshot.forEach((childSnapshot) => {
          const caseData = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          
          // Check if this case belongs to the current client
          if (props.isclient && props.userDetails && props.userDetails[1] === caseData.phoneNumber) {
            casesData.push(caseData);
          }
        });
        
        // Set the cases
        setCases(casesData);
        setFilteredCases(casesData);
      } else {
        console.log("No cases found for this client");
        setCases([]);
        setFilteredCases([]);
      }
    } catch (error) {
      console.error("Error fetching client cases from Blockchain:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting of cases
  const handleSort = () => {
    const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newSortOrder);
  };

  // Handle filtering by status
  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  // Get filtered and sorted cases
  const getFilteredAndSortedCases = () => {
    // First apply search filter
    let result = cases.filter((caseData) => {
      const caseId = caseData.caseId || "";
      const caseTitle = caseData.caseTitle || "";
      const caseType = caseData.caseType || "";
      const clientName = caseData.fullName || "";
      
      return (
        caseId.toLowerCase().includes(keyword.toLowerCase()) ||
        caseTitle.toLowerCase().includes(keyword.toLowerCase()) ||
        caseType.toLowerCase().includes(keyword.toLowerCase()) ||
        clientName.toLowerCase().includes(keyword.toLowerCase())
      );
    });
    
    // Then apply status filter
    result = result.filter((caseData) => {
      const status = caseData.status || "";
      
      if (filterStatus === "all") return true;
      
      if (filterStatus === "closed") {
        return status === "Closed" || status === "Completed";
      }
      
      if (filterStatus === "open") {
        return status !== "Closed" && status !== "Completed";
      }
      
      if (filterStatus === "pending") {
        return status === "Pending" || status === "Pending Verification" || status === "Submitted";
      }
      
      if (filterStatus === "active") {
        return status === "Taken" || status === "Started" || status === "In Progress";
      }
      
      return status.toLowerCase() === filterStatus.toLowerCase();
    });
    
    // Finally apply sorting
    result.sort((a, b) => {
      // Use submittedAt date for sorting if available
      const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0);
      const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0);
      
      if (sortOrder === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    return result;
  };

  useEffect(() => {
    // If the user is a client, fetch only their cases
    if (props.isclient && props.userDetails && props.userDetails.length > 1) {
      fetchClientCases();
    } else {
      // Otherwise fetch all cases (for admin or lawyer view)
      fetchCasesFromMetaMask();
    }
  }, [props.userDetails]);

  // Update filtered cases when search keyword, filter status, or sort order changes
  useEffect(() => {
    const filtered = getFilteredAndSortedCases();
    setFilteredCases(filtered);
  }, [keyword, filterStatus, sortOrder, cases]);

  return (
    <>
      <div className="container-fluid mt-4" style={{ marginBottom: "50px" }}>
        {/* Dashboard Header */}
        <div 
          className="card mb-4" 
          style={{ 
            backgroundColor: "#000", 
            color: "#fff", 
            border: "1px solid #333" 
          }}
        >
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0" style={{ color: "#fff" }}>
                <FaFolder className="me-3" style={{ color: "#0077FF" }} />
                Your Cases
              </h2>
              <p className="text-muted mt-2 mb-0" style={{ color: "#aaa !important" }}>
                View and manage all your legal cases
              </p>
            </div>
            <div className="d-flex">
              <button 
                className="btn me-2" 
                onClick={handleSort}
                style={{ 
                  backgroundColor: "#333", 
                  color: "#fff",
                  border: "none"
                }}
              >
                {sortOrder === "desc" ? (
                  <><FaSortAmountDown className="me-2" /> Newest First</>
                ) : (
                  <><FaSortAmountUp className="me-2" /> Oldest First</>
                )}
              </button>
              <div className="dropdown">
                <button 
                  className="btn dropdown-toggle" 
                  type="button" 
                  id="filterDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{ 
                    backgroundColor: "#333", 
                    color: "#fff",
                    border: "none"
                  }}
                >
                  <FaFilter className="me-2" />
                  {filterStatus === "all" ? "All Cases" : 
                   filterStatus === "open" ? "Open Cases" : 
                   filterStatus === "active" ? "Active Cases" :
                   filterStatus === "pending" ? "Pending Cases" :
                   filterStatus === "closed" ? "Closed Cases" : 
                   `${filterStatus} Cases`}
                </button>
                <ul 
                  className="dropdown-menu" 
                  aria-labelledby="filterDropdown"
                  style={{ 
                    backgroundColor: "#222", 
                    border: "1px solid #444" 
                  }}
                >
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleFilterChange("all")}
                      style={{ color: "#fff" }}
                    >
                      All Cases
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleFilterChange("open")}
                      style={{ color: "#fff" }}
                    >
                      Open Cases
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleFilterChange("pending")}
                      style={{ color: "#fff" }}
                    >
                      Pending Cases
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleFilterChange("active")}
                      style={{ color: "#fff" }}
                    >
                      Active Cases
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleFilterChange("closed")}
                      style={{ color: "#fff" }}
                    >
                      Closed Cases
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Row */}
        <div 
          className="card mb-4" 
          style={{ 
            backgroundColor: "#000", 
            color: "#fff", 
            border: "1px solid #333" 
          }}
        >
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <div 
                  className="input-group mb-3" 
                  style={{ 
                    backgroundColor: "#000", 
                    border: "1px solid #333",
                    borderRadius: "4px"
                  }}
                >
                  <div className="input-group-prepend">
                    <span 
                      className="input-group-text" 
                      style={{ 
                        backgroundColor: "#222", 
                        color: "#fff",
                        border: "1px solid #444"
                      }}
                    >
                      <FaSearch />
                    </span>
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    onChange={(e) => setKeyword(e.target.value)} 
                    value={keyword} 
                    placeholder="Search by case ID, title, client name, or type..." 
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444"
                    }}
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="d-flex justify-content-end">
                  <div className="badge bg-primary me-2 d-flex align-items-center p-2">
                    <FaFolder className="me-1" /> Total: {cases.length}
                  </div>
                  
                  <div className="badge bg-success me-2 d-flex align-items-center p-2">
                    <FaCalendarAlt className="me-1" /> 
                    Active: {cases.filter(caseData => 
                      caseData.status === "Taken" || 
                      caseData.status === "Started" || 
                      caseData.status === "In Progress").length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Display */}
        {loading ? (
          <div 
            className="card" 
            style={{ 
              backgroundColor: "#000", 
              color: "#fff", 
              border: "1px solid #333" 
            }}
          >
            <div className="card-body text-center p-5">
              <FaSpinner className="fa-spin" style={{ fontSize: "48px", color: "#0077FF" }} />
              <p className="mt-3" style={{ color: "#aaa" }}>Loading your cases...</p>
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div 
            className="card" 
            style={{ 
              backgroundColor: "#000", 
              color: "#fff", 
              border: "1px solid #333" 
            }}
          >
            <div className="card-body text-center p-5">
              <FaFolderOpen style={{ fontSize: "48px", color: "#666", marginBottom: "20px" }} />
              <h4 style={{ color: "#fff" }}>No Cases Found</h4>
              <p style={{ color: "#aaa" }}>
                {keyword ? 
                  "No cases match your search criteria. Try different keywords." : 
                  "You don't have any cases yet. Create a new case to get started."}
              </p>
            </div>
          </div>
        ) : (
          <div className="row">
            {filteredCases.map((caseData) => (
              <div key={caseData.id} className="col-md-4 mb-4">
                <CaseCard
                  hideSensative={true}
                  isclient={true}
                  setcurrentCase={props.setcurrentCase}
                  caseData={caseData}
                  CaseId={caseData.caseId}
                  userDetails={props.userDetails}
                  showchat={true}
                  setcurrentCaseName={props.setcurrentCaseName}
                  firebaseId={caseData.id}
                  showtake={!props.isclient && caseData.status === "Pending Verification"}
                  showclose={!props.isclient && (caseData.status === "Started" || caseData.status === "In Progress")}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default CaseView;