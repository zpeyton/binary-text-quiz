import { match } from "path-to-regexp";

export const parseUrlParams = (pattern, url) => {
  let matchFn = match("/contacts/:id");
  let matchUrl = matchFn(url);
  if (!matchUrl) {
    return {};
  }
  return matchUrl.params;
};

export const clientError = (data) => {
  return {
    statusCode: 400,
    data,
  };
};

export const ok = (data) => {
  return {
    statusCode: 200,
    data,
  };
};
