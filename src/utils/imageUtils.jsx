export const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); // El resultado incluye el prefijo "data:image/..."
        reader.onerror = (error) => reject(error);
    });
};