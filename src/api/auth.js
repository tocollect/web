export const getToken = () => localStorage.getItem('jwtToken');


export const setToken = (jwtToken) => {
    localStorage.setItem('jwtToken', jwtToken);
};

export const clearToken = () => {
    localStorage.removeItem('jwtToken');
};
