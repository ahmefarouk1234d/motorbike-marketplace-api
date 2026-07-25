import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/user.model.js';
import Brand from '../models/brand.model.js';
import Listing from '../models/listing.model.js';

const seed = async () => {
    try {
        await connectDB();

        await Listing.deleteMany();
        await Brand.deleteMany();
        await User.deleteMany({ email: 'seller@demo.com' });

        const brands = await Brand.create([
            { name: 'SYM', description: 'Taiwanese manufacturer, popular in Egypt' },
            { name: 'Halawa', description: 'Egyptian assembled motorcycles' },
            { name: 'Jieda', description: 'Chinese sport bikes' },
            { name: 'Hojen', description: 'Chinese cruiser and sport models' },
            { name: 'Honda', description: 'Japanese manufacturer' },
            { name: 'Yamaha', description: 'Japanese manufacturer' },
            { name: 'Bajaj', description: 'Indian manufacturer' },
            { name: 'Keeway', description: 'Chinese-Hungarian brand' }
        ]);

        const seller = await User.create({
            fullName: 'Demo Seller',
            email: 'seller@demo.com',
            password: 'password123',
            phone: '01000000000',
            city: 'Cairo',
            role: 'seller',
            isVerified: true
        });

        await Listing.create([
            {
                title: 'SYM NHX 200 ABS 2024',
                description: 'Brand new SYM NHX 200 with ABS, fuel injection, agent warranty.',
                price: 145000, brand: brands[0]._id, model: 'NHX 200 ABS',
                year: 2024, mileage: 0, engineCC: 200, condition: 'new',
                city: 'Cairo', seller: seller._id, status: 'approved'
            },
            {
                title: 'Halawa 150 - Clean Condition',
                description: 'Well maintained Halawa 150, single owner, all papers ready.',
                price: 42000, brand: brands[1]._id, model: 'Halawa 150',
                year: 2023, mileage: 12000, engineCC: 150, condition: 'used',
                city: 'Giza', seller: seller._id, status: 'approved'
            },
            {
                title: 'Jieda R3 2024 Sport',
                description: 'New Jieda R3 sport bike, aggressive styling, great for city riding.',
                price: 68000, brand: brands[2]._id, model: 'R3',
                year: 2024, mileage: 0, engineCC: 200, condition: 'new',
                city: 'Alexandria', seller: seller._id, status: 'approved'
            },
            {
                title: 'Hojen 3 250cc Cruiser',
                description: 'Hojen 3 cruiser, low mileage, comfortable for long rides.',
                price: 55000, brand: brands[3]._id, model: 'Hojen 3',
                year: 2023, mileage: 8000, engineCC: 250, condition: 'used',
                city: 'Cairo', seller: seller._id, status: 'approved'
            },
            {
                title: 'Bajaj Boxer 150 - Reliable Commuter',
                description: 'Bajaj Boxer 150, fuel efficient, perfect daily commuter.',
                price: 38000, brand: brands[6]._id, model: 'Boxer 150',
                year: 2022, mileage: 20000, engineCC: 150, condition: 'used',
                city: 'Mansoura', seller: seller._id, status: 'approved'
            }
        ]);

        console.log('✅ Database seeded successfully!');
        console.log(`   ${brands.length} brands, 1 seller, 5 listings`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();