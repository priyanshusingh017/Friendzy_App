import { useEffect } from "react";
import NewDM from "./components/new-dm";
import ProfileInfo from "./components/profile-info";
import apiClient from "@/lib/api_client";
import { GET_DM_CONTACTS_ROUTES, GET_USER_CHANNELS_ROUTE } from "@/utils/constants";
import { useAppStore } from "@/store";
import ContactList from "@/components/ui/contact-list";
import ChannelList from "@/components/ui/channel-list";
import CreateChannel from "./components/create-channel";
import friendzyLogo from '@/assets/friendzy.png';

const ContactContainer = () => {
    const { directMessageContacts, setDirectMessageContacts, channels, setChannels } = useAppStore();

    useEffect(() => {
        const getContact = async () => {
            try {
                const response = await apiClient.post(GET_DM_CONTACTS_ROUTES, {}, {
                    withCredentials: true,
                });
                if (response.data.contacts) {
                    setDirectMessageContacts(response.data.contacts);
                }
            } catch (error) {
                setDirectMessageContacts([]);
                console.error("Failed to fetch contacts:", error);
            }
        };
        
        const getChannels = async () => {
            try {
                const response = await apiClient.get(GET_USER_CHANNELS_ROUTE, {
                    withCredentials: true,
                });
                if (response.data.channels) {
                    setChannels(response.data.channels);
                }
            } catch (error) {
                setChannels([]);
                console.error("Failed to fetch channels:", error);
            }
        };
        
        getContact();
        getChannels();
    }, [setDirectMessageContacts, setChannels]);

    return (
        <aside
            className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full"
            aria-label="Contact Sidebar"
        >
            <div className="pt-3">
                <Logo />
            </div>
            <div className="my-5">
                <div className="flex items-center justify-between pr-10">
                    <Title text="Direct Message" />
                    <NewDM />
                </div>
                <div className="max-h-[38vh] overflow-auto scrollbar-hidden">
                    <ContactList contacts={directMessageContacts} />
                </div>
            </div>
            <div className="my-5">
                <div className="flex items-center justify-between pr-10">
                    <Title text="Channels" />
                    <CreateChannel />
                </div>
                <div className="max-h-[38vh] overflow-auto scrollbar-hidden">
                    <ChannelList channels={channels} />
                </div>
            </div>
            <ProfileInfo />
        </aside>
    );
};

export default ContactContainer;

const Logo = () => (
    <div className="flex p-5 justify-start items-center gap-2" aria-label="App Logo">
        <img
            src={friendzyLogo}
            alt="Friendzy Logo"
            className="h-10 w-10 rounded-full"
            style={{ objectFit: 'cover' }}
        />
        <span className="text-3xl font-semibold">Friendzy</span>
    </div>
);

function Title({ text }) {
    return (
        <h6
            className="uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm"
            aria-label={text}
        >
            {text}
        </h6>
    );
}