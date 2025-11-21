// logging middleware (log every request)
export function logger(req, res, next) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
}

