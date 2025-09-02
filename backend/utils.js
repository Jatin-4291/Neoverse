export function formatEmailToName(email) {
  const name = email.split("@")[0];
  return name;
}
