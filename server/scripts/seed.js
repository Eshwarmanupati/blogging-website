/*
    Populates the database with a few demo authors and posts so a fresh deploy
    does not look empty. Safe to re-run: it skips anything that already exists.

        npm run seed
*/
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

import User from "../Schema/User.js";
import Blog from "../Schema/Blog.js";

const DEMO_PASSWORD = "Demo1234";

const authors = [
    {
        fullname: "Maya Chen",
        email: "maya@example.com",
        username: "mayachen",
        bio: "Frontend engineer who cares far too much about loading states.",
        social_links: { github: "https://github.com/", website: "https://example.com" }
    },
    {
        fullname: "Dev Patel",
        email: "dev@example.com",
        username: "devpatel",
        bio: "Backend and databases. Writing about the things that broke in production.",
        social_links: { github: "https://github.com/" }
    }
];

const para = (text) => ({ type: "paragraph", data: { text } });
const head = (text, level = 2) => ({ type: "header", data: { text, level } });
const list = (items) => ({ type: "list", data: { style: "unordered", items } });
const code = (c) => ({ type: "code", data: { code: c } });

const posts = [
    {
        author: "mayachen",
        title: "Why your loading spinner is hurting your app",
        des: "A spinner tells people to wait. A skeleton tells them what they are waiting for — and that difference changes how fast your app feels.",
        banner: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
        tags: ["design", "programming", "tech"],
        blocks: [
            para("Perceived performance is not the same as measured performance. An app that takes 800ms but shows structure immediately feels faster than one that takes 500ms behind a spinner."),
            head("What a spinner actually communicates"),
            para("A spinner says <b>something is happening</b>. It does not say what, how much is left, or what the result will look like. That uncertainty is what makes waiting feel long."),
            list([
                "A spinner has no relationship to the content it replaces",
                "It resets the viewer's sense of progress every time it appears",
                "Several spinners on one screen read as several separate failures waiting to happen"
            ]),
            head("Skeletons set an expectation"),
            para("A skeleton screen shows the shape of what is coming. By the time the data lands, the viewer has already parsed the layout, so the content simply fills in."),
            code("// Render the shape first, then the data\nreturn loading ? <PostSkeleton /> : <Post data={data} />;"),
            para("The rule of thumb: under 300ms show nothing, 300ms to a few seconds show a skeleton, and past that show real progress.")
        ]
    },
    {
        author: "devpatel",
        title: "The N+1 query that survived three code reviews",
        des: "It passed review because every individual line looked correct. The problem only existed in the shape of the loop.",
        banner: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&q=80",
        tags: ["programming", "tech", "technology"],
        blocks: [
            para("The endpoint was fine with ten records in development. In production, with a few thousand, it took eleven seconds."),
            head("The shape of the bug"),
            para("Fetching a list, then fetching a relation inside the loop, is the classic N+1. One query for the list, then one more per row."),
            code("// One query for the posts, then one per post for the author\nconst posts = await Post.find();\nfor (const post of posts) {\n  post.author = await User.findById(post.authorId);\n}"),
            head("Why review missed it"),
            list([
                "Every line in isolation was correct and idiomatic",
                "The test fixtures had three rows, so it was fast",
                "The await inside the loop read as ordinary async code"
            ]),
            head("The fix"),
            para("Let the database do the join. One round trip instead of N."),
            code("const posts = await Post.find().populate('author');"),
            para("The lasting fix was not the query though — it was adding a query-count assertion to the test, so the next N+1 fails CI instead of production.")
        ]
    },
    {
        author: "mayachen",
        title: "Small habits that keep a side project alive",
        des: "Most side projects do not die from hard problems. They die from a broken setup step you never wrote down.",
        banner: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
        tags: ["programming", "design"],
        blocks: [
            para("The gap between a project you return to and one you abandon is usually the first five minutes after you open it again."),
            head("Write the README before you need it"),
            para("Not documentation — just the two commands that start the thing. Future you has forgotten which port the API runs on."),
            head("Commit an env example"),
            para("A committed <code>.env.example</code> is the difference between a project that starts and one where you spend an hour guessing variable names."),
            list([
                "Keep setup to a single install and a single start command",
                "Make the app boot even when optional services are unconfigured",
                "Leave a failing note in the issue tracker, not in your head"
            ]),
            para("None of this is impressive. It is just what makes the project still runnable in six months.")
        ]
    },
    {
        author: "devpatel",
        title: "Indexes are not magic, they are a data structure",
        des: "Once you picture the B-tree, every confusing thing about compound indexes stops being confusing.",
        banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
        tags: ["technology", "programming", "tech"],
        blocks: [
            para("Most index confusion comes from treating an index as a hint rather than as a sorted structure you are asking the database to walk."),
            head("Order matters, and here is why"),
            para("A compound index on <b>(a, b)</b> is sorted by a first, then by b within each a. So it can serve a query on a, or on a and b — but not one on b alone."),
            code("db.posts.createIndex({ author: 1, publishedAt: -1 })"),
            para("That index serves \"this author's posts, newest first\" in a single range scan. Reverse the fields and it no longer does."),
            head("The cost side"),
            list([
                "Every index is rewritten on every insert and update",
                "Indexes live in memory when they are useful, so size matters",
                "An index nothing queries is pure write overhead"
            ]),
            para("Measure before adding one, and measure again after.")
        ]
    },
    {
        author: "mayachen",
        title: "Accessible forms are mostly just labels",
        des: "You can skip the ARIA research. Most form accessibility problems are solved by connecting a label to an input.",
        banner: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1200&q=80",
        tags: ["design", "programming"],
        blocks: [
            para("Form accessibility sounds like it needs specialist knowledge. In practice a handful of basics cover most of it."),
            head("Connect every label"),
            para("A placeholder is not a label. It disappears the moment someone types, and screen readers treat it inconsistently."),
            code('<label htmlFor="email">Email</label>\n<input id="email" name="email" type="email" />'),
            head("The rest of the list"),
            list([
                "Keep focus outlines — people navigating by keyboard rely on them",
                "Put errors next to the field, not only at the top",
                "Use the right input type so mobile shows the right keyboard",
                "Make the submit button a real button element"
            ]),
            para("None of this requires ARIA. Reach for ARIA when you build something the platform has no element for — not before.")
        ]
    }
];

