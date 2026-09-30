// Loaded before every test file: env first so "@/lib/db/client" (which
// throws without DATABASE_URL) can be imported anywhere.
import dotenv from "dotenv";

dotenv.config();
