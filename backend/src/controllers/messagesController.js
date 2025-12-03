import { createMessage, getMessagesForRide, getConversationsForUser } from '../services/messageService.js';


// POST /api/messages
export async function postMessage(req, res, next) {
    try {
        
        const { ride_id, content } = req.body;

        const userId = req.user.id;

        if (!ride_id) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        if (!content || !content.trim().length) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        const message = await createMessage(ride_id, userId, content);

        return res.status(201).json({
            message: 'Message sent',
            data: message
        })
        
    } catch (error) {
        console.error('Post message error', error);
        next(error);
    }
}

// GET /api/messages
export async function getMessages(req, res, next) {
    try{

        const { ride_id } = req.query;

        const userId = req.user.id;

        if (!ride_id) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        const messages = await getMessagesForRide(ride_id, userId);

        return res.status(200).json({
            messages
        })


    } catch (error) {
        console.error('Get messages error', error);
        next(error);
    }
}

// GET /api/messages/conversations (get all conversations for current user)
export async function getConversations(req, res, next) {
    try {
        const userId = req.user.id;
        console.log('Fetching conversations for userId:', userId);

        const conversations = await getConversationsForUser(userId);
        console.log('Conversations found:', conversations.length);

        return res.status(200).json({
            conversations
        });
    } catch (error) {
        console.error('Get conversations error', error);
        next(error);
    }
}

