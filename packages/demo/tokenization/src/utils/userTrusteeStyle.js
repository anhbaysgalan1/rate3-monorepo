const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const genStyle = (name, styleFn) => ({
  [`user${capitalize(name)}`]: styleFn(true),
  [`trustee${capitalize(name)}`]: styleFn(false),
});

export const getClass = (classes, name, isUser) => (
  classes[`${isUser ? 'user' : 'trustee'}${capitalize(name)}`]
);
