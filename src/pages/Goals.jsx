import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Retirement",
  "House",
  "Car",
  "Education",
  "Travel",
  "Emergency",
  "Investment",
  "Other",
];

const PRIORITY = ["Low", "Medium", "High"];
const STATUS = ["Active", "Paused", "Completed"];

export default function Goals() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAmount: 0,
    currentAmount: 0,
    currency: "USD",
    targetDate: "",
    priority: "Medium",
    status: "Active",
    category: "Other",
  });

  // 🔹 GET
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.entities.Goal.list("-created_date"),
    initialData: [],
  });

  // 🔹 CREATE
  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal created");
      setOpen(false);
      resetForm();
    },
  });

  // 🔹 DELETE
  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal updated");
      setOpen(false);
      setEditingGoal(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      currency: "USD",
      targetDate: "",
      priority: "Medium",
      status: "Active",
      category: "Other",
    });
  };

  const handleSubmit = () => {
    if (!form.title || !form.targetAmount || !form.targetDate) {
      toast.error("Required fields missing");
      return;
    }

    if (editingGoal) {
      updateMutation.mutate({
        id: editingGoal.id,
        data: form,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>

        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      {/* List */}
      <div className="border rounded-xl p-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No goals found</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((g) => {
              const progress =
                g.targetAmount > 0
                  ? Math.min((g.currentAmount / g.targetAmount) * 100, 100)
                  : 0;

              return (
                <div
                  key={g.id}
                  className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{g.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {g.description || "No description"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingGoal(g);

                          setForm({
                            title: g.title,
                            description: g.description || "",
                            targetAmount: g.targetAmount,
                            currentAmount: g.currentAmount,
                            currency: g.currency,
                            targetDate: g.targetDate?.split("T")[0],
                            priority: g.priority,
                            status: g.status,
                            category: g.category,
                          });

                          setOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(g)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Badge>{g.category}</Badge>
                    <Badge variant="secondary">{g.priority}</Badge>
                    <Badge variant="outline">{g.status}</Badge>
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-sm mb-2">
                      <span>${g.currentAmount}</span>
                      <span>${g.targetAmount}</span>
                    </div>

                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-4">
                    Target Date: {new Date(g.targetDate).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔥 MODAL */}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setEditingGoal(null);
            resetForm();
          }
        }}
      >
        {/* <Dialog open={open} onOpenChange={setOpen}> */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Goal" : "Create Goal"}
            </DialogTitle>
            {/* <DialogTitle>Create Goal</DialogTitle> */}
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Target Amount *</Label>
              <Input
                type="number"
                value={form.targetAmount}
                onChange={(e) =>
                  setForm({ ...form, targetAmount: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>Current Amount</Label>
              <Input
                type="number"
                value={form.currentAmount}
                onChange={(e) =>
                  setForm({ ...form, currentAmount: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>

            <div>
              <Label>Target Date *</Label>
              <Input
                type="date"
                value={form.targetDate}
                onChange={(e) =>
                  setForm({ ...form, targetDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Priority</Label>
              <select
                className="w-full border rounded p-2"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITY.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Status</Label>
              <select
                className="w-full border rounded p-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <Label>Category</Label>
              <select
                className="w-full border rounded p-2"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {editingGoal ? "Update Goal" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title}
        itemType="Goal"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
