export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = `${HOST}/api/auth`;
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/add-profile-image`;
export const REMOVE_PROFILE_ROUTE = `${AUTH_ROUTES}/remove-profile-image`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;

// GridFS file serving route
export const GET_FILE_URL = (filename) => filename ? `${AUTH_ROUTES}/files/${filename}` : null;

export const CONTACT_ROUTES = `${HOST}/api/contacts`;
export const SEARCH_CONTACTS_ROUTES = `${CONTACT_ROUTES}/search`;
export const GET_DM_CONTACTS_ROUTES = `${CONTACT_ROUTES}/get-contacts-for-dm`;
export const GET_ALL_CONTACTS_ROUTE = `${CONTACT_ROUTES}/all`;

export const MESSAGE_ROUTES = `${HOST}/api/messages`;
export const GET_ALL_MESSAGES_ROUTE = `${MESSAGE_ROUTES}/get-message`;
export const UPLOAD_FILE_ROUTE = `${MESSAGE_ROUTES}/upload-file`;

export const CHANNEL_ROUTES = `${HOST}/api/channels`;
export const CREATE_CHANNEL_ROUTE = `${CHANNEL_ROUTES}/create-channel`;
export const GET_USER_CHANNELS_ROUTE = `${CHANNEL_ROUTES}/get-user-channel`;
export const GET_CHANNEL_MESSAGES_ROUTE = `${CHANNEL_ROUTES}/get-channel-messages`;
export const UPDATE_CHANNEL_ROUTE = (channelId) => `${CHANNEL_ROUTES}/update-channel/${channelId}`;
export const DELETE_CHANNEL_ROUTE = (channelId) => `${CHANNEL_ROUTES}/delete-channel/${channelId}`;
export const ADD_CHANNEL_MEMBERS_ROUTE = (channelId) => `${CHANNEL_ROUTES}/${channelId}/members`;
export const REMOVE_CHANNEL_MEMBER_ROUTE = (channelId, memberId) => `${CHANNEL_ROUTES}/${channelId}/members/${memberId}`;


