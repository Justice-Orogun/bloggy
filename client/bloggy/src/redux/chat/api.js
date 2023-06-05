import axios from "axios";

export const getChats = async () => {
  return await axios.get(`${process.env.REACT_APP_BASE_URL}/api/chat`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

