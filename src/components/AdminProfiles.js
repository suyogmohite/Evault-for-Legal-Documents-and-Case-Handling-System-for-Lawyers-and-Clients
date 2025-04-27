import React, { useState, useEffect } from "react";
import { Container, Table, Button, Badge } from "react-bootstrap";
import DashboardHeading from "./DashboardHeading";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { profileABI, profileAddress } from "./contractAddress";

const AdminProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      
      const { ethereum } = window;
      if (!ethereum) {
        toast.error("Please install MetaMask");
        setLoading(false);
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      setAccount(accounts[0]);

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      const ProfileContract = new ethers.Contract(
        profileAddress,
        profileABI,
        signer
      );

      // Check if the current user is a master/admin
      const userProfile = await ProfileContract.getProfileById(accounts[0]);
      if (userProfile[4].toLowerCase() !== "master") {
        toast.error("Access denied. Only admins can view this page.");
        setLoading(false);
        return;
      }

      // Get all profile IDs
      const allProfileIds = await ProfileContract.getAllProfileIds();
      
      // Fetch each profile details
      const profilePromises = allProfileIds.map(async (id) => {
        const profile = await ProfileContract.getProfileById(id);
        return {
          address: id,
          fullName: profile[0],
          phoneNumber: profile[1],
          emailId: profile[2],
          userAddress: profile[3],
          userType: profile[4]
        };
      });
      
      const allProfiles = await Promise.all(profilePromises);
      setProfiles(allProfiles);
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const getUserTypeBadge = (userType) => {
    switch(userType.toLowerCase()) {
      case "lawyer":
        return <Badge bg="primary">{userType}</Badge>;
      case "client":
        return <Badge bg="success">{userType}</Badge>;
      case "master":
        return <Badge bg="danger">{userType}</Badge>;
      default:
        return <Badge bg="secondary">{userType}</Badge>;
    }
  };

  const handleRefresh = () => {
    loadProfiles();
  };

  return (
    <>
      <DashboardHeading text={"Admin - All Profiles"} />
      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="btn btn-success" onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="alert alert-info">No profiles found</div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover className="bg-white" style={{ borderColor: "white" }}>
              <thead>
                <tr className="bg-white">
                  <th className="border-white">#</th>
                  <th className="border-white">Full Name</th>
                  <th className="border-white">Phone Number</th>
                  <th className="border-white">Email</th>
                  <th className="border-white">Address</th>
                  <th className="border-white">Type</th>
                  <th className="border-white">Wallet Address</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => (
                  <tr key={profile.address} className="bg-white">
                    <td className="border-white">{index + 1}</td>
                    <td className="border-white">{profile.fullName}</td>
                    <td className="border-white">{profile.phoneNumber}</td>
                    <td className="border-white">{profile.emailId}</td>
                    <td className="border-white">{profile.userAddress}</td>
                    <td className="border-white">{getUserTypeBadge(profile.userType)}</td>
                    <td className="border-white">
                      <small>
                        {`${profile.address.substring(0, 6)}...${profile.address.substring(profile.address.length - 4)}`}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

 
      </Container>
    </>
  );
};

export default AdminProfiles;