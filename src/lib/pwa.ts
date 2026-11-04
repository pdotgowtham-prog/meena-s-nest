export async function requestAppInstallHelp(): Promise<boolean> {
  return "serviceWorker" in navigator && navigator.serviceWorker.ready.then(() => true).catch(() => false);
}
