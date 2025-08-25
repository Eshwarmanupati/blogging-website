import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from "bcrypt";
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from "firebase-admin"
import serviceAccountKey from "./blog-website-992fe-firebase-adminsdk-fbsvc-70abbc9892.json" with { type: "json" };
import { getAuth } from 'firebase-admin/auth';
import aws from 'aws-sdk';


import User from './Schema/User.js';
import Blog from './Schema/Blog.js';

const app = express();
const PORT = process.env.PORT || 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

app.use(express.json());

app.use(cors())

mongoose.connect(process.env.DB_LOCATION,{
    autoIndex: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err.message));

const s3 = new aws.S3({
    region:'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const generateUploadURL = async() => {

    const data = new Date();
    const imageName = `${nanoid()}-${data.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject',{
        Bucket:'blogging-website-esh',
        Key: imageName,
        Expires: 1000,
        ContentType: 'image/jpeg'
    })
}

const verifyJWT = (req,res,next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token == null){
        return res.status(401).json({ error: "No access Token" })
    }

    jwt.verify(token,process.env.SECRET_ACCESS_KEY,(err,user) => {
        if(err){
            return res.status(403).json({error:"Access token is invalid" })
        }
        req.user = user.id
        next()
    })
}

const formateDataToSend = (user) => {

    const access_token = jwt.sign({id:user._id},process.env.SECRET_ACCESS_KEY)
    return {
        access_token,
        profile_img:user.personal_info.profile_img,
        username:user.personal_info.username,
        fullname:user.personal_info.fullname
    }
}

const generateUsername = async (email) => {
    let username = email.split("@")[0];
    
    let isUsernameNotUnique = await User.exists({"personal_info.username":username}).then((result) => result)

    isUsernameNotUnique ? username += nanoid().substring(0,5): "" ;

    return username;
}

app.get('/get-upload-url',(req, res) => {
    generateUploadURL().then(url =>res.status(200).json({uploadURL:url}))
    .catch(err => {
        console.error(err.message)
        return res.status(500).json({error:err})
    })
})

app.post("/signup" ,(req,res ) => {
    let {fullname, email, password} = req.body;


    if (!fullname || fullname.length < 3) {
        return res.status(403).json({ message: "Fullname must be at least 3 characters long" });
    }

    if (!email.length) {
        return res.status(403).json({ message: "Enter email" });
    }

    if (!emailRegex.test(email)) {
        return res.status(403).json({ message: "Email is invalid" });
    }

    if (!passwordRegex.test(password)) {
        return res.status(403).json({ 
            message: "Password must be at least 6 characters long, with at least 1 number, 1 lowercase, and 1 uppercase letter"
        });
    }

    bcrypt.hash(password,10, async(err,hashed_password) => {

        let username = await generateUsername(email);

        let user = new User({
            personal_info:{ fullname, email, password:hashed_password, username }
        })
        
        user.save().then((u) => {
            return res.status(200).json(formateDataToSend(u))
        })
        .catch(err => {

            if(err.code == 11000){
                return res.status(500).json({ message: "Email already exists" });
            }

            return res.status(500).json({ "error": err.message });
        })

    })

});


app.post("/signin" , (req,res) => {
    let {email, password} = req.body;

    User.findOne({"personal_info.email":email })
    .then((user) => {
        if(!user){
            return res.status(403).json({ message: "Email is not registered" });
        }
        
        if(!user.google_auth){
            bcrypt.compare(password,user.personal_info.password,(err,result) => {
                if(err){
                    return res.status(403).json({ "error": "Error occurred while login please try again" });
                }

                if(!result){
                    return res.status(403).json({ message: "Password is incorrect" });
                }else{
                    return res.status(200).json(formateDataToSend(user))
                }
            })
        }else{
            return res.status(403).json({"error":"Account was created using google.try logging in with google."})
        }
    })
    .catch(err => {
        console.log(err.message)
        return res.status(500).json({ "error": err.message });
    })
});

app.post("/google-auth", async(req, res) => {

    let { access_token } = req.body;

    getAuth()
    .verifyIdToken(access_token)
    .then(async(decodedToken) => {

        let { email , name, picture } = decodedToken;

        picture = picture.replace("s96-c" , "s384-c");
        
        let user  =  await User.findOne({"personal_info.email":email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null
        })
        .catch(err => {
            return res.status(500).json({"error":err.message})
        })
        if(user){
            if(!user.google_auth){
                return res.status(403).json({"error" : "this email was signed up without google. please login with password to access account"})
            }
        }
        else{
            let username = await generateUsername(email);

            user = new User({
                personal_info: {fullname:name, email, profile_img: picture, username},google_auth:true
            })
            await user.save().then((u) => {
                user = u
            })
            .catch(err => {
                return res.status(500).json({"error":err.message})
            })
        }

        return res.status(200).json(formateDataToSend(user))
    })
    .catch(err => {
        return res.status(500).json({"error":"Failed to authenticate you with the google . try with some other google account"})
    })
})


app.get('/latest-blogs',(req, res) => {
    let maxLimit = 5;

    Blog.find({draft:false})
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err => {
        return res.status(500).json({error:err.message})
    })
})

app.get('/trending-blogs', (req, res) => {

    Blog.find({draft:false})
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"activity.total_read":-1, "activity.total_likes":-1, "publishedAt":-1})
    .select("blog_id title banner publishedAt -_id")
    .limit(5)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err => {
        return res.status(500).json({error:err.message})
    })
})


app.post("/search-blogs",(req, res) => {
    let { tag } = req.body;

    let findQuery = { tags:tag, draft:false};

    let maxLimit = 5;

    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"activity.total_read":-1, "activity.total_likes":-1, "publishedAt":-1})
    .select("blog_id title publishedAt -_id")
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err => {
        return res.status(500).json({error:err.message})
    })

})

app.post('/create-blog',verifyJWT,(req,res) => {
    
    let authorId = req.user;

    let { title, des, banner, tags, content, draft } = req.body;

    if(!title.length){
        return res.status(403).json({ error:"you must provide a title "});
    }

    if(!draft){
        if(!des.length){
            return res.status(404).json({ error:"you must provide blog description under 200 characters"});
        }

        if(!banner.length){
            return res.status(403).json({error:"you must provide a banner to publish a blog"});
        }

        if(!content.blocks.length){
            return res.status(403).json({error:"there must be some blog content in it to publish"});
        }

        if(!tags.length || tags.length > 10){
            return res.status(403).json({error:"provide tags in order to publish it,maximum 10"});

        }
    }

    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();

    let blog = new Blog({
        title,des,banner,content,tags,author:authorId,blog_id,draft:Boolean(draft)
    })

    blog.save().then(blog => {

        let incrementVal = draft ? 0 : 1 ;

        User.findOneAndUpdate({_id:authorId},{$inc : {"account_info.total_posts" : incrementVal }, $push : {"blogs":blog._id } })
        .then(user => {
            return res.status(200).json( {id : blog.blog_id})
        })
        .catch(err => {
            return res.status(200).json({error:"Failed to update total posts numbers"})
        })
    })
    .catch(err => {
        return res.status(500).json({error : err.message })
    })
    
})

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});