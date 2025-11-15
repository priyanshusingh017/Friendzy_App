import { useAppStore } from "@/store";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { HOST } from "@/utils/constants";
import { getColor } from "@/lib/utils";

const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${HOST}${imagePath}`;
    if (imagePath.startsWith('/api/auth/files/')) return `${HOST}${imagePath}`;
    return `${HOST}/api/auth/files/${imagePath}`;
};

const ContactList = ({ contacts, isChannel = false }) => {
    const {
        selectedChatData,
        setSelectedChatData,
        setSelectedChatType,
        selectedChatType,
        setSelectedChatMessages,
    } = useAppStore();

    const handleClick = (contact) => {
        if (isChannel) setSelectedChatType("channel");
        else setSelectedChatType("contact");
        setSelectedChatData(contact);
        if (
            selectedChatData &&
            selectedChatData._id !== contact._id
        ) {
            setSelectedChatMessages([]);
        }
    };

    return (
        <div className="mt-5">
            {contacts.map((contact) => (
                <div
                    key={contact._id}
                    className={`pl-10 py-2 transition-all duration-300 cursor-pointer ${
                        selectedChatData && selectedChatData._id === contact._id
                            ? "bg-[#8417ff] hover:bg-[#8417ff]"
                            : "hover:bg-[#f1f1f111]"
                    }`}
                    onClick={() => handleClick(contact)}
                >
                    <div className="flex gap-5 items-center justify-start text-neutral-300">
                        {!isChannel && (
                            <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                                <AvatarImage
                                    src={getImageUrl(contact.image)}
                                    alt="profile"
                                    className="object-cover w-full h-full bg-black"
                                />
                                <AvatarFallback
                                    className="uppercase h-12 w-12 text-lg border-[1.5px] flex items-center justify-center rounded-full"
                                    style={{
                                        background: getColor(contact.color)?.bg,
                                        color: getColor(contact.color)?.text,
                                        border: `2px solid ${getColor(contact.color)?.border}`
                                    }}
                                >
                                    {contact.firstName
                                        ? contact.firstName[0].toUpperCase()
                                        : (contact.email ? contact.email[0].toUpperCase() : "?")}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <span>
                            {contact.firstName && contact.lastName
                                ? `${contact.firstName} ${contact.lastName}`
                                : contact.firstName
                                    ? contact.firstName
                                    : contact.email}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ContactList;