const run = async () => {
    if (!process.env.DB_LOCATION) {
        console.error("❌ DB_LOCATION is not set. Copy .env.example to .env first.");
        process.exit(1);
    }

    await mongoose.connect(process.env.DB_LOCATION, { autoIndex: true });
    console.log("✅ Connected");

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userIds = {};

    for (const author of authors) {
        let user = await User.findOne({ "personal_info.username": author.username });

        if (user) {
            console.log(`→ author @${author.username} already exists`);
        } else {
            user = await new User({
                personal_info: {
                    fullname: author.fullname,
                    email: author.email,
                    password: hashed,
                    username: author.username,
                    bio: author.bio
                },
                social_links: author.social_links
            }).save();

            console.log(`✚ created author @${author.username}`);
        }

        userIds[author.username] = user._id;
    }

    let created = 0;

    for (const post of posts) {
        const exists = await Blog.findOne({ title: post.title });

        if (exists) {
            console.log(`→ post "${post.title}" already exists`);
            continue;
        }

        const blog_id =
            post.title
                .replace(/[^a-zA-Z0-9]/g, " ")
                .replace(/\s+/g, "-")
                .trim()
                .toLowerCase() +
            "-" +
            nanoid(8);

        const saved = await new Blog({
            blog_id,
            title: post.title,
            des: post.des,
            banner: post.banner,
            content: { blocks: post.blocks },
            tags: post.tags.map((t) => t.toLowerCase()),
            author: userIds[post.author],
            draft: false,
            activity: {
                total_likes: Math.floor(Math.random() * 40) + 5,
                total_reads: Math.floor(Math.random() * 400) + 50
            }
        }).save();

        await User.findByIdAndUpdate(userIds[post.author], {
            $inc: { "account_info.total_posts": 1, "account_info.total_reads": saved.activity.total_reads },
            $push: { blogs: saved._id }
        });

        created++;
        console.log(`✚ created post "${post.title}"`);
    }

    console.log("");
    console.log(`Done. ${created} new post(s).`);
    console.log(`Demo sign-in: maya@example.com / ${DEMO_PASSWORD}`);

    await mongoose.disconnect();
};

run().catch(async (err) => {
    console.error("❌ Seed failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
});
