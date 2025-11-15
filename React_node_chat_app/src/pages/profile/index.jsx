import { useAppStore } from "@/store";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { FaPlus, FaTrash } from "react-icons/fa";
import { colors, getColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import apiClient from "@/lib/api_client";
import { UPDATE_PROFILE_ROUTE, ADD_PROFILE_IMAGE_ROUTE, REMOVE_PROFILE_ROUTE, HOST } from "@/utils/constants";

// getColor now imported from utils.js

const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${HOST}${imagePath}`;
    if (imagePath.startsWith('/api/auth/files/')) return `${HOST}${imagePath}`;
    return `${HOST}/api/auth/files/${imagePath}`;
};

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstname, setfirstname] = useState("");
  const [lastname, setlastname] = useState("");
  const [image, setimage] = useState("");
  const [hovered, setHovered] = useState(false);
  const [selectedcolor, setselectcolor] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  // Debug log for userInfo
  console.log("userInfo", userInfo);

  useEffect(() => {
    if (userInfo.profileSetup) {
      setfirstname(userInfo.firstName);
      setlastname(userInfo.lastName);
      // If color is a number, use as index; if string, find index in colors array
      if (typeof userInfo.color === "number") {
        setselectcolor(userInfo.color);
      } else if (typeof userInfo.color === "string") {
        const idx = colors.findIndex(c => c === userInfo.color);
        setselectcolor(idx !== -1 ? idx : 0);
      }
    }
  }, [userInfo]);

  const validateprofile = () => {
    if (!firstname) {
      toast.error("First name is required.");
      return false;
    }
    if (!lastname) {
      toast.error("Last name is required.");
      return false;
    }
    return true;
  };

  const savechange = async () => {
    if (!validateprofile()) {
      toast.error("Please complete your profile to continue.");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post(
        UPDATE_PROFILE_ROUTE,
        { firstName: firstname, lastName: lastname, color: selectedcolor },
        { withCredentials: true }
      );
      if (response.status == 200 && response.data) {
        setUserInfo({ ...response.data });
        toast.success("Profile updated successfully.");
        navigate("/chat");
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    navigate("/auth");
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    if (!userInfo || !userInfo.id) {
      toast.error("You must be logged in to upload a profile image.");
      return;
    }
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files (jpg, jpeg, png, gif, webp) are allowed.");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append("profile-image", file); // ✅ Changed from "profile_image" to "profile-image"
      
      const response = await apiClient.post(ADD_PROFILE_IMAGE_ROUTE, formData, {
        withCredentials: true,
      });
      
      if (response.status === 200 && response.data.image) {
        setUserInfo({ ...userInfo, image: response.data.image });
        setimage(response.data.image);
        toast.success("Profile image updated successfully.");
      } else {
        toast.error("Failed to update profile image.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading image.");
    }
  };

  const handleRemoveImage = async () => {
    if (!userInfo || !userInfo.id) {
      toast.error("You must be logged in to remove a profile image.");
      return;
    }
    if (!userInfo.image) {
      toast.error("No profile image to remove.");
      return;
    }
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_ROUTE, {
        withCredentials: true,
      });
      if (response.status === 200) {
  setUserInfo({ ...userInfo, image: "" });
        setimage("");
        toast.success("Profile image removed successfully.");
      } else {
        toast.error("Failed to remove profile image.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error removing image.");
    }
  };

  const handleDeleteImage = () => {
    setimage("");
  };

  // Fallback UI if userInfo is missing
  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18191A]">
        <div className="bg-[#23272F] rounded-2xl shadow-2xl p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Profile</h2>
          <div className="w-36 h-36 rounded-full flex items-center justify-center text-5xl font-bold bg-gray-700 text-gray-300 mb-4">
            ?
          </div>
          <div className="text-gray-400 mb-4">Not logged in or no user info available.</div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full shadow transition" onClick={() => navigate("/auth")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18191A] flex items-center justify-center px-1 py-2 md:px-4 md:py-8">
      <div className="w-full max-w-lg md:max-w-3xl bg-[#23272F] rounded-2xl shadow-2xl p-2 md:p-8 flex flex-col gap-4 md:gap-8">
        <div className="flex items-center gap-1 md:gap-4">
          <button
            className="text-white text-3xl hover:text-purple-400 transition"
            aria-label="Back"
            onClick={handleNavigate}
          >
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
        </div>
  <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center">
          <div className="relative flex flex-col items-center w-full md:w-auto">
            <div
              className="w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold bg-gray-900"
              style={{
                background: getColor(selectedcolor).bg,
                color: getColor(selectedcolor).text,
                border: `2px solid ${getColor(selectedcolor).border}`
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {/* Avatar letter or image */}
              {image ? (
                <img 
                    src={getImageUrl(image)} 
                    alt="profile" 
                    className="object-cover w-full h-full rounded-full" 
                />
              ) : (
                firstname ? firstname[0].toUpperCase() : (userInfo?.email ? userInfo.email[0].toUpperCase() : "A")
              )}
              {hovered && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 ring-fuchsia-50 rounded-full"
                  onClick={image ? handleRemoveImage : handleFileInputClick}
                  style={{ cursor: "pointer" }}
                >
                  {image ? (
                    <FaTrash className="text-white text-3xl cursor-pointer" />
                  ) : (
                    <FaPlus className="text-white text-3xl cursor-pointer" />
                  )}
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
              name="profile-image"
              accept=".png,.jpg,.jpeg,.svg,.webp,.gif" // ✅ Match the server-side allowed types
            />
          </div>
          <div className="flex flex-col gap-2 w-full max-w-md">
            <label htmlFor="email" className="text-sm text-gray-400 mb-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              disabled
              value={userInfo?.email || ""}
              className="rounded-lg p-3 md:p-4 bg-[#23272F] text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base md:text-lg"
            />
            <label htmlFor="firstName" className="text-sm text-gray-400 mb-1">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="First Name"
              value={firstname || ""}
              onChange={e => setfirstname(e.target.value)}
              className="rounded-lg p-3 md:p-4 bg-[#23272F] text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base md:text-lg"
              autoComplete="given-name"
              required
            />
            <label htmlFor="lastName" className="text-sm text-gray-400 mb-1">Last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Last Name"
              value={lastname || ""}
              onChange={e => setlastname(e.target.value)}
              className="rounded-lg p-3 md:p-4 bg-[#23272F] text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base md:text-lg"
              autoComplete="family-name"
              required
            />
            <div className="flex gap-2 md:gap-4 mt-2 flex-wrap justify-center">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  className={`h-10 w-10 md:h-8 md:w-8 rounded-full border-2 focus:outline-none transition-all duration-200 ${selectedcolor === idx ? "ring-4 ring-purple-400 scale-110" : ""}`}
                  style={{ background: color.bg, borderColor: color.border }}
                  onClick={() => setselectcolor(idx)}
                  aria-label={`Select color ${color.name}`}
                  aria-pressed={selectedcolor === idx}
                  tabIndex={0}
                />
              ))}
            </div>
          </div>
        </div>
        <button
          className="w-full py-4 md:py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg transition text-lg md:text-lg"
          onClick={savechange}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
  {/* Profile information hidden from user-facing UI. Data still available for backend verification. */}
      </div>
    </div>
  );
};

export default Profile;