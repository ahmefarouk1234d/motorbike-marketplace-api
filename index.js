import 'dotenv/config';
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import './src/models/index.js';
const port = process.env.PORT ;

async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

startServer();