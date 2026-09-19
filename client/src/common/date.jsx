const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const getDay = (timestamp) => {
    const date = new Date(timestamp);

    return `${date.getDate()} ${months[date.getMonth()]}`;
};

export const getFullDay = (timestamp) => {
    const date = new Date(timestamp);

    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/* "3 hours ago" style label used on notification cards. */
export const getRelativeTime = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

    if (seconds < 60) {
        return "just now";
    }

    const units = [
        { label: "year", secs: 31536000 },
        { label: "month", secs: 2592000 },
        { label: "day", secs: 86400 },
        { label: "hour", secs: 3600 },
        { label: "minute", secs: 60 }
    ];

    for (const { label, secs } of units) {
        const value = Math.floor(seconds / secs);

        if (value >= 1) {
            return `${value} ${label}${value > 1 ? "s" : ""} ago`;
        }
    }

    return "just now";
};

export { days, months };
