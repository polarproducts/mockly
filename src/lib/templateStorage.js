const KEY = "mockly_templates";

export function getTemplates() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveTemplate(name, logos, texts) {
  const templates = getTemplates();
  const template = {
    id: `tpl-${Date.now()}`,
    name: name?.trim() || `Template ${templates.length + 1}`,
    logos: logos.map((l) => ({ ...l })),
    texts: texts.map((t) => ({ ...t })),
    created: Date.now(),
  };
  templates.unshift(template);
  localStorage.setItem(KEY, JSON.stringify(templates));
  return template;
}

export function deleteTemplate(id) {
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(templates));
}