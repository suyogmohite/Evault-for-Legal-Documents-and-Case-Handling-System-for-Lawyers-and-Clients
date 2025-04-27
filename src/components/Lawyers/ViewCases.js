import { useEffect, useState } from "react";
import { getDatabase, ref as rtdbRef, onValue, get } from "firebase/database";
import { database } from "../../firebaseConfig";
import DashboardHeading from "../DashboardHeading";
import CaseCard from "../CaseCard";
import { ethers } from "ethers";
import { casesABI, casesAddress } from "../contractAddress";
import { FaSearch, FaSpinner } from "react-icons/fa";

function ViewCases(props) {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("firebase"); // "firebase" or "blockchain"

  // Function to fetch cases from Firebase
  const fetchCasesFromFirebase = async () => {
    setLoading(true);
    try {
      // Reference to the Cases node in Firebase
      const casesRef = rtdbRef(database, "Cases");
      
      // Get all cases from Firebase
      const snapshot = await get(casesRef);
      
      if (snapshot.exists()) {
        const casesData = [];
        
        // Convert Firebase object to array and add the Firebase key as id
        snapshot.forEach((childSnapshot) => {
          const caseData = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          casesData.push(caseData);
        });
        
        // Set the cases
        setCases(casesData);
        setFilteredCases(casesData);
        console.log("Firebase Cases Data:", casesData);
      } else {
        console.log("No cases found in Firebase");
        setCases([]);
        setFilteredCases([]);
      }
    } catch (error) {
      console.error("Error fetching cases from Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch cases from Blockchain (keeping as fallback)
  const fetchCasesFromBlockchain = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const caseContract = new ethers.Contract(
          casesAddress,
          casesABI,
          signer
        );
        const arraylist = await caseContract.getAllCases();
        const caseIds = await caseContract.getAllCaseIds();

        const blockchainCases = [];
        for (let i = 0; i < arraylist.length; i++) {
          blockchainCases.push({
            ...arraylist[i],
            blockchainId: caseIds[i]
          });
        }
        
        setCases(blockchainCases);
        setFilteredCases(blockchainCases);
        console.log("Blockchain Cases Data:", blockchainCases);
      }
    } catch (error) {
      console.error("Error fetching cases from blockchain:", error);
    } finally {
      setLoading(false);
    }
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

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    filterCases(value);
  };

  // Toggle data source (for testing purposes)
  const toggleDataSource = () => {
    const newSource = dataSource === "firebase" ? "blockchain" : "firebase";
    setDataSource(newSource);
    
    if (newSource === "firebase") {
      fetchCasesFromFirebase();
    } else {
      fetchCasesFromBlockchain();
    }
  };

  useEffect(() => {
    // Fetch cases based on the selected data source
    if (dataSource === "firebase") {
      fetchCasesFromFirebase();
    } else {
      fetchCasesFromBlockchain();
    }
  }, [dataSource]);

  return (
    <>
      <DashboardHeading text={"View Cases"} />
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
              <p className="text-muted">Loading cases...</p>
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="alert" style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #333" }}>
            <p className="mb-0 text-center">
              {keyword ? "No cases match your search criteria." : "No cases found."}
            </p>
          </div>
        ) : (
          <div className="row">
            {filteredCases.map((caseData, index) => (
              <div key={caseData.id || index} className="col-md-4 mb-4">
                <CaseCard
                  hideSensative={true}
                  showclose={true}
                  showchat={true}
                  showtake={true}
                  isclient={false}
                  setcurrentCase={props.setcurrentCase}
                  caseData={caseData}
                  CaseId={caseData.caseId || caseData.blockchainId}
                  userDetails={props.userDetails}
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

export default ViewCases;