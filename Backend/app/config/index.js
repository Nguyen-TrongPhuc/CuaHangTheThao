const config = {
    app: {
        port: process.env.PORT || 3003,
    }, 
     db: {
        uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/SportStore",
    }, 
      jwt: {
        secret: "sportstore_secret_key"
    },

    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    }
};

module.exports = config;