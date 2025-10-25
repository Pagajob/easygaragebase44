import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, User, Car, MapPin, CheckCircle, Plus, Calendar as CalendarIcon, AlertTriangle, Trash2 } from "lucide-react";
import { format, isToday, parseISO, isPast, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

import TaskModal from "./TaskModal";

export default function TodayTasks({
  reservations,
  vehicles,
  clients,
  isLoading
}) {
  const queryClient = useQueryClient();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Charger les tâches
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list("-created_date"),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  // Mutation pour créer/modifier une tâche
  const saveTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      if (selectedTask) {
        return await base44.entities.Task.update(selectedTask.id, taskData);
      } else {
        return await base44.entities.Task.create(taskData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskModal(false);
      setSelectedTask(null);
    }
  });

  // Mutation pour basculer le statut complété
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }) => {
      return await base44.entities.Task.update(taskId, {
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Mutation pour supprimer une tâche
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const todayReservations = reservations.filter((r) =>
  isToday(parseISO(r.start_date)) && (
  r.status === 'confirmee' || r.status === 'a_checker')
  );

  // Filtrer les tâches non complétées ou celles du jour
  const activeTasks = tasks.filter((t) =>
  !t.completed || t.due_date && isToday(parseISO(t.due_date))
  );

  const getVehicle = (vehicleId) => vehicles.find((v) => v.id === vehicleId);
  const getClient = (clientId) => clients.find((c) => c.id === clientId);

  const handleSaveTask = (taskData) => {
    saveTaskMutation.mutate(taskData);
  };

  const handleToggleTask = (task) => {
    toggleTaskMutation.mutate({
      taskId: task.id,
      completed: !task.completed
    });
  };

  const handleDeleteTask = (taskId) => {
    if (confirm("Supprimer cette tâche ?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const isTaskOverdue = (task) => {
    if (!task.due_date || task.completed) return false;
    return isBefore(parseISO(task.due_date), new Date()) && !isToday(parseISO(task.due_date));
  };

  const priorityColors = {
    basse: "border-l-blue-500",
    normale: "border-l-slate-400",
    haute: "border-l-red-500"
  };

  if (isLoading || tasksLoading) {
    return (
      <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            À faire aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) =>
          <div key={i} className="flex items-center space-x-4 p-4 bg-white/30 dark:bg-slate-700/30 border border-white/20 dark:border-slate-600/20 rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          )}
        </CardContent>
      </Card>);

  }

  const totalItems = todayReservations.length + activeTasks.length;

  return (
    <>
      <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 dark:text-slate-100">
              <span className="text-xl">⏳</span>
              À faire aujourd'hui ({totalItems})
            </CardTitle>
            <Button
              onClick={() => {
                setSelectedTask(null);
                setShowTaskModal(true);
              }}
              size="sm" className="bg-blue-600 text-primary-foreground p-0 text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-blue-700 h-8 w-8">


              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {totalItems === 0 ?
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium">Aucune tâche aujourd'hui</p>
              <p className="text-sm">Toutes les tâches sont terminées !</p>
            </div> :

          <div className="space-y-3">
              {/* Tâches personnalisées */}
              {activeTasks.map((task) => {
              const overdue = isTaskOverdue(task);

              return (
                <div
                  key={task.id} className="bg-white/40 p-3 rounded-[100px] flex items-start gap-3 dark:bg-slate-700/40 border-l-4 border-l-slate-400 hover:shadow-md transition-shadow">




                    <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task)} className="mt-4 rounded-sm peer h-4 w-4 shrink-0 border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground flex-shrink-0" />


                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`font-semibold text-slate-900 dark:text-white text-sm ${
                      task.completed ? 'line-through' : ''}`
                      }>
                          {task.title}
                        </p>
                        <Button
                        variant="ghost"
                        size="icon" className="text-red-500 mx-2 pt-4 text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-6 w-6 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"

                        onClick={() => handleDeleteTask(task.id)}>

                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {task.description &&
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {task.description}
                        </p>
                    }
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.due_date &&
                      <Badge
                        variant="outline"
                        className={`text-xs rounded-full ${
                        overdue ?
                        'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' :
                        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`
                        }>

                            {overdue && <AlertTriangle className="w-3 h-3 mr-1" />}
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(parseISO(task.due_date), "d MMM", { locale: fr })}
                          </Badge>
                      }
                        
                        {task.priority === 'haute' &&
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
                            Priorité haute
                          </Badge>
                      }
                      </div>
                    </div>
                  </div>);

            })}

              {/* Check-ins du jour */}
              {todayReservations.map((reservation) => {
              const vehicle = getVehicle(reservation.vehicle_id);
              const client = getClient(reservation.client_id);

              return (
                <div key={reservation.id} className="flex items-center justify-between p-4 bg-white/30 dark:bg-slate-700/30 border border-white/20 dark:border-slate-600/20 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Check-in {reservation.start_time || '9:00'}
                          </p>
                          <Badge variant={reservation.status === 'a_checker' ? "destructive" : "secondary"} className="rounded-full">
                            {reservation.status === 'a_checker' ? 'En retard' : 'Prévu'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {client?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {vehicle?.make} {vehicle?.model}
                          </div>
                          {reservation.pickup_location &&
                        <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {reservation.pickup_location}
                            </div>
                        }
                        </div>
                      </div>
                    </div>
                    
                    <Link to={createPageUrl(`CheckIn?reservation=${reservation.id}`)}>
                      <Button size="sm" className="rounded-full">
                        Démarrer
                      </Button>
                    </Link>
                  </div>);

            })}
            </div>
          }
        </CardContent>
      </Card>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={handleSaveTask} />

    </>);

}