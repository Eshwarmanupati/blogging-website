import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Toaster } from "react-hot-toast";

import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import NotificationCard from "../components/notification-card.component";
import LoadMoreDataBtn from "../components/load-more.component";

const Notifications = () => {
    const [filter, setFilter] = useState("all");
    const [notifications, setNotifications] = useState(null);

    const { userAuth, userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    const filters = ["all", "like", "comment", "reply"];

    const fetchNotifications = async ({ page, deletedDocCount = 0 }) => {
        try {
            const { data: { notifications: results } } = await axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/notifications",
                { page, filter, deletedDocCount },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            // Opening this page is what clears the navbar dot.
            setUserAuth({ ...userAuth, new_notification_available: false });

            const formatted = await filterPaginationData({
                state: notifications,
                data: results,
                page,
                countRoute: "/all-notifications-count",
                data_to_send: { filter },
                user: access_token
            });

            setNotifications(formatted);
        } catch (err) {
            console.error(err);
            setNotifications({ results: [], page: 1, totalDocs: 0 });
        }
    };

    useEffect(() => {
        if (access_token) {
            fetchNotifications({ page: 1 });
        }
    }, [access_token, filter]);

    const handleFilter = (e) => {
        const btn = e.target;

        setFilter(btn.innerHTML);
        setNotifications(null);
    };

    return (
        <div>
            <h1 className="max-md:hidden">Recent Notifications</h1>

            <Toaster />

            <div className="my-8 flex gap-6">
                {filters.map((filterName, i) => (
                    <button
                        key={i}
                        className={"py-2 " + (filter === filterName ? "btn-dark" : "btn-light")}
                        onClick={handleFilter}
                    >
                        {filterName}
                    </button>
                ))}
            </div>

            {notifications === null ? (
                <Loader />
            ) : notifications.results.length ? (
                <>
                    {notifications.results.map((notification, i) => (
                        <AnimationWrapper key={i} transition={{ delay: i * 0.08 }}>
                            <NotificationCard
                                data={notification}
                                index={i}
                                notificationState={{ notifications, setNotifications }}
                            />
                        </AnimationWrapper>
                    ))}

                    <LoadMoreDataBtn
                        state={notifications}
                        fetchDataFun={fetchNotifications}
                        additionalParam={{ deletedDocCount: notifications.deletedDocCount || 0 }}
                    />
                </>
            ) : (
                <NoDataMessage message="Nothing available" />
            )}
        </div>
    );
};

export default Notifications;
