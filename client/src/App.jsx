import { Route, Routes } from "react-router-dom";
import { createContext, lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";

import Navbar from "./components/navbar.component";
import Loader from "./components/loader.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { lookInSession } from "./common/session";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import SideNav from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notifications from "./pages/notifications.page";
import ManageBlogs from "./pages/manage-blogs.page";
import Dashboard from "./pages/dashboard.page";

/* Editor.js is ~330kB and only needed when you actually write, so it loads on demand. */
const Editor = lazy(() => import("./pages/editor.pages"));

export const UserContext = createContext({});

const App = () => {
    const [userAuth, setUserAuth] = useState({});

    useEffect(() => {
        const userInSession = lookInSession("user");

        if (userInSession) {
            setUserAuth(JSON.parse(userInSession));
        } else {
            setUserAuth({ access_token: null });
        }
    }, []);

    // Poll once on sign-in so the navbar bell reflects reality on a fresh load.
    useEffect(() => {
        if (!userAuth.access_token) {
            return;
        }

        axios
            .get(import.meta.env.VITE_SERVER_DOMAIN + "/new-notification", {
                headers: { Authorization: `Bearer ${userAuth.access_token}` }
            })
            .then(({ data }) => {
                setUserAuth((preVal) => ({ ...preVal, ...data }));
            })
            .catch((err) => console.error(err));
    }, [userAuth.access_token]);

    return (
        <UserContext.Provider value={{ userAuth, setUserAuth }}>
            <Routes>
                <Route
                    path="/editor"
                    element={
                        <Suspense fallback={<Loader />}>
                            <Editor />
                        </Suspense>
                    }
                />
                <Route
                    path="/editor/:blog_id"
                    element={
                        <Suspense fallback={<Loader />}>
                            <Editor />
                        </Suspense>
                    }
                />

                <Route path="/" element={<Navbar />}>
                    <Route index element={<HomePage />} />

                    <Route path="dashboard" element={<SideNav />}>
                        <Route index element={<Dashboard />} />
                        <Route path="blogs" element={<ManageBlogs />} />
                        <Route path="notifications" element={<Notifications />} />
                    </Route>

                    <Route path="settings" element={<SideNav />}>
                        <Route path="edit-profile" element={<EditProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    </Route>

                    <Route path="signup" element={<UserAuthForm type="sign-up" />} />
                    <Route path="signin" element={<UserAuthForm type="sign-in" />} />
                    <Route path="search/:query" element={<SearchPage />} />
                    <Route path="user/:id" element={<ProfilePage />} />
                    <Route path="blog/:blog_id" element={<BlogPage />} />

                    <Route path="*" element={<PageNotFound />} />
                </Route>
            </Routes>
        </UserContext.Provider>
    );
};

export default App;
