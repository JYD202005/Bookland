import { supabase } from "./supabase/supabase";

export interface Character {
  id?: string;
  created_at?: string;
  name: string;
  book: string;
  description: string;
  image_url?: string;
  usuario_id: string;
}

export const getCharacters = async (): Promise<Character[]> => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createCharacter = async (character: Character, imageFile?: File): Promise<Character> => {
  let image_url = character.image_url;

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${character.usuario_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('characters')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('characters')
      .getPublicUrl(filePath);
    
    image_url = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('characters')
    .insert([{ ...character, image_url }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCharacter = async (id: string, updates: Partial<Character>, imageFile?: File): Promise<Character> => {
  let image_url = updates.image_url;

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${updates.usuario_id || 'unknown'}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('characters')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('characters')
      .getPublicUrl(filePath);
    
    image_url = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('characters')
    .update({ ...updates, image_url })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCharacter = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
