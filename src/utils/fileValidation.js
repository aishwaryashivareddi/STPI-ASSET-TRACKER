export const validateFile = (file) => {
  if (!file) return true;
  
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (file.size > maxSize) {
    alert('File too large. Maximum size is 10MB');
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type. Only images, PDFs, and Office documents are allowed');
    return false;
  }
  
  return true;
};
