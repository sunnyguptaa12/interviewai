export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body); // throws ZodError, strips unknown fields
  next();
};
