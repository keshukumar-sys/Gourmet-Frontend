import CreateAccount from "./CreateUser";

/** Same form as CreateUser, pinned to the admin role. */
export default function CreateAdmin() {
  return <CreateAccount role="admin" />;
}
