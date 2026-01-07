import { useEffect, useMemo, useRef, useState } from "react";
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
  TextField,
} from "@mui/material";
import type { Card, Grouping, Tag } from "./types";

const STORAGE_KEY = "backoffice_basic_token";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  ""
) || "http://localhost:8000";

const CATEGORY_OPTIONS = ["calientes", "romance", "risas", "otras"];

const buildBasicToken = (username: string, password: string) =>
  btoa(`${username}:${password}`);

const getAuthHeaders = (token: string) => ({
  Authorization: `Basic ${token}`,
});

const parseCardTags = (tagsJson: string | null) => {
  if (!tagsJson) {
    return { tags: [] as string[], intensity: "" };
  }
  try {
    const data = JSON.parse(tagsJson);
    return {
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      intensity: typeof data.intensity === "string" ? data.intensity : "",
    };
  } catch {
    return { tags: [] as string[], intensity: "" };
  }
};

const getTagLabel = (tag: Tag) => tag.name_es || tag.name || tag.slug;

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [cards, setCards] = useState<Card[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [groupings, setGroupings] = useState<Grouping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cards" | "tags" | "groupings">("cards");
  const [showCardModal, setShowCardModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showGroupingModal, setShowGroupingModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; card: Card | null }>({
    open: false,
    card: null,
  });
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    title_es: "",
    description_es: "",
    category: CATEGORY_OPTIONS[0],
    spice_level: 1,
    difficulty_level: 1,
    credit_value: 3,
    tags: [] as string[],
    intensity: "",
    grouping_ids: [] as number[],
  });

  const [selectedCardId, setSelectedCardId] = useState<number | "">("");
  const [editorForm, setEditorForm] = useState({
    title: "",
    description: "",
    title_es: "",
    description_es: "",
    tags: [] as string[],
    intensity: "",
    grouping_ids: [] as number[],
  });

  const [tagForm, setTagForm] = useState({
    slug: "",
    name_es: "",
    name_en: "",
    tag_type: "category",
    parent_slug: "",
    display_order: 0,
  });

  const [groupingForm, setGroupingForm] = useState({
    slug: "",
    name: "",
    description: "",
    display_order: 0,
  });

  const isAuthed = useMemo(() => Boolean(token), [token]);
  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) || null,
    [cards, selectedCardId]
  );

  const intensityOptions = useMemo(
    () => tags.filter((tag) => tag.tag_type === "intensity"),
    [tags]
  );

  const selectableTags = useMemo(
    () => tags.filter((tag) => tag.tag_type !== "intensity"),
    [tags]
  );

  const tagLabelBySlug = useMemo(
    () => new Map(selectableTags.map((tag) => [tag.slug, getTagLabel(tag)])),
    [selectableTags]
  );

  const sortedGroupings = useMemo(
    () => [...groupings].sort((a, b) => a.display_order - b.display_order),
    [groupings]
  );

  useEffect(() => {
    if (!isAuthed) return;
    loadCards(token);
    loadTags(token);
    loadGroupings(token);
  }, [isAuthed, token]);

  useEffect(() => {
    if (!selectedCard) return;
    const parsed = parseCardTags(selectedCard.tags);
    setEditorForm({
      title: selectedCard.title,
      description: selectedCard.description,
      title_es: "",
      description_es: "",
      tags: parsed.tags,
      intensity: parsed.intensity,
      grouping_ids: selectedCard.groupings_list?.map((grouping) => grouping.id) || [],
    });
    loadCardTranslation(selectedCard.id);
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCardId, cards]);

  useEffect(() => {
    if (!createForm.intensity && intensityOptions.length > 0) {
      setCreateForm((prev) => ({ ...prev, intensity: intensityOptions[0].slug }));
    }
  }, [createForm.intensity, intensityOptions]);

  useEffect(() => {
    if (!editorForm.intensity && intensityOptions.length > 0) {
      setEditorForm((prev) => ({ ...prev, intensity: intensityOptions[0].slug }));
    }
  }, [editorForm.intensity, intensityOptions]);

  const handleEditorTagsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setEditorForm((prev) => ({
      ...prev,
      tags: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleEditorGroupingsChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    const ids =
      typeof value === "string" ? value.split(",").map(Number) : value.map(Number);
    setEditorForm((prev) => ({
      ...prev,
      grouping_ids: ids,
    }));
  };

  const handleCreateTagsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setCreateForm((prev) => ({
      ...prev,
      tags: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleCreateGroupingsChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    const ids =
      typeof value === "string" ? value.split(",").map(Number) : value.map(Number);
    setCreateForm((prev) => ({
      ...prev,
      grouping_ids: ids,
    }));
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backoffice/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales invalidas");
      }

      const newToken = buildBasicToken(username, password);
      localStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setCards([]);
    setTags([]);
    setGroupings([]);
  };

  const loadCards = async (authToken = token) => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards/admin/all?include_disabled=true&limit=500&offset=0`,
        {
          headers: {
            ...getAuthHeaders(authToken),
          },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
        }
        throw new Error("No se pudo cargar las cartas");
      }
      const data = (await response.json()) as { cards: Card[] };
      setCards(data.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async (authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        headers: {
          ...getAuthHeaders(authToken),
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar los tags");
      }
      const data = (await response.json()) as Tag[];
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const loadGroupings = async (authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/groupings`, {
        headers: {
          ...getAuthHeaders(authToken),
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo cargar los groupings");
      }
      const data = (await response.json()) as Grouping[];
      setGroupings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const loadCardTranslation = async (cardId: number) => {
    if (!token) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}/content?locale=es`,
        {
          headers: {
            ...getAuthHeaders(token),
          },
        }
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { title: string; description: string };
      setEditorForm((prev) => ({
        ...prev,
        title_es: data.title || "",
        description_es: data.description || "",
      }));
    } catch {
      // Ignore translation errors
    }
  };

  const toggleCard = async (cardId: number, enabled: boolean) => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}/toggle?enabled=${enabled}`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(token),
          },
        }
      );
      if (!response.ok) {
        throw new Error("No se pudo actualizar la carta");
      }
      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? { ...card, is_enabled: enabled } : card))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleCreateCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cards/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          title_es: createForm.title_es || null,
          description_es: createForm.description_es || null,
          tags: createForm.tags,
          intensity: createForm.intensity || "standard",
          grouping_ids: createForm.grouping_ids,
          category: createForm.category,
          spice_level: createForm.spice_level,
          difficulty_level: createForm.difficulty_level,
          credit_value: createForm.credit_value,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo crear la carta");
      }
      setCreateForm({
        title: "",
        description: "",
        title_es: "",
        description_es: "",
        category: CATEGORY_OPTIONS[0],
        spice_level: 1,
        difficulty_level: 1,
        credit_value: 3,
        tags: [],
        intensity: intensityOptions[0]?.slug || "standard",
        grouping_ids: [],
      });
      await loadCards(token);
      setShowCardModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleSaveCardEdits = async () => {
    if (!token || !selectedCard) return;
    setError(null);
    try {
      const translations: Record<string, { title?: string; description?: string }> = {};
      const hasSpanishContent =
        editorForm.title_es.trim().length > 0 || editorForm.description_es.trim().length > 0;
      if (hasSpanishContent) {
        translations.es = {
          title: editorForm.title_es,
          description: editorForm.description_es,
        };
      }

      const response = await fetch(`${API_BASE_URL}/cards/${selectedCard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({
          title: editorForm.title,
          description: editorForm.description,
          translations,
          tags: editorForm.tags,
          intensity: editorForm.intensity || "standard",
          grouping_ids: editorForm.grouping_ids,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo actualizar la carta");
      }

      await loadCards(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleCreateTag = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({
          slug: tagForm.slug,
          name: tagForm.name_es || tagForm.name_en,
          name_es: tagForm.name_es || null,
          name_en: tagForm.name_en || null,
          tag_type: tagForm.tag_type,
          parent_slug: tagForm.parent_slug || null,
          display_order: tagForm.display_order,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo crear el tag");
      }
      setTagForm({
        slug: "",
        name_es: "",
        name_en: "",
        tag_type: "category",
        parent_slug: "",
        display_order: 0,
      });
      await loadTags(token);
      setShowTagModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleUpdateTag = async (tag: Tag) => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tag.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({
          slug: tag.slug,
          name: tag.name_es || tag.name,
          name_es: tag.name_es || null,
          name_en: tag.name_en || null,
          tag_type: tag.tag_type,
          parent_slug: tag.parent_slug || null,
          display_order: tag.display_order,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo actualizar el tag");
      }
      await loadTags(token);
      await loadCards(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(token),
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el tag");
      }
      await loadTags(token);
      await loadCards(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const updateTagField = (tagId: number, field: keyof Tag, value: string | number) => {
    setTags((prev) =>
      prev.map((tag) => (tag.id === tagId ? { ...tag, [field]: value } : tag))
    );
  };

  const handleCreateGrouping = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/groupings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({
          slug: groupingForm.slug,
          name: groupingForm.name,
          description: groupingForm.description || null,
          display_order: groupingForm.display_order,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo crear el grouping");
      }
      setGroupingForm({
        slug: "",
        name: "",
        description: "",
        display_order: 0,
      });
      await loadGroupings(token);
      setShowGroupingModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleUpdateGrouping = async (grouping: Grouping) => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/groupings/${grouping.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(token),
        },
        body: JSON.stringify({
          slug: grouping.slug,
          name: grouping.name,
          description: grouping.description || null,
          display_order: grouping.display_order,
        }),
      });
      if (!response.ok) {
        throw new Error("No se pudo actualizar el grouping");
      }
      await loadGroupings(token);
      await loadCards(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleDeleteGrouping = async (groupingId: number) => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/groupings/${groupingId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(token),
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el grouping");
      }
      await loadGroupings(token);
      await loadCards(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const updateGroupingField = (
    groupingId: number,
    field: keyof Grouping,
    value: string | number
  ) => {
    setGroupings((prev) =>
      prev.map((grouping) =>
        grouping.id === groupingId ? { ...grouping, [field]: value } : grouping
      )
    );
  };

  const handleDeleteCard = async () => {
    if (!token || !deleteDialog.card) return;
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${deleteDialog.card.id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(token),
        },
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar la carta");
      }
      setDeleteDialog({ open: false, card: null });
      setSelectedCardId("");
      await loadCards(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Backoffice</p>
          <h1>Control Room</h1>
          <p className="subtitle">
            Administra cartas, traducciones, tags y groupings. Acceso restringido a usuarios de backoffice.
          </p>
        </div>
        {isAuthed && (
          <div className="header-actions">
            <div className="tabs">
              <button
                className={activeTab === "cards" ? "tab active" : "tab"}
                onClick={() => setActiveTab("cards")}
              >
                Cartas
              </button>
              <button
                className={activeTab === "tags" ? "tab active" : "tab"}
                onClick={() => setActiveTab("tags")}
              >
                Tags
              </button>
              <button
                className={activeTab === "groupings" ? "tab active" : "tab"}
                onClick={() => setActiveTab("groupings")}
              >
                Groupings
              </button>
            </div>
            <button className="ghost" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        )}
      </header>

      {!isAuthed ? (
        <section className="panel login-panel">
          <div>
            <h2>Ingreso seguro</h2>
            <p>Usa tus credenciales de backoffice para continuar.</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Usuario
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="usuario"
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Validando..." : "Entrar"}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </section>
      ) : (
        <section className="panel dashboard">
          <div className="panel-header">
            <div>
              <h2>Operaciones de backoffice</h2>
              <p>{cards.length} cartas cargadas</p>
            </div>
            <div className="actions">
              {activeTab === "cards" && (
                <>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setShowCardModal(true)}
                  >
                    +
                  </button>
                  <button className="ghost" onClick={() => loadCards()} disabled={loading}>
                    {loading ? "Actualizando..." : "Refrescar cartas"}
                  </button>
                </>
              )}
              {activeTab === "tags" && (
                <>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setShowTagModal(true)}
                  >
                    +
                  </button>
                  <button className="ghost" onClick={() => loadTags()}>
                    Refrescar tags
                  </button>
                </>
              )}
              {activeTab === "groupings" && (
                <>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setShowGroupingModal(true)}
                  >
                    +
                  </button>
                  <button className="ghost" onClick={() => loadGroupings()}>
                    Refrescar groupings
                  </button>
                </>
              )}
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          {activeTab === "cards" ? (
            <>
              <div className="dashboard-grid">
                <div className="panel-section" ref={editorRef}>
                  <h3>Editor de cartas</h3>
                  <label>
                    Seleccionar carta
                    <select
                      value={selectedCardId}
                      onChange={(event) =>
                        setSelectedCardId(
                          event.target.value ? Number(event.target.value) : ("" as const)
                        )
                      }
                    >
                      <option value="">Selecciona una carta</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedCard ? (
                    <>
                      <div className="editor-grid">
                        <div>
                          <h4>Contenido (EN)</h4>
                          <div className="stack">
                            <TextField
                              label="Titulo"
                              value={editorForm.title}
                              onChange={(event) =>
                                setEditorForm((prev) => ({ ...prev, title: event.target.value }))
                              }
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Descripcion"
                              value={editorForm.description}
                              onChange={(event) =>
                                setEditorForm((prev) => ({
                                  ...prev,
                                  description: event.target.value,
                                }))
                              }
                            size="small"
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          </div>
                        </div>

                        <div>
                          <h4>Contenido (ES)</h4>
                          <div className="stack">
                            <TextField
                              label="Titulo"
                              value={editorForm.title_es}
                              onChange={(event) =>
                                setEditorForm((prev) => ({ ...prev, title_es: event.target.value }))
                              }
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="Descripcion"
                              value={editorForm.description_es}
                              onChange={(event) =>
                                setEditorForm((prev) => ({
                                  ...prev,
                                  description_es: event.target.value,
                                }))
                              }
                            size="small"
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          </div>
                        </div>

                        <div>
                          <h4>Tags e intensidad</h4>
                          <div className="stack">
                            <FormControl size="small" fullWidth>
                              <InputLabel>Intensidad</InputLabel>
                              <Select
                                value={editorForm.intensity}
                                label="Intensidad"
                                onChange={(event) =>
                                  setEditorForm((prev) => ({
                                    ...prev,
                                    intensity: event.target.value,
                                  }))
                                }
                              >
                                {intensityOptions.map((option) => (
                                  <MenuItem key={option.slug} value={option.slug}>
                                    {getTagLabel(option)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Tags</InputLabel>
                              <Select
                                multiple
                                value={editorForm.tags}
                                onChange={handleEditorTagsChange}
                                input={<OutlinedInput label="Tags" />}
                                renderValue={(selected) =>
                                  (selected as string[])
                                    .map((slug) => tagLabelBySlug.get(slug) || slug)
                                    .join(", ")
                                }
                              >
                                {selectableTags.map((tag) => (
                                  <MenuItem key={tag.id} value={tag.slug}>
                                    <Checkbox checked={editorForm.tags.includes(tag.slug)} />
                                    <ListItemText primary={getTagLabel(tag)} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </div>
                        </div>
                        <div>
                          <h4>Groupings</h4>
                          {sortedGroupings.length === 0 ? (
                            <p className="muted">No hay groupings disponibles.</p>
                          ) : (
                            <FormControl size="small" fullWidth>
                              <InputLabel>Groupings</InputLabel>
                              <Select
                                multiple
                                value={editorForm.grouping_ids}
                                onChange={handleEditorGroupingsChange}
                                input={<OutlinedInput label="Groupings" />}
                                renderValue={(selected) =>
                                  (selected as number[])
                                    .map(
                                      (id) =>
                                        sortedGroupings.find((grouping) => grouping.id === id)
                                          ?.name || String(id)
                                    )
                                    .join(", ")
                                }
                              >
                                {sortedGroupings.map((grouping) => (
                                  <MenuItem key={grouping.id} value={grouping.id}>
                                    <Checkbox checked={editorForm.grouping_ids.includes(grouping.id)} />
                                    <ListItemText primary={grouping.name} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </div>
                      </div>
                      <div className="editor-actions">
                        <button type="button" onClick={handleSaveCardEdits}>
                          Guardar cambios
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => setDeleteDialog({ open: true, card: selectedCard })}
                        >
                          Eliminar carta
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="muted">Selecciona una carta para editar contenido y tags.</p>
                  )}
                </div>
              </div>

              <div className="cards-grid">
                {cards.map((card) => (
                  <article
                    key={card.id}
                    className={card.is_enabled ? "card" : "card disabled"}
                    onClick={() => setSelectedCardId(card.id)}
                  >
                    <header>
                      <div>
                        <h3>{card.title}</h3>
                        <p className="meta">
                          {card.category} · spice {card.spice_level} · diff {card.difficulty_level}
                        </p>
                        {card.groupings_list && card.groupings_list.length > 0 && (
                          <p className="meta">
                            Groupings: {card.groupings_list.map((grouping) => grouping.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <label className="toggle" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={card.is_enabled}
                          onChange={(event) => toggleCard(card.id, event.target.checked)}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <span />
                      </label>
                    </header>
                    <p className="description">{card.description}</p>
                    <footer>
                      <span>Creditos: {card.credit_value}</span>
                      <span className="tag">{card.is_enabled ? "Activa" : "Desactivada"}</span>
                    </footer>
                  </article>
                ))}
              </div>
            </>
          ) : activeTab === "tags" ? (
            <div className="panel-section">
              <h3>Editor de tags</h3>
              <div className="tag-list">
                {tags.map((tag) => (
                  <div key={tag.id} className="tag-row">
                    <input
                      value={tag.slug}
                      onChange={(event) => updateTagField(tag.id, "slug", event.target.value)}
                    />
                    <input
                      value={tag.name_es ?? ""}
                      onChange={(event) => updateTagField(tag.id, "name_es", event.target.value)}
                      placeholder="Nombre ES"
                    />
                    <input
                      value={tag.name_en ?? ""}
                      onChange={(event) => updateTagField(tag.id, "name_en", event.target.value)}
                      placeholder="Nombre EN"
                    />
                    <select
                      value={tag.tag_type}
                      onChange={(event) => updateTagField(tag.id, "tag_type", event.target.value)}
                    >
                      <option value="category">category</option>
                      <option value="intensity">intensity</option>
                      <option value="subtag">subtag</option>
                    </select>
                    <input
                      value={tag.parent_slug ?? ""}
                      onChange={(event) =>
                        updateTagField(tag.id, "parent_slug", event.target.value)
                      }
                      placeholder="parent"
                    />
                    <input
                      type="number"
                      value={tag.display_order}
                      onChange={(event) =>
                        updateTagField(tag.id, "display_order", Number(event.target.value))
                      }
                    />
                    <div className="tag-actions">
                      <button className="ghost" type="button" onClick={() => handleUpdateTag(tag)}>
                        Guardar
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel-section">
              <h3>Editor de groupings</h3>
              <div className="tag-list">
                {sortedGroupings.map((grouping) => (
                  <div key={grouping.id} className="tag-row">
                    <input
                      value={grouping.slug}
                      onChange={(event) =>
                        updateGroupingField(grouping.id, "slug", event.target.value)
                      }
                    />
                    <input
                      value={grouping.name}
                      onChange={(event) =>
                        updateGroupingField(grouping.id, "name", event.target.value)
                      }
                      placeholder="Nombre"
                    />
                    <input
                      value={grouping.description ?? ""}
                      onChange={(event) =>
                        updateGroupingField(grouping.id, "description", event.target.value)
                      }
                      placeholder="Descripcion"
                    />
                    <input
                      type="number"
                      value={grouping.display_order}
                      onChange={(event) =>
                        updateGroupingField(
                          grouping.id,
                          "display_order",
                          Number(event.target.value)
                        )
                      }
                    />
                    <div className="tag-actions">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => handleUpdateGrouping(grouping)}
                      >
                        Guardar
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => handleDeleteGrouping(grouping.id)}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showCardModal && (
            <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>Nueva carta</h3>
                  <button className="ghost" type="button" onClick={() => setShowCardModal(false)}>
                    Cerrar
                  </button>
                </div>
                <form className="form-grid" onSubmit={handleCreateCard}>
                  <label>
                    Titulo (EN)
                    <input
                      value={createForm.title}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Descripcion (EN)
                    <textarea
                      value={createForm.description}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Titulo (ES)
                    <input
                      value={createForm.title_es}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, title_es: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Descripcion (ES)
                    <textarea
                      value={createForm.description_es}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, description_es: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Categoria
                    <select
                      value={createForm.category}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="inline-fields">
                    <label>
                      Spice
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={createForm.spice_level}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            spice_level: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <label>
                      Dificultad
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={createForm.difficulty_level}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            difficulty_level: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <label>
                      Creditos
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={createForm.credit_value}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            credit_value: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Intensidad
                    <select
                      value={createForm.intensity}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, intensity: event.target.value }))
                      }
                    >
                      {intensityOptions.map((option) => (
                        <option key={option.slug} value={option.slug}>
                          {getTagLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Tags</InputLabel>
                    <Select
                      multiple
                      value={createForm.tags}
                      onChange={handleCreateTagsChange}
                      input={<OutlinedInput label="Tags" />}
                      renderValue={(selected) =>
                        (selected as string[])
                          .map((slug) => tagLabelBySlug.get(slug) || slug)
                          .join(", ")
                      }
                    >
                      {selectableTags.map((tag) => (
                        <MenuItem key={tag.id} value={tag.slug}>
                          <Checkbox checked={createForm.tags.includes(tag.slug)} />
                          <ListItemText primary={getTagLabel(tag)} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {sortedGroupings.length === 0 ? (
                    <p className="muted">No hay groupings disponibles.</p>
                  ) : (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Groupings</InputLabel>
                      <Select
                        multiple
                        value={createForm.grouping_ids}
                        onChange={handleCreateGroupingsChange}
                        input={<OutlinedInput label="Groupings" />}
                        renderValue={(selected) =>
                          (selected as number[])
                            .map(
                              (id) =>
                                sortedGroupings.find((grouping) => grouping.id === id)?.name ||
                                String(id)
                            )
                            .join(", ")
                        }
                      >
                        {sortedGroupings.map((grouping) => (
                          <MenuItem key={grouping.id} value={grouping.id}>
                            <Checkbox checked={createForm.grouping_ids.includes(grouping.id)} />
                            <ListItemText primary={grouping.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <button type="submit">Crear carta</button>
                </form>
              </div>
            </div>
          )}
          {showTagModal && (
            <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>Nuevo tag</h3>
                  <button className="ghost" type="button" onClick={() => setShowTagModal(false)}>
                    Cerrar
                  </button>
                </div>
                <form className="form-grid" onSubmit={handleCreateTag}>
                  <label>
                    Slug
                    <input
                      value={tagForm.slug}
                      onChange={(event) =>
                        setTagForm((prev) => ({ ...prev, slug: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Nombre (ES)
                    <input
                      value={tagForm.name_es}
                      onChange={(event) =>
                        setTagForm((prev) => ({ ...prev, name_es: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Nombre (EN)
                    <input
                      value={tagForm.name_en}
                      onChange={(event) =>
                        setTagForm((prev) => ({ ...prev, name_en: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      value={tagForm.tag_type}
                      onChange={(event) =>
                        setTagForm((prev) => ({ ...prev, tag_type: event.target.value }))
                      }
                    >
                      <option value="category">category</option>
                      <option value="intensity">intensity</option>
                      <option value="subtag">subtag</option>
                    </select>
                  </label>
                  <label>
                    Parent
                    <input
                      value={tagForm.parent_slug}
                      onChange={(event) =>
                        setTagForm((prev) => ({ ...prev, parent_slug: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Orden
                    <input
                      type="number"
                      value={tagForm.display_order}
                      onChange={(event) =>
                        setTagForm((prev) => ({
                          ...prev,
                          display_order: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <button type="submit">Crear tag</button>
                </form>
              </div>
            </div>
          )}
          {showGroupingModal && (
            <div className="modal-overlay" onClick={() => setShowGroupingModal(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>Nuevo grouping</h3>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => setShowGroupingModal(false)}
                  >
                    Cerrar
                  </button>
                </div>
                <form className="form-grid" onSubmit={handleCreateGrouping}>
                  <label>
                    Slug
                    <input
                      value={groupingForm.slug}
                      onChange={(event) =>
                        setGroupingForm((prev) => ({ ...prev, slug: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Nombre
                    <input
                      value={groupingForm.name}
                      onChange={(event) =>
                        setGroupingForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Descripcion
                    <input
                      value={groupingForm.description}
                      onChange={(event) =>
                        setGroupingForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Orden
                    <input
                      type="number"
                      value={groupingForm.display_order}
                      onChange={(event) =>
                        setGroupingForm((prev) => ({
                          ...prev,
                          display_order: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <button type="submit">Crear grouping</button>
                </form>
              </div>
            </div>
          )}
          {deleteDialog.open && deleteDialog.card && (
            <div
              className="modal-overlay"
              onClick={() => setDeleteDialog({ open: false, card: null })}
            >
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>Confirmar eliminacion</h3>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => setDeleteDialog({ open: false, card: null })}
                  >
                    Cerrar
                  </button>
                </div>
                <p>
                  Vas a eliminar la carta <strong>{deleteDialog.card.title}</strong>. Esta accion es
                  irreversible.
                </p>
                <div className="editor-actions">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => setDeleteDialog({ open: false, card: null })}
                  >
                    Cancelar
                  </button>
                  <button className="danger" type="button" onClick={handleDeleteCard}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
