"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const getCloudinary = () => {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary_1.v2;
};
const uploadImage = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = getCloudinary().uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};
exports.uploadImage = uploadImage;
const deleteImage = async (imageUrl) => {
    const parts = imageUrl.split('/');
    const file = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${file}`;
    await getCloudinary().uploader.destroy(publicId);
};
exports.deleteImage = deleteImage;
