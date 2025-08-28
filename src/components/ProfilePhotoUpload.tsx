import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { memberService } from '@/services/memberService';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePhotoUploadProps {
  memberId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated: (photoUrl: string) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  memberId,
  currentPhotoUrl,
  onPhotoUpdated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'image/jpeg', 0.9);
      });
    },
    []
  );

  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein Bild und definieren Sie den Ausschnitt.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const file = new File([croppedBlob], `profile-${memberId}.jpg`, { type: 'image/jpeg' });
      
      let photoUrl: string;
      if (memberId === "new") {
        // For new members, we'll handle the upload later when the member is created
        // For now, we'll create a temporary URL
        const tempUrl = URL.createObjectURL(croppedBlob);
        onPhotoUpdated(tempUrl);
        photoUrl = tempUrl;
      } else {
        photoUrl = await memberService.uploadProfilePhoto(memberId, file);
        // Force page reload to refresh image cache
        window.location.reload();
        onPhotoUpdated(photoUrl);
      }
      
      toast({
        title: "Erfolg",
        description: "Profilbild wurde erfolgreich hochgeladen.",
      });
      
      setIsOpen(false);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Profilbild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        {currentPhotoUrl ? 'Foto ändern' : 'Foto hochladen'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Profilbild hochladen</DialogTitle>
            <DialogDescription>
              Wählen Sie ein Bild aus und definieren Sie den gewünschten Ausschnitt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-upload">Bild auswählen</Label>
              <Input
                ref={inputRef}
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="mt-2"
              />
            </div>

            {imgSrc && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{ maxHeight: '400px', maxWidth: '100%' }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!completedCrop || uploading}
              className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
            >
              <Check className="h-4 w-4 mr-2" />
              {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePhotoUpload;