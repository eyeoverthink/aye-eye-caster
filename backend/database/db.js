import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.set("strictQuery", true);


mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
});

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect('mongodb+srv://eyeoverthink:wolverine@cluster0.zic3y.mongodb.net/ephless?retryWrites=true&w=majority&appName=Cluster0"');
		console.log(`Connected to Mongo ${conn.connection.host}`);
	} catch (error) {
		console.log("Failed to connect to MongoDB", error);
		process.exit(1); // 1 is failure, 0 is success
	}
};
