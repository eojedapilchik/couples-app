export type Tag = {
  id: number;
  slug: string;
  name: string;
  name_en?: string | null;
  name_es?: string | null;
  tag_type: string;
  parent_slug: string | null;
  display_order: number;
};

export type Card = {
  id: number;
  title: string;
  description: string;
  category: string;
  spice_level: number;
  difficulty_level: number;
  credit_value: number;
  tags: string | null;
  is_enabled: boolean;
  tags_list?: Tag[];
};
