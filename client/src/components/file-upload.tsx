import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, Image } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (url: string) => void;
  className?: string;
  preview?: boolean;
}

export function FileUpload({ 
  accept = '*/*', 
  maxSize = 10 * 1024 * 1024, // 10MB
  onUpload,
  className = '',
  preview = false
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { mutate: uploadFile, isPending } = useFileUpload();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Show preview for images
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file
    uploadFile(file, {
      onSuccess: (response) => {
        onUpload(response.url);
        toast({
          title: "Upload successful",
          description: "File has been uploaded successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [uploadFile, onUpload, preview, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept === 'image/*' ? { 'image/*': [] } : accept === '.pdf' ? { 'application/pdf': [] } : undefined,
    maxSize,
    multiple: false,
  });

  const clearPreview = () => {
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const getIcon = () => {
    if (accept === 'image/*') return <Image className="h-8 w-8" />;
    if (accept === '.pdf') return <File className="h-8 w-8" />;
    return <Upload className="h-8 w-8" />;
  };

  const getAcceptText = () => {
    if (accept === 'image/*') return 'Drop image here or click to browse';
    if (accept === '.pdf') return 'Drop PDF here or click to browse';
    return 'Drop file here or click to browse';
  };

  return (
    <div className={className}>
      {previewUrl && (
        <div className="mb-4 relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full h-32 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          <div className="text-gray-400">
            {getIcon()}
          </div>
          
          <p className="text-sm text-gray-500">
            {getAcceptText()}
          </p>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
          >
            {isPending ? 'Uploading...' : 'Choose File'}
          </Button>
          
          <p className="text-xs text-gray-400">
            Max size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {isPending && (
        <div className="mt-4">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-gray-500 mt-1">Uploading...</p>
        </div>
      )}
    </div>
  );
}
