// Rasterise a DOM node to a PNG and hand it to the OS share sheet (or download
// it on the web). Same Filesystem → Share path the PDF and CSV exports use.

import { toPng } from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function shareNodeAsImage(node, filename, title = 'Share') {
  if (!node) throw new Error('nothing to share');
  // 2× for a crisp 1080×1350 from the 540×675 card. Fonts are embedded when the
  // stylesheet can be fetched; offline they fall back to the system sans, which
  // the card is designed to survive.
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#0c0d10' });

  if (Capacitor.isNativePlatform()) {
    const base64 = dataUrl.split(',')[1];
    await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
    await Share.share({ title, url: uri, dialogTitle: title });
    return;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
