import { Link } from "react-router-dom";
import { getDay } from "../common/date";

const MinimalBlogPost = ({ blog, index }) => {
  let {
    publishedAt,
    title,
    blog_id: id,
    banner, 
    author: {
      personal_info: { fullname, username, profile_img },
    },
  } = blog;

  return (
    <Link to={`/blog/${id}`} className="flex gap-5 mb-8">
      <h1 className="blog-index">
        {index + 1 < 10 ? "0" + (index + 1) : index + 1}
      </h1>
      <div>
        <div className="flex gap-2 items-center mb-7">
          <img src={profile_img} className="w-6 h-6 rounded-full" />
          <p className="line-clamp-1">
            {fullname} @{username}
          </p>
          <p className="min-w-fit">{getDay(publishedAt)}</p>
        </div>

        <h1 className="blog-title">{title}</h1>

        {banner && (
          <div className="h-28 aspect-square bg-grey mt-3">
            <img
              src={banner}
              alt="blog banner"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </Link>
  );
};

export default MinimalBlogPost;
