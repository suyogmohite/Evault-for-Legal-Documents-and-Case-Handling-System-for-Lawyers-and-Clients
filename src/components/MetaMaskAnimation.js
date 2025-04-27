import React from 'react';
import { FaCheck, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';

// Animations
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Styled Components
const AnimationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const MetaMaskIcon = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  animation: ${props => props.animationType === 'bounce' ? bounce : pulse} 2s infinite;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const SpinnerIcon = styled.div`
  font-size: 3rem;
  margin: 1rem 0;
  color: #FFC107;
  animation: ${rotate} 1.5s linear infinite;
`;

const StatusIcon = styled.div`
  font-size: 3.5rem;
  margin: 1rem 0;
  color: ${props => props.status === 'success' ? '#00b300' : '#dc3545'};
  animation: ${pulse} 1s ease-in-out;
`;

const MetaMaskAnimation = ({ status, message, submessage }) => {
  const getStatusContent = () => {
    switch (status) {
      case 'connecting':
        return (
          <>
            <MetaMaskIcon animationType="bounce">
              <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="MetaMask" />
            </MetaMaskIcon>
            <SpinnerIcon>
              <FaSpinner />
            </SpinnerIcon>
            <h4 className="mb-3">{message || "Connecting to MetaMask..."}</h4>
            <p className="text-muted">{submessage || "Please confirm the connection in your MetaMask wallet"}</p>
          </>
        );

      case 'connected':
        return (
          <>
            <MetaMaskIcon animationType="pulse">
              <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="MetaMask" />
            </MetaMaskIcon>
            <StatusIcon status="success">
              <FaCheck />
            </StatusIcon>
            <h4 className="mb-3 text-success">{message || "Wallet Connected!"}</h4>
            <p className="text-muted">{submessage || "Preparing transaction..."}</p>
          </>
        );

      case 'submitting':
        return (
          <>
            <SpinnerIcon>
              <FaSpinner />
            </SpinnerIcon>
            <h4 className="mb-3">{message || "Processing Transaction..."}</h4>
            <p className="text-muted">{submessage || "Please wait while we complete your transaction"}</p>
            <div className="progress w-100 mt-3" style={{ height: '8px' }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: '100%', backgroundColor: '#0077FF' }}></div>
            </div>
          </>
        );

      case 'success':
        return (
          <>
            <MetaMaskIcon animationType="pulse">
              <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="MetaMask" />
            </MetaMaskIcon>
            <StatusIcon status="success">
              <FaCheck />
            </StatusIcon>
            <h4 className="mb-3 text-success">{message || "Success!"}</h4>
            <p className="text-muted">{submessage || "Transaction completed successfully"}</p>
          </>
        );

      case 'error':
        return (
          <>
            <StatusIcon status="error">
              <FaExclamationCircle />
            </StatusIcon>
            <h4 className="mb-3 text-danger">{message || "Transaction Failed"}</h4>
            <p className="text-muted">{submessage || "There was a problem with your transaction. Please try again."}</p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AnimationContainer>
      {getStatusContent()}
    </AnimationContainer>
  );
};

export default MetaMaskAnimation;