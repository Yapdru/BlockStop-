/**
 * Async File Picker Hook
 * Handles file selection with native file picker
 */

import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  type?: string;
}

interface UseFilePickerReturn {
  isLoading: boolean;
  error: string | null;
  pickFile: () => Promise<PickedFile | null>;
  pickImage: () => Promise<PickedFile | null>;
  pickMultiple: () => Promise<PickedFile[]>;
  clear: () => void;
}

export const useFilePickerAsync = (): UseFilePickerReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setError(null);
  }, []);

  const pickFile = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file: PickedFile = {
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: asset.mimeType,
        };

        setIsLoading(false);
        return file;
      }

      setIsLoading(false);
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick file';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const pickImage = useCallback(async (): Promise<PickedFile | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        setIsLoading(false);
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const file: PickedFile = {
          uri: asset.uri,
          name: asset.uri.split('/').pop() || 'image',
          size: 0,
          type: 'image/jpeg',
        };

        setIsLoading(false);
        return file;
      }

      setIsLoading(false);
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const pickMultiple = useCallback(async (): Promise<PickedFile[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      const files: PickedFile[] = [];

      if (result.type === 'success' && result.assets) {
        result.assets.forEach((asset) => {
          files.push({
            uri: asset.uri,
            name: asset.name,
            size: asset.size || 0,
            type: asset.mimeType,
          });
        });
      }

      setIsLoading(false);
      return files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick files';
      setError(errorMessage);
      setIsLoading(false);
      return [];
    }
  }, []);

  return {
    isLoading,
    error,
    pickFile,
    pickImage,
    pickMultiple,
    clear,
  };
};
