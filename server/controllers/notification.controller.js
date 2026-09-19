import Notification from "../Schema/Notification.js";

/* Powers the red dot on the navbar bell. */
export const newNotification = async (req, res) => {
    const user_id = req.user;

    const result = await Notification.exists({
        notification_for: user_id,
        seen: false,
        user: { $ne: user_id }
    });

    return res.status(200).json({ new_notification_available: Boolean(result) });
};

export const notifications = async (req, res) => {
    const user_id = req.user;
    const { page = 1, filter = "all", deletedDocCount = 0 } = req.body;

    const maxLimit = 10;

    const findQuery = { notification_for: user_id, user: { $ne: user_id } };

    if (filter !== "all") {
        findQuery.type = filter;
    }

    const skipDocs = (page - 1) * maxLimit - deletedDocCount;

    const docs = await Notification.find(findQuery)
        .skip(skipDocs < 0 ? 0 : skipDocs)
        .limit(maxLimit)
        .populate("blog", "title blog_id")
        .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
        .populate("comment", "comment")
        .populate("replied_on_comment", "comment")
        .populate("reply", "comment")
        .sort({ createdAt: -1 })
        .select("createdAt type seen reply");

    /*
        Fetching a page is what marks it as read. Mongoose ignores skip/limit on
        updateMany, so the ids that were actually returned are targeted directly —
        otherwise loading page 1 would mark every notification seen.
    */
    await Notification.updateMany({ _id: { $in: docs.map((doc) => doc._id) } }, { seen: true });

    return res.status(200).json({ notifications: docs });
};

export const allNotificationsCount = async (req, res) => {
    const user_id = req.user;
    const { filter = "all" } = req.body;

    const findQuery = { notification_for: user_id, user: { $ne: user_id } };

    if (filter !== "all") {
        findQuery.type = filter;
    }

    const count = await Notification.countDocuments(findQuery);

    return res.status(200).json({ totalDocs: count });
};
