// this middleware catches all errors and sends the proper error response
export function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // if error has a status code, use it; otherwise, default is 100
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: err.message || 'Internal server error'
    });
}

