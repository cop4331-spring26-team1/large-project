import { v2 as cloudinary } from 'cloudinary';

const getCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
};

export const uploadImage = (buffer: Buffer, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = getCloudinary().uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
    const parts    = imageUrl.split('/');
    const file     = parts[parts.length - 1].split('.')[0];
    const folder   = parts[parts.length - 2];
    const publicId = `${folder}/${file}`;
    await getCloudinary().uploader.destroy(publicId);
};