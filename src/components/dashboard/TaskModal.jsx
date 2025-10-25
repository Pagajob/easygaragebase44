import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentOrganizationId } from "../utils/multiTenant";

export default function TaskModal({ isOpen, onClose, task, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "normale",
    completed: false
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        due_date: task.due_date || "",
        priority: task.priority || "normale",
        completed: task.completed || false
      });
    } else {
      setFormData({
        title: "",
        description: "",
        due_date: "",
        priority: "normale",
        completed: false
      });
    }
  }, [task, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.trim() === "") {
      alert("Le titre est requis");
      return;
    }

    setIsSaving(true);
    try {
      const orgId = await getCurrentOrganizationId();
      const taskData = {
        ...formData,
        organization_id: orgId
      };
      
      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la tâche:", error);
      alert("Erreur lors de la sauvegarde de la tâche");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="dark:text-slate-300">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Que devez-vous faire ?"
              required
              className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
            />
          </div>

          <div>
            <Label htmlFor="description" className="dark:text-slate-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={3}
              className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
  <Label htmlFor="due_date" className="dark:text-slate-300">
    Date limite
  </Label>
  <Input
    id="due_date"
    type="date"
    value={formData.due_date}
    onChange={(e) => handleInputChange("due_date", e.target.value)}
    className="
      bg-white/50 dark:bg-slate-700/50
      border border-slate-300/50 dark:border-slate-600/50
      rounded-full px-4 py-2
      text-slate-800 dark:text-slate-100
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      transition-colors
    "
  />
</div>

            <div>
              <Label htmlFor="priority" className="dark:text-slate-300">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg">
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full dark:text-white dark:hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}