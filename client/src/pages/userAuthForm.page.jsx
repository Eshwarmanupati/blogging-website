import { Link, Navigate } from "react-router-dom";
import { useContext } from "react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle, isGoogleAuthConfigured } from "../common/firebase";

const UserAuthForm = ({ type }) => {
    const { userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const userAuthThroughServer = async (serverRoute, formData) => {
        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + serverRoute,
                formData
            );

            storeInSession("user", JSON.stringify(data));
            setUserAuth(data);
        } catch (err) {
            toast.error(err.response?.data?.error || "Something went wrong. Please try again.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const serverRoute = type === "sign-in" ? "/signin" : "/signup";

        const form = new FormData(e.target);
        const formData = {};

        for (const [key, value] of form.entries()) {
            formData[key] = value;
        }

        const { fullname, email, password } = formData;

        if (fullname !== undefined && fullname.length < 3) {
            return toast.error("Fullname must be at least 3 characters long");
        }

        if (!email.length) {
            return toast.error("Enter an email");
        }

        if (!emailRegex.test(email)) {
            return toast.error("Email is invalid");
        }

        if (!passwordRegex.test(password)) {
            return toast.error(
                "Password must be 6-20 characters, with at least 1 number, 1 lowercase and 1 uppercase letter"
            );
        }

        userAuthThroughServer(serverRoute, formData);
    };

    const handleGoogleAuth = async (e) => {
        e.preventDefault();

        try {
            /*
                The server verifies a Firebase *ID token*, so that is what gets
                sent — result.user.accessToken is a different thing and fails
                verification.
            */
            const idToken = await authWithGoogle();

            await userAuthThroughServer("/google-auth", { access_token: idToken });
        } catch (err) {
            console.error(err);
            toast.error("Trouble signing in with Google");
        }
    };

    if (access_token) {
        return <Navigate to="/" />;
    }

    return (
        <AnimationWrapper Keyvalue={type}>
            <section className="h-cover flex items-center justify-center">
                <Toaster />

                <form className="w-[80%] max-w-[400px]" onSubmit={handleSubmit}>
                    <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                        {type === "sign-in" ? "Welcome back" : "Join us today"}
                    </h1>

                    {type !== "sign-in" ? (
                        <InputBox name="fullname" type="text" placeholder="Full Name" icon="fi-rr-user" />
                    ) : (
                        ""
                    )}

                    <InputBox name="email" type="email" placeholder="Email" icon="fi-rr-envelope" />

                    <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key" />

                    <button className="btn-dark center mt-14" type="submit">
                        {type === "sign-in" ? "Sign in" : "Sign up"}
                    </button>

                    {isGoogleAuthConfigured ? (
                        <>
                            <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                                <hr className="w-1/2 border-black" />
                                <p>or</p>
                                <hr className="w-1/2 border-black" />
                            </div>

                            <button
                                className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
                                onClick={handleGoogleAuth}
                                type="button"
                            >
                                <img src={googleIcon} alt="" className="w-5" />
                                Continue with Google
                            </button>
                        </>
                    ) : null}

                    {type === "sign-in" ? (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don&apos;t have an account?
                            <Link to="/signup" className="underline text-black text-xl ml-1">
                                Join us today
                            </Link>
                        </p>
                    ) : (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already a member?
                            <Link to="/signin" className="underline text-black text-xl ml-1">
                                Sign in here
                            </Link>
                        </p>
                    )}
                </form>
            </section>
        </AnimationWrapper>
    );
};

export default UserAuthForm;
