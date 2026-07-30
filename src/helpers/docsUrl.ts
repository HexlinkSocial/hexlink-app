export const getDocsUrl = (path: string = ""): string => {
  const baseUrl = import.meta.env.VITE_DOCS_URL ?? "https://docs.hexlink.org";
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^(?:\/#|\/)+/, "");
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
};
