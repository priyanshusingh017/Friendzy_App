import axios from "axios";
import { HOST } from "@/utils/constants";

const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true, // Send cookies with requests
});

export default apiClient;