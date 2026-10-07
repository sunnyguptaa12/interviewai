export const sendSuccess = (res, data = {}, message = 'Operation successful', status = 200) =>
  res.status(status).json({ success: true, message, data });
