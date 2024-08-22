import { Router } from "../../router";
import { clientError, ok } from "../../utils/response";

export class Contacts {
  get = async (router: Router) => {
    let mockContacts = [
      { first_name: "First", last_name: "Last" },
      { first_name: "Zach", last_name: "Peyton" },
      { first_name: "John", last_name: "Smith" },
    ];

    if (router.urlParams.id) {
      return ok({
        status: "ok",
        data: {
          contact: mockContacts[router.urlParams.id],
        },
      });
    }

    return ok({ status: "ok", data: { contacts: mockContacts } });
  };

  post = async (router: Router) => {
    let postBody = JSON.parse(router.req.body);

    let { user } = postBody;
    if (!user) {
      return clientError({
        status: "fail",
        message: "Missing required param user",
        data: postBody,
      });
    }

    let newContact = { id: 1, ...user };
    return ok({ newContact });
  };

  put = (router: Router) => {
    if (!router.urlParams.id) {
      return clientError({
        status: "fail",
        message: "Missing required url param: id",
        data: router.urlParams,
      });
    }

    let postBody = JSON.parse(router.req.body);

    let { user } = postBody;
    if (!user) {
      return clientError({
        status: "fail",
        message: "Missing required param user",
        data: postBody,
      });
    }

    return ok({ contact: { ...router.urlParams, ...user } });
  };
}
