import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { api } from "@/api/apiClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Shield,
  Search,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";

import { toast } from "sonner";
import NoCompanyBanner from "@/components/ui/NoCompanyBanner";

const emptyForm = {
  title: "",
  description: "",
  content: "",
};

const draftForm = {
  title: "Untitled Draft",
  description: "",
  content: "",
};

function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] rounded-b-xl border-x border-b bg-background px-4 py-3 text-sm leading-7 outline-none prose prose-sm max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || "";

    if (nextHtml !== currentHtml) {
      editor.commands.setContent(nextHtml, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border bg-muted/30 p-2">
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          className="h-8 w-8"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          className="h-8 w-8"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export default function Contracts() {
  const { activeCompany, companies, currentUser } = useOutletContext();
  const qc = useQueryClient();

  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const isOwner =
    activeCompany?.created_by?.toLowerCase() ===
    currentUser?.email?.toLowerCase();

  const getContractId = (contract) => contract?.id || contract?._id;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts", activeCompany?.id],
    queryFn: () => api.entities.Contract.filter({ company_id: activeCompany.id }),
    enabled: !!activeCompany?.id && isOwner,
  });

  const filteredContracts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return contracts;

    return contracts.filter((contract) => {
      const title = contract.title?.toLowerCase() || "";
      const description = contract.description?.toLowerCase() || "";
      const content = contract.content?.toLowerCase() || "";

      return (
        title.includes(value) ||
        description.includes(value) ||
        content.includes(value)
      );
    });
  }, [contracts, search]);

  const invalidate = () => {
    qc.invalidateQueries(["contracts", activeCompany?.id]);
  };

  const setFormValue = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const normalizeForm = () => {
    return {
      title: form.title.trim() || "Untitled Draft",
      description: form.description.trim(),
      content: form.content || "",
    };
  };

  const selectForEdit = (contract) => {
    const id = getContractId(contract);

    if (!id) {
      toast.error("Contract id not found");
      return;
    }

    setSelected(contract);
    setEditingId(id);
    setIsDirty(false);

    setForm({
      title: contract.title || "",
      description: contract.description || "",
      content: contract.content || "",
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.entities.Contract.create({
        ...data,
        company_id: activeCompany.id,
      }),
    onSuccess: (createdContract) => {
      invalidate();

      const created = createdContract || draftForm;
      const createdId = getContractId(created);

      setSelected(created);
      setEditingId(createdId);
      setIsDirty(false);

      setForm({
        title: created.title || "Untitled Draft",
        description: created.description || "",
        content: created.content || "",
      });

      toast.success("Draft created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Contract.update(id, data),
    onSuccess: (updatedContract, variables) => {
      invalidate();

      const updated = updatedContract || {
        ...selected,
        ...variables.data,
      };

      setSelected(updated);
      setEditingId(getContractId(updated) || variables.id);
      setIsDirty(false);

      setForm({
        title: updated.title || "",
        description: updated.description || "",
        content: updated.content || "",
      });

      toast.success("Contract saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Contract.delete(id),
    onSuccess: (_, deletedId) => {
      invalidate();
      toast.success("Contract deleted");

      if (getContractId(selected) === deletedId) {
        setSelected(null);
        setEditingId(null);
        setForm(emptyForm);
        setIsDirty(false);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    if (!activeCompany?.id) {
      toast.error("Company not found");
      return;
    }

    createMutation.mutate(draftForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const id = editingId || getContractId(selected);

    if (!id) {
      toast.error("Contract id not found");
      return;
    }

    updateMutation.mutate({
      id,
      data: normalizeForm(),
    });
  };

  const handleDelete = (contract) => {
    const id = getContractId(contract);

    if (!id) {
      toast.error("Contract id not found");
      return;
    }

    if (confirm("Delete this contract?")) {
      deleteMutation.mutate(id);
    }
  };

  if (!activeCompany) {
    return <NoCompanyBanner hasNoCompanies={companies.length === 0} />;
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Shield className="h-7 w-7 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Access restricted</h2>
              <p className="text-sm text-muted-foreground">
                Only the company owner can access Contracts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSaving = updateMutation.isPending;
  const isCreating = createMutation.isPending;

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col gap-4 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Contracts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and edit company contracts in one place.
          </p>
        </div>

        <Button
          onClick={openCreate}
          disabled={isCreating}
          className="w-full gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {isCreating ? "Creating Draft..." : "New Contract"}
        </Button>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl shadow-sm">
          <CardHeader className="space-y-4 border-b p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">All Contracts</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {contracts.length} total contract
                  {contracts.length === 1 ? "" : "s"}
                </p>
              </div>

              <Button
                size="icon"
                variant="outline"
                onClick={openCreate}
                disabled={isCreating}
                className="h-9 w-9 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contracts..."
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium">No contracts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Click New Contract and an empty draft will be created.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCreate}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating Draft..." : "Create Draft"}
                </Button>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  No contract found for “{search}”
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContracts.map((contract) => {
                  const id = getContractId(contract);
                  const isSelected = getContractId(selected) === id;

                  return (
                    <Card
                      key={id}
                      onClick={() => selectForEdit(contract)}
                      className={`cursor-pointer rounded-xl transition-all hover:bg-muted/60 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border"
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {contract.title || "Untitled Draft"}
                                </p>

                                {contract.description ? (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {contract.description}
                                  </p>
                                ) : (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    Draft
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectForEdit(contract);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(contract);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[420px] overflow-hidden rounded-2xl shadow-sm">
          {selected ? (
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <CardHeader className="border-b p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>

                      <CardTitle className="truncate text-lg sm:text-xl">
                        Edit Contract
                      </CardTitle>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Edit directly here. No separate open/preview screen.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving || !isDirty}
                    className="gap-2"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSaving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setFormValue("title", e.target.value)}
                    placeholder="Untitled Draft"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setFormValue("description", e.target.value)
                    }
                    placeholder="Brief description of this contract"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contract Content</Label>
                  <RichTextEditor
                    value={form.content}
                    onChange={(value) => setFormValue("content", value)}
                  />
                </div>
              </CardContent>
            </form>
          ) : (
            <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-medium">Select a contract</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Choose a contract from the left side and it will open directly
                  in edit mode.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={openCreate}
                disabled={isCreating}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreating ? "Creating Draft..." : "New Contract"}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}