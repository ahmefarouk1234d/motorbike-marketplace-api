const RANGE_OPERATORS = ['gte', 'gt', 'lte', 'lt'];

class APIFeatures {
    // allowedFilters is a whitelist of fields the caller may filter on. Anything
    // not named here is ignored, so the query object is built by this class
    // rather than handed straight to Mongoose from req.query.
    constructor(query, queryString, allowedFilters = []) {
        this.query = query; // the Mongoose query (Listing.find())
        this.queryString = queryString; // req.query (the ?brand=...&page=2 object)
        this.allowedFilters = allowedFilters;
    }

    filter() {
        const filter = {};

        for (const field of this.allowedFilters) {
            // Exact match, e.g. ?city=Cairo. Only strings are accepted, so a
            // repeated parameter cannot smuggle in an array.
            const exact = this.queryString[field];
            if (typeof exact === 'string') {
                filter[field] = exact;
            }

            // Range, e.g. ?price[gte]=100. Express 5's default query parser does
            // not nest, so this arrives as the literal key "price[gte]". The
            // operator names are ours, never taken from the request, and values
            // are coerced to numbers.
            const range = {};
            for (const operator of RANGE_OPERATORS) {
                const raw = this.queryString[`${field}[${operator}]`];
                if (typeof raw !== 'string') continue;

                const value = Number(raw);
                if (!Number.isFinite(value)) continue;

                range[`$${operator}`] = value;
            }
            if (Object.keys(range).length) filter[field] = range;
        }

        this.query = this.query.find(filter);
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = Number(this.queryString.page) || 1;
        const limit = Number(this.queryString.limit) || 12;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

export default APIFeatures;