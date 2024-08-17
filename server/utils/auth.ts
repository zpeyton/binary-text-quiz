import { config } from "dotenv";

config();

// console.log(process.env);
export const validateAuthHeader = (headers) => {
  let authHeader = headers.authorization || "";
  let token = authHeader.replace("Bearer ", "");

  if (!authHeader) {
    console.log("[utils] [validateAuthHeader]", "No Auth Header");
    return false;
  }

  // find token in database return user
  if (token == process.env.TOKEN) {
    console.log("[utils] [validateAuthHeader]", "Valid User");
    return true;
  }

  console.log("[utils] [validateAuthHeader]", "Invalid Token");
  return false;
};
