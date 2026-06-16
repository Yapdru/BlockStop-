/**
 * File Picker Button Component
 * Native file picker integration
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { mobileTheme } from '../utils/mobile-theme';
import { MobileButton } from './MobileButton';
import { useFilePickerAsync, PickedFile } from '../hooks/useFilePickerAsync';

interface FilePickerButtonProps {
  onFilePicked?: (file: PickedFile) => void;
  onImagePicked?: (image: PickedFile) => void;
  onMultiplePicked?: (files: PickedFile[]) => void;
  mode?: 'file' | 'image' | 'multiple';
  title?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
}

const styles = StyleSheet.create({
  container: {
    gap: mobileTheme.spacing[2],
  },
  errorText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.error[500],
    paddingHorizontal: mobileTheme.spacing[3],
  },
  successText: {
    fontSize: mobileTheme.typography.fontSize.sm,
    color: mobileTheme.colors.success[600],
    paddingHorizontal: mobileTheme.spacing[3],
  },
});

export const FilePickerButton = ({
  onFilePicked,
  onImagePicked,
  onMultiplePicked,
  mode = 'file',
  title,
  buttonVariant = 'primary',
  disabled = false,
}: FilePickerButtonProps) => {
  const { isLoading, error, pickFile, pickImage, pickMultiple, clear } =
    useFilePickerAsync();
  const [lastFile, setLastFile] = React.useState<PickedFile | null>(null);

  const handlePress = async () => {
    clear();

    if (mode === 'image') {
      const image = await pickImage();
      if (image) {
        setLastFile(image);
        onImagePicked?.(image);
      }
    } else if (mode === 'multiple') {
      const files = await pickMultiple();
      if (files.length > 0) {
        setLastFile(files[0]);
        onMultiplePicked?.(files);
      }
    } else {
      const file = await pickFile();
      if (file) {
        setLastFile(file);
        onFilePicked?.(file);
      }
    }
  };

  const getDefaultTitle = () => {
    if (title) return title;
    switch (mode) {
      case 'image':
        return 'Pick Image';
      case 'multiple':
        return 'Pick Files';
      default:
        return 'Pick File';
    }
  };

  return (
    <View style={styles.container}>
      <MobileButton
        title={isLoading ? 'Picking...' : getDefaultTitle()}
        variant={buttonVariant}
        size="md"
        onPress={handlePress}
        disabled={disabled || isLoading}
        loading={isLoading}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {lastFile && (
        <Text style={styles.successText}>
          Selected: {lastFile.name}
        </Text>
      )}
    </View>
  );
};
