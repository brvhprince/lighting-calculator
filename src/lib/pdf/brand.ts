// Brand assets for the PDF reports. The logo is embedded as a data URL because
// react-pdf renders those most reliably (no network fetch during layout).

export const LOGO_PATH = '/media/penlabs-icon.png';

// Fetch the brand logo and return it as a data URL. Returns undefined when it
// cannot be loaded (e.g. server-side), so the report falls back to a text mark.
export async function loadLogoDataUrl(path: string = LOGO_PATH): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const res = await fetch(path);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error('logo read failed'));
      fr.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
