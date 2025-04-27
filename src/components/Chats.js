import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, push, set, serverTimestamp } from "firebase/database";
import { database } from "../firebaseConfig";
import "../chat.css";
import { FaArrowLeft, FaPaperPlane, FaClock, FaUser } from "react-icons/fa";
import { format } from 'date-fns';

function ChatComponent(props) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [caseDetails, setCaseDetails] = useState({
    id: '',
    name: 'Unknown Case'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setLoading(true);
    
    const caseId = props.currentCase?.caseId || localStorage.getItem("selectedCaseId");
    
    let caseName = "Case Chat";
    if (props.currentCaseName && typeof props.currentCaseName === 'string') {
      caseName = props.currentCaseName;
    } else if (props.currentCase?.caseTitle && typeof props.currentCase.caseTitle === 'string') {
      caseName = props.currentCase.caseTitle;
    } else if (localStorage.getItem("selectedCaseName")) {
      caseName = localStorage.getItem("selectedCaseName");
    }
    
    if (!caseId) {
      console.error("No case ID available");
      window.history.back();
      return;
    }

    setCaseDetails({
      id: caseId,
      name: caseName
    });
    
    const messagesRef = ref(database, `messages/${caseId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = [];
        
        for (let id in messagesData) {
          messagesList.push({ id, ...messagesData[id] });
        }
        
        messagesList.sort((a, b) => {
          const timestampA = a.timestamp || 0;
          const timestampB = b.timestamp || 0;
          return timestampA - timestampB;
        });
        
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
      
      setLoading(false);

      setTimeout(scrollToBottom, 100);
    });
    
    return () => {
      unsubscribe();
    };
  }, [props.currentCase, props.currentCaseName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
 
    let name = "User";
    let type = props.isclient ? "client" : "lawyer";
    
    if (props.userDetails && Array.isArray(props.userDetails) && props.userDetails.length > 0) {
      name = props.userDetails[0] || "User";
 
      if (props.userDetails.length > 4) {
        type = props.userDetails[4] || type;
      }
    }
    
    // Reference to messages for this case
    const messagesRef = push(ref(database, `messages/${caseDetails.id}`));
    
    // Create message object
    const messageData = {
      name,
      message: message.trim(),
      type,
      timestamp: serverTimestamp(),
      sentAt: new Date().toISOString()
    };
    
    // Save message to Firebase
    set(messagesRef, messageData);
    
    // Clear input
    setMessage("");
    
    // Close modal if open (Bootstrap)
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
    document.querySelector('.modal')?.classList.remove('show');
  };

  // Format timestamp for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      let date;
      if (typeof timestamp === 'object' && timestamp.seconds) {
        // Firebase Firestore timestamp
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'number') {
        // Regular timestamp
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        // ISO string
        date = new Date(timestamp);
      } else {
        return "";
      }
      
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  // Handle back button
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow" style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #333" }}>
        {/* Chat Header */}
        <div className="card-header" style={{ backgroundColor: "#111", borderBottom: "1px solid #333" }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <button
                className="btn btn-sm"
                onClick={handleGoBack}
                style={{ backgroundColor: "#333", color: "#fff" }}
              >
                <FaArrowLeft className="me-2" />
                Back
              </button>
              <span className="ms-3 fw-bold">{caseDetails.name}</span>
              <span className="ms-3 text-muted" style={{ fontSize: "0.9rem" }}>
                Case ID: {caseDetails.id}
              </span>
            </div>
          </div>
        </div>
        
        {/* Chat Body */}
        <div className="card-body" style={{ 
          backgroundColor: "#000", 
          minHeight: "400px", 
          maxHeight: "500px", 
          overflowY: "auto",
          padding: "20px"
        }}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ color: "#666", fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
              <h5 style={{ color: "#aaa" }}>No messages yet</h5>
              <p className="text-muted">Start the conversation by sending a message.</p>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`message-wrapper ${msg.type === "client" ? "message-left" : "message-right"}`}
                >
                  <div 
                    className="message-bubble" 
                    style={{ 
                      backgroundColor: msg.type === "client" ? "#006633" : "#0066cc",
                      color: "#fff",
                      borderRadius: "12px",
                      padding: "10px 15px",
                      maxWidth: "80%",
                      marginBottom: "10px",
                      display: "inline-block",
                      position: "relative"
                    }}
                  >
                    <div className="message-sender" style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      {msg.name || "User"}
                    </div>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time" style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "4px", textAlign: "right" }}>
                      {msg.sentAt || msg.timestamp ? (
                        <>{formatMessageTime(msg.sentAt || msg.timestamp)}</>
                      ) : (
                        <FaClock size={10} style={{ marginRight: "3px" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="card-footer" style={{ backgroundColor: "#111", borderTop: "1px solid #333", padding: "15px" }}>
          <form onSubmit={handleSubmit} className="d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ 
                backgroundColor: "#222", 
                color: "#fff", 
                border: "1px solid #444",
                marginRight: "10px"
              }}
            />
            <button
              type="submit"
              className="btn"
              disabled={!message.trim()}
              style={{ 
                backgroundColor: message.trim() ? "#0077FF" : "#333", 
                color: "#fff"
              }}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>

      {/* Modal for mobile view (kept for backward compatibility) */}
      <div
        className="modal fade"
        id="exampleModal2"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content" style={{ backgroundColor: "#222", color: "#fff" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #444" }}>
              <h5 className="modal-title" id="exampleModalLabel">
                Send Message
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                style={{ color: "#fff" }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="messageInput" className="form-label">
                    Message
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="messageInput"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ backgroundColor: "#333", color: "#fff", border: "1px solid #444" }}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer" style={{ borderTop: "1px solid #444" }}>
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button 
                className="btn" 
                data-dismiss="modal" 
                onClick={handleSubmit}
                style={{ backgroundColor: "#0077FF", color: "#fff" }}
              >
                <FaPaperPlane className="me-2" /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatComponent;