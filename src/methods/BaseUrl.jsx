const baseUrl = (endPoint) => {
     let baseUrl = `http://localhost:5000${endPoint}`;
     return baseUrl;
}

export default baseUrl;