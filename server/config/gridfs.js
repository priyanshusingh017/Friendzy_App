import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket;
let isInitialized = false;

export const initGridFS = () => {
  return new Promise((resolve, reject) => {
    const conn = mongoose.connection;
    
    if (conn.readyState !== 1) {
      reject(new Error('MongoDB is not connected'));
      return;
    }
    
    try {
      bucket = new GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      isInitialized = true;
      console.log('✅ GridFS initialized successfully');
      resolve(bucket);
    } catch (error) {
      reject(error);
    }
  });
};

export const getGridFSBucket = () => {
  if (!bucket || !isInitialized) {
    throw new Error('GridFS not initialized. Make sure MongoDB is connected and initGridFS() was called.');
  }
  return bucket;
};

export const uploadToGridFS = (filename, buffer, metadata = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      
      // Metadata is already a plain object with ISO string dates
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: metadata
      });

      uploadStream.on('error', (error) => {
        console.error('❌ GridFS upload error:', error);
        reject(error);
      });
      
      uploadStream.on('finish', () => {
        console.log('✅ File uploaded to GridFS:', filename);
        resolve({
          id: uploadStream.id,
          filename: filename
        });
      });

      uploadStream.end(buffer);
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteFromGridFS = async (filename) => {
  try {
    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename }).toArray();
    
    if (files.length > 0) {
      await bucket.delete(files[0]._id);
      console.log('✅ File deleted from GridFS:', filename);
      return true;
    }
    console.log('⚠️ File not found in GridFS:', filename);
    return false;
  } catch (error) {
    console.error('❌ Error deleting from GridFS:', error);
    throw error;
  }
};

export const getFileFromGridFS = (filename) => {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStreamByName(filename);
};

// Check if GridFS is ready
export const isGridFSReady = () => {
  return isInitialized && bucket !== null;
};