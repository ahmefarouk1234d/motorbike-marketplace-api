const bearer = [{ bearerAuth: [] }];

const error = (description) => ({
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
});

const json = (description, schema) => ({
    description,
    content: { 'application/json': { schema } }
});

const envelope = (dataSchema, extra = {}) => ({
    type: 'object',
    properties: { success: { type: 'boolean' }, data: dataSchema, ...extra }
});

const openapi = {
    openapi: '3.0.3',
    info: {
        title: 'Motorbike Marketplace API',
        version: '1.0.0',
        description:
            'REST API for a motorcycle listings marketplace.\n\n' +
            'Authenticate with `POST /api/auth/login`, then send the returned token as `Authorization: Bearer <token>`.\n\n' +
            'Endpoints that accept images use `multipart/form-data`; every other write is JSON. ' +
            'Image fields are never accepted in the request body - they are derived from the uploaded files.'
    },
    servers: [{ url: '/', description: 'Current host' }],
    tags: [
        { name: 'Auth', description: 'Registration, login, verification and password reset' },
        { name: 'Listings', description: 'Motorcycle listings' },
        { name: 'Brands', description: 'Manufacturer catalogue' },
        { name: 'Favorites', description: 'Per-user saved listings' },
        { name: 'Admin', description: 'Administrative endpoints' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Listing not found' }
                }
            },
            StoredFile: {
                type: 'object',
                description: 'An object in Firebase Storage. `path` is kept so the file can be deleted later.',
                properties: {
                    url: { type: 'string', format: 'uri' },
                    path: { type: 'string', example: 'listings/6f1c3e02-....jpg' }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    city: { type: 'string' },
                    role: { type: 'string', enum: ['buyer', 'seller', 'admin'] },
                    isVerified: { type: 'boolean' },
                    avatar: { $ref: '#/components/schemas/StoredFile' }
                }
            },
            Brand: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string', example: 'SYM' },
                    description: { type: 'string' },
                    logo: { $ref: '#/components/schemas/StoredFile' }
                }
            },
            Listing: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    title: { type: 'string', example: 'SYM NHX 200 ABS 2024' },
                    description: { type: 'string' },
                    price: { type: 'number', example: 145000 },
                    brand: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Brand' }] },
                    model: { type: 'string' },
                    year: { type: 'integer', example: 2024 },
                    mileage: { type: 'integer' },
                    engineCC: { type: 'integer' },
                    condition: { type: 'string', enum: ['new', 'used'] },
                    city: { type: 'string' },
                    status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'sold'] },
                    viewsCount: { type: 'integer' },
                    images: { type: 'array', items: { $ref: '#/components/schemas/StoredFile' } },
                    seller: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string', description: 'JWT bearer token' },
                    data: { $ref: '#/components/schemas/User' }
                }
            }
        }
    },
    paths: {
        '/api/health': {
            get: {
                tags: ['Admin'],
                summary: 'Liveness check',
                security: [],
                responses: { 200: json('Server is up', { type: 'object' }) }
            }
        },

        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Create an account',
                description: 'Sends a verification email. Registration still succeeds if mail delivery fails.',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['fullName', 'email', 'password'],
                                properties: {
                                    fullName: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 8 },
                                    phone: { type: 'string' },
                                    city: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: json('Account created', { $ref: '#/components/schemas/AuthResponse' }),
                    400: error('Validation failed'),
                    409: error('Email already in use'),
                    429: error('Too many attempts')
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Exchange credentials for a token',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: json('Signed in', { $ref: '#/components/schemas/AuthResponse' }),
                    401: error('Invalid email or password'),
                    429: error('Too many failed attempts')
                }
            }
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Current user',
                security: bearer,
                responses: {
                    200: json('The authenticated user', envelope({ $ref: '#/components/schemas/User' })),
                    401: error('Not authenticated')
                }
            }
        },
        '/api/auth/me/avatar': {
            patch: {
                tags: ['Auth'],
                summary: 'Upload or replace the avatar',
                description: 'Any previous avatar is deleted from storage once the new one is saved.',
                security: bearer,
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['avatar'],
                                properties: { avatar: { type: 'string', format: 'binary' } }
                            }
                        }
                    }
                },
                responses: {
                    200: json('Avatar updated', envelope({ $ref: '#/components/schemas/User' })),
                    400: error('No file, wrong type, or over 5MB'),
                    401: error('Not authenticated')
                }
            }
        },
        '/api/auth/verify-email/{token}': {
            get: {
                tags: ['Auth'],
                summary: 'Confirm an email address',
                security: [],
                parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: json('Email verified', { type: 'object' }),
                    400: error('Link is invalid or expired')
                }
            }
        },
        '/api/auth/resend-verification': {
            post: {
                tags: ['Auth'],
                summary: 'Request a fresh verification link',
                description: 'Always answers 200, whether or not the address exists, to avoid account enumeration.',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: { email: { type: 'string', format: 'email' } }
                            }
                        }
                    }
                },
                responses: { 200: json('Acknowledged', { type: 'object' }), 429: error('Too many attempts') }
            }
        },
        '/api/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Request a password reset link',
                description: 'Always answers 200 regardless of whether the address exists.',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: { email: { type: 'string', format: 'email' } }
                            }
                        }
                    }
                },
                responses: { 200: json('Acknowledged', { type: 'object' }), 429: error('Too many attempts') }
            }
        },
        '/api/auth/reset-password/{token}': {
            patch: {
                tags: ['Auth'],
                summary: 'Set a new password using a reset link',
                security: [],
                parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['password'],
                                properties: { password: { type: 'string', minLength: 8 } }
                            }
                        }
                    }
                },
                responses: {
                    200: json('Password changed, signed in', { $ref: '#/components/schemas/AuthResponse' }),
                    400: error('Link is invalid or expired, or password too short')
                }
            }
        },

        '/api/listings': {
            get: {
                tags: ['Listings'],
                summary: 'Browse listings',
                description:
                    'Public. Returns approved listings only. Admins may pass `status` to see others. ' +
                    'Filterable fields are whitelisted; anything else in the query string is ignored.',
                security: [],
                parameters: [
                    { name: 'city', in: 'query', schema: { type: 'string' } },
                    { name: 'condition', in: 'query', schema: { type: 'string', enum: ['new', 'used'] } },
                    { name: 'brand', in: 'query', schema: { type: 'string' }, description: 'Brand id' },
                    { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Admins only; ignored otherwise' },
                    { name: 'price[gte]', in: 'query', schema: { type: 'number' }, description: 'Also gt, lte, lt. Same form works for year, mileage, engineCC.' },
                    { name: 'sort', in: 'query', schema: { type: 'string', example: '-price' } },
                    { name: 'fields', in: 'query', schema: { type: 'string', example: 'title,price' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } }
                ],
                responses: {
                    200: json('Matching listings', envelope(
                        { type: 'array', items: { $ref: '#/components/schemas/Listing' } },
                        { results: { type: 'integer' } }
                    ))
                }
            },
            post: {
                tags: ['Listings'],
                summary: 'Publish a listing',
                description:
                    'Sellers and admins only. Sent as multipart/form-data. Numeric fields may be sent as strings. ' +
                    'Up to 5 images, 5MB each, JPEG/PNG/WebP. New listings start with status `pending`.',
                security: bearer,
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['title', 'description', 'price', 'brand', 'model', 'year', 'mileage', 'engineCC', 'condition', 'city'],
                                properties: {
                                    title: { type: 'string', minLength: 3 },
                                    description: { type: 'string', minLength: 10 },
                                    price: { type: 'number' },
                                    brand: { type: 'string', description: 'Brand id' },
                                    model: { type: 'string' },
                                    year: { type: 'integer' },
                                    mileage: { type: 'integer' },
                                    engineCC: { type: 'integer' },
                                    condition: { type: 'string', enum: ['new', 'used'] },
                                    city: { type: 'string' },
                                    images: { type: 'array', items: { type: 'string', format: 'binary' } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: json('Listing created', envelope({ $ref: '#/components/schemas/Listing' })),
                    400: error('Validation failed, or a file was rejected'),
                    401: error('Not authenticated'),
                    403: error('Buyers cannot publish listings')
                }
            }
        },
        '/api/listings/{id}': {
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            get: {
                tags: ['Listings'],
                summary: 'Fetch one listing',
                description: 'Increments the view counter. Unapproved listings return 404 unless you are the seller or an admin.',
                security: [],
                responses: {
                    200: json('The listing', envelope({ $ref: '#/components/schemas/Listing' })),
                    404: error('Not found, or not visible to you')
                }
            },
            patch: {
                tags: ['Listings'],
                summary: 'Update a listing',
                description: 'Owner or admin. Uploading images replaces the existing set; the old files are deleted.',
                security: bearer,
                requestBody: {
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    price: { type: 'number' },
                                    model: { type: 'string' },
                                    year: { type: 'integer' },
                                    mileage: { type: 'integer' },
                                    engineCC: { type: 'integer' },
                                    condition: { type: 'string', enum: ['new', 'used'] },
                                    city: { type: 'string' },
                                    images: { type: 'array', items: { type: 'string', format: 'binary' } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: json('Listing updated', envelope({ $ref: '#/components/schemas/Listing' })),
                    403: error('Not your listing'),
                    404: error('Not found')
                }
            },
            delete: {
                tags: ['Listings'],
                summary: 'Delete a listing',
                description: 'Owner or admin. Stored images are removed from Firebase Storage too.',
                security: bearer,
                responses: {
                    200: json('Listing deleted', envelope({ $ref: '#/components/schemas/Listing' })),
                    403: error('Not your listing'),
                    404: error('Not found')
                }
            }
        },
        '/api/listings/{id}/status': {
            patch: {
                tags: ['Admin'],
                summary: 'Approve or reject a listing',
                security: bearer,
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: { status: { type: 'string', enum: ['approved', 'rejected'] } }
                            }
                        }
                    }
                },
                responses: {
                    200: json('Status changed', envelope({ $ref: '#/components/schemas/Listing' })),
                    400: error('Status must be approved or rejected'),
                    403: error('Admins only')
                }
            }
        },

        '/api/brands': {
            get: {
                tags: ['Brands'],
                summary: 'List all brands',
                security: [],
                responses: {
                    200: json('All brands', envelope(
                        { type: 'array', items: { $ref: '#/components/schemas/Brand' } },
                        { results: { type: 'integer' } }
                    ))
                }
            },
            post: {
                tags: ['Brands'],
                summary: 'Create a brand',
                description: 'Admins only. Multipart, and a logo file is required.',
                security: bearer,
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['name', 'logo'],
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    logo: { type: 'string', format: 'binary' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: json('Brand created', envelope({ $ref: '#/components/schemas/Brand' })),
                    400: error('A logo image is required'),
                    403: error('Admins only'),
                    409: error('Brand name already exists')
                }
            }
        },
        '/api/brands/{id}': {
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            get: {
                tags: ['Brands'],
                summary: 'Fetch one brand',
                security: [],
                responses: {
                    200: json('The brand', envelope({ $ref: '#/components/schemas/Brand' })),
                    404: error('Not found')
                }
            },
            patch: {
                tags: ['Brands'],
                summary: 'Update a brand',
                description: 'Admins only. Supplying a new logo deletes the previous file.',
                security: bearer,
                requestBody: {
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    logo: { type: 'string', format: 'binary' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: json('Brand updated', envelope({ $ref: '#/components/schemas/Brand' })),
                    403: error('Admins only'),
                    404: error('Not found')
                }
            },
            delete: {
                tags: ['Brands'],
                summary: 'Delete a brand',
                security: bearer,
                responses: {
                    200: json('Brand deleted', envelope({ $ref: '#/components/schemas/Brand' })),
                    403: error('Admins only'),
                    404: error('Not found')
                }
            }
        },

        '/api/favorites': {
            get: {
                tags: ['Favorites'],
                summary: 'List your saved listings',
                security: bearer,
                responses: {
                    200: json('Saved listings', envelope({ type: 'array', items: { $ref: '#/components/schemas/Listing' } })),
                    401: error('Not authenticated')
                }
            }
        },
        '/api/favorites/{listingId}': {
            parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
            post: {
                tags: ['Favorites'],
                summary: 'Save a listing',
                security: bearer,
                responses: { 201: json('Saved', { type: 'object' }), 401: error('Not authenticated') }
            },
            delete: {
                tags: ['Favorites'],
                summary: 'Remove a saved listing',
                security: bearer,
                responses: { 200: json('Removed', { type: 'object' }), 401: error('Not authenticated') }
            }
        },

        '/api/stats': {
            get: {
                tags: ['Admin'],
                summary: 'Marketplace totals',
                security: bearer,
                responses: {
                    200: json('Aggregate counts', envelope({ type: 'object' })),
                    403: error('Admins only')
                }
            }
        }
    }
};

export default openapi;
