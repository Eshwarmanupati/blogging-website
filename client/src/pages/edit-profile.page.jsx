import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

import { UserContext } from "../App";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { profileDataStructure } from "./profile.page";
import InputBox from "../components/input.component";
import { uploadImage } from "../common/upload";
import { storeInSession } from "../common/session";

const EditProfile = () => {
    const { userAuth, userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    const bioLimit = 200;

    const [profile, setProfile] = useState(profileDataStructure);
    const [loading, setLoading] = useState(true);
    const [charactersLeft, setCharactersLeft] = useState(bioLimit);
    const [updatedProfileImg, setUpdatedProfileImg] = useState(null);

    const profileImgEle = useRef();
    const editProfileForm = useRef();

    const {
        personal_info: { fullname, username: profile_username, profile_img, email, bio },
        social_links
    } = profile;

    useEffect(() => {
        if (!access_token) {
            return;
        }

        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", { username: userAuth.username })
            .then(({ data }) => {
                setProfile(data);
                setCharactersLeft(bioLimit - (data.personal_info.bio?.length || 0));
            })
            .catch((err) => {
                console.error(err);
                toast.error("Could not load your profile");
            })
            .finally(() => setLoading(false));
    }, [access_token, userAuth.username]);

    const handleCharacterChange = (e) => {
        setCharactersLeft(bioLimit - e.target.value.length);
    };

    const handleImagePreview = (e) => {
        const img = e.target.files[0];

        if (!img) {
            return;
        }

        profileImgEle.current.src = URL.createObjectURL(img);

        setUpdatedProfileImg(img);
    };

    const handleImageUpload = async (e) => {
        e.preventDefault();

        if (!updatedProfileImg) {
            return toast.error("Choose an image first");
        }

        const loadingToast = toast.loading("Uploading...");

        e.target.setAttribute("disabled", true);

        try {
            const url = await uploadImage(updatedProfileImg, access_token);

            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/update-profile-img",
                { url },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            const newUserAuth = { ...userAuth, profile_img: data.profile_img };

            storeInSession("user", JSON.stringify(newUserAuth));
            setUserAuth(newUserAuth);

            setUpdatedProfileImg(null);

            toast.dismiss(loadingToast);
            toast.success("Profile image updated");
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error || "Could not upload your image");
        } finally {
            e.target.removeAttribute("disabled");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = new FormData(editProfileForm.current);
        const formData = {};

        for (const [key, value] of form.entries()) {
            formData[key] = value;
        }

        const { username, bio: newBio, youtube, facebook, twitter, github, instagram, website } = formData;

        if (username.length < 3) {
            return toast.error("Username must be at least 3 characters long");
        }

        if (newBio.length > bioLimit) {
            return toast.error(`Bio should not be more than ${bioLimit} characters`);
        }

        const submitBtn = e.target.querySelector("button[type=submit]");

        submitBtn.setAttribute("disabled", true);

        const loadingToast = toast.loading("Updating...");

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/update-profile",
                {
                    username,
                    bio: newBio,
                    social_links: { youtube, facebook, twitter, github, instagram, website }
                },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            // The username is part of the session payload, so keep both in step.
            if (userAuth.username !== data.username) {
                const newUserAuth = { ...userAuth, username: data.username };

                storeInSession("user", JSON.stringify(newUserAuth));
                setUserAuth(newUserAuth);
            }

            toast.dismiss(loadingToast);
            toast.success("Profile updated");
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.error || "Could not update your profile");
        } finally {
            submitBtn.removeAttribute("disabled");
        }
    };

    return (
        <AnimationWrapper>
            {loading ? (
                <Loader />
            ) : (
                <form ref={editProfileForm} onSubmit={handleSubmit}>
                    <Toaster />

                    <h1 className="max-md:hidden">Edit Profile</h1>

                    <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
                        <div className="max-lg:center mb-5">
                            <label
                                htmlFor="uploadImg"
                                id="profileImgLabel"
                                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden cursor-pointer"
                            >
                                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer">
                                    Upload Image
                                </div>

                                <img ref={profileImgEle} src={profile_img} alt={fullname} />
                            </label>

                            <input
                                type="file"
                                id="uploadImg"
                                accept=".jpeg, .png, .jpg"
                                hidden
                                onChange={handleImagePreview}
                            />

                            <button
                                className="btn-light mt-5 max-lg:center lg:w-full px-10"
                                onClick={handleImageUpload}
                            >
                                Upload
                            </button>
                        </div>

                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                                <InputBox
                                    name="fullname"
                                    type="text"
                                    value={fullname}
                                    placeholder="Full Name"
                                    disable={true}
                                    icon="fi-rr-user"
                                />

                                <InputBox
                                    name="email"
                                    type="email"
                                    value={email}
                                    placeholder="Email"
                                    disable={true}
                                    icon="fi-rr-envelope"
                                />
                            </div>

                            <InputBox
                                type="text"
                                name="username"
                                value={profile_username}
                                placeholder="Username"
                                icon="fi-rr-at"
                            />

                            <p className="text-dark-grey -mt-3">
                                Your username is what people see on your profile and blogs
                            </p>

                            <textarea
                                name="bio"
                                maxLength={bioLimit}
                                defaultValue={bio}
                                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
                                placeholder="Bio"
                                onChange={handleCharacterChange}
                            ></textarea>

                            <p className="mt-1 text-dark-grey">{charactersLeft} characters left</p>

                            <p className="my-6 text-dark-grey">Add your social handles below</p>

                            <div className="md:grid md:grid-cols-2 gap-x-6">
                                {Object.keys(social_links).map((key, i) => {
                                    return (
                                        <InputBox
                                            key={i}
                                            name={key}
                                            type="text"
                                            value={social_links[key]}
                                            placeholder="https://"
                                            icon={
                                                "fi " +
                                                (key !== "website" ? "fi-brands-" + key : "fi-rr-globe")
                                            }
                                        />
                                    );
                                })}
                            </div>

                            <button className="btn-dark w-auto px-10" type="submit">
                                Update
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </AnimationWrapper>
    );
};

export default EditProfile;
