const RANGE_OPERATORS = ['gte', 'gt', 'lte', 'lt'];

class APIFeatures {
    constructor(query, queryString, allowedFilters = []) {
        this.query = query;
        this.queryString = queryString;
        this.allowedFilters = allowedFilters;
    }

    filter() {
        const filter = {};

        for (const field of this.allowedFilters) {
            const exact = this.queryString[field];
            if (typeof exact === 'string') {
                filter[field] = exact;
            }

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