const isObject = (value) => value !== null && typeof value === 'object';

const scrub = (value) => {
    if (Array.isArray(value)) {
        value.forEach(scrub);
        return;
    }
    if (!isObject(value)) return;

    for (const key of Object.keys(value)) {
        if (key.includes('$') || key.includes('.')) {
            delete value[key];
        } else {
            scrub(value[key]);
        }
    }
};

const sanitize = (req, res, next) => {
    scrub(req.body);
    scrub(req.params);

    const query = req.query;
    scrub(query);
    Object.defineProperty(req, 'query', {
        value: query,
        writable: true,
        configurable: true,
        enumerable: true
    });

    next();
};

export default sanitize;
