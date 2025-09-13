import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Lottie from "react-lottie";
import { animationDefaultoption } from "@/lib/utils";
import apiClient from "@/lib/api_client";
import { SEARCH_CONTACTS_ROUTES, HOST } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";

const NewDM = () => {
    const { setSelectedChatType, setSelectedChatData } = useAppStore();
    const [opennewcontactmodel, setopennewcontactmodel] = useState(false);
    const [searchedContacts, setsearchedContacts] = useState([]);

    const searchContact = async (searchTerm) => {
        try {
            if (searchTerm.length > 0) {
                const response = await apiClient.post(SEARCH_CONTACTS_ROUTES, { searchTerm }, { withCredentials: true });
                if (response.status === 200 && response.data.contacts) {
                    setsearchedContacts(response.data.contacts);
                }
            } else {
                setsearchedContacts([]);
            }
        } catch (error) {
            console.log({ error });
        }
    };

    const selectNewContact = (contact) => {
        setopennewcontactmodel(false);
        setSelectedChatType("contact");
        setSelectedChatData(contact);
        setsearchedContacts([]);
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger>
                    <FaPlus
                        className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all"
                        onClick={() => setopennewcontactmodel(true)}
                        aria-label="Add new contact"
                    />
                </TooltipTrigger>
                <TooltipContent
                    className="bg-[#1c1b1e] border-none mb-2 p-3 text-white"
                >
                    <p>New Contact</p>
                </TooltipContent>
            </Tooltip>
            <Dialog open={opennewcontactmodel} onOpenChange={setopennewcontactmodel}>
                <DialogContent
                    className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col"
                    aria-label="New Contact Dialog"
                >
                    <DialogHeader>
                        <DialogTitle className="sr-only">New Contact</DialogTitle>
                        <DialogDescription>
                            Please select a contact
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Input
                            placeholder="Search contact"
                            className="rounded-lg p-6 bg-[#2c2e3b] border-none"
                            onChange={e => searchContact(e.target.value)}
                            aria-label="Search contact"
                        />
                    </div>
                    {searchedContacts.length > 0 && (
                        <ScrollArea className="h-[250px]">
                            <div className="flex flex-col gap-5">
                                {searchedContacts.map((contact) => (
                                    <div
                                        key={contact._id}
                                        className="flex gap-3 items-center cursor-pointer"
                                        onClick={() => selectNewContact(contact)}
                                        tabIndex={0}
                                        aria-label={`Select contact ${contact.firstName || contact.email}`}
                                    >
                                        <div className="w-12 h-12 relative">
                                            <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                                                {contact.image ? (
                                                    <AvatarImage
                                                        src={contact.image.startsWith("/uploads/") ? `${HOST}${contact.image}` : contact.image}
                                                        alt="profile"
                                                        className="object-cover w-full h-full bg-black rounded-full"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full`}
                                                        style={{
                                                            background: getColor(contact.color)?.bg,
                                                            color: getColor(contact.color)?.text,
                                                            border: `2px solid ${getColor(contact.color)?.border}`
                                                        }}
                                                    >
                                                        {contact.firstName
                                                            ? contact.firstName[0].toUpperCase()
                                                            : contact.email[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </Avatar>
                                        </div>
                                        <div className="flex flex-col">
                                            <span>
                                                {contact.firstName && contact.lastName
                                                    ? `${contact.firstName} ${contact.lastName}`
                                                    : contact.email}
                                            </span>
                                            <span className="text-xs">{contact.email}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                    {searchedContacts.length <= 0 && (
                        <div className="flex-1 md:bg-[#1c1d25] md:flex mt-5 md:mt-0 flex-col justify-center items-center duration-1000 transition-all">
                            <Lottie
                                isClickToPauseDisabled={true}
                                height={100}
                                width={100}
                                options={animationDefaultoption}
                            />
                            <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-5 lg:text-2xl text-xl transition-all duration-100 text-center">
                                <h3 className="poppins-medium">
                                    Hi <span className="text-purple-500">!</span> Search new
                                    <span className="text-purple-500"> Contact</span>
                                </h3>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NewDM;