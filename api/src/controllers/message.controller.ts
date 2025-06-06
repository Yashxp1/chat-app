import { Request, Response } from 'express';
import User from '../models/user.model';
import { Document } from 'mongoose';
import Message from '../models/message.model';
import cloudinary from '../lib/cloudinary';
import { getReceiverSocketId, io } from '../lib/socket';

interface RequestWithUser extends Request {
  user?: Document<typeof User>;
}

export const getUsersForSidebar = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const loggedInUserId = req.user?._id;

    if (!loggedInUserId) {
      res.status(401).json({ error: 'Unauthorized - No User Found' });
      return;
    }

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select('-password');

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error in getUsersForSidebar: ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user?._id;
    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: myId,
        },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages', error);
    res.status(500).json({
      Error: 'Internal server error',
    });
  }
};

export const sendMessage = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user?._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log('Error in send message', error);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};
