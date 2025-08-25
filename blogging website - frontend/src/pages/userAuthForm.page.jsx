import { Link, Navigate } from "react-router-dom";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png"
import AnimationWrapper from "../common/page-animation";
import { useContext, useRef } from "react";
import { Toaster, toast} from 'react-hot-toast';
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";


const UserAuthForm = ({type}) => {

    const authForm = useRef();

    let { userAuth : { access_token }, setUserAuth} = useContext(UserContext)

    const userAuthThroughServer = (serverRoute, formData) => {
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}${serverRoute}`, formData)
        .then(({ data }) => {
            storeInSession("user",JSON.stringify(data))
            setUserAuth(data)
        })
        .catch((err) => {
        console.error("Signup error:", err);
        if (err.response) {
            toast.error(err.response.data?.message || "Something went wrong");
        } else {
            toast.error("Network or server error — check console");
        }
    });

   }


    const handleSubmit = (e) => {
        e.preventDefault();

        let serverRoute = type === "sign-in" ? "/signin" : "/signup";

        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

        let form = new FormData(e.target);
        let formData = {}

        for(let[key,value] of form.entries()){
            formData[key] = value;
        }

        let {fullname, email, password } = formData;

        if(fullname){
            if (!fullname || fullname.length < 3) {
                return toast.error("Fullname must be at least 3 characters long" );
            }
        }


        if (!email.length) {
            return toast.error("Enter email" );
        }

        if (!emailRegex.test(email)) {
            return toast.error("Email is invalid" );
        }

        if (!passwordRegex.test(password)) {
            return toast.error( "Password must be at least 6 characters long, with at least 1 number, 1 lowercase, and 1 uppercase letter"
            );
        }
        userAuthThroughServer(serverRoute,formData);
    }

    const handleGoogleAuth = (e) => {

        e.preventDefault();

        authWithGoogle().then(user => {
            
            let serverRoute = "/google-auth";

            let formData = {
                access_token: user.accessToken
            } 

            userAuthThroughServer(serverRoute, formData)
        })
        .catch(err => {
            toast.error("trouble login through google ");
            return console.log(err)
        })

    }

    return (
        access_token? 
        <Navigate to="/" />
        :
        <AnimationWrapper Keyvalue={type}>
            <section className="h-cover flex items-center justify-center">
                <Toaster/>
                <form ref={authForm} className="w-[80%] max-w-[400px]" onSubmit={handleSubmit}>
                    <h1 className="text-4xl font-gelasio capitalize text-center">
                        {type == "sign-in"? "welcome back" : "join us today"}
                    </h1>

                    {
                        type != "sign-in"? <InputBox name="fullname" type="text" placeholder="Full Name" icon="fi-rr-user"/>:""
                    }

                    <InputBox name="email" type="email" placeholder="Email" icon="fi-sr-envelope"/>

                    <InputBox name="password" type="password" placeholder="Password" icon="fi-sr-key"/>

                    <button className="btn-dark center mt-14" type="submit" >{type.replace("-","")}</button>

                    <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black"/>
                        <p>or</p>
                        <hr className="w-1/2 border-black"/>
                    </div>

                    <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
                        <img src={googleIcon} className="w-5"/>
                        continue with google
                    </button>

                    {
                        type == "sign-in"?
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have an account ?
                            <Link to="/signup" className="underline text-black text-xl ml-1">
                            Join us today</Link>
                        </p>
                        :
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already a member ?
                            <Link to="/signin" className="underline text-black text-xl ml-1">
                                sign in here
                            </Link>
                        </p>
                    }
                </form>
            </section>
        </AnimationWrapper>
    )
}

export default UserAuthForm;