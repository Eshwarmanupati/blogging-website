import { useContext, useRef } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { UserContext } from "../App";

const ChangePassword = () => {
    const changePasswordForm = useRef();

    const { userAuth: { access_token } } = useContext(UserContext);

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = new FormData(changePasswordForm.current);
        const formData = {};

        for (const [key, value] of form.entries()) {
            formData[key] = value;
        }

        const { currentPassword, newPassword } = formData;

        if (!currentPassword.length || !newPassword.length) {
            return toast.error("Fill in both password fields");
        }

        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
            return toast.error(
                "Password must be 6-20 characters, with at least 1 number, 1 lowercase and 1 uppercase letter"
            );
        }

        const submitBtn = e.target.querySelector("button[type=submit]");

        submitBtn.setAttribute("disabled", true);

        const loadingToast = toast.loading("Updating...");

        try {
            await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/change-password", formData, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            toast.dismiss(loadingToast);
            toast.success("Password updated");

            changePasswordForm.current.reset();
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error || "Could not update your password");
        } finally {
            submitBtn.removeAttribute("disabled");
        }
    };

    return (
        <AnimationWrapper>
            <Toaster />

            <form ref={changePasswordForm} onSubmit={handleSubmit}>
                <h1 className="max-md:hidden">Change Password</h1>

                <div className="py-10 w-full md:max-w-[400px]">
                    <InputBox
                        name="currentPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="Current Password"
                        icon="fi-rr-unlock"
                    />

                    <InputBox
                        name="newPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="New Password"
                        icon="fi-rr-unlock"
                    />

                    <button className="btn-dark px-10" type="submit">
                        Change Password
                    </button>
                </div>
            </form>
        </AnimationWrapper>
    );
};

export default ChangePassword;
