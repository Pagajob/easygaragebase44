import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, PenTool, RotateCcw } from "lucide-react";

// Composant de signature personnalisé sans dépendance externe
const SignaturePad = ({ onSave, onClear, canvasRef }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Définir la taille du canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
  }, [canvasRef]);

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const handleSave = () => {
    if (!isEmpty && onSave) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef} className="w-full h-48 border-2 border-slate-300 rounded-xl bg-white cursor-crosshair touch-none"

        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }} />

      <div className="rounded-[100px] flex gap-2">
        <Button
          type="button"
          onClick={handleClear}
          variant="outline" className="bg-background px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 flex-1">


          <RotateCcw className="w-4 h-4 mr-2" />
          Effacer
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isEmpty} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 flex-1">


          <Check className="w-4 h-4 mr-2" />
          Valider
        </Button>
      </div>
    </div>);

};

export default function CheckInStep3({ reservation, vehicle, client, organization, checkInData, updateCheckInData, onBack, onComplete }) {
  const ownerSigRef = useRef(null);
  const clientSigRef = useRef(null);
  const [ownerSigned, setOwnerSigned] = useState(false);
  const [clientSigned, setClientSigned] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleSaveOwnerSignature = (signatureData) => {
    updateCheckInData({ owner_signature: signatureData });
    setOwnerSigned(true);
  };

  const handleSaveClientSignature = (signatureData) => {
    updateCheckInData({ client_signature: signatureData });
    setClientSigned(true);
  };

  const handleClearOwnerSignature = () => {
    setOwnerSigned(false);
    updateCheckInData({ owner_signature: null });
  };

  const handleClearClientSignature = () => {
    setClientSigned(false);
    updateCheckInData({ client_signature: null });
  };

  const handleComplete = async () => {
    if (ownerSigned && clientSigned) {
      setIsCompleting(true);
      await onComplete();
    }
  };

  const canComplete = ownerSigned && clientSigned;

  return (
    <div className="space-y-6">
      {/* Signature du loueur */}
      <Card className="rounded-xl border text-card-foreground bg-transparent backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-base dark:text-slate-100">Signature du loueur


          </CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-300">{organization?.name || "Loueur"}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ownerSigned ?
          <SignaturePad
            canvasRef={ownerSigRef}
            onSave={handleSaveOwnerSignature}
            onClear={handleClearOwnerSignature} /> :


          <div className="space-y-3">
              <div className="border-2 border-green-300 rounded-lg bg-green-50 p-4">
                <img src={checkInData.owner_signature} alt="Signature loueur" className="w-full h-32 object-contain" />
              </div>
              <Button
              type="button"
              onClick={handleClearOwnerSignature}
              variant="outline" className="bg-background px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full">


                <RotateCcw className="w-4 h-4 mr-2" />
                Modifier la signature
              </Button>
            </div>
          }
        </CardContent>
      </Card>

      {/* Signature du client */}
      <Card className="rounded-xl border text-card-foreground bg-transparent backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-base dark:text-slate-100">Signature du client


          </CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-300">{client?.name || "Client"}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!clientSigned ?
          <SignaturePad
            canvasRef={clientSigRef}
            onSave={handleSaveClientSignature}
            onClear={handleClearClientSignature} /> :


          <div className="space-y-3">
              <div className="border-2 border-green-300 rounded-lg bg-green-50 p-4">
                <img src={checkInData.client_signature} alt="Signature client" className="w-full h-32 object-contain" />
              </div>
              <Button
              type="button"
              onClick={handleClearClientSignature}
              variant="outline" className="bg-background px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full">


                <RotateCcw className="w-4 h-4 mr-2" />
                Modifier la signature
              </Button>
            </div>
          }
        </CardContent>
      </Card>

      {/* Boutons navigation */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1 rounded-full"
          size="lg">

          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={handleComplete}
          disabled={!canComplete || isCompleting}
          className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
          size="lg">

          {isCompleting ? "Finalisation..." : "Terminer l'EDL"}
          <Check className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {!canComplete &&
      <p className="text-center text-sm text-orange-600">
          Les deux signatures sont requises pour finaliser l'EDL
        </p>
      }
    </div>);

}