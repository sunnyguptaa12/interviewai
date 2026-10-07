import Notification from '../models/Notification.js';

// Notifications must never break the main request.
export async function notify(user, type, title, message, link) {
  try { await Notification.create({ user, type, title, message, link }); } catch (e) { console.error('notify failed', e.message); }
}

export const list = (userId) => Notification.find({ user: userId }).sort('-createdAt').limit(50);
export const unreadCount = (userId) => Notification.countDocuments({ user: userId, read: false });
export const markRead = (userId, id) => Notification.updateOne({ _id: id, user: userId }, { read: true });
export const markAllRead = (userId) => Notification.updateMany({ user: userId, read: false }, { read: true });
