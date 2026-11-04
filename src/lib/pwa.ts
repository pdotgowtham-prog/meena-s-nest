export async function requestAppInstallHelp(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.ready;
    return true;
  } catch {
    return false;
  }
}
