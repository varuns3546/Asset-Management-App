import { supabase, getCurrentUser, signOut } from './config/supabase.js';

class Entry {
  constructor(entryData) {
    this.id = entryData.id;
    this.title = entryData.title;
    this.description = entryData.description;
    this.image = entryData.image
   
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }


  // Create a new user
  static async create(entryData) {
    const { title, description, image } = entryData;
    
    // Hash password
    
    const { data, error } = await supabase
      .from('entries')
      .insert([
        {
          title: title,
          description: description,
          image: image
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Entry(data);
  }

  // Find user by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? new Entry(data) : null;
  }

  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Entry;