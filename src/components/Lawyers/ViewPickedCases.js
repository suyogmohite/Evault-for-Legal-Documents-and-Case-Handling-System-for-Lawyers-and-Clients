import { useEffect, useState } from "react";
import { getDatabase, ref as rtdbRef, get } from "firebase/database";
import { database } from "../../firebaseConfig";
import DashboardHeading from "../DashboardHeading";
import CaseCard from "../CaseCard";
import { FaSearch, FaSpinner, FaBriefcase } from "react-icons/fa";

function ViewPickedCases(props) {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch cases from Firebase that are taken by the current lawyer
  const fetchLawyerCasesFromFirebase = async () => {
    setLoading(true);
    try {
      // Make sure user details are available
      if (!props.userDetails || !props.userDetails[1]) {
        console.error("User details not available");
        setLoading(false);
        return;
      }

      // Reference to the Cases node in Firebase
      const casesRef = rtdbRef(database, "Cases");
      
      // Get all cases from Firebase
      const snapshot = await get(casesRef);
      
      if (snapshot.exists()) {
        const allCases = [];
        
        // Convert Firebase object to array
        snapshot.forEach((childSnapshot) => {
          const caseData = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          allCases.push(caseData);
        });
        
        // Filter cases taken by this lawyer
        const lawyerCases = allCases.filter(caseData => {
          // Check if case has lawyer phone number matching current user
          const lawyerPhone = caseData.lawyerPhoneNumber || 
                           (caseData.lawyerDetails && caseData.lawyerDetails.split("_")[1]);
          
          return lawyerPhone === props.userDetails[1];
        });
        
        // Set the cases
        setCases(lawyerCases);
        setFilteredCases(lawyerCases);
        console.log("Lawyer's Cases:", lawyerCases);
      } else {
        console.log("No cases found in Firebase");
        setCases([]);
        setFilteredCases([]);
      }
    } catch (error) {
      console.error("Error fetching lawyer cases from Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    filterCases(value);
  };

  // Function to filter cases based on keyword
  const filterCases = (keyword) => {
    if (!keyword.trim()) {
      setFilteredCases(cases);
      return;
    }
    
    const filtered = cases.filter((caseData) => {
      // Search in case ID
      const caseId = caseData.caseId || 
                    (caseData.titleDescription && caseData.titleDescription.split("_")[2]) || 
                    "";
      
      // Search in case title
      const caseTitle = caseData.caseTitle || 
                       (caseData.titleDescription && caseData.titleDescription.split("_")[0]) || 
                       "";
      
      // Search in case type
      const caseType = caseData.caseType || "";
      
      // Search in client name
      const clientName = caseData.fullName || 
                        (caseData.fullNameAndPhoneNumber && caseData.fullNameAndPhoneNumber.split("_")[0]) || 
                        "";
      
      // Search in client phone
      const clientPhone = caseData.phoneNumber || 
                         (caseData.fullNameAndPhoneNumber && caseData.fullNameAndPhoneNumber.split("_")[1]) || 
                         "";
      
      const searchTerm = keyword.toLowerCase();
      
      return caseId.toLowerCase().includes(searchTerm) ||
             caseTitle.toLowerCase().includes(searchTerm) ||
             caseType.toLowerCase().includes(searchTerm) ||
             clientName.toLowerCase().includes(searchTerm) ||
             clientPhone.toLowerCase().includes(searchTerm);
    });
    
    setFilteredCases(filtered);
  };

  useEffect(() => {
    fetchLawyerCasesFromFirebase();
  }, [props.userDetails]);

  return (
    <>
      <DashboardHeading text={"Your Cases"} />
      <div className="container-fluid mt-4" style={{ marginBottom: "30%" }}>
        {/* Search Bar */}
        <div className="card mb-4" style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #333" }}>
          <div className="card-body">
            <div className="input-group">
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
                onChange={handleSearchChange} 
                value={keyword} 
                placeholder="Search by case ID, title, client name, or phone number..." 
                style={{ 
                  backgroundColor: "#222", 
                  color: "#fff",
                  border: "1px solid #444"
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
            <div className="text-center">
              <FaSpinner className="fa-spin mb-2" style={{ fontSize: "2rem", color: "#0077FF" }} />
              <p className="text-muted">Loading your cases...</p>
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="alert" style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #333", padding: "30px" }}>
            <div className="text-center">
              <FaBriefcase style={{ fontSize: "2rem", color: "#666", marginBottom: "15px" }} />
              <h5 style={{ color: "#fff" }}>No Cases Found</h5>
              <p className="mb-0">
                {keyword ? "No cases match your search criteria." : "You haven't taken any cases yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="row">
            {filteredCases.map((caseData) => (
              <div key={caseData.id} className="col-md-4 mb-4">
                <CaseCard
                  hideSensative={true}
                  isclient={false}
                  showtake={false}
                  showclose={true}
                  setcurrentCase={props.setcurrentCase}
                  setcurrentCaseName={props.setcurrentCaseName}
                  caseData={caseData}
                  CaseId={caseData.caseId}
                  userDetails={props.userDetails}
                  showchat={true}
                  firebaseId={caseData.id} // Pass Firebase ID to CaseCard
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ViewPickedCases;