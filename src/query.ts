// ?flow y ?debug se manejan a mano, sin router.
export const getParam = (name: string) => new URLSearchParams(window.location.search).get(name);

export const setParam = (name: string, value: string | null) => {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  window.history.replaceState(null, '', url);
};
