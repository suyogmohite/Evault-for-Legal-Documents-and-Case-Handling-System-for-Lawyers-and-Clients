import {
  FaFile,
  FaCalendarAlt,
  FaUser,
  FaMapMarkedAlt,
  FaEnvelope,
  FaCheck,
  FaPhone,
  FaBriefcase,
  FaRegFileAlt,
  FaSnapchat,
  FaExternalLinkAlt,
  FaMoneyBillWave,
  FaLock,
  FaUserCircle,
  FaInfoCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlayCircle,
  FaSpinner
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { ref as rtdbRef, update, get } from "firebase/database";
import { database } from "../firebaseConfig";
import { toast } from "react-toastify";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { format } from "date-fns";
import MetaMaskAnimation from "./MetaMaskAnimation"; // Import the new animation component

function CaseCard({
  hideSensative,
  isclient,
  caseData,
  CaseId,
  userDetails,
  setcurrentCase,
  showtake,
  showclose,
  showchat,
  setcurrentCaseName,
  firebaseId
}) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    lawyerName: userDetails ? userDetails[0] : "",
    lawyerPhoneNumber: userDetails ? userDetails[1] : "",
    lawyerAddress: userDetails ? userDetails[3] : "",
  });
  const [amount, setAmount] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Add new state for MetaMask animation
  const [metaMaskModalVisible, setMetaMaskModalVisible] = useState(false);
  const [metaMaskStatus, setMetaMaskStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSubmessage, setStatusSubmessage] = useState("");

  // Helper functions to get case data properties
  const getCaseId = () => caseData?.caseId || "N/A";
  const getaddedBy = ()=> caseData?.addedBy || "";
  const getCaseTitle = () => caseData?.caseTitle || "N/A";
  const getCaseDescription = () => caseData?.caseDescription || "N/A";
  const getClientName = () => caseData?.fullName || "N/A";
  const getClientPhone = () => caseData?.phoneNumber || "N/A";
  const getClientAddress = () => caseData?.currentAddress || "N/A";
  const getCaseStatus = () => caseData?.status || "Pending";
  const getCaseType = () => caseData?.caseType || "N/A";

  const getDocuments = () => {
    if (!caseData) return ["", "", "", "", ""];
    return [
      caseData.mutationEntries || "",
      caseData.deedOfTitle || "",
      caseData.noEncumbranceCertificate || "",
      caseData.searchReport || "",
      caseData.charsheetWithStatementOfWitnesses || ""
    ];
  };

  const getLawyerName = () => caseData?.lawyerName || "";
  const getLawyerPhone = () => caseData?.lawyerPhoneNumber || "";
  const getLawyerAddress = () => caseData?.lawyerAddress || "";

  const getPaymentStatus = () => ({
    amount: caseData?.paymentAmount || "0",
    status: caseData?.paymentStatus || "not_initiated"
  });

  const isCaseClosed = () => {
    const status = getCaseStatus();
    return status === "Closed" || status === "Completed";
  };

  const getStatusColor = () => {
    const status = getCaseStatus();
    const closed = isCaseClosed();
    
    if (closed) return "#00b300"; // green for closed or completed
    
    switch (status.toLowerCase()) {
      case "submitted":
      case "pending verification":
      case "pending":
        return "#FFA500"; // orange for pending
      case "taken":
        return "#0077FF"; // blue for taken
      case "started":
      case "in progress":
        return "#0077FF"; // blue for in progress/started
      case "rejected":
        return "#dc3545"; // red for rejected
      default:
        return "#6c757d"; // gray for unknown
    }
  };

  const getStatusIcon = () => {
    const status = getCaseStatus();
    const closed = isCaseClosed();
    
    if (closed) return <FaCheckCircle className="me-1" />;
    
    switch (status.toLowerCase()) {
      case "submitted":
      case "pending verification":
      case "pending":
        return <FaHourglassHalf className="me-1" />;
      case "taken":
        return <FaBriefcase className="me-1" />;
      case "started":
      case "in progress":
        return <FaPlayCircle className="me-1" />;
      case "rejected":
        return <FaExclamationTriangle className="me-1" />;
      default:
        return <FaHourglassHalf className="me-1" />;
    }
  };

  const getSubmissionDate = () => {
    if (caseData?.submittedAt) {
      try {
        return format(new Date(caseData.submittedAt), "MMM dd, yyyy");
      } catch (error) {
        return "N/A";
      }
    }
    return "N/A";
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const handleModalShow = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  // Handle payment and case closure with MetaMask animation
  const handleCloseCase = async (caseId) => {
    // Show MetaMask modal
    setMetaMaskModalVisible(true);
    setMetaMaskStatus("connecting");
    setStatusMessage("Connecting to MetaMask...");
    setStatusSubmessage("Please confirm in your wallet");
    
    try {
      // Simulate connecting to MetaMask (2 seconds)
      setTimeout(async () => {
        try {
          // Check if MetaMask is installed
          if (typeof window.ethereum === 'undefined') {
            setMetaMaskStatus("error");
            setStatusMessage("MetaMask Not Found");
            setStatusSubmessage("Please install MetaMask to continue");
            
            setTimeout(() => {
              setMetaMaskModalVisible(false);
              toast.error("MetaMask is not installed. Please install MetaMask to continue.");
            }, 2000);
            return;
          }
          
          // Connected successfully
          setMetaMaskStatus("connected");
          setStatusMessage("Wallet Connected!");
          setStatusSubmessage(isclient ? "Preparing to complete payment..." : "Preparing payment request...");
          
          // Wait 2 seconds before proceeding
          setTimeout(async () => {
            setMetaMaskStatus("submitting");
            setStatusMessage(isclient ? "Processing Payment..." : "Submitting Request...");
            setStatusSubmessage("Please wait while we complete your transaction");
            
            // Reference to the case in the database
            const caseRef = rtdbRef(database, `Cases/${firebaseId}`);
            
            let updates = {};
            if (isclient) {
              // Client confirming payment
              updates = {
                paymentStatus: "completed",
                status: "Completed",
                closedAt: new Date().toISOString()
              };
              
              // Wait 3 seconds to simulate transaction
              setTimeout(async () => {
                try {
                  await update(caseRef, updates);
                  
                  // Show success state
                  setMetaMaskStatus("success");
                  setStatusMessage("Payment Successful!");
                  setStatusSubmessage("Your case has been closed successfully");
                  
                  // Close modal after 2 seconds and refresh
                  setTimeout(() => {
                    setMetaMaskModalVisible(false);
                    toast.success("Case closed and payment completed successfully.");
                    window.location.reload();
                  }, 2000);
                } catch (error) {
                  setMetaMaskStatus("error");
                  setStatusMessage("Transaction Failed");
                  setStatusSubmessage("There was an error processing your payment");
                  
                  // Close modal after 2 seconds
                  setTimeout(() => {
                    setMetaMaskModalVisible(false);
                    toast.error("Error processing payment. Please try again.");
                  }, 2000);
                }
              }, 3000);
            } else {
              // Lawyer requesting payment
              if (!amount || parseFloat(amount) <= 0) {
                setMetaMaskStatus("error");
                setStatusMessage("Invalid Amount");
                setStatusSubmessage("Please enter a valid payment amount");
                
                // Close modal after 2 seconds
                setTimeout(() => {
                  setMetaMaskModalVisible(false);
                  toast.error("Please enter a valid payment amount.");
                }, 2000);
                return;
              }
              
              updates = {
                paymentAmount: amount,
                paymentStatus: "pending",
                paymentRequestedAt: new Date().toISOString()
              };
              
              // Wait 2 seconds to simulate transaction
              setTimeout(async () => {
                try {
                  await update(caseRef, updates);
                  
                  // Show success state
                  setMetaMaskStatus("success");
                  setStatusMessage("Request Submitted!");
                  setStatusSubmessage("Payment request sent to client successfully");
                  
                  // Close modal after 2 seconds and refresh
                  setTimeout(() => {
                    setMetaMaskModalVisible(false);
                    toast.success("Payment request sent to client successfully.");
                    window.location.reload();
                  }, 2000);
                } catch (error) {
                  setMetaMaskStatus("error");
                  setStatusMessage("Request Failed");
                  setStatusSubmessage("There was an error sending your payment request");
                  
                  // Close modal after 2 seconds
                  setTimeout(() => {
                    setMetaMaskModalVisible(false);
                    toast.error("Error processing payment request. Please try again.");
                  }, 2000);
                }
              }, 2000);
            }
          }, 2000);
        } catch (error) {
          setMetaMaskStatus("error");
          setStatusMessage("Connection Error");
          setStatusSubmessage("Failed to connect to MetaMask");
          
          setTimeout(() => {
            setMetaMaskModalVisible(false);
            toast.error("Error connecting to MetaMask. Please try again.");
          }, 2000);
        }
      }, 2000);
    } catch (error) {
      console.error("Error updating payment status:", error);
      setMetaMaskStatus("error");
      setStatusMessage("Transaction Error");
      setStatusSubmessage("An unexpected error occurred");
      
      setTimeout(() => {
        setMetaMaskModalVisible(false);
        toast.error("Error processing payment action. Please try again.");
      }, 2000);
    }
  };

  // Start the case (with MetaMask animation)
  const handleStartCase = async () => {
    // Show MetaMask modal
    setMetaMaskModalVisible(true);
    setMetaMaskStatus("connecting");
    setStatusMessage("Connecting to MetaMask...");
    setStatusSubmessage("Please confirm in your wallet");
    
    try {
      // Simulate connecting to MetaMask (2 seconds)
      setTimeout(async () => {
        try {
          // Check if MetaMask is installed
          if (typeof window.ethereum === 'undefined') {
            setMetaMaskStatus("error");
            setStatusMessage("MetaMask Not Found");
            setStatusSubmessage("Please install MetaMask to continue");
            
            setTimeout(() => {
              setMetaMaskModalVisible(false);
              toast.error("MetaMask is not installed. Please install MetaMask to continue.");
            }, 2000);
            return;
          }
          
          // Connected successfully
          setMetaMaskStatus("connected");
          setStatusMessage("Wallet Connected!");
          setStatusSubmessage("Preparing to start case...");
          
          // Wait 2 seconds before proceeding
          setTimeout(async () => {
            setMetaMaskStatus("submitting");
            setStatusMessage("Starting Case...");
            setStatusSubmessage("Please wait while we update the case status");
            
            // Reference to the case in the database
            const caseRef = rtdbRef(database, `Cases/${firebaseId}`);
            const updates = {
              status: "Started",
              startedAt: new Date().toISOString()
            };
            
            // Wait 2 seconds to simulate transaction
            setTimeout(async () => {
              try {
                await update(caseRef, updates);
                
                // Show success state
                setMetaMaskStatus("success");
                setStatusMessage("Case Started!");
                setStatusSubmessage("The case has been started successfully");
                
                // Close modal after 2 seconds and refresh
                setTimeout(() => {
                  setMetaMaskModalVisible(false);
                  toast.success("Case has been started successfully.");
                  window.location.reload();
                }, 2000);
              } catch (error) {
                setMetaMaskStatus("error");
                setStatusMessage("Transaction Failed");
                setStatusSubmessage("There was an error starting the case");
                
                // Close modal after 2 seconds
                setTimeout(() => {
                  setMetaMaskModalVisible(false);
                  toast.error("Error starting case. Please try again.");
                }, 2000);
              }
            }, 2000);
          }, 2000);
        } catch (error) {
          setMetaMaskStatus("error");
          setStatusMessage("Connection Error");
          setStatusSubmessage("Failed to connect to MetaMask");
          
          setTimeout(() => {
            setMetaMaskModalVisible(false);
            toast.error("Error connecting to MetaMask. Please try again.");
          }, 2000);
        }
      }, 2000);
    } catch (error) {
      console.error("Error starting case:", error);
      setMetaMaskStatus("error");
      setStatusMessage("Transaction Error");
      setStatusSubmessage("An unexpected error occurred");
      
      setTimeout(() => {
        setMetaMaskModalVisible(false);
        toast.error("Error starting case. Please try again.");
      }, 2000);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Update case when lawyer takes it (with MetaMask animation)
  const handleUpdateCaseFirebase = async () => {
    // Close the current modal
    handleModalClose();
    
    // Show MetaMask modal
    setMetaMaskModalVisible(true);
    setMetaMaskStatus("connecting");
    setStatusMessage("Connecting to MetaMask...");
    setStatusSubmessage("Please confirm in your wallet");
    
    try {
      // Simulate connecting to MetaMask (2 seconds)
      setTimeout(async () => {
        try {
          // Check if MetaMask is installed
          if (typeof window.ethereum === 'undefined') {
            setMetaMaskStatus("error");
            setStatusMessage("MetaMask Not Found");
            setStatusSubmessage("Please install MetaMask to continue");
            
            setTimeout(() => {
              setMetaMaskModalVisible(false);
              toast.error("MetaMask is not installed. Please install MetaMask to continue.");
            }, 2000);
            return;
          }
          
          // Connected successfully
          setMetaMaskStatus("connected");
          setStatusMessage("Wallet Connected!");
          setStatusSubmessage("Preparing to take case...");
          
          // Wait 2 seconds before proceeding
          setTimeout(async () => {
            setMetaMaskStatus("submitting");
            setStatusMessage("Taking Case...");
            setStatusSubmessage("Please wait while we update the case status");
            
            // Reference to the case in the database
            const caseRef = rtdbRef(database, `Cases/${firebaseId}`);
            const updates = {
              lawyerName: formData.lawyerName,
              lawyerPhoneNumber: formData.lawyerPhoneNumber,
              lawyerAddress: formData.lawyerAddress,
              status: "Taken",
              takenAt: new Date().toISOString()
            };
            
            // Wait 2 seconds to simulate transaction
            setTimeout(async () => {
              try {
                await update(caseRef, updates);
                
                // Show success state
                setMetaMaskStatus("success");
                setStatusMessage("Case Taken!");
                setStatusSubmessage("You have successfully taken this case");
                
                // Close modal after 2 seconds and refresh
                setTimeout(() => {
                  setMetaMaskModalVisible(false);
                  toast.success("Case taken successfully.");
                  window.location.reload();
                }, 2000);
              } catch (error) {
                setMetaMaskStatus("error");
                setStatusMessage("Transaction Failed");
                setStatusSubmessage("There was an error taking the case");
                
                // Close modal after 2 seconds
                setTimeout(() => {
                  setMetaMaskModalVisible(false);
                  toast.error("Error taking case. Please try again.");
                }, 2000);
              }
            }, 2000);
          }, 2000);
        } catch (error) {
          setMetaMaskStatus("error");
          setStatusMessage("Connection Error");
          setStatusSubmessage("Failed to connect to MetaMask");
          
          setTimeout(() => {
            setMetaMaskModalVisible(false);
            toast.error("Error connecting to MetaMask. Please try again.");
          }, 2000);
        }
      }, 2000);
    } catch (error) {
      console.error("Error updating case in Firebase:", error);
      setMetaMaskStatus("error");
      setStatusMessage("Transaction Error");
      setStatusSubmessage("An unexpected error occurred");
      
      setTimeout(() => {
        setMetaMaskModalVisible(false);
        toast.error("Error taking case. Please try again.");
      }, 2000);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const setcurrentCasehandle = () => {
    const caseId = getCaseId();
    const caseName = getCaseTitle();
    
    if (setcurrentCase) {
      setcurrentCase(caseData);
    }
    
    if (setcurrentCaseName && caseName) {
      setcurrentCaseName(caseName);
    }
    
    // Store Firebase ID for reference
    if (firebaseId) {
      localStorage.setItem("selectedCaseFirebaseId", firebaseId);
    }
    
    // Store case ID for reference
    localStorage.setItem("selectedCaseId", caseId);
  };

  // Extract data using helper functions
  const caseId = getCaseId();
  const addedBy = getaddedBy();
  const caseTitle = getCaseTitle();
  const caseDesc = getCaseDescription();
  const clientName = getClientName();
  const clientPhone = getClientPhone();
  const caseStatus = getCaseStatus();
  const statusColor = getStatusColor();
  const StatusIcon = getStatusIcon();
  const documents = getDocuments();
  const lawyerName = getLawyerName();
  const lawyerPhone = getLawyerPhone();
  const lawyerAddress = getLawyerAddress();
  const paymentStatus = getPaymentStatus();
  const closed = isCaseClosed();

  return (
    <div 
      className="card h-100" 
      style={{ 
        backgroundColor: "#000", 
        color: "#fff", 
        border: "1px solid #333",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      {/* Card Header */}
      <div 
        className="card-header d-flex justify-content-between align-items-center" 
        style={{ 
          backgroundColor: "#111", 
          borderBottom: "1px solid #333",
          padding: "15px"
        }}
      >
        <div>
          <h5 
            className="mb-0" 
            style={{ 
              color: "#fff", 
              fontWeight: "600" 
            }}
          >
            {caseTitle}
          </h5>
          <small 
            className="text-muted" 
            style={{ 
              color: "#aaa !important" 
            }}
          >
            Case ID: {caseId}
          </small>
        </div>
        
        <div className="d-flex">
          {showchat && !closed && (
            <Link 
              to={isclient ? "/chat" : "/chat"}
              onClick={setcurrentCasehandle}
              className="btn btn-sm me-2 mr-2"
              style={{
                backgroundColor: "#0077FF",
                color: "#fff",
                border: "none"
              }}
              title="Chat about case"
            >
              <FaSnapchat className="me-1" /> Chat
            </Link>
          )}
          <span 
            className="badge" 
            style={{ 
              backgroundColor: statusColor,
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            {StatusIcon} {caseStatus}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div 
        className="card-body" 
        style={{ 
          padding: "20px" 
        }}
      >
        {/* Client Info Section */}
        <div 
          className="mb-3 p-3" 
          style={{ 
            backgroundColor: "#111", 
            borderRadius: "8px" 
          }}
        >
          <div 
            className="d-flex justify-content-between align-items-center mb-2" 
            style={{ 
              cursor: "pointer" 
            }}
            onClick={() => toggleSection('client')}
          >
            <h6 className="mb-0" style={{ color: "#0077FF" }}>
              <FaUser className="me-2" /> Client Information
            </h6>
            <span>{expandedSection === 'client' ? '−' : '+'}</span>
          </div>
          
          {(expandedSection === 'client') && (
            <div className="mt-3">
              <div className="row mb-2">
                <div className="col-md-4" style={{ color: "#aaa" }}>Name:</div>
                <div className="col-md-8">{clientName}</div>
              </div>
              <div className="row mb-2">
                <div className="col-md-4" style={{ color: "#aaa" }}>Phone:</div>
                <div className="col-md-8">{clientPhone}</div>
              </div>
              <div className="row mb-2">
                <div className="col-md-4" style={{ color: "#aaa" }}>Address:</div>
                <div className="col-md-8">{getClientAddress()}</div>
              </div>
              {caseData?.submittedAt && (
                <div className="row mb-2">
                  <div className="col-md-4" style={{ color: "#aaa" }}>Submitted:</div>
                  <div className="col-md-8">{getSubmissionDate()}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Case Details Section */}
        <div 
          className="mb-3 p-3" 
          style={{ 
            backgroundColor: "#111", 
            borderRadius: "8px" 
          }}
        >
          <div 
            className="d-flex justify-content-between align-items-center mb-2" 
            style={{ 
              cursor: "pointer" 
            }}
            onClick={() => toggleSection('details')}
          >
            <h6 className="mb-0" style={{ color: "#0077FF" }}>
              <FaRegFileAlt className="me-2" /> Case Details
            </h6>
            <span>{expandedSection === 'details' ? '−' : '+'}</span>
          </div>
          
          {(expandedSection === 'details') && (
            <div className="mt-3">
              <div className="row mb-2">
                <div className="col-md-4" style={{ color: "#aaa" }}>Type:</div>
                <div className="col-md-8">
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: "#333", 
                      color: "#fff" 
                    }}
                  >
                    {getCaseType()}
                  </span>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-4" style={{ color: "#aaa" }}>Description:</div>
                <div className="col-md-8">{caseDesc}</div>
              </div>
              <div className="row mb-2">
                <div className="col-md-4" style={{ color: "#aaa" }}>FIR Reference:</div>
                <div className="col-md-8">{caseData?.copyOfFIR || "N/A"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div 
          className="mb-3 p-3" 
          style={{ 
            backgroundColor: "#111", 
            borderRadius: "8px" 
          }}
        >
          <div 
            className="d-flex justify-content-between align-items-center mb-2" 
            style={{ 
              cursor: "pointer" 
            }}
            onClick={() => toggleSection('documents')}
          >
            <h6 className="mb-0" style={{ color: "#0077FF" }}>
              <FaFile className="me-2" /> Supporting Documents
            </h6>
            <span>{expandedSection === 'documents' ? '−' : '+'}</span>
          </div>
          
          {(expandedSection === 'documents') && (
            <div className="mt-3">
              <div className="row mb-3">
                <div className="col-md-6">
                  <a
                    href={documents[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm w-100"
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444",
                      textAlign: "left",
                      pointerEvents: documents[0] ? "auto" : "none",
                      opacity: documents[0] ? 1 : 0.5
                    }}
                  >
                    <FaFile className="me-2" /> Mutation Entries
                    <FaExternalLinkAlt style={{ float: "right", marginTop: "4px" }} />
                  </a>
                </div>
                <div className="col-md-6">
                  <a
                    href={documents[1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm w-100"
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444",
                      textAlign: "left",
                      pointerEvents: documents[1] ? "auto" : "none",
                      opacity: documents[1] ? 1 : 0.5
                    }}
                  >
                    <FaFile className="me-2" /> Deed of Title
                    <FaExternalLinkAlt style={{ float: "right", marginTop: "4px" }} />
                  </a>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <a
                    href={documents[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm w-100"
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444",
                      textAlign: "left",
                      pointerEvents: documents[2] ? "auto" : "none",
                      opacity: documents[2] ? 1 : 0.5
                    }}
                  >
                    <FaFile className="me-2" /> No Encumbrance Certificate
                    <FaExternalLinkAlt style={{ float: "right", marginTop: "4px" }} />
                  </a>
                </div>
                <div className="col-md-6">
                  <a
                    href={documents[3]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm w-100"
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444",
                      textAlign: "left",
                      pointerEvents: documents[3] ? "auto" : "none",
                      opacity: documents[3] ? 1 : 0.5
                    }}
                  >
                    <FaFile className="me-2" /> Search Report
                    <FaExternalLinkAlt style={{ float: "right", marginTop: "4px" }} />
                  </a>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <a
                    href={documents[4]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm w-100"
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444",
                      textAlign: "left",
                      pointerEvents: documents[4] ? "auto" : "none",
                      opacity: documents[4] ? 1 : 0.5
                    }}
                  >
                    <FaFile className="me-2" /> Charsheet with Statement of Witnesses
                    <FaExternalLinkAlt style={{ float: "right", marginTop: "4px" }} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lawyer Details Section (if available) */}
        {lawyerName && !showtake && (
          <div 
            className="mb-3 p-3" 
            style={{ 
              backgroundColor: "#111", 
              borderRadius: "8px" 
            }}
          >
            <div 
              className="d-flex justify-content-between align-items-center mb-2" 
              style={{ 
                cursor: "pointer" 
              }}
              onClick={() => toggleSection('lawyer')}
            >
              <h6 className="mb-0" style={{ color: "#0077FF" }}>
                <FaUserCircle className="me-2" /> Lawyer Information
              </h6>
              <span>{expandedSection === 'lawyer' ? '−' : '+'}</span>
            </div>
            
            {(expandedSection === 'lawyer') && (
              <div className="mt-3">
                <div className="row mb-2">
                  <div className="col-md-4" style={{ color: "#aaa" }}>Name:</div>
                  <div className="col-md-8">{lawyerName}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-md-4" style={{ color: "#aaa" }}>Phone:</div>
                  <div className="col-md-8">{lawyerPhone}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-md-4" style={{ color: "#aaa" }}>Address:</div>
                  <div className="col-md-8">{lawyerAddress}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer - Case Actions */}
      {/* Take Case Button for Lawyers */}
      {!isclient && showtake && !lawyerName && (
        <div 
          className="card-footer" 
          style={{ 
            backgroundColor: "#111", 
            borderTop: "1px solid #333",
            padding: "15px"
          }}
        >
          <Button 
            variant="primary" 
            onClick={handleModalShow}
            style={{ 
              backgroundColor: "#0077FF", 
              border: "none" 
            }}
          >
            <FaBriefcase className="me-2" /> Take Case
          </Button>
        </div>
      )}

      {/* Start Case Button for Lawyers */}
      {!isclient && caseStatus === "Taken" && (
        <div 
          className="card-footer" 
          style={{ 
            backgroundColor: "#111", 
            borderTop: "1px solid #333",
            padding: "15px"
          }}
        >
          <Button 
            variant="primary" 
            onClick={handleStartCase}
            style={{ 
              backgroundColor: "#0077FF", 
              border: "none" 
            }}
          >
            <FaPlayCircle className="me-2" /> Start Case
          </Button>
        </div>
      )}

      {/* Payment Status and Actions */}
      {hideSensative && (
        <>
          {/* Payment Completed Status */}
          {(paymentStatus.status === "completed" || caseStatus === "Completed") && (
            <div 
              className="card-footer" 
              style={{ 
                backgroundColor: "#00b30020", 
                borderTop: "1px solid #006600",
                color: "#fff"
              }}
            >
              <FaCheck className="me-2" style={{ color: "#00b300" }} />
              {isclient 
                ? `Payment completed and case closed`
                : `Payment received and case closed`
              }
              {paymentStatus.amount !== "0" && (
                <span> - <b>RS - {paymentStatus.amount}</b></span>
              )}
            </div>
          )}

          {/* Payment Pending Confirmation Status */}
          {isclient && paymentStatus.status === "pending" && (
            <div className="card-footer" style={{ backgroundColor: "#111", borderTop: "1px solid #333" }}>
              <div className="d-flex justify-content-between align-items-center">
                <Button 
                  variant="success" 
                  onClick={() => handleCloseCase(caseId)}
                  style={{ 
                    backgroundColor: "#00b300", 
                    border: "none",
                    flex: "1"
                  }}
                >
                  <FaMoneyBillWave className="me-2" /> Pay & Close Case
                </Button>
                <div 
                  className="mx-2 px-3 py-2 rounded" 
                  style={{ 
                    backgroundColor: "#222", 
                    color: "#fff",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <FaMoneyBillWave className="me-2" style={{ color: "#0077FF" }} />
                  <span>RS {paymentStatus.amount}</span>
                </div>
              </div>
              <div 
                className="mt-2" 
                style={{ 
                  backgroundColor: "#002244", 
                  padding: "10px", 
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <FaInfoCircle className="me-2" style={{ color: "#0077FF" }} />
                Click the button above to confirm payment and close this case
              </div>
            </div>
          )}

          {/* Payment Notification for Lawyer */}
          {!isclient && paymentStatus.status === "pending" && (
            <div 
              className="card-footer" 
              style={{ 
                backgroundColor: "#0077FF20", 
                borderTop: "1px solid #0055BB",
                color: "#fff"
              }}
            >
              <FaMoneyBillWave className="me-2" style={{ color: "#0077FF" }} />
              Payment of <b> RS- {paymentStatus.amount}</b> requested - awaiting client confirmation
            </div>
          )}

          {/* Lawyer Payment Request UI */}
          {!isclient && showclose && paymentStatus.status === "not_initiated" && (
            <div className="card-footer" style={{ backgroundColor: "#111", borderTop: "1px solid #333" }}>
              <div className="d-flex justify-content-between align-items-center">
                <Button 
                  variant="success" 
                  disabled={amount === ""}
                  onClick={() => handleCloseCase(caseId)}
                  style={{ 
                    backgroundColor: amount === "" ? "#333" : "#00b300", 
                    border: "none",
                    flex: "1"
                  }}
                >
                  <FaLock className="me-2" /> Request Payment
                </Button>
                <div 
                  className="input-group ms-2" 
                  style={{ 
                    width: "150px"
                  }}
                >
                  <div 
                    className="input-group-prepend"
                    style={{
                      display: "flex"
                    }}
                  >
                    <span 
                      className="input-group-text" 
                      style={{ 
                        backgroundColor: "#222", 
                        color: "#0077FF",
                        border: "1px solid #444"
                      }}
                    >
                      RS -
                    </span>
                  </div>
                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Amount"
                    style={{ 
                      backgroundColor: "#222", 
                      color: "#fff",
                      border: "1px solid #444"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          
        </>
      )}

      {/* Take Case Modal */}
      <Modal 
        show={showModal} 
        onHide={handleModalClose}
        backdrop="static"
        centered
      >
        <Modal.Header 
          closeButton
          style={{
            backgroundColor: "#111",
            borderBottom: "1px solid #333",
            color: "#fff"
          }}
        >
          <div>
            <Modal.Title>Confirm Case Assignment</Modal.Title>
            <small style={{ color: "#aaa" }}>Case ID: {caseId}</small>
          </div>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "20px"
          }}
        >
          <div className="mb-4">
            <h6 style={{ color: "#0077FF" }}>
              <FaUserCircle className="me-2" /> Lawyer Information
            </h6>
            <div 
              style={{
                backgroundColor: "#111",
                borderRadius: "8px",
                padding: "15px",
                marginTop: "10px"
              }}
            >
              <Form>
                <Form.Group controlId="lawyerName" className="mb-3">
                  <Form.Label style={{ color: "#aaa" }}>Lawyer Name</Form.Label>
                  <Form.Control
                    type="text"
                    disabled={true}
                    name="lawyerName"
                    value={formData.lawyerName}
                    onChange={handleInputChange}
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444"
                    }}
                  />
                </Form.Group>

                <Form.Group controlId="lawyerPhoneNumber" className="mb-3">
                  <Form.Label style={{ color: "#aaa" }}>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    disabled={true}
                    name="lawyerPhoneNumber"
                    value={formData.lawyerPhoneNumber}
                    onChange={handleInputChange}
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444"
                    }}
                  />
                </Form.Group>
   
                <Form.Group controlId="lawyerName" className="mb-3">
                  <Form.Label style={{ color: "#aaa" }}>Lawyer Address</Form.Label>
                  <Form.Control
                    type="text"
                    disabled={true}
                    name="lawyerAddress"
                    value={formData.lawyerAddress}
                    onChange={handleInputChange}
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid #444"
                    }}
                  />
                </Form.Group>
              </Form>
            </div>
          </div>

          <div 
            className="alert mb-0" 
            style={{ 
              backgroundColor: "#002244", 
              color: "#fff",
              border: "1px solid #003366" 
            }}
          >
            <FaInfoCircle className="me-2" style={{ color: "#0077FF" }} />
            By taking this case, you confirm that you have reviewed all submitted documents and accept responsibility for this legal matter.
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: "#111",
            borderTop: "1px solid #333"
          }}
        >
          <Button 
            variant="secondary" 
            onClick={handleModalClose}
            style={{
              backgroundColor: "#333",
              border: "none"
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateCaseFirebase}
            style={{
              backgroundColor: "#0077FF",
              border: "none"
            }}
          >
            <FaBriefcase className="me-2" /> Confirm & Take Case
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MetaMask Animation Modal */}
      {metaMaskModalVisible && (
        <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
      )}
      <div className={`modal ${metaMaskModalVisible ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content" style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #444' }}>
              <h5 className="modal-title">
                {statusMessage || "Processing..."}
              </h5>
            </div>
            <div className="modal-body text-center py-4">
              <MetaMaskAnimation 
                status={metaMaskStatus} 
                message={statusMessage}
                submessage={statusSubmessage}
              />
            </div>
            
            {metaMaskStatus === "error" && (
              <div className="modal-footer" style={{ borderTop: '1px solid #444' }}>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setMetaMaskModalVisible(false)}
                  style={{ backgroundColor: "#333", color: "#fff" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseCard;