import Background from "@/assets/login2.png";
import victory from "@/assets/victory.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/api_client";
import { useAppStore } from "@/store";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "@/utils/constants";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/utils";

const Auth = () => {
    const navigate = useNavigate();
    const { setUserInfo } = useAppStore();

    // Separate state for login and signup
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const validateSignup = () => {
        if (!signupEmail) {
            toast.error("Email is required");
            return false;
        }
        if (!isValidEmail(signupEmail)) {
            toast.error("Invalid email format");
            return false;
        }
        if (!signupPassword) {
            toast.error("Password is required.");
            return false;
        }
        if (signupPassword !== confirmPassword) {
            toast.error("Password and confirm password should be the same.");
            return false;
        }
        return true;
    };

    const validateLogin = () => {
        if (!loginEmail) {
            toast.error("Email is required");
            return false;
        }
        if (!isValidEmail(loginEmail)) {
            toast.error("Invalid email format");
            return false;
        }
        if (!loginPassword) {
            toast.error("Password is required.");
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (validateLogin()) {
            try {
                const response = await apiClient.post(LOGIN_ROUTE, { email: loginEmail, password: loginPassword });
                if (response.data.user?.id) {
                    setUserInfo(response.data.user);
                    setLoginPassword("");
                    if (response.data.user.profileSetup) {
                        navigate("/chat");
                    } else {
                        navigate("/profile");
                    }
                }
            } catch (error) {
                toast.error(error?.response?.data?.error || "Login failed");
            }
        }
    };

    const handleSignup = async () => {
        if (validateSignup()) {
            try {
                const response = await apiClient.post(SIGNUP_ROUTE, { email: signupEmail, password: signupPassword });
                toast.success("Signup successful!");
                if (response.status === 201) {
                    setUserInfo(response.data.user);
                    setSignupPassword("");
                    setConfirmPassword("");
                    navigate("/profile");
                }
            } catch (error) {
                toast.error(error?.response?.data?.error || "Signup failed");
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 p-2">
            <div className="bg-white border-2 border-white shadow-2xl w-full max-w-4xl rounded-3xl grid xl:grid-cols-2 overflow-hidden">
                <div className="flex flex-col gap-10 items-center justify-center p-6">
                    <div className="flex items-center justify-center flex-col">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-4xl md:text-5xl font-bold">Welcome</h1>
                            <img src={victory} alt="victory Emoji" className="h-16 md:h-20" />
                        </div>
                        <p className="font-medium text-center text-gray-600 mt-2">Fill in the details to get started with the best chat app</p>
                    </div>
                    <div className="flex items-center justify-center w-full">
                        <Tabs className="w-full max-w-md" defaultValue="login">
                            <TabsList className="bg-gray-100 rounded-lg w-full flex">
                                <TabsTrigger value="login" className="flex-1 text-black border-b-2 rounded-none data-[state=active]:border-b-purple-500 data-[state=active]:font-semibold p-3 transition-all duration-300">Login</TabsTrigger>
                                <TabsTrigger value="signup" className="flex-1 text-black border-b-2 rounded-none data-[state=active]:border-b-purple-500 data-[state=active]:font-semibold p-3 transition-all duration-300">Signup</TabsTrigger>
                            </TabsList>
                            <TabsContent className="flex flex-col gap-5 mt-8" value="login">
                                <Input placeholder="Email" type="email" className="rounded-full p-4" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                                <Input placeholder="Password" type="password" className="rounded-full p-4" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                                <Button className="rounded-full p-4 mt-2" onClick={handleLogin}>Login</Button>
                            </TabsContent>
                            <TabsContent className="flex flex-col gap-5 mt-8" value="signup">
                                <Input placeholder="Email" type="email" className="rounded-full p-4" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                                <Input placeholder="Password" type="password" className="rounded-full p-4" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                                <Input placeholder="Confirm Password" type="password" className="rounded-full p-4" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                <Button className="rounded-full p-4 mt-2" onClick={handleSignup}>Sign Up</Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
                <div className="hidden xl:flex justify-center items-center bg-gradient-to-br from-purple-200 to-blue-200">
                    <img src={Background} alt="background login" className="h-96 object-contain mx-auto" />
                </div>
            </div>
        </div>
    );
};

export default Auth;