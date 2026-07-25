// Strips MongoDB operator syntax out of user input, so a payload like
// { "email": { "$gt": "" } } cannot turn a findOne into a match-anything query.
//
// express-mongo-sanitize is in package.json but is unusable here: it assigns to
// req.query, which is a getter-only property in Express 5, and throws on every
// request.

const isObject = (value) => value !== null && typeof value === 'object';

const scrub = (value) => {
    if (Array.isArray(value)) {
        value.forEach(scrub);
        return;
    }
    if (!isObject(value)) return;

    for (const key of Object.keys(value)) {
        // `$` marks a query operator and `.` walks into a nested path. Neither
        // belongs in client input. Matching `$` anywhere rather than only as a
        // prefix also catches bracket notation such as `bad[$gt]`, which is how
        // Express 5's default `simple` query parser surfaces it.
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

    // Express 5 re-parses req.query on every read, so scrubbing the object it
    // hands back is thrown away. Take one snapshot, clean it, then install it as
    // an own property - own properties shadow the prototype's getter.
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
