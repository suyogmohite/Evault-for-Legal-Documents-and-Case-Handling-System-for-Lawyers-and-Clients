import { FaCheck, FaCalendarAlt, FaUpload, FaUserAlt, FaPhone, FaMapMarkerAlt, FaFileAlt, FaGavel, FaArrowLeft, FaArrowRight, FaWallet, FaSpinner } from "react-icons/fa";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getDatabase, ref as rtdbRef, push, set, get, update } from "firebase/database";
import { database, storage } from "../../firebaseConfig";
import DashboardHeading from "../DashboardHeading";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

function AddCaseForm(props) {
  const [formData, setFormData] = useState({
    addedBy:props.userDetails[1],
    fullName: "",
    currentAddress: "",
    phoneNumber: "",
    caseTitle: "",
    caseDescription: "",
    caseType: "",
    mutationEntries: null,
    deedOfTitle: null,
    noEncumbranceCertificate: null,
    searchReport: null,
    copyOfFIR: null,
    charsheetWithStatementOfWitnesses: null,
    status: "Submitted",
    lawyerDetails: "",
    lawyerAddress: "",
    paymentStatus: "not_initiated",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [metamaskStatus, setMetamaskStatus] = useState("idle"); 
  
  // Define modal state
  const [showModal, setShowModal] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (props.isclient && !formData.phoneNumber) {
      setFormData(prev => ({...prev, phoneNumber: props.userDetails[1]}));
    }
    
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number.");
      setIsSubmitting(false);
      return;
    }
  
    // Show the metamask connection modal
    setShowModal(true);
    setMetamaskStatus("connecting");
    
    // First, check MetaMask connection and ask for confirmation
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setMetamaskStatus("error");
        setTimeout(() => {
          setShowModal(false);
          toast.error("MetaMask is not installed. Please install MetaMask to continue.");
          setIsSubmitting(false);
        }, 1500);
        return;
      }
  
      // Request MetaMask account access - this will open the MetaMask popup
      console.log("Requesting MetaMask connection...");
      
      // Simulating a delay to show the loader (MetaMask will show its own UI)
      setTimeout(async () => {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log("MetaMask connected successfully");
          setMetamaskStatus("connected");
          
          // Wait for 2 seconds to show the success state
          setTimeout(async () => {
            // Continue with the form submission after MetaMask connection
            await processFormSubmission();
          }, 2000);
        } catch (error) {
          setMetamaskStatus("error");
          setTimeout(() => {
            setShowModal(false);
            if (error.code === 4001) {
              // User rejected the connection request
              toast.error("You need to connect to MetaMask to submit your case.");
            } else {
              toast.error("Error connecting to MetaMask. Please try again.");
            }
            setIsSubmitting(false);
          }, 1500);
        }
      }, 1500);
  
    } catch (metaMaskError) {
      console.error("MetaMask connection error:", metaMaskError);
      setMetamaskStatus("error");
      setTimeout(() => {
        setShowModal(false);
        if (metaMaskError.code === 4001) {
          // User rejected the connection request
          toast.error("You need to connect to MetaMask to submit your case.");
        } else {
          toast.error("Error connecting to MetaMask. Please try again.");
        }
        setIsSubmitting(false);
      }, 1500);
    }
  };
  
  // Separated the form submission logic into its own function
  const processFormSubmission = async () => {
    try {
      setMetamaskStatus("submitting");
      
      const filesToUpload = [
        "mutationEntries",
        "deedOfTitle",
        "noEncumbranceCertificate",
        "searchReport",
        "charsheetWithStatementOfWitnesses",
      ];
    
      const fileUrls = [];
      const fileUrlsE = {};
    
      await Promise.all(
        filesToUpload.map(async (fieldName) => {
          const files = formData[fieldName];
          if (files) {
            const fileArray = Array.from(files);
            await Promise.all(
              fileArray.map(async (file) => {
                const fileRef = storageRef(
                  storage,
                  `Client-Cases/${file.name}`
                );
                await uploadBytes(fileRef, file);
                const fileUrl = await getDownloadURL(fileRef);
                fileUrlsE[fieldName] = fileUrl;
                fileUrls.push(fileUrl);
              })
            );
          }
        })
      );
    
      const updatedFormData = {
        ...formData,
        ...fileUrlsE,
        timestamp: new Date().toISOString(),
        status: "Pending Verification",
      };
    
      let caseId = "";
      for (let i = 0; i < 10; i++) {
        caseId += Math.floor(Math.random() * 10);
      }
      
      try {
        const casesRef = rtdbRef(database, "Cases");
        const newCaseRef = push(casesRef);
        
        const caseData = {
          ...updatedFormData,
          caseId: caseId,
          clientId: props.isclient ? props.userDetails[2] : null,
          submittedAt: new Date().toISOString(),
          walletAddress: window.ethereum.selectedAddress || "",
        };
        
        await set(newCaseRef, caseData);
        console.log("Case saved to Firebase Realtime Database");
        
        // Set success status and show for a moment before redirecting
        setMetamaskStatus("success");
        setTimeout(() => {
          setShowModal(false);
          toast.success("Case submitted successfully");
          
          setFormData({
            fullName: props.isclient ? props.userDetails[0] : "",
            currentAddress: props.isclient ? props.userDetails[3] : "",
            phoneNumber: props.isclient ? props.userDetails[1] : "",
            caseTitle: "",
            caseDescription: "",
            caseType: "",
            mutationEntries: null,
            deedOfTitle: null,
            noEncumbranceCertificate: null,
            searchReport: null,
            copyOfFIR: null,
            charsheetWithStatementOfWitnesses: null,
            status: "Submitted",
            lawyerDetails: "",
            lawyerAddress: "",
            paymentStatus: "not_initiated",
          });
          
          window.history.back();
        }, 2000);
        
      } catch (firebaseError) {
        console.error("Error saving to Firebase:", firebaseError);
        setMetamaskStatus("error");
        setTimeout(() => {
          setShowModal(false);
          toast.error("Failed to save case to database. Please try again.");
          setIsSubmitting(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting case:", error);
      setMetamaskStatus("error");
      setTimeout(() => {
        setShowModal(false);
        toast.error("Failed to submit case. Please try again later.");
        setIsSubmitting(false);
      }, 1500);
    }
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  useEffect(() => {
  }, [props.userDetails, props.CaseId]);

  return (
    <>
      <div className="container mt-4" style={{ marginBottom: "100px" }}>
        <div className="card" style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #333" }}>
          <div className="card-header" style={{ backgroundColor: "black", color: "white" }}>
            <h4 className="mb-0">Case Submission Form</h4>
          <hr color="white"></hr>
          </div>
          <div className="card-body">
            {/* Progress bar */}
            <div className="progress mb-4" style={{ backgroundColor: "#333", height: "30px" }}>
              <div 
                className="progress-bar" 
                role="progressbar" 
                style={{ 
                  width: `${step * 33.33}%`, 
                  backgroundColor: "#00b300",
                  height: "30px"
                }} 
                aria-valuenow={step * 33.33} 
                aria-valuemin="0" 
                aria-valuemax="100"
              >
                Step {step} of 3
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="step-content">
                  <h5 className="card-title mb-4" style={{ color: "#fff" }}>
                    <FaUserAlt className="me-2" /> Personal Information
                  </h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="fullName" className="form-label" style={{ color: "#fff" }}>
                          <FaUserAlt className="me-2" /> Full Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="phoneNumber" className="form-label" style={{ color: "#fff" }}>
                          <FaPhone className="me-2" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="10-digit phone number"
                          style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="currentAddress" className="form-label" style={{ color: "#fff" }}>
                      <FaMapMarkerAlt className="me-2" /> Current Address
                    </label>
                    <textarea
                      className="form-control"
                      id="currentAddress"
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleInputChange}
                      rows="3"
                      style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                      required
                    />
                  </div>
                  <div className="d-flex justify-content-end mt-4">
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={nextStep}
                      style={{ backgroundColor: "#0077FF", color: "#fff" }}
                    >
                      Next <FaArrowRight className="ms-2" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <h5 className="card-title mb-4" style={{ color: "#fff" }}>
                    <FaFileAlt className="me-2" /> Case Details
                  </h5>
                  <div className="form-group mb-3">
                    <label htmlFor="caseTitle" className="form-label" style={{ color: "#fff" }}>
                      <FaFileAlt className="me-2" /> Case Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="caseTitle"
                      name="caseTitle"
                      value={formData.caseTitle}
                      onChange={handleInputChange}
                      style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                      required
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="caseType" className="form-label" style={{ color: "#fff" }}>
                      <FaGavel className="me-2" /> Case Type
                    </label><br></br>
                    <select
                      className="form-select"
                      id="caseType"
                      name="caseType"
                      value={formData.caseType}
                      onChange={handleInputChange}
                      style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                      required
                    >
                      <option value="">Select Case Type</option>
                      <option value="Civil">Civil</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Civil suit">Civil Suit</option>
                      <option value="Criminal case">Criminal Case</option>
                      <option value="Civil misc applications">Civil Misc Applications</option>
                      <option value="Criminal misc applications">Criminal Misc Applications</option>
                      <option value="Civil appeal">Civil Appeal</option>
                      <option value="Criminal appeal">Criminal Appeal</option>
                      <option value="Motor accident claim petition(MACP)">Motor Accident Claim Petition (M.A.C.P.)</option>
                    </select>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="caseDescription" className="form-label" style={{ color: "#fff" }}>
                      <FaFileAlt className="me-2" /> Case Description
                    </label>
                    <textarea
                      className="form-control"
                      id="caseDescription"
                      name="caseDescription"
                      value={formData.caseDescription}
                      onChange={handleInputChange}
                      rows="5"
                      style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                      required
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="copyOfFIR" className="form-label" style={{ color: "#fff" }}>
                      <FaFileAlt className="me-2" /> Copy of FIR (ID/Reference Number)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="copyOfFIR"
                      name="copyOfFIR"
                      value={formData.copyOfFIR}
                      onChange={handleInputChange}
                      style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                      required
                    />
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={prevStep}
                      style={{ backgroundColor: "#333", color: "#fff" }}
                    >
                      <FaArrowLeft className="me-2" /> Previous
                    </button>
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={nextStep}
                      style={{ backgroundColor: "#0077FF", color: "#fff" }}
                    >
                      Next <FaArrowRight className="ms-2" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="step-content">
                  <h5 className="card-title mb-4" style={{ color: "#fff" }}>
                    <FaUpload className="me-2" /> Supporting Documents
                  </h5>
                  <div className="alert" style={{ backgroundColor: "#002244", color: "#fff", border: "1px solid #003366" }}>
                    <i className="fas fa-info-circle me-2"></i>
                    Please upload all relevant documents to support your case. Accepted file formats: PDF, JPG, PNG (Max: 5MB per file)
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="mutationEntries" className="form-label" style={{ color: "#fff" }}>
                          <FaUpload className="me-2" /> Mutation Entries
                        </label>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            id="mutationEntries"
                            name="mutationEntries"
                            onChange={handleFileChange}
                            multiple
                            style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="deedOfTitle" className="form-label" style={{ color: "#fff" }}>
                          <FaUpload className="me-2" /> Deed of Title
                        </label>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            id="deedOfTitle"
                            name="deedOfTitle"
                            onChange={handleFileChange}
                            multiple
                            style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="noEncumbranceCertificate" className="form-label" style={{ color: "#fff" }}>
                          <FaUpload className="me-2" /> No Encumbrance Certificate
                        </label>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            id="noEncumbranceCertificate"
                            name="noEncumbranceCertificate"
                            onChange={handleFileChange}
                            multiple
                            style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="searchReport" className="form-label" style={{ color: "#fff" }}>
                          <FaUpload className="me-2" /> Search Report
                        </label>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            id="searchReport"
                            name="searchReport"
                            onChange={handleFileChange}
                            multiple
                            style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="charsheetWithStatementOfWitnesses" className="form-label" style={{ color: "#fff" }}>
                      <FaUpload className="me-2" /> Charsheet with Statement of Witnesses
                    </label>
                    <div className="input-group">
                      <input
                        type="file"
                        className="form-control"
                        id="charsheetWithStatementOfWitnesses"
                        name="charsheetWithStatementOfWitnesses"
                        onChange={handleFileChange}
                        multiple
                        style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444" }}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={prevStep}
                      style={{ backgroundColor: "#333", color: "#fff" }}
                    >
                      <FaArrowLeft className="me-2" /> Previous
                    </button>
                    <button 
                      type="submit" 
                      className="btn" 
                      disabled={isSubmitting}
                      style={{ backgroundColor: "#00b300", color: "#fff" }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaCheck className="me-2" /> Submit Case
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* MetaMask Connection Modal */}
      {showModal && (
        <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
      )}
      <div className={`modal ${showModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content" style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #444' }}>
              <h5 className="modal-title">
                {metamaskStatus === "connecting" && "Connecting to MetaMask..."}
                {metamaskStatus === "connected" && "Connected to MetaMask"}
                {metamaskStatus === "submitting" && "Submitting Case..."}
                {metamaskStatus === "success" && "Case Submitted Successfully!"}
                {metamaskStatus === "error" && "Connection Error"}
              </h5>
            </div>
            <div className="modal-body text-center py-4">
              {metamaskStatus === "connecting" && (
                <div className="d-flex flex-column align-items-center">
                  <div className="mb-3" style={{ width: '80px', height: '80px' }}>
                    <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="MetaMask" style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div className="spinner-border text-warning mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Please confirm the connection in the MetaMask popup</p>
                </div>
              )}
              
              {metamaskStatus === "connected" && (
                <div className="d-flex flex-column align-items-center">
                  <div className="mb-3" style={{ width: '80px', height: '80px' }}>
                    <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="MetaMask" style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div className="text-success mb-3" style={{ fontSize: '3rem' }}>
                    <FaCheck />
                  </div>
                  <p>Wallet connected successfully!</p>
                  <p className="text-muted">Preparing to submit your case...</p>
                </div>
              )}
              
              {metamaskStatus === "submitting" && (
                <div className="d-flex flex-column align-items-center">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Submitting...</span>
                  </div>
                  <p>Uploading documents and submitting your case...</p>
                  <div className="progress w-100 mt-3" style={{ height: '8px' }}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: '100%' }}></div>
                  </div>
                </div>
              )}
              
              {metamaskStatus === "success" && (
                <div className="d-flex flex-column align-items-center">
                  <div className="text-success mb-3" style={{ fontSize: '4rem' }}>
                    <FaCheck />
                  </div>
                  <h4 className="text-success mb-3">Success!</h4>
                  <p>Your case has been submitted successfully.</p>
                  <p className="text-muted">You will be redirected momentarily...</p>
                </div>
              )}
              
              {metamaskStatus === "error" && (
                <div className="d-flex flex-column align-items-center">
                  <div className="text-danger mb-3" style={{ fontSize: '4rem' }}>
                    <i className="fas fa-exclamation-circle"></i>
                  </div>
                  <h4 className="text-danger mb-3">Error</h4>
                  <p>There was a problem connecting to MetaMask or submitting your case.</p>
                  <p>Please try again later.</p>
                </div>
              )}
            </div>
            
            {metamaskStatus === "error" && (
              <div className="modal-footer" style={{ borderTop: '1px solid #444' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AddCaseForm;