import { useAppStore } from "@/store";
import { getColor } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiPower } from "react-icons/fi";
import apiClient from "@/lib/api_client";
import { LOGOUT_ROUTE, HOST } from "@/utils/constants";

const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${HOST}${imagePath}`;
    if (imagePath.startsWith('/api/auth/files/')) return `${HOST}${imagePath}`;
    return `${HOST}/api/auth/files/${imagePath}`;
};

const ProfileInfo = () => {
    const { userInfo, setUserInfo } = useAppStore();
    const color = getColor(userInfo?.color || 0);
    const navigate = useNavigate();

    const logOut = async () => {
        try {
            await apiClient.post(LOGOUT_ROUTE, {}, { withCredentials: true });
        } catch (error) {
            // Optionally handle error
        }
        setUserInfo(null);
        navigate('/auth');
    };

    return (
        <footer
            className="absolute bottom-0 h-16 flex items-center px-2 md:px-10 w-full bg-[#2a2b33]"
            aria-label="Profile Info"
        >
            <div className="flex gap-3 items-center min-w-0 flex-1 overflow-hidden">
                {/* Avatar */}
                <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden"
                    style={{
                        background: color.bg,
                        color: color.text,
                        border: `2px solid ${color.border}`
                    }}
                    aria-label="User Avatar"
                >
                    {userInfo?.image ? (
                        <img
                            src={getImageUrl(userInfo.image)}
                            alt={userInfo?.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}` : "Profile"}
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <span aria-label="User Initial">
                            {userInfo?.firstName
                                ? userInfo.firstName[0].toUpperCase()
                                : userInfo?.email
                                    ? userInfo.email[0].toUpperCase()
                                    : "A"}
                        </span>
                    )}
                </div>
                {/* Name and email */}
                <div className="flex flex-col" aria-label="User Name">
                    <span
                        className="text-white font-semibold text-sm md:text-base"
                        title={
                            userInfo?.firstName
                                ? `${userInfo.firstName} ${userInfo.lastName || ""}`
                                : userInfo?.email || "No Name"
                        }
                    >
                        {userInfo?.firstName || userInfo?.email || "No Name"}
                        {userInfo?.lastName ? ` ${userInfo.lastName}` : ""}
                    </span>
                </div>
            </div>
            {/* Edit and Logout icons */}
            <nav className="flex items-center gap-1 md:gap-2 flex-shrink-0" aria-label="Profile Actions">
                <button
                    className="p-2 rounded-full hover:bg-[#393a43] transition-colors flex-shrink-0"
                    aria-label="Edit Profile"
                    title="Edit Profile"
                    onClick={() => navigate('/profile')}
                >
                    <FiEdit2 className="text-purple-400 text-lg" />
                </button>
                <button
                    className="p-2 rounded-full hover:bg-[#393a43] transition-colors flex-shrink-0"
                    aria-label="Logout"
                    title="Logout"
                    onClick={logOut}
                >
                    <FiPower className="text-red-400 text-lg" />
                </button>
            </nav>
        </footer>
    );
};

export default ProfileInfo;