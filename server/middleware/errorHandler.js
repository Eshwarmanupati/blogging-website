/* Turns anything thrown inside an async handler into a JSON response. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler = (err, req, res, next) => {
    console.error("❌", err.message);

    const status = err.status || 500;

    res.status(status).json({
        error: status === 500 ? "Something went wrong on our side" : err.message
    });
};
