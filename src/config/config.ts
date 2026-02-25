import "dotenv/config"

export const config = {
    jwt:{
        secret: process.env.JWT_SECRET,
        expires_in: process.env.JWT_EXPIRES_IN
    },
    port: process.env.PORT,
    db_url: process.env.DATABASE_URL,
}