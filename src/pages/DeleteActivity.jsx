import React, { useEffect, useState } from "react";
import api from "@/api/apiClient";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DeleteActivity = () => {
  const [loading, setLoading] = useState(false);
  const [activitiesCount, setActivitiesCount] = useState(0);

  const companyId = api.auth.getActiveCompanyId();

  useEffect(() => {
    const loadActivities = async () => {
      try {
        if (!companyId) return;

        const activities = await api.entities.Activity.filter({
          company_id: companyId,
        });

        setActivitiesCount(activities?.length || 0);
      } catch (error) {
        console.error(error);
      }
    };

    loadActivities();
  }, [companyId]);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const result =
        await api.entities.Activity.deleteCompanyActivities(companyId);

      setActivitiesCount(0);

      toast.success(
        `${result.deletedCount || 0} activities deleted successfully`
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error.message || "Failed to delete activities"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={loading || activitiesCount === 0}
          className={`px-4 py-2 rounded text-white transition
            ${
              loading || activitiesCount === 0
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }
          `}
        >
          {loading
            ? "Deleting..."
            : `Delete All Activities (${activitiesCount})`}
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete All Activities?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. All activities for this
            company will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteActivity;