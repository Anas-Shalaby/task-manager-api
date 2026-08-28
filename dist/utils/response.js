export const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
    };
    if (message)
        response.message = message;
    return res.status(statusCode).json(response);
};
export const sendError = (res, code, message, statusCode = 500, details) => {
    const response = {
        success: false,
        error: {
            code,
            message,
        },
    };
    if (details)
        response.error.details = details;
    return res.status(statusCode).json(response);
};
//# sourceMappingURL=response.js.map