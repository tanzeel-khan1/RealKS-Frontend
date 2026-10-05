import React, { useEffect, useState } from "react";
import api from "@/api/apiClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EVENT_TYPES = [
  "Investor Meeting",
  "Board Meeting",
  "Funding Deadline",
  "Demo Day",
  "Property Handover",
  "Rental Payout",
  "Dividend Distribution",
  "Financial Report",
  "Document Deadline",
  "Other",
];

const REMINDER_OPTIONS = ["1 Hour", "6 Hours", "1 Day", "3 Days", "1 Week"];

const STATUS_OPTIONS = ["Scheduled", "Completed", "Cancelled"];

const initialForm = {
  title: "",
  type: "Investor Meeting",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  mode: "Online",
  meetingLink: "",
  location: "",
  attendees: [],
  reminder: {
    enabled: false,
    before: "1 Hour",
  },
  status: "Scheduled",
};

// Shared styling tokens — uses theme variables so it follows your app's
// existing light/dark mode automatically (no hardcoded colors)
const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground";

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground";

const Event = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [selectedInvestorIds, setSelectedInvestorIds] = useState([]);
  const [inviting, setInviting] = useState(false);

  const companyId = api.auth.getActiveCompanyId();
  const user = api.auth.getUser();

  // =========================
  // GET EVENTS BY COMPANY
  // =========================
  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.entities.Event.getByCompanyId(companyId);
      setEvents(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadEvents();
    }
  }, [companyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReminderChange = (value) => {
    setForm((prev) => ({
      ...prev,
      reminder: { enabled: true, before: value },
    }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm(initialForm);
    setSelectedInvestorIds([]);
    setInvitePanelOpen(false);
  };

  const openInvestorInvitePanel = async () => {
    if (!companyId) {
      toast.error("Please select a company first");
      return;
    }

    setInvitePanelOpen(true);
    setLoadingInvestors(true);

    try {
      const data = await api.entities.Investor.filter({ company_id: companyId });
      const companyInvestors = Array.isArray(data) ? data : data?.data || [];
      setInvestors(companyInvestors);
      setSelectedInvestorIds((prev) => (prev.length ? prev : form.attendees || []));
    } catch (error) {
      console.log(error);
      toast.error("Failed to load investors");
    } finally {
      setLoadingInvestors(false);
    }
  };

  const toggleInvestorSelection = (investorId) => {
    setSelectedInvestorIds((prev) =>
      prev.includes(investorId)
        ? prev.filter((id) => id !== investorId)
        : [...prev, investorId]
    );
  };

  const sendInvestorInvites = async () => {
    if (!selectedInvestorIds.length) {
      toast.error("Select at least one investor to invite");
      return;
    }

    const selectedInvestors = investors.filter((investor) => {
      const id = investor._id || investor.id;
      return selectedInvestorIds.includes(id);
    });

    const recipients = selectedInvestors.filter((investor) => investor.user_email);

    if (!recipients.length) {
      toast.error("No valid investor email found");
      return;
    }

    try {
      setInviting(true);
      const eventTitle = form.title.trim() || "Event";
      const eventDate = form.date ? new Date(form.date).toLocaleDateString() : "TBD";
      const eventTime = form.startTime ? ` at ${form.startTime}` : "";
      const eventEndTime = form.endTime ? ` - ${form.endTime}` : "";
      const eventLocation = form.mode === "Offline"
        ? form.location || "Offline venue"
        : form.mode === "Hybrid"
          ? form.location || "Hybrid venue"
          : "Online";
      const eventLink = form.meetingLink
        ? `\nMeeting link: ${form.meetingLink}`
        : "";
      const eventDescription = form.description?.trim() || "Please join us for this event.";

      await Promise.all(
        recipients.map((investor) =>
          api.integrations.Core.SendEmail({
            to: investor.user_email,
            subject: `Invitation: ${eventTitle}`,
            body: `Hello ${investor.name || investor.user_name || "there"},\n\nYou have been invited to the event "${eventTitle}".\n\nDate: ${eventDate}\nTime: ${form.startTime || "TBD"}${eventEndTime}\nLocation/Mode: ${eventLocation}\n\nDetails: ${eventDescription}${eventLink}`,
          })
        )
      );

      setForm((prev) => ({ ...prev, attendees: selectedInvestorIds }));
      setInvitePanelOpen(false);
      toast.success(`Invites sent to ${recipients.length} investor(s)`);
    } catch (error) {
      console.log(error);
      toast.error("Failed to send invites");
    } finally {
      setInviting(false);
    }
  };

  const saveEvent = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const payload = {
        ...form,
        attendees: selectedInvestorIds,
        company: companyId,
        createdBy: user?._id,
      };

      if (editId) {
        await api.entities.Event.update(editId, payload);
        toast.success("Event updated successfully");
      } else {
        await api.entities.Event.create(payload);
        toast.success("Event created successfully");
      }

      setOpen(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Operation failed");
    }
  };

  const editEvent = (event) => {
    setEditId(event.id);
    setForm({
      title: event.title || "",
      type: event.type || "Investor Meeting",
      description: event.description || "",
      date: event.date ? event.date.substring(0, 10) : "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      mode: event.mode || "Online",
      meetingLink: event.meetingLink || "",
      location: event.location || "",
      attendees: event.attendees || [],
      reminder: event.reminder || { enabled: false, before: "1 Hour" },
      status: event.status || "Scheduled",
    });
    setSelectedInvestorIds(event.attendees || []);
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.entities.Event.delete(deleteTarget._id || deleteTarget.id);
      toast.success("Event deleted successfully");
      setDeleteTarget(null);
      loadEvents();
    } catch (error) {
      console.log(error);
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const statusBadgeClass = (status) => {
    if (status === "Completed") return "bg-foreground text-background";
    if (status === "Cancelled") return "border border-border text-muted-foreground line-through";
    return "border border-foreground text-foreground";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight"> UpComing Event's</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage meetings, deadlines, and payouts in one place.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-80">
              + Create Event
            </button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border border-border bg-background p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {editId ? "Update Event" : "Create Event"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              {/* Basic info */}
              <div>
                <label className={labelClass}>Title</label>
                <input
                  name="title"
                  placeholder="e.g. Q3 Investor Sync"
                  className={inputClass}
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Type</label>
                <select
                  name="type"
                  className={inputClass}
                  value={form.type}
                  onChange={handleChange}
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  placeholder="Add any relevant details"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {/* Date & time */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    type="date"
                    name="date"
                    className={inputClass}
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    className={inputClass}
                    value={form.startTime}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    className={inputClass}
                    value={form.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Mode & location */}
              <div>
                <label className={labelClass}>Mode</label>
                <select
                  name="mode"
                  className={inputClass}
                  value={form.mode}
                  onChange={handleChange}
                >
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Hybrid</option>
                </select>
              </div>

              {form.mode !== "Offline" && (
                <div>
                  <label className={labelClass}>Meeting Link</label>
                  <input
                    name="meetingLink"
                    placeholder="https://..."
                    className={inputClass}
                    value={form.meetingLink}
                    onChange={handleChange}
                  />
                </div>
              )}

              {form.mode !== "Online" && (
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    name="location"
                    placeholder="Venue or address"
                    className={inputClass}
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Reminder & status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Reminder</label>
                  <select
                    className={inputClass}
                    value={form.reminder.before}
                    onChange={(e) => handleReminderChange(e.target.value)}
                  >
                    {REMINDER_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    name="status"
                    className={inputClass}
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Invite investors</p>
                    <p className="text-xs text-muted-foreground">
                      See company investors and send them an email invite for this event.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openInvestorInvitePanel}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:border-foreground hover:bg-foreground hover:text-background"
                  >
                    {invitePanelOpen ? "Refresh" : "Invite"}
                  </button>
                </div>

                {invitePanelOpen && (
                  <div className="space-y-2 rounded-md border border-border bg-background/60 p-3">
                    {loadingInvestors ? (
                      <p className="text-sm text-muted-foreground">Loading investors…</p>
                    ) : investors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No investors found for this company.</p>
                    ) : (
                      <>
                        <div className="max-h-44 space-y-2 overflow-y-auto">
                          {investors.map((investor) => {
                            const id = investor._id || investor.id;
                            const checked = selectedInvestorIds.includes(id);
                            return (
                              <label
                                key={id}
                                className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-2 py-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleInvestorSelection(id)}
                                  className="mt-0.5"
                                />
                                <span>
                                  <span className="font-medium">{investor.name || investor.user_name || "Investor"}</span>
                                  <span className="block text-xs text-muted-foreground">{investor.user_email || "No email"}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={sendInvestorInvites}
                          disabled={inviting}
                          className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-60"
                        >
                          {inviting ? "Sending invites…" : "Send invites"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={saveEvent}
                className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-80"
              >
                {editId ? "Update Event" : "Save Event"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No events yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event._id || event.id}
              className="flex flex-col justify-between rounded-lg border border-border p-4 transition hover:border-foreground/40 hover:shadow-sm"
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold leading-snug">{event.title}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                </div>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {event.type}
                </p>

                {event.date && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                    {event.startTime && ` · ${event.startTime}`}
                    {event.endTime && ` – ${event.endTime}`}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <button
                  onClick={() => editEvent({ ...event, id: event._id || event.id })}
                  className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium transition hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(event)}
className="flex-1 rounded-md border border-border text-white bg-red-600 py-1.5 text-xs font-medium transition-all hover:border-red-700 hover:bg-red-800  hover:shadow-lg hover:shadow-red-900/50"                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(value) => {
          if (!value) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Delete event</DialogTitle>
          </DialogHeader>

          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">"{deleteTarget?.title}"</span>? This
            action cannot be undone.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 rounded-md border border-border py-2 text-sm font-medium transition hover:border-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 rounded-md bg-red-600 py-2 text-sm font-medium  transition hover:opacity-80 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Event;