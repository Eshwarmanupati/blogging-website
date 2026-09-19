import { Navigate } from "react-router-dom";

/* /dashboard on its own has nothing to show, so send people to their blogs. */
const Dashboard = () => {
    return <Navigate to="/dashboard/blogs" replace />;
};

export default Dashboard;
