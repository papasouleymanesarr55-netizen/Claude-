import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** Partage un fichier texte via la feuille de partage du système (téléchargement sur le web). */
export async function shareTextFile(
  name: string,
  content: string,
  mimeType: string,
  uti?: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: name });
}

export async function shareFileUri(uri: string, mimeType: string, uti?: string): Promise<void> {
  await Sharing.shareAsync(uri, { mimeType, UTI: uti });
}

/** Ouvre le sélecteur de fichier et renvoie le texte choisi, ou null si annulé. */
export async function pickTextFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled) return null;
  const asset = res.assets[0];
  if (!asset) return null;
  if (asset.file) return await asset.file.text();
  return await new File(asset.uri).text();
}
