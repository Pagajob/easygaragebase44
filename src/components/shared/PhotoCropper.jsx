
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Check, X, RotateCw } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

export default function PhotoCropper({ isOpen, onClose, imageUrl, onSave }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageUrl && isOpen) {
      setIsLoading(true); // Ensure loading state is true when a new image URL is set
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        setIsLoading(false);
        // Centrer l'image
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          setZoom(scale);
          setPosition({
            x: (canvas.width - img.width * scale) / 2,
            y: (canvas.height - img.height * scale) / 2
          });
        }
      };
      img.onerror = () => {
        setIsLoading(false); // Handle image loading error
        console.error("Failed to load image from URL:", imageUrl);
        // Optionally, show an error message to the user or call onClose()
        onClose();
      };
      img.src = imageUrl;
    } else if (!isOpen) {
      // Reset state when dialog is closed, if onOpenChange={onClose} does not handle it
      // Note: The outline changed onOpenChange to onClose, so explicit reset might be needed here
      // if onClose doesn't trigger parent to unmount or reset state for next open.
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImage(null);
      setIsLoading(true);
    }
  }, [imageUrl, isOpen]);

  useEffect(() => {
    if (image && !isLoading) {
      drawImage();
    }
  }, [image, zoom, rotation, position, isLoading]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fond gris
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // Appliquer la transformation
    ctx.translate(position.x + (image.width * zoom) / 2, position.y + (image.height * zoom) / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-image.width / 2, -image.height / 2);
    
    // Dessiner l'image
    ctx.drawImage(image, 0, 0);
    
    ctx.restore();

    // Dessiner le cadre de recadrage
    const cropSize = Math.min(canvas.width, canvas.height) * 0.8;
    const cropX = (canvas.width - cropSize) / 2;
    const cropY = (canvas.height - cropSize) / 2;

    // Zone sombre autour du cadre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, cropY);
    ctx.fillRect(0, cropY, cropX, cropSize);
    ctx.fillRect(cropX + cropSize, cropY, canvas.width - cropX - cropSize, cropSize);
    ctx.fillRect(0, cropY + cropSize, canvas.width, canvas.height - cropY - cropSize);

    // Cadre blanc
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropX, cropY, cropSize, cropSize);

    // Coins du cadre
    const cornerSize = 20;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    
    // Coin haut gauche
    ctx.beginPath();
    ctx.moveTo(cropX, cropY + cornerSize);
    ctx.lineTo(cropX, cropY);
    ctx.lineTo(cropX + cornerSize, cropY);
    ctx.stroke();

    // Coin haut droit
    ctx.beginPath();
    ctx.moveTo(cropX + cropSize - cornerSize, cropY);
    ctx.lineTo(cropX + cropSize, cropY);
    ctx.lineTo(cropX + cropSize, cropY + cornerSize);
    ctx.stroke();

    // Coin bas gauche
    ctx.beginPath();
    ctx.moveTo(cropX, cropY + cropSize - cornerSize);
    ctx.lineTo(cropX, cropY + cropSize);
    ctx.lineTo(cropX + cornerSize, cropY + cropSize);
    ctx.stroke();

    // Coin bas droit
    ctx.beginPath();
    ctx.moveTo(cropX + cropSize - cornerSize, cropY + cropSize);
    ctx.lineTo(cropX + cropSize, cropY + cropSize);
    ctx.lineTo(cropX + cropSize, cropY + cropSize - cornerSize);
    ctx.stroke();
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - position.x,
      y: e.clientY - rect.top - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - rect.left - position.x,
      y: touch.clientY - rect.top - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    setPosition({
      x: touch.clientX - rect.left - dragStart.x,
      y: touch.clientY - rect.top - dragStart.y
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const cropSize = Math.min(canvas.width, canvas.height) * 0.8;
    const cropX = (canvas.width - cropSize) / 2;
    const cropY = (canvas.height - cropSize) / 2;

    // Créer un canvas temporaire pour la zone recadrée
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropSize;
    tempCanvas.height = cropSize;
    const tempCtx = tempCanvas.getContext('2d');

    // Copier la zone recadrée
    tempCtx.drawImage(
      canvas,
      cropX, cropY, cropSize, cropSize,
      0, 0, cropSize, cropSize
    );

    // Convertir en blob
    tempCanvas.toBlob((blob) => {
      onSave(blob);
      handleClose(); // Still call handleClose for internal state reset
    }, 'image/jpeg', 0.92);
  };

  const handleClose = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImage(null);
    setIsLoading(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-2xl p-0 bg-slate-900 border-0">
        <DialogHeader className="p-4 border-b border-slate-700">
          <DialogTitle className="text-white text-center">Recadrer la photo</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <LoadingSpinner size="lg" text="Chargement de l'image..." />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Canvas */}
            <div className="relative bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden" style={{ touchAction: 'none' }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="w-full cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              />
            </div>

            {/* Contrôles de zoom */}
            <div className="flex items-center gap-4">
              <ZoomOut className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>

            {/* Boutons d'action */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRotate}
                className="w-full"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Pivoter
              </Button>

              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Valider
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